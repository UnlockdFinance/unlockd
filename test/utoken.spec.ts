import { expect } from "chai";
import { APPROVAL_AMOUNT_LENDING_POOL, ZERO_ADDRESS } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, waitForTx } from "../helpers/misc-utils";
import { ProtocolErrors } from "../helpers/types";
import { CommonsConfig } from "../markets/unlockd/commons";
import { approveERC20 } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("UToken", (testEnv: TestEnv) => {
  const { INVALID_FROM_BALANCE_AFTER_TRANSFER, INVALID_TO_BALANCE_AFTER_TRANSFER } = ProtocolErrors;

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
