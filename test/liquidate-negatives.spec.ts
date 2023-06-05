import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { APPROVAL_AMOUNT_LENDING_POOL, ONE_DAY, TWO_DAYS } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { advanceTimeAndBlock, fundWithERC20, fundWithERC721, increaseTime, waitForTx } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

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
    const { weth, bayc, pool, users, configurator, deployer, nftOracle } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // user 0 mint and deposit 100 WETH
    await fundWithERC20("WETH", user0.address, "100");
    await approveERC20(testEnv, user0, "WETH");

    const amountDeposit = await convertToCurrencyDecimals(deployer, weth, "100");
    await pool.connect(user0.signer).deposit(weth.address, amountDeposit, user0.address, "0");

    // user 1 mint NFT and borrow 10 WETH
    await fundWithERC20("WETH", user1.address, "10");
    await approveERC20(testEnv, user1, "WETH");

    await fundWithERC721("BAYC", user1.address, 101);
    await setApprovalForAll(testEnv, user1, "BAYC");

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "10");

    const price = await convertToCurrencyDecimals(deployer, weth, "100");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: BN.from("700000000000000000"), //0.7 eth valuation
      ltv: 6000,
      liquidationThreshold: 7500,
      redeemThreshold: 5000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    await pool
      .connect(user1.signer)
      .borrow(weth.address, BN.from("420000000000000000"), bayc.address, "101", user1.address, "0");

    // user 2, 3 mint 100 WETH
    await fundWithERC20("WETH", user2.address, "100");
    await approveERC20(testEnv, user2, "WETH");

    await fundWithERC20("WETH", user3.address, "100");
    await approveERC20(testEnv, user3, "WETH");
  });

  it("User 1 liquidate on a non-existent NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user1 = users[1];

    await expect(pool.connect(user1.signer).liquidate(bayc.address, "102", "0")).to.be.revertedWith(
      ProtocolErrors.LP_NFT_IS_NOT_USED_AS_COLLATERAL
    );
  });

  it("User 2 auction on a loan health factor above 1", async () => {
    const { bayc, pool, users, configurator, deployer, weth, dataProvider } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, bayc.address, "101");
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await expect(
      pool.connect(user2.signer).auction(bayc.address, "101", liquidatePrice, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD);
  });

  it("Drop loan health factor below 1", async () => {
    const { bayc, nftOracle, pool, users, configurator } = testEnv;

    const poolLoanData = await pool.getNftDebtData(bayc.address, "101");
    const baycPrice = new BigNumber(poolLoanData.totalDebt.toString())
      .percentMul(new BigNumber(5000)) // 50%
      .toFixed(0);
    await advanceTimeAndBlock(100);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
  });

  it("User 2 auction price is unable to cover borrow", async () => {
    const { bayc, pool, users, configurator, deployer, weth, dataProvider } = testEnv;
    const user2 = users[2];

    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);

    const nftDebtData = await pool.getNftDebtData(bayc.address, "101");

    await expect(
      pool.connect(user2.signer).auction(bayc.address, "101", nftDebtData.totalDebt, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_PRICE_LESS_THAN_DEBT_PRICE);
  });

  it("User 2 auction price is less than debt price", async () => {
    const { weth, bayc, nftOracle, pool, users, dataProvider } = testEnv;
    const user2 = users[2];

    const nftColData = await pool.getNftCollateralData(bayc.address, "101", weth.address);
    const nftDebtData = await pool.getNftDebtData(bayc.address, "101");
    // Price * LH / Debt = HF => Price * LH = Debt * HF => Price = Debt * HF / LH
    // LH is 2 decimals
    const baycPrice = new BigNumber(nftDebtData.totalDebt.toString())
      .percentMul(new BigNumber(9500)) //95%
      .percentDiv(new BigNumber(nftColData.liquidationThreshold.toString()))
      .toFixed(0);

    await advanceTimeAndBlock(100);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);

    const auctionPriceFail = new BigNumber(nftDebtData.totalDebt.toString()).multipliedBy(0.9).toFixed(0);

    await expect(
      pool.connect(user2.signer).auction(bayc.address, "101", auctionPriceFail, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_PRICE_LESS_THAN_DEBT_PRICE);
  });

  it("User 2 auction price is enough to cover borrow and liqudiate price", async () => {
    const { bayc, pool, users, configurator, deployer, weth, dataProvider } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, bayc.address, "101");
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    const auctionPriceOk = new BigNumber(liquidatePrice.toString()).multipliedBy(1.5).toFixed(0);
    await waitForTx(await pool.connect(user2.signer).auction(bayc.address, "101", auctionPriceOk, user2.address));
  });

  it("User 3 auction price is lesser than user 2", async () => {
    const { bayc, pool, users, configurator, deployer, weth, dataProvider } = testEnv;
    const user3 = users[3];

    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, bayc.address, "101");
    const auctionPrice = new BigNumber(liquidatePrice.toString()).multipliedBy(1.2).toFixed(0);
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await expect(
      pool.connect(user3.signer).auction(bayc.address, "101", auctionPrice, user3.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE);
  });

  it("User 2 liquidate before auction duration is end", async () => {
    const { bayc, pool, users } = testEnv;
    const user2 = users[2];

    await expect(pool.connect(user2.signer).liquidate(bayc.address, "101", "0")).to.be.revertedWith(
      ProtocolErrors.LPL_CLAIM_HASNT_STARTED_YET
    );
  });

  it("User 1 redeem but bidFine is not fullfil to borrow amount of user 2 auction", async () => {
    const { bayc, pool, users, deployer } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount;
    const badBidFine = new BigNumber(nftAuctionData.bidFine.toString()).multipliedBy(0.9).toFixed(0);
    await pool.connect(deployer.signer).updateSafeHealthFactor(BN.from("1100000000000000000"));
    await expect(pool.connect(user1.signer).redeem(bayc.address, "101", redeemAmount, badBidFine)).to.be.revertedWith(
      ProtocolErrors.LPL_BID_INVALID_BID_FINE
    );
  });

  it("User 1 redeem but amount is not fullfil to mininum repay amount", async () => {
    const { bayc, pool, users, deployer } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    await pool.connect(deployer.signer).updateSafeHealthFactor(BN.from("1100000000000000000"));
    // user 1 want redeem and query the bid fine (user 2 bid price)
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount.div(2);

    const badBidFine = new BigNumber(nftAuctionData.bidFine.toString()).multipliedBy(2).toFixed(0);

    await expect(
      pool.connect(user1.signer).redeem(bayc.address, "101", BN.from("1"), BN.from("1000000000000000000"))
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD);
  });

  it("User 1 redeem but amount is not fullfil to maximum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine (user 2 bid price)
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount.mul(2);

    const badBidFine = new BigNumber(nftAuctionData.bidFine.toString()).multipliedBy(1.1).toFixed(0);

    await expect(
      pool.connect(user1.signer).redeem(bayc.address, "101", BN.from("10000000000000000000"), badBidFine)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_GREATER_THAN_MAX_REPAY);
  });

  it("Ends redeem duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);
    const nftTokenIdCfgData = await dataProvider.getNftConfigurationDataByTokenId(bayc.address, "101");

    await increaseTime(nftCfgData.redeemDuration.mul(ONE_DAY).add(100).toNumber());
    await increaseTime(nftTokenIdCfgData.redeemDuration.mul(ONE_DAY).add(100).toNumber());
  });

  it("User 1 redeem after duration is end", async () => {
    const { bayc, pool, users, dataProvider, loan } = testEnv;
    const user1 = users[1];

    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount.div(2);

    await expect(
      pool.connect(user1.signer).redeem(bayc.address, "101", redeemAmount, nftAuctionData.bidFine)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_REDEEM_DURATION_HAS_END);
  });

  it("Ends auction duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);
    const deltaDuration = nftCfgData.auctionDuration.sub(nftCfgData.redeemDuration);

    await increaseTime(deltaDuration.mul(ONE_DAY).add(100).toNumber());
  });

  it("User 3 auction after duration is end", async () => {
    const { bayc, pool, users, configurator, deployer, weth, dataProvider } = testEnv;
    const user3 = users[3];
    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, bayc.address, "101");
    const auctionPrice = new BigNumber(liquidatePrice.toString()).multipliedBy(2.0).toFixed(0);
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await expect(
      pool.connect(user3.signer).auction(bayc.address, "101", auctionPrice, user3.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_AUCTION_DURATION_HAS_END);
  });

  it("User 2 auction consecutively", async () => {
    const { bayc, pool, users, configurator, deployer, weth, dataProvider } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, bayc.address, "101");
    const auctionPrice = new BigNumber(liquidatePrice.toString()).multipliedBy(2.0).toFixed(0);
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    //Current bid is from user 2, thus, it should revert
    await expect(
      pool.connect(user2.signer).auction(bayc.address, "101", auctionPrice, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LP_CONSECUTIVE_BIDS_NOT_ALLOWED);
  });

  it("Auction ends and the user tries to claim before the 20m pass.", async () => {
    const { weth, bayc, pool, users, configurator, deployer, nftOracle, dataProvider } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // user 0 mint and deposit 100 WETH
    await fundWithERC20("WETH", user0.address, "100");
    await approveERC20(testEnv, user0, "WETH");

    const amountDeposit = await convertToCurrencyDecimals(deployer, weth, "100");
    await pool.connect(user0.signer).deposit(weth.address, amountDeposit, user0.address, "0");

    // user 1 mint NFT and borrow 10 WETH
    await fundWithERC20("WETH", user1.address, "10");
    await approveERC20(testEnv, user1, "WETH");

    await fundWithERC721("BAYC", user1.address, 103);
    await setApprovalForAll(testEnv, user1, "BAYC");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: "103",
      newPrice: BN.from("700000000000000000"), //0.7 eth valuation
      ltv: 6000,
      liquidationThreshold: 7500,
      redeemThreshold: 5000,
      liquidationBonus: 500,
      redeemDuration: 47,
      auctionDuration: 48,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    await pool
      .connect(user1.signer)
      .borrow(weth.address, BN.from("420000000000000000"), bayc.address, "103", user1.address, "0");

    // user 2 mint 100 WETH
    await fundWithERC20("WETH", user2.address, "100");
    await approveERC20(testEnv, user2, "WETH");

    const poolLoanData = await pool.getNftDebtData(bayc.address, "103");
    const baycPrice = new BigNumber(poolLoanData.totalDebt.toString())
      .percentMul(new BigNumber(5000)) // 50%
      .toFixed(0);
    await advanceTimeAndBlock(100);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    await nftOracle.setNFTPrice(bayc.address, 103, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setNFTPrice(bayc.address, 103, baycPrice);

    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, bayc.address, "103");
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    const auctionPrice = new BigNumber(liquidatePrice.toString()).multipliedBy(3).toFixed(0);
    await waitForTx(await pool.connect(user2.signer).auction(bayc.address, "103", auctionPrice, user2.address));

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(bayc.address, "103");
    const deltaDuration = nftCfgData.auctionDuration;
    console.log(deltaDuration);
    // We need to be sure the auction Ended - Expecting to revert bidding again.
    // after we need to be sure we can't claim before the 20m pass.
    await increaseTime(deltaDuration.mul(60).toNumber());

    // user 3 mint 100 WETH
    await fundWithERC20("WETH", user3.address, "100");
    await approveERC20(testEnv, user3, "WETH");

    const auctionPriceOk = new BigNumber(liquidatePrice.toString()).multipliedBy(4).toFixed(0);
    await expect(
      pool.connect(user3.signer).auction(bayc.address, "103", auctionPriceOk, user3.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_AUCTION_DURATION_HAS_END);

    await expect(pool.connect(user2.signer).liquidate(bayc.address, "103", auctionPriceOk)).to.be.revertedWith(
      ProtocolErrors.LPL_CLAIM_HASNT_STARTED_YET
    );
  });
});
