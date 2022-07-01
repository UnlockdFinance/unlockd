import BigNumber from "bignumber.js";

import { advanceTimeAndBlock, DRE, increaseTime, waitForTx } from "../helpers/misc-utils";
import { APPROVAL_AMOUNT_LENDING_POOL, oneEther, ONE_DAY } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { makeSuite } from "./helpers/make-suite";
import { ProtocolErrors } from "../helpers/types";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Liquidation negative test cases", (testEnv) => {
  before("Before liquidation: set config", () => {
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });
  });

  after("After liquidation: reset config", () => {
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
  });

  it("User 0 deposit 100 WETH, user 1 mint NFT and borrow 10 WETH", async () => {
    const { weth, bayc, pool, users } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // user 0 mint and deposit 100 WETH
    await weth.connect(user0.signer).mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth.connect(user0.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    const amountDeposit = await convertToCurrencyDecimals(weth.address, "100");
    await pool.connect(user0.signer).deposit(weth.address, amountDeposit, user0.address, "0");

    // user 1 mint NFT and borrow 10 WETH
    await weth.connect(user1.signer).mint(await convertToCurrencyDecimals(weth.address, "5"));
    await weth.connect(user1.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await bayc.connect(user1.signer).mint("101");
    await bayc.connect(user1.signer).setApprovalForAll(pool.address, true);
    const amountBorrow = await convertToCurrencyDecimals(weth.address, "10");
    await pool
      .connect(user1.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", user1.address, "0");

    // user 2, 3 mint 100 WETH
    await weth.connect(user2.signer).mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth.connect(user2.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
    await weth.connect(user3.signer).mint(await convertToCurrencyDecimals(weth.address, "100"));
    await weth.connect(user3.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);
  });

  it("Liquidator liquidateNFTX on a non-existent NFT", async () => {
    const { bayc, pool, liquidator } = testEnv;

    await expect(pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "102")).to.be.revertedWith(
      ProtocolErrors.LP_NFT_IS_NOT_USED_AS_COLLATERAL
    );
  });
  /* Can not deactive Reserve or NFT when liquidity is not zero
  it("User 2 auction on a non-active NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateNft(bayc.address);

    await expect(pool.connect(user2.signer).auction(bayc.address, "101", "0", user2.address)).to.be.revertedWith(
      ProtocolErrors.VL_NO_ACTIVE_NFT
    );

    await configurator.activateNft(bayc.address);
  });

  it("User 2 liquidate on a non-active NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateNft(bayc.address);

    await expect(pool.connect(user2.signer).liquidate(bayc.address, "101", "0")).to.be.revertedWith(
      ProtocolErrors.VL_NO_ACTIVE_NFT
    );

    await configurator.activateNft(bayc.address);
  });

  it("User 2 auction on a non-active Reserve", async () => {
    const { configurator, weth, bWETH, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateReserve(weth.address);

    await expect(
      pool.connect(user2.signer).auction(bayc.address, '101', '0', user2.address)
    ).to.be.revertedWith(ProtocolErrors.VL_NO_ACTIVE_RESERVE);

    await configurator.activateReserve(weth.address);
  });

  it("User 2 liquidate on a non-active Reserve", async () => {
    const { configurator, weth, bWETH, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateReserve(weth.address);

    await expect(
      pool.connect(user2.signer).liquidate(bayc.address, '101', '0')
    ).to.be.revertedWith(ProtocolErrors.VL_NO_ACTIVE_RESERVE);

    await configurator.activateReserve(weth.address);
  });
*/
  it("Liquidator auction on a loan health factor above 1", async () => {
    const { bayc, pool, liquidator } = testEnv;

    await expect(pool.connect(liquidator.signer).auction(bayc.address, "101")).to.be.revertedWith(
      ProtocolErrors.LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD
    );
  });

  it("Drop loan health factor below 1", async () => {
    const { bayc, nftOracle, pool, users } = testEnv;

    const poolLoanData = await pool.getNftDebtData(bayc.address, "101");
    const baycPrice = new BigNumber(poolLoanData.totalDebt.toString())
      .percentMul(new BigNumber(5000)) // 50%
      .toFixed(0);

    await advanceTimeAndBlock(100);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
  });

  it("Liquidator opens an auction", async () => {
    const { bayc, pool, liquidator } = testEnv;

    await bayc.connect(liquidator.signer).setApprovalForAll(pool.address, true);
    await waitForTx(await pool.connect(liquidator.signer).auction(bayc.address, "101"));

    const tokenOwner = await bayc.ownerOf("101");
    expect(tokenOwner).to.be.equal(liquidator.address, "Invalid token owner after auction");
  });

  it("Liquidator liquidates before auction duration is end", async () => {
    const { bayc, pool, liquidator } = testEnv;

    await expect(pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "101")).to.be.revertedWith(
      ProtocolErrors.LPL_BID_AUCTION_DURATION_NOT_END
    );
  });

  it("User 1 redeem but amount is not fullfil to mininum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine (user 2 bid price)
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.minBidPrice.div(2);

    // const badBidFine = new BigNumber(nftAuctionData.bidFine.toString()).multipliedBy(1.1).toFixed(0);

    await expect(pool.connect(user1.signer).redeem(bayc.address, "101", redeemAmount)).to.be.revertedWith(
      ProtocolErrors.LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD
    );
  });

  it("User 1 redeem but amount is not fullfil to maximum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine (user 2 bid price)
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.minBidPrice.mul(2);

    // const badBidFine = new BigNumber(nftAuctionData.bidFine.toString()).multipliedBy(1.1).toFixed(0);

    await expect(pool.connect(user1.signer).redeem(bayc.address, "101", redeemAmount)).to.be.revertedWith(
      ProtocolErrors.LP_AMOUNT_GREATER_THAN_MAX_REPAY
    );
  });

  it("Ends auction duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);
    // const deltaDuration = nftCfgData.auctionDuration.sub(nftCfgData.redeemDuration);

    await increaseTime(nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber());
  });

  it("User 1 redeem after duration is end", async () => {
    const { bayc, pool, users, dataProvider } = testEnv;
    const user1 = users[1];

    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.minBidPrice.div(2);

    await expect(pool.connect(user1.signer).redeem(bayc.address, "101", redeemAmount)).to.be.revertedWith(
      ProtocolErrors.LPL_BID_AUCTION_DURATION_HAS_END
    );
  });
});
