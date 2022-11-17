import { BigNumber } from "bignumber.js";
import { APPROVAL_AMOUNT_LENDING_POOL } from "../helpers/constants";
import { getEmergencyAdminSigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

const { expect } = require("chai");

makeSuite("LendPool: Pause", (testEnv: TestEnv) => {
  before(async () => {});

  it("Transfer", async () => {
    const { users, pool, dai, uDai, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const amountDeposit = await convertToCurrencyDecimals(dai.address, "1000");

    await dai.connect(users[0].signer).mint(amountDeposit);

    // user 0 deposits 1000 DAI
    await dai.connect(users[0].signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await pool.connect(users[0].signer).deposit(dai.address, amountDeposit, users[0].address, "0");

    const user0Balance = await uDai.balanceOf(users[0].address);
    const user1Balance = await uDai.balanceOf(users[1].address);

    // Configurator pauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // User 0 tries the transfer to User 1
    await expect(uDai.connect(users[0].signer).transfer(users[1].address, amountDeposit)).to.revertedWith(
      ProtocolErrors.LP_IS_PAUSED
    );

    const pausedFromBalance = await uDai.balanceOf(users[0].address);
    const pausedToBalance = await uDai.balanceOf(users[1].address);

    expect(pausedFromBalance).to.be.equal(user0Balance.toString(), ProtocolErrors.INVALID_TO_BALANCE_AFTER_TRANSFER);
    expect(pausedToBalance.toString()).to.be.equal(
      user1Balance.toString(),
      ProtocolErrors.INVALID_FROM_BALANCE_AFTER_TRANSFER
    );

    // Configurator unpauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);

    // User 0 succeeds transfer to User 1
    await uDai.connect(users[0].signer).transfer(users[1].address, amountDeposit);

    const fromBalance = await uDai.balanceOf(users[0].address);
    const toBalance = await uDai.balanceOf(users[1].address);

    expect(fromBalance.toString()).to.be.equal(
      user0Balance.sub(amountDeposit),
      ProtocolErrors.INVALID_FROM_BALANCE_AFTER_TRANSFER
    );
    expect(toBalance.toString()).to.be.equal(
      user1Balance.add(amountDeposit),
      ProtocolErrors.INVALID_TO_BALANCE_AFTER_TRANSFER
    );
  });

  it("Deposit", async () => {
    const { users, pool, dai, uDai, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const amountDeposit = await convertToCurrencyDecimals(dai.address, "1000");

    await dai.connect(users[0].signer).mint(amountDeposit);

    // user 0 deposits 1000 DAI
    await dai.connect(users[0].signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    // Configurator pauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);
    await expect(
      pool.connect(users[0].signer).deposit(dai.address, amountDeposit, users[0].address, "0")
    ).to.revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Configurator unpauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Withdraw", async () => {
    const { users, pool, dai, uDai, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const amountDeposit = await convertToCurrencyDecimals(dai.address, "1000");

    await dai.connect(users[0].signer).mint(amountDeposit);

    // user 0 deposits 1000 DAI
    await dai.connect(users[0].signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await pool.connect(users[0].signer).deposit(dai.address, amountDeposit, users[0].address, "0");

    // Configurator pauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // user tries to burn
    await expect(pool.connect(users[0].signer).withdraw(dai.address, amountDeposit, users[0].address)).to.revertedWith(
      ProtocolErrors.LP_IS_PAUSED
    );

    // Configurator unpauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Borrow", async () => {
    const { pool, dai, bayc, users, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const user = users[1];
    // Pause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Try to execute liquidation
    await expect(pool.connect(user.signer).borrow(dai.address, "1", bayc.address, "1", user.address, "0")).revertedWith(
      ProtocolErrors.LP_IS_PAUSED
    );

    // Unpause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Repay", async () => {
    const { pool, dai, bayc, users, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const user = users[1];
    // Pause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Try to execute liquidation
    await expect(pool.connect(user.signer).repay(bayc.address, "1", "1")).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Unpause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Liquidate", async () => {
    const { users, pool, nftOracle, reserveOracle, weth, bayc, configurator, deployer } = testEnv;
    const depositor = users[3];
    const borrower = users[4];
    const liquidator = users[5];
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    //user 3 mints WETH to depositor
    await weth.connect(depositor.signer).mint(await convertToCurrencyDecimals(weth.address, "1000"));

    //user 3 approve protocol to access depositor wallet
    await weth.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(weth.address, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    await bayc.connect(borrower.signer).mint("101");

    //user 4 approve protocol to access borrower wallet
    await bayc.connect(borrower.signer).setApprovalForAll(pool.address, true);

    //user 4 borrows
    const price = await convertToCurrencyDecimals(weth.address, "1000");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, "101", price, 4000, 7000, 100, 1, 2, 25, true, false);

    const loanData = await pool.getNftCollateralData(bayc.address, "101", weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      weth.address,
      new BigNumber(loanData.availableBorrowsInETH.toString()).div(wethPrice.toString()).multipliedBy(0.2).toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", borrower.address, "0");

    // Drops HF below 1
    const baycPrice = await nftOracle.getNFTPrice(bayc.address, "101");
    await nftOracle.setNFTPrice(bayc.address, 101, new BigNumber(baycPrice.toString()).multipliedBy(0.5).toFixed(0));

    //mints usdc to the liquidator
    await weth.connect(liquidator.signer).mint(await convertToCurrencyDecimals(weth.address, "1000"));
    await weth.connect(liquidator.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    // Pause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Do auction
    await expect(
      pool.connect(liquidator.signer).auction(bayc.address, "101", amountBorrow, liquidator.address)
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Do redeem
    await expect(pool.connect(liquidator.signer).redeem(bayc.address, "101", "1", "1")).revertedWith(
      ProtocolErrors.LP_IS_PAUSED
    );

    // Do liquidation
    await expect(pool.connect(liquidator.signer).liquidate(bayc.address, "101", "0")).revertedWith(
      ProtocolErrors.LP_IS_PAUSED
    );

    // Unpause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("LiquidateNFTX", async () => {
    const { users, pool, nftOracle, reserveOracle, weth, bayc, configurator, deployer, liquidator } = testEnv;
    const depositor = users[3];
    const borrower = users[4];
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    //user 3 mints WETH to depositor
    await weth.connect(depositor.signer).mint(await convertToCurrencyDecimals(weth.address, "1000"));

    //user 3 approve protocol to access depositor wallet
    await weth.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(weth.address, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    await bayc.connect(borrower.signer).mint("102");

    //user 4 approve protocol to access borrower wallet
    await bayc.connect(borrower.signer).setApprovalForAll(pool.address, true);

    //user 4 borrows
    const price = await convertToCurrencyDecimals(weth.address, "1000");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, "102", price, 4000, 7000, 100, 1, 2, 25, true, false);

    const loanData = await pool.getNftCollateralData(bayc.address, 102, weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      weth.address,
      new BigNumber(loanData.availableBorrowsInETH.toString()).div(wethPrice.toString()).multipliedBy(0.2).toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "102", borrower.address, "0");

    // Drops HF below 1
    const baycPrice = await nftOracle.getNFTPrice(bayc.address, 102);
    await nftOracle.setNFTPrice(bayc.address, 102, new BigNumber(baycPrice.toString()).multipliedBy(0.5).toFixed(0));

    //mints usdc to the liquidator
    await weth.connect(liquidator.signer).mint(await convertToCurrencyDecimals(weth.address, "1000"));
    await weth.connect(liquidator.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    // Pause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Do liquidation
    await expect(pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "102")).revertedWith(
      ProtocolErrors.LP_IS_PAUSED
    );

    // Unpause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });
});
