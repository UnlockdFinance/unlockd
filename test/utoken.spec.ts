const chai = require("chai");
import { zeroAddress } from "ethereumjs-util";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH, APPROVAL_AMOUNT_LENDING_POOL, ZERO_ADDRESS } from "../helpers/constants";
import { deployGenericYVaultStrategy, deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getMintableERC20,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getUToken,
  getYVault,
} from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { createRandomAddress, fundWithERC20, notFalsyOrZeroAddress, waitForTx } from "../helpers/misc-utils";
import { eContractid, eNetwork, ProtocolErrors } from "../helpers/types";
import { CommonsConfig } from "../markets/unlockd/commons";
import { approveERC20 } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { wadDiv } from "./helpers/utils/math";

const { expect } = chai;

makeSuite("UToken", (testEnv: TestEnv) => {
  const {
    INVALID_FROM_BALANCE_AFTER_TRANSFER,
    INVALID_TO_BALANCE_AFTER_TRANSFER,
    CALLER_NOT_POOL_ADMIN,
    INVALID_ZERO_ADDRESS,
  } = ProtocolErrors;

  afterEach("Reset", () => {
    testEnv.mockIncentivesController.resetHandleActionIsCalled();
  });

  it("Check WETH basic parameters", async () => {
    const { weth, uWETH, pool } = testEnv;

    const symbol = await uWETH.symbol();
    const bSymbol = await uWETH.symbol();
    expect(bSymbol).to.be.equal(symbol);

    const name = await weth.name();
    const bName = await uWETH.name();
    expect(bName).to.be.equal("Unlockd interest bearing WETH");

    const decimals = await weth.decimals();
    const bDecimals = await uWETH.decimals();
    expect(decimals).to.be.equal(bDecimals);

    const treasury = await uWETH.RESERVE_TREASURY_ADDRESS();
    expect(treasury).to.be.not.equal(ZERO_ADDRESS);

    const underAsset = await uWETH.UNDERLYING_ASSET_ADDRESS();
    expect(underAsset).to.be.equal(weth.address);

    const wantPool = await uWETH.POOL();
    expect(wantPool).to.be.equal(pool.address);
  });

  it("Check the onlyAdmin on set treasury to new utoken", async () => {
    const { uWETH, users, bayc } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).setTreasuryAddress(bayc.address),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the zero check on set treasury to new utoken", async () => {
    const { uWETH, deployer, bayc } = testEnv;
    await expect(
      uWETH.connect(deployer.signer).setTreasuryAddress(zeroAddress()),
      INVALID_ZERO_ADDRESS
    ).to.be.revertedWith(INVALID_ZERO_ADDRESS);
  });

  it("Check the address is properly updated in WETH uToken", async () => {
    const { uWETH, deployer, weth, dataProvider } = testEnv;
    const expectedAddress = await createRandomAddress();
    const { uTokenAddress } = await dataProvider.getReserveTokenData(weth.address);

    await uWETH.connect(deployer.signer).setTreasuryAddress(expectedAddress);

    await expect(await (await getUToken(uTokenAddress)).RESERVE_TREASURY_ADDRESS()).to.be.equal(expectedAddress);
  });

  it("10 WETH are sent to UToken, sweep deposits them into Yearn Vault", async () => {
    const { users, pool, weth, uWETH, deployer, addressesProvider } = testEnv;

    await fundWithERC20("WETH", uWETH.address, "10");

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const pricePerShare = await yVault.pricePerShare();

    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const yvWETHBalanceBefore = await erc20YVault.balanceOf(uWETH.address);
    const availableLiquidityBefore = await uWETH.getAvailableLiquidity();
    await uWETH.sweepUToken();

    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHBalanceAfter = await erc20YVault.balanceOf(uWETH.address);
    const yvWETHExpectedBalance = wadDiv(parseEther("10"), pricePerShare);
    const balanceExpected = yvWETHBalanceBefore.add(yvWETHExpectedBalance);
    await expect(balanceExpected).to.be.within(yvWETHBalanceAfter, yvWETHBalanceAfter.add(1000));

    const availableLiquidityAfter = await uWETH.getAvailableLiquidity();

    await expect(availableLiquidityAfter.toString()).to.be.within(
      availableLiquidityBefore.add(parseEther("10").sub(1000)),
      availableLiquidityBefore.add(parseEther("10")).toString()
    );
  });

  it("User 8 deposits 1000 WETH, transfers uweth to user 6", async () => {
    const { users, pool, weth, uWETH, deployer } = testEnv;

    await fundWithERC20("WETH", users[8].address, "1000");
    await approveERC20(testEnv, users[8], "WETH");

    //user 1 deposits 1000 weth
    const amountDeposit = await convertToCurrencyDecimals(deployer, weth, "1000");

    await pool.connect(users[8].signer).deposit(weth.address, amountDeposit, users[8].address, "0");

    await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    const fromBalanceBeforeTransfer = await uWETH.balanceOf(users[8].address);
    const amountTransfer = await convertToCurrencyDecimals(deployer, weth, "500");
    await uWETH.connect(users[8].signer).transfer(users[6].address, amountTransfer);

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // expect(checkResult).to.be.equal(true, "IncentivesController not called");

    const fromBalance = await uWETH.balanceOf(users[8].address);
    const toBalance = await uWETH.balanceOf(users[6].address);

    expect(toBalance.toString()).to.be.equal(amountTransfer.toString(), INVALID_TO_BALANCE_AFTER_TRANSFER);
  });

  it("UToken: Check `updateUTokenManagers()`", async () => {
    const { users, uWETH } = testEnv;

    /*//////////////////////////////////////////////////////////////
                        NEGATIVES
    //////////////////////////////////////////////////////////////*/

    // 1. CHECK INVALID ZERO ADDRESS
    expect(
      uWETH.updateUTokenManagers(
        [users[1].address, zeroAddress()], //STRATEGY ADDRESS
        true // FLAG
      )
    ).to.be.revertedWith(INVALID_ZERO_ADDRESS);

    /*//////////////////////////////////////////////////////////////
                        POSITIVES
    //////////////////////////////////////////////////////////////*/
    // 1. SET 3 ADDRESSES AS MANAGERS
    await uWETH.updateUTokenManagers(
      [users[1].address, users[2].address, users[3].address], //STRATEGY ADDRESS
      true // FLAG
    );

    expect(await uWETH.isManager(users[1].address)).to.be.eq(true);
    expect(await uWETH.isManager(users[2].address)).to.be.eq(true);
    expect(await uWETH.isManager(users[3].address)).to.be.eq(true);

    // 2. REMOVE 2 ADDRESSES FROM BEING MANAGERS
    await uWETH.updateUTokenManagers(
      [users[2].address, users[3].address], //STRATEGY ADDRESS
      false // FLAG
    );
    expect(await uWETH.isManager(users[1].address)).to.be.eq(true);
    expect(await uWETH.isManager(users[2].address)).to.be.eq(false);
    expect(await uWETH.isManager(users[3].address)).to.be.eq(false);
  });

  it.only("UToken: `addStrategy()`", async () => {
    const { genericYVaultStrategy, uWETH, deployer } = testEnv;

    /*//////////////////////////////////////////////////////////////
                        NEGATIVES
    //////////////////////////////////////////////////////////////*/

    // 1. Force max strategy limit to be reached

    // Deploy implementation
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolAdmin = await addressesProvider.getPoolAdmin();
    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    console.log("Deploying new GenericYVault strategy implementation...");
    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const dataProvider = await getUnlockdProtocolDataProvider();
    const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
    const uTokenAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;
    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    // Deploy 20 instances of strategies
    for (let i = 0; i < 20; i++) {
      const proxy = await deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false
      );
      console.log("PROXY ADDRESS: " + proxy.address);
      uWETH.addStrategy(
        proxy.address, //STRATEGY ADDRESS
        0, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      );
    }
  });
});
