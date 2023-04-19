const chai = require("chai");
import { zeroAddress } from "ethereumjs-util";
import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH, APPROVAL_AMOUNT_LENDING_POOL, ZERO_ADDRESS } from "../helpers/constants";
import {
  deployGenericMockUTokenImpl,
  deployGenericUTokenImpl,
  deployGenericYVaultStrategy,
  deployUnlockdUpgradeableProxy,
} from "../helpers/contracts-deployments";
import {
  getGenericYVaultStrategy,
  getLendPoolAddressesProvider,
  getMintableERC20,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getUToken,
  getYVault,
} from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  createRandomAddress,
  evmRevert,
  evmSnapshot,
  fundWithERC20,
  notFalsyOrZeroAddress,
  waitForTx,
} from "../helpers/misc-utils";
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
  let snapshotId;

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

  it("UToken: `updateUTokenManagers()`", async () => {
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

  it("UToken: `addStrategy()`- Add zero address as strategy (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    expect(
      uWETH.addStrategy(
        zeroAddress(), //STRATEGY ADDRESS
        0, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidZeroAddress()");
  });
  it("UToken: `addStrategy()`- Add strategy with invalid UToken (expect revert)", async () => {
    const { uWETH, deployer, weth } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }
    const uToken = await deployGenericMockUTokenImpl(false, true);
    await uToken.initialize(addressesProvider.address, createRandomAddress(), weth.address, 18, "Test", "TST");

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uToken.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    expect(
      uWETH.addStrategy(
        proxy.address, //STRATEGY ADDRESS
        0, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidStrategyUToken()");
  });
  it("UToken: `addStrategy()`- Add strategy with invalid debt ratio (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    expect(
      uWETH.addStrategy(
        proxy.address, //STRATEGY ADDRESS
        10001, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidDebtRatio()");
  });
  it("UToken: `addStrategy()`- Add strategy with invalid min debt and max debt values (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    expect(
      uWETH.addStrategy(
        proxy.address, //STRATEGY ADDRESS
        10000, // DEBT RATIO
        "115792089237316195423570985008687907853269984665640564039457584007913129639935", //MIN DEBT PER HARVEST
        0 // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidHarvestAmounts()");
  });
  it("UToken: `addStrategy()`- Check adding strategy values", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    await uWETH.addStrategy(
      proxy.address, // STRATEGY ADDRESS
      5000, // 50% DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    const strategyData = await uWETH.getStrategy(proxy.address);
    expect(strategyData.debtRatio).to.be.eq(5000);
    expect(strategyData.active).to.be.eq(true);
    expect(strategyData.totalDebt).to.be.eq(0);
    expect(strategyData.totalGain).to.be.eq(0);
    expect(strategyData.totalLoss).to.be.eq(0);
    expect(strategyData.minDebtPerHarvest).to.be.eq(0);
    expect(strategyData.maxDebtPerHarvest).to.be.eq(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935"
    );

    const debtRatioUToken = await uWETH.debtRatio();
    expect(debtRatioUToken).to.be.equal(5000);
    const strategyWithdrawalQueueZero = await uWETH.withdrawalQueue(0);
    const strategyWithdrawalQueueOne = await uWETH.withdrawalQueue(1);
    // Only one strategy has been added (hence, position 0 is the added strategy, 1 is empty)
    expect(strategyWithdrawalQueueZero).to.be.eq(proxy.address);
    expect(strategyWithdrawalQueueOne).to.be.eq(zeroAddress());

    await uWETH.revokeStrategy(proxy.address);
    await uWETH.removeStrategyFromQueue(proxy.address);
  });
  it("UToken: `updateStrategyParams()`- Check updating strategy params", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    await uWETH.addStrategy(
      proxy.address, // STRATEGY ADDRESS
      5000, // 50% DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    await uWETH.updateStrategyParams(
      proxy.address, // STRATEGY ADDRESS
      20, // NEW DEBT RATIO
      10, // NEW MIN DEBT PER HARVEST
      50 // NET MAX DEBT PER HARVEST
    );
    const strategyData = await uWETH.getStrategy(proxy.address);
    expect(strategyData.debtRatio).to.be.eq(20);

    expect(strategyData.minDebtPerHarvest).to.be.eq(10);
    expect(strategyData.maxDebtPerHarvest).to.be.eq(50);

    const debtRatioUToken = await uWETH.debtRatio();
    expect(debtRatioUToken).to.be.equal(20);

    await uWETH.revokeStrategy(proxy.address);
    await uWETH.removeStrategyFromQueue(proxy.address);
  });
  it("UToken: `revokeStrategy()`- Revoke invalid strategy (ie zero debt ratio) (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    expect(
      uWETH.revokeStrategy(
        proxy.address //STRATEGY ADDRESS
      )
    ).to.be.revertedWith("StrategyDebtRatioAlreadyZero()");
  });
  it("UToken: `revokeStrategy()`- Revoke strategy ", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    await uWETH.addStrategy(
      proxy.address, // STRATEGY ADDRESS
      5000, // 50% DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    const strategyDataPrev = await uWETH.getStrategy(proxy.address);
    const debtRatioPrev = await uWETH.debtRatio();

    await uWETH.revokeStrategy(
      proxy.address // STRATEGY ADDRESS
    );
    const strategyData = await uWETH.getStrategy(proxy.address);
    const debtRatio = await uWETH.debtRatio();

    expect(debtRatio).to.be.eq(debtRatioPrev.sub(strategyDataPrev.debtRatio));
    expect(strategyData.debtRatio).to.be.eq(0);
    expect(strategyData.active).to.be.eq(false);

    await uWETH.removeStrategyFromQueue(proxy.address);
  });
  it("UToken: `updateStrategyParams()`- update strategy params for invalid strategy (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    expect(
      uWETH.updateStrategyParams(
        proxy.address, //STRATEGY ADDRESS
        0, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidStrategy()");
  });
  it("UToken: `updateStrategyParams()`- update strategy params with invalid min debt and max debt values (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );
    // Add strategy properly
    await uWETH.addStrategy(proxy.address, 100, 0, 10000000);

    expect(
      uWETH.updateStrategyParams(
        proxy.address, //STRATEGY ADDRESS
        0, // DEBT RATIO
        "115792089237316195423570985008687907853269984665640564039457584007913129639935", //MIN DEBT PER HARVEST
        0 // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidHarvestAmounts()");
    await uWETH.revokeStrategy(proxy.address);
    await uWETH.removeStrategyFromQueue(proxy.address);
  });
  it("UToken: `updateStrategyParams()`- update strategy params with invalid debt ratio (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    const proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    // Add strategy properly
    await uWETH.addStrategy(
      proxy.address,
      100, // debt ratio
      0,
      10000000
    );
    expect(
      uWETH.updateStrategyParams(
        proxy.address, //STRATEGY ADDRESS
        10001, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("InvalidDebtRatio()");
    await uWETH.revokeStrategy(proxy.address);
    await uWETH.removeStrategyFromQueue(proxy.address);
  });
  it("UToken: `addStrategy()` - Force maximum strategies reached (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;
    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    let strategies: string[] = [];
    // Deploy 20 instances of strategies
    for (let i = 0; i < 20; i++) {
      const proxy = await deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false,
        true
      );
      strategies.push(proxy.address);
      await uWETH.addStrategy(
        strategies[i], //STRATEGY ADDRESS
        100, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      );
    }

    let proxy = await deployUnlockdUpgradeableProxy(
      eContractid.GenericYVaultStrategy,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false,
      true
    );

    expect(
      uWETH.addStrategy(
        proxy.address, //STRATEGY ADDRESS
        0, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith("MaxStrategiesReached()");

    for (let i = 0; i < 20; i++) {
      await uWETH.revokeStrategy(strategies[i]);
      await uWETH.removeStrategyFromQueue(strategies[i]);
    }
  });
  it("UToken: Check withdrawal queue (expect revert)", async () => {
    const { uWETH, deployer } = testEnv;
    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    let strategies: string[] = [];
    // Deploy 10 instances of strategies
    for (let i = 0; i < 10; i++) {
      const proxy = await deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false,
        true
      );
      strategies.push(proxy.address);
      await uWETH.addStrategy(
        strategies[i], //STRATEGY ADDRESS
        100, // DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      );
    }

    for (let i = 0; i < 10; i++) {
      const strategy = await uWETH.withdrawalQueue(i);
      expect(strategy).to.be.equal(strategies[i]);
    }
    for (let i = 0; i < 20; i++) {
      const strategy = await uWETH.withdrawalQueue(i);
      if (strategy != zeroAddress()) await uWETH.revokeStrategy(strategy);
    }

    for (let i = 0; i < 20; i++) {
      const strategy = await uWETH.withdrawalQueue(i);
      if (strategy != zeroAddress()) await uWETH.removeStrategyFromQueue(strategy);
    }
  });
  it("UToken: `removeStrategyFromQueue()`- Remove strategy from queue", async () => {
    const { uWETH, deployer } = testEnv;

    // Deploy implementation
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    const strategyName = "Yearn yvWETH Strategy";

    let genericYVaultStrategyImpl;
    let strategyName32;
    let proxyAdmin;
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false, true);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    //@ts-ignore
    let initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    for (let i = 0; i < 20; i++) {
      const strategy = await uWETH.withdrawalQueue(0);
      await uWETH.removeStrategyFromQueue(strategy);
    }

    let second;
    for (let i = 0; i < 2; i++) {
      const proxy = await deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false,
        true
      );

      await uWETH.addStrategy(
        proxy.address, // STRATEGY ADDRESS
        5000, // 50% DEBT RATIO
        0, //MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      );
      if (i == 1) second = proxy.address;
    }

    await uWETH.removeStrategyFromQueue(await uWETH.withdrawalQueue(0));
    expect(await uWETH.withdrawalQueue(0)).to.be.eq(second);
  });
});
