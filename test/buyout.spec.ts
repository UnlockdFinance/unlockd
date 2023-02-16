import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { oneEther } from "../helpers/constants";
import { convertToCurrencyDecimals, convertToCurrencyUnits } from "../helpers/contracts-helpers";
import { fundWithERC20, fundWithERC721, waitForTx } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors, ProtocolLoanState } from "../helpers/types";
import { approveERC20, setApprovalForAll, setNftAssetPriceForDebt } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";
import { getUserData } from "./helpers/utils/helpers";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: buyout test cases", (testEnv) => {
  before("Before liquidation: set config", () => {
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });
  });

  after("After liquidation: reset config", () => {
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
  });

  it("Borrower - Borrows WETH", async () => {
    const { users, pool, nftOracle, weth, bayc, configurator, deployer } = testEnv;
    const depositor = users[3];
    const borrower = users[4];

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000"); //deployer

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(deployer.address, true);

    type NewType = IConfigNftAsCollateralInput;

    const collData: NewType = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 2820,
      auctionDuration: 2880,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "40");

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", borrower.address, "0");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("Health Factor goes below 1", async () => {
    const { pool, nftOracle, weth, bayc, deployer } = testEnv;

    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "101");

    const debAmountUnits = await convertToCurrencyUnits(deployer, weth, nftDebtDataBefore.totalDebt.toString());
    await nftOracle.setNFTPrice(bayc.address, 101, parseEther("50")); // 50 eth

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");
    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("Buyer - buys out the NFT in auction", async () => {
    const { users, pool, nftOracle, bayc, dataProvider, weth } = testEnv;
    const buyer = users[2];
    const borrower = users[4];

    await fundWithERC20("WETH", buyer.address, "1000");
    await approveERC20(testEnv, buyer, "WETH");

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, "101");

    const ethReserveDataBefore = await dataProvider.getReserveData(weth.address);

    const userReserveDataBefore = await getUserData(pool, dataProvider, weth.address, borrower.address);

    const nftPrice = await nftOracle.getNFTPrice(bayc.address, "101");

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // BUYOUT
    const buyoutPrice = nftPrice;
    // Amount is more than nft price (revert expected)
    await expect(
      pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPrice.add(parseEther("1")), buyer.address)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE);

    // Amount is less than nft price (revert expected)
    await expect(
      pool
        .connect(buyer.signer)
        .buyout(bayc.address, "101", buyoutPrice.sub(parseEther("0.000000000000001")), buyer.address)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE);

    // Amount is less than borrow amount (revert expected)
    await expect(
      pool.connect(buyer.signer).buyout(bayc.address, "101", parseEther("1"), buyer.address)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_LESS_THAN_DEBT);

    await waitForTx(await pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPrice, buyer.address));

    expect(await bayc.ownerOf(101), "buyer should be the new owner").to.be.eq(buyer.address);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(loanDataBefore.loanId);

    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    const userReserveDataAfter = await getUserData(pool, dataProvider, weth.address, borrower.address);

    const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);

    const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
      new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
    );

    // expect debt amount to be liquidated
    const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
      new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
    );

    expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
      userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
      "Invalid user debt after liquidation"
    );

    //the liquidity index of the principal reserve needs to be bigger than the index before
    expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
      ethReserveDataBefore.liquidityIndex.toString(),
      "Invalid liquidity index"
    );

    //the principal APY after a liquidation needs to be lower than the APY before
    expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
      ethReserveDataBefore.liquidityRate.toString(),
      "Invalid liquidity APY"
    );

    expect(ethReserveDataBefore.availableLiquidity.add(BN.from(expectedLiquidateAmount.toString()))).to.be.within(
      ethReserveDataAfter.availableLiquidity.toString(),
      ethReserveDataAfter.availableLiquidity.add(1000).toString()
    );
  });

  it("Lockey Holder: Borrower - Borrows WETH", async () => {
    const { users, pool, nftOracle, weth, bayc, configurator, deployer } = testEnv;
    const depositor = users[3];
    const borrower = users[4];

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000"); //deployer

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(deployer.address, true);

    type NewType = IConfigNftAsCollateralInput;

    const collData: NewType = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 2820,
      auctionDuration: 2880,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "40");

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", borrower.address, "0");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("Lockey Holder: Health Factor goes below 1", async () => {
    const { pool, nftOracle, weth, bayc, deployer } = testEnv;

    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "101");

    // const debAmountUnits = await convertToCurrencyUnits(deployer, weth, nftDebtDataBefore.totalDebt.toString());
    // await setNftAssetPriceForDebt(testEnv, "BAYC", 101, "WETH", debAmountUnits, "40");

    await nftOracle.setNFTPrice(bayc.address, 101, parseEther("50")); // 50 eth
    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");
    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("Lockey Holder: Buyer - buys out the NFT in auction and deducts because he is a lockey holder.", async () => {
    const { users, pool, nftOracle, bayc, dataProvider, weth, lockeyManager, deployer, addressesProvider } = testEnv;
    const buyer = users[2];
    const borrower = users[4];
    const bidder = users[6];
    const firstBidder = users[7];

    await fundWithERC20("WETH", buyer.address, "1000");
    await approveERC20(testEnv, buyer, "WETH");

    await fundWithERC20("WETH", bidder.address, "100");
    await approveERC20(testEnv, bidder, "WETH");

    await fundWithERC20("WETH", firstBidder.address, "100");
    await approveERC20(testEnv, firstBidder, "WETH");

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, "101");

    const ethReserveDataBefore = await dataProvider.getReserveData(weth.address);

    const userReserveDataBefore = await getUserData(pool, dataProvider, weth.address, borrower.address);

    const nftPrice = await nftOracle.getNFTPrice(bayc.address, "101");

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // BUYOUT
    await lockeyManager.connect(deployer.signer).setLockeyDiscountPercentage(BN.from("9700")); // 97% of original price

    await fundWithERC721("LOCKEY", buyer.address, 1);

    // Price is discounted by less amount. Revert expected
    let buyoutPriceIncorrect = new BigNumber(
      new BigNumber(nftPrice.toString()).percentMul(new BigNumber("9699"))
    ).toFixed(0);
    await expect(
      pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPriceIncorrect, buyer.address)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE);

    // Price is bigger than nft price. Revert expected
    buyoutPriceIncorrect = new BigNumber(new BigNumber(nftPrice.toString()).percentMul(new BigNumber("9999"))).toFixed(
      0
    );
    await expect(
      pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPriceIncorrect, buyer.address)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE);

    // First bidder bids
    const firstBidderBalanceBeforeBid = await weth.balanceOf(firstBidder.address);
    await pool.connect(firstBidder.signer).auction(bayc.address, "101", parseEther("49"), firstBidder.address);

    // Second bidder bids
    const bidderBalanceBeforeBid = await weth.balanceOf(bidder.address);
    await pool.connect(bidder.signer).auction(bayc.address, "101", parseEther("50"), bidder.address);

    // Price is discounted
    const buyoutPrice = new BigNumber(new BigNumber(nftPrice.toString()).percentMul(new BigNumber("9700"))).toFixed(0);
    await waitForTx(await pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPrice, buyer.address));

    const firstBidderBalanceAfterBid = await weth.balanceOf(firstBidder.address);
    const bidderBalanceAfterBuyout = await weth.balanceOf(bidder.address);

    expect(await bayc.ownerOf(101), "buyer should be the new owner").to.be.eq(buyer.address);
    expect(bidderBalanceBeforeBid).to.be.eq(bidderBalanceAfterBuyout);
    expect(firstBidderBalanceAfterBid).to.be.gt(firstBidderBalanceBeforeBid);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(loanDataBefore.loanId);

    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    const userReserveDataAfter = await getUserData(pool, dataProvider, weth.address, borrower.address);

    const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);

    const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
      new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
    );

    // expect debt amount to be liquidated
    const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
      new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
    );

    expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
      userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
      "Invalid user debt after liquidation"
    );

    //the liquidity index of the principal reserve needs to be bigger than the index before
    expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
      ethReserveDataBefore.liquidityIndex.toString(),
      "Invalid liquidity index"
    );

    //the principal APY after a liquidation needs to be lower than the APY before
    expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
      ethReserveDataBefore.liquidityRate.toString(),
      "Invalid liquidity APY"
    );

    expect(ethReserveDataBefore.availableLiquidity.add(BN.from(expectedLiquidateAmount.toString()))).to.be.within(
      ethReserveDataAfter.availableLiquidity.toString(),
      ethReserveDataAfter.availableLiquidity.add(1000).toString()
    );
  });
});
