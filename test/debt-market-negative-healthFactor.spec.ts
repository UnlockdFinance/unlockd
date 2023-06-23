import { BigNumber as BN, Contract, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import moment from "moment";
import { MAX_UINT_AMOUNT, oneEther } from "../helpers/constants";
import { getDebtToken, getPoolAdminSigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals, convertToCurrencyUnits } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  DRE,
  fundWithERC20,
  fundWithERC721,
  fundWithWrappedPunk,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, approveERC20PunkGateway, borrowBayc, deposit } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("Sell the Debt with Health Factor below 1", (testEnv) => {
  describe("Fixed Price", function () {
    let debtBuyer;
    let nftSeller;
    let nftAsset;
    let tokenId;

    beforeEach(async function () {
      const { users, debtMarket, bayc, pool, nftOracle, deployer } = testEnv;
      debtBuyer = users[3];
      nftSeller = users[4];
      nftAsset = bayc.address;
      tokenId = testEnv.tokenIdTracker++;

      await borrowBayc(testEnv, nftSeller, tokenId, 10);

      // Fund the wallets
      await fundWithERC20("WETH", nftSeller.address, "1000");
      await fundWithERC20("WETH", debtBuyer.address, "1000");

      await debtMarket.connect(nftSeller.signer).createDebtListing(nftAsset, tokenId, 50, nftSeller.address, 0, 0);

      // Set the price manager and drop health factor below 1
      await nftOracle.setPriceManagerStatus(deployer.address, true);
      await nftOracle.setNFTPrice(nftAsset, tokenId, "12000000000000000000");

      // confirms health factor is below 1
      const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, tokenId);
      expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
    });

    it("Confirms HF < 1 after buyer buys the debt.", async () => {
      const { pool, wethGateway, uBAYC, dataProvider } = testEnv;

      // Get the Id before reset to 0
      const debtIdBefore = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      // Buyer buys the debt
      await wethGateway.connect(debtBuyer.signer).buyDebtETH(nftAsset, tokenId, debtBuyer.address, { value: 50 });

      // Confirm the debt is sold
      const debtIdAfter = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      expect(debtIdBefore[2]).to.not.equal(debtIdAfter[2], "Seller and buyer should be different");
      expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(debtBuyer.address), 1, "Invalid balance of UToken");

      // confirms health factor is below 1
      const nftDebtDataAfter = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
    });
  });
  describe("Auctions", function () {
    let auctionBuyer;
    let debtBuyer;
    let nftSeller;
    let nftAsset;
    let tokenId;

    beforeEach(async function () {
      const { users, debtMarket, bayc, pool, nftOracle, deployer, configurator } = testEnv;
      auctionBuyer = users[2];
      debtBuyer = users[3];
      nftSeller = users[4];
      nftAsset = bayc.address;
      tokenId = testEnv.tokenIdTracker++;

      await pool.connect(deployer.signer).updateSafeHealthFactor("2000000000000000000");

      await borrowBayc(testEnv, nftSeller, tokenId, 10);

      // Fund the wallets
      await fundWithERC20("WETH", nftSeller.address, "1000");
      await fundWithERC20("WETH", debtBuyer.address, "1000");
      await fundWithERC20("WETH", auctionBuyer.address, "1000");
      await approveERC20(testEnv, nftSeller, "WETH");
      await approveERC20(testEnv, debtBuyer, "WETH");
      await approveERC20(testEnv, auctionBuyer, "WETH");

      console.log("Test to see if beforeEach doesn't fail.");
      const blockNumber = await users[0].signer.provider!.getBlockNumber();
      const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
      const auctionEndTimestamp = moment(currTimestamp).add(5, "minutes").unix() * 1000;

      await debtMarket
        .connect(nftSeller.signer)
        .createDebtListing(nftAsset, tokenId, 0, nftSeller.address, 3, auctionEndTimestamp);

      type NewType = IConfigNftAsCollateralInput;

      const collData: NewType = {
        asset: bayc.address,
        nftTokenId: tokenId,
        newPrice: parseEther("100"),
        ltv: 4000,
        liquidationThreshold: 7000,
        redeemThreshold: 9000,
        liquidationBonus: 500,
        redeemDuration: 10,
        auctionDuration: 15,
        redeemFine: 500,
        minBidFine: 2000,
      };
      await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

      // Set the price manager and drop health factor below 1
      await nftOracle.setPriceManagerStatus(deployer.address, true);
      await nftOracle.setNFTPrice(nftAsset, tokenId, "12000000000000000000");

      // confirms health factor is below 1
      const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, tokenId);
      expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
    });

    it("Confirms HF < 1 after buyer buys the debt, new buyer repays and HF > 1", async () => {
      const { pool, weth, uBAYC, dataProvider, debtMarket } = testEnv;

      // Get the Id before reset to 0
      const debtIdBefore = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      // Buyer buys the debt
      await weth.connect(debtBuyer.signer).approve(debtMarket.address, "4000000000000000000");
      await debtMarket.connect(debtBuyer.signer).bid(nftAsset, tokenId, "4000000000000000000", debtBuyer.address);
      await increaseTime(2000000);
      await debtMarket.connect(debtBuyer.signer).claim(nftAsset, tokenId, debtBuyer.address);

      // Confirm the debt is sold
      const debtIdAfter = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      expect(debtIdBefore[2]).to.not.equal(debtIdAfter[2], "Seller and buyer should be different");
      expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(debtBuyer.address), 1, "Invalid balance of UToken");

      // confirms health factor is below 1
      const nftDebtDataAfter = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );

      await pool.connect(debtBuyer.signer).repay(nftAsset, tokenId, "8000000000000000000");

      const nftDebtData = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtData.healthFactor.toString()).to.be.bignumber.gt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
    });

    it("Confirms HF < 1 after buyer bids the debt, seller redeems and HF > 1", async () => {
      const { pool, uBAYC, debtMarket, weth } = testEnv;

      // Get the Id before reset to 0
      const balanceBefore = await weth.balanceOf(debtBuyer.address);

      // Buyer bids the debt
      await weth.connect(debtBuyer.signer).approve(debtMarket.address, "4000000000000000000");
      await debtMarket.connect(debtBuyer.signer).bid(nftAsset, tokenId, "4000000000000000000", debtBuyer.address);
      await increaseTime(2000000);

      // auctionsBuyer bids on Auction to change state to auction
      await pool.connect(auctionBuyer.signer).auction(nftAsset, tokenId, "11000000000000000000", auctionBuyer.address);

      // Seller redeems the auction HF < 1
      await pool.connect(nftSeller.signer).redeem(nftAsset, tokenId, "6000000000000000000", "1000000000000000000");

      const balanceAfter = await weth.balanceOf(debtBuyer.address);

      // The balance of the buyer should be the same as before + delta
      const delta = "500000000000000"; // 0.0005 ETH
      expect(balanceBefore).to.be.closeTo(balanceAfter, delta);

      // After Redeem HF > 1
      const nftDebtData = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtData.healthFactor.toString()).to.be.bignumber.gt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
      expect(uBAYC.balanceOf(nftSeller.address), 1, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(debtBuyer.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(auctionBuyer.address), 0, "Invalid balance of UToken");
    });

    it("Confirms HF < 1 after debt buyer bids the debt, and auctionBuyer bids and liquidates", async () => {
      const { pool, uBAYC, debtMarket, bayc, weth } = testEnv;

      // Get the Id before reset to 0
      const balanceBefore = await weth.balanceOf(debtBuyer.address);

      // Buyer bids the debt
      await weth.connect(debtBuyer.signer).approve(debtMarket.address, "4000000000000000000");
      await debtMarket.connect(debtBuyer.signer).bid(nftAsset, tokenId, "4000000000000000000", debtBuyer.address);

      // auctionsBuyer bids on Auction to change state to auction
      await pool.connect(auctionBuyer.signer).auction(nftAsset, tokenId, "11000000000000000000", auctionBuyer.address);

      // moves time to end both auctions
      await increaseTime(2000000);

      // the buyer liquidates, claiming the NFT
      await pool.connect(auctionBuyer.signer).liquidate(nftAsset, tokenId, "11000000000000000000");

      const balanceAfter = await weth.balanceOf(debtBuyer.address);

      // The balance of the buyer should be the same as before + delta
      const delta = "500000000000000"; // 0.0005 ETH
      expect(balanceBefore).to.be.closeTo(balanceAfter, delta);
      expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(debtBuyer.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(auctionBuyer.address), 0, "Invalid balance of UToken");
      expect(await bayc.ownerOf(tokenId)).to.be.equal(auctionBuyer.address);
    });

    it("Confirms HF < 1 after debt buyer bids the debt, and auctionBuyer bids, but debt buyer wins", async () => {
      const { pool, uBAYC, debtMarket, weth } = testEnv;

      // Get the Id before reset to 0
      const balanceBefore = await weth.balanceOf(auctionBuyer.address);

      // Buyer bids the debt
      await weth.connect(debtBuyer.signer).approve(debtMarket.address, "4000000000000000000");
      await debtMarket.connect(debtBuyer.signer).bid(nftAsset, tokenId, "4000000000000000000", debtBuyer.address);

      // auctionsBuyer bids on Auction to change state to auction
      await pool.connect(auctionBuyer.signer).auction(nftAsset, tokenId, "11000000000000000000", auctionBuyer.address);

      // moves time to end both auctions
      await increaseTime(2000000);

      // the debt buyer claims the debt
      await debtMarket.connect(debtBuyer.signer).claim(nftAsset, tokenId, debtBuyer.address);

      const balanceAfter = await weth.balanceOf(auctionBuyer.address);

      // The balance of the buyer should be the same as before + delta
      const delta = "500000000000000"; // 0.0005 ETH
      expect(balanceBefore).to.be.closeTo(balanceAfter, delta);

      expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(debtBuyer.address), 1, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(auctionBuyer.address), 0, "Invalid balance of UToken");
    });
    // If auction time higher than HFAuction?? Tokens Returned?
  });
});
