import BigNumber from "bignumber.js";
import { APPROVAL_AMOUNT_LENDING_POOL, MAX_UINT_AMOUNT } from "../helpers/constants";
import { getDeploySigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { MaliciousHackerERC721, MaliciousHackerERC721Factory } from "../types";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Malicious Hacker Rentrant", (testEnv) => {
  let maliciousHackerErc721: MaliciousHackerERC721;

  before("Before: set config", async () => {
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });

    maliciousHackerErc721 = await new MaliciousHackerERC721Factory(await getDeploySigner()).deploy(
      testEnv.pool.address
    );
  });

  after("After: reset config", async () => {
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
  });

  it("Malicious hacker try to reentrant (should revert)", async () => {
    const { weth, bayc, pool, users, configurator, deployer, nftOracle } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // delegates borrowing power
    await maliciousHackerErc721.approveDelegate(weth.address, borrower.address);

    // depositor mint and deposit 100 WETH
    await weth.connect(depositor.signer).mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    const amountDeposit = await convertToCurrencyDecimals(weth.address, "100");
    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    // borrower mint NFT and borrow 10 WETH
    await weth.connect(borrower.signer).mint(await convertToCurrencyDecimals(weth.address, "5"));
    await weth.connect(borrower.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await bayc.connect(borrower.signer).mint("101");
    await bayc.connect(borrower.signer).setApprovalForAll(pool.address, true);
    const amountBorrow = await convertToCurrencyDecimals(weth.address, "10");
    const price = await convertToCurrencyDecimals(weth.address, "50");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, "101", price, 4000, 7000, 5000, 100, 47, 48, 200, 250);

    await configurator.setTimeframe(3600);

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", maliciousHackerErc721.address, "0");

    // borrower repay and hacker try to do reentrant action
    console.log("hacker do reentrant action: ACTION_DEPOSIT");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_DEPOSIT());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );

    console.log("hacker do reentrant action: ACTION_WITHDRAW");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_WITHDRAW());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );

    console.log("hacker do reentrant action: ACTION_BORROW");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_BORROW());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );

    console.log("hacker do reentrant action: ACTION_REPAY");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_REPAY());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );

    console.log("hacker do reentrant action: ACTION_AUCTION");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_AUCTION());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );

    console.log("hacker do reentrant action: ACTION_REDEEM");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_REDEEM());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );

    console.log("hacker do reentrant action: ACTION_LIQUIDATE_NFTX");
    await maliciousHackerErc721.simulateAction(await maliciousHackerErc721.ACTION_LIQUIDATE_NFTX());
    await expect(pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)).to.be.revertedWith(
      "ReentrancyGuard: reentrant call"
    );
  });
});
