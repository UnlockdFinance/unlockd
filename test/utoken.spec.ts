import { zeroAddress } from "ethereumjs-util";
import { parseEther } from "ethers/lib/utils";
import { ADDRESS_ID_YVAULT_WETH, ZERO_ADDRESS } from "../helpers/constants";
import { getMintableERC20, getUToken, getYVault } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { createRandomAddress, fundWithERC20, waitForTx } from "../helpers/misc-utils";
import { ProtocolErrors } from "../helpers/types";
import { approveERC20 } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { wadDiv } from "./helpers/utils/math";

const chai = require("chai");
const { expect } = chai;

makeSuite("UToken", (testEnv: TestEnv) => {
  const { INVALID_FROM_BALANCE_AFTER_TRANSFER, INVALID_TO_BALANCE_AFTER_TRANSFER } = ProtocolErrors;

  afterEach("Reset", () => {
    testEnv.mockIncentivesController.resetHandleActionIsCalled();
  });

  const { CALLER_NOT_POOL_ADMIN, INVALID_ZERO_ADDRESS } = ProtocolErrors;

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

  it("10 WETH are sent to UToken, sweep deposits them into Yearn Vault", async () => {
    const { users, pool, weth, uWETH, deployer, addressesProvider } = testEnv;

    await fundWithERC20("WETH", uWETH.address, "10");

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const pricePerShare = await yVault.pricePerShare();

    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const yvWETHBalanceBefore = await erc20YVault.balanceOf(uWETH.address);
    await expect(yvWETHBalanceBefore).to.be.equal(0);

    const availableLiquidityBefore = await uWETH.getAvailableLiquidity();
    await expect(availableLiquidityBefore).to.be.equal(0);

    await uWETH.sweepUToken();

    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHBalanceAfter = await erc20YVault.balanceOf(uWETH.address);
    const yvWETHExpectedBalance = wadDiv(parseEther("10"), pricePerShare);

    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalanceAfter, yvWETHBalanceAfter.add(1000));

    const availableLiquidityAfter = await uWETH.getAvailableLiquidity();

    await expect(availableLiquidityAfter.toString()).to.be.within(
      parseEther("10").sub(1000),
      parseEther("10").toString()
    );
  });

  it("Check the onlyAdmin on set treasury to new utoken", async () => {
    const { users, uWETH } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).setTreasuryAddress(users[2].address),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the zero check on set treasury to new utoken", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(
      uWETH.connect(deployer.signer).setTreasuryAddress(zeroAddress()),
      INVALID_ZERO_ADDRESS
    ).to.be.revertedWith(INVALID_ZERO_ADDRESS);
  });

  it("Check the address is properly updated in WETH uToken", async () => {
    const { deployer, weth, dataProvider, uWETH } = testEnv;
    const expectedAddress = await createRandomAddress();
    const { uTokenAddress } = await dataProvider.getReserveTokenData(weth.address);

    await uWETH.connect(deployer.signer).setTreasuryAddress(expectedAddress);

    await expect(await (await getUToken(uTokenAddress)).RESERVE_TREASURY_ADDRESS()).to.be.equal(expectedAddress);
  });

  it("User 0 deposits 1000 WETH, transfers uweth to user 1", async () => {
    const { users, pool, weth, uWETH, deployer } = testEnv;

    await fundWithERC20("WETH", users[0].address, "1000");
    await approveERC20(testEnv, users[0], "WETH");

    //user 1 deposits 1000 weth
    const amountDeposit = await convertToCurrencyDecimals(deployer, weth, "1000");

    await pool.connect(users[0].signer).deposit(weth.address, amountDeposit, users[0].address, "0");

    await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());

    await uWETH.connect(users[0].signer).transfer(users[1].address, amountDeposit);

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // expect(checkResult).to.be.equal(true, "IncentivesController not called");

    const fromBalance = await uWETH.balanceOf(users[0].address);
    const toBalance = await uWETH.balanceOf(users[1].address);

    expect(fromBalance.toString()).to.be.equal("0", INVALID_FROM_BALANCE_AFTER_TRANSFER);
    expect(toBalance.toString()).to.be.equal(amountDeposit.toString(), INVALID_TO_BALANCE_AFTER_TRANSFER);
  });

  it("User 1 receive uweth from user 0, transfers 50% to user 2", async () => {
    const { users, pool, weth, uWETH } = testEnv;

    const amountTransfer = (await uWETH.balanceOf(users[1].address)).div(2);

    await uWETH.connect(users[1].signer).transfer(users[2].address, amountTransfer);

    const fromBalance = await uWETH.balanceOf(users[1].address);
    const toBalance = await uWETH.balanceOf(users[2].address);

    expect(fromBalance.toString()).to.be.equal(amountTransfer.toString(), INVALID_FROM_BALANCE_AFTER_TRANSFER);
    expect(toBalance.toString()).to.be.equal(amountTransfer.toString(), INVALID_TO_BALANCE_AFTER_TRANSFER);

    await uWETH.totalSupply();
    await uWETH.getScaledUserBalanceAndSupply(users[1].address);
  });
});
