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
    let nftBuyer;
    let nftSeller;
    let nftAsset;
    let tokenId;

    beforeEach(async function () {
      const { users, debtMarket, bayc, pool, nftOracle, deployer } = testEnv;
      nftBuyer = users[3];
      nftSeller = users[4];
      nftAsset = bayc.address;
      tokenId = testEnv.tokenIdTracker++;

      await borrowBayc(testEnv, nftSeller, tokenId, 10);

      // Fund the wallets
      await fundWithERC20("WETH", nftSeller.address, "1000");
      await fundWithERC20("WETH", nftBuyer.address, "1000");

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
      await wethGateway.connect(nftBuyer.signer).buyDebtETH(nftAsset, tokenId, nftBuyer.address, { value: 50 });

      // Confirm the debt is sold
      const debtIdAfter = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      expect(debtIdBefore[2]).to.not.equal(debtIdAfter[2], "Seller and buyer should be different");
      expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(nftBuyer.address), 1, "Invalid balance of UToken");

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
    let nftBuyer;
    let nftSeller;
    let nftAsset;
    let tokenId;

    beforeEach(async function () {
      const { users, debtMarket, bayc, pool, nftOracle, deployer } = testEnv;
      auctionBuyer = users[2];
      nftBuyer = users[3];
      nftSeller = users[4];
      nftAsset = bayc.address;
      tokenId = testEnv.tokenIdTracker++;

      await pool.connect(deployer.signer).updateSafeHealthFactor("2000000000000000000");

      await borrowBayc(testEnv, nftSeller, tokenId, 10);

      // Fund the wallets
      await fundWithERC20("WETH", nftSeller.address, "1000");
      await fundWithERC20("WETH", nftBuyer.address, "1000");
      await fundWithERC20("WETH", auctionBuyer.address, "1000");
      await approveERC20(testEnv, nftSeller, "WETH");
      await approveERC20(testEnv, nftBuyer, "WETH");
      await approveERC20(testEnv, auctionBuyer, "WETH");

      const blockNumber = await users[0].signer.provider!.getBlockNumber();
      const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
      const auctionEndTimestamp = moment(currTimestamp).add(5, "minutes").unix() * 1000;
      await debtMarket
        .connect(nftSeller.signer)
        .createDebtListing(nftAsset, tokenId, 0, nftSeller.address, 3, auctionEndTimestamp);

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
      const { pool, wethGateway, uBAYC, dataProvider, debtMarket } = testEnv;

      // Get the Id before reset to 0
      const debtIdBefore = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      // Buyer buys the debt
      await wethGateway.connect(nftBuyer.signer).bidDebtETH(nftAsset, tokenId, nftBuyer.address, { value: 4 });
      await increaseTime(2000000);
      await debtMarket.connect(nftBuyer.signer).claim(nftAsset, tokenId, nftBuyer.address);

      // Confirm the debt is sold
      const debtIdAfter = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

      expect(debtIdBefore[2]).to.not.equal(debtIdAfter[2], "Seller and buyer should be different");
      expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
      expect(uBAYC.balanceOf(nftBuyer.address), 1, "Invalid balance of UToken");

      // confirms health factor is below 1
      const nftDebtDataAfter = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );

      await pool.connect(nftBuyer.signer).repay(nftAsset, tokenId, "8000000000000000000");

      const nftDebtData = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtData.healthFactor.toString()).to.be.bignumber.gt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
    });

    it("Confirms HF < 1 after buyer bids the debt, seller redeems and HF > 1", async () => {
      const { pool, wethGateway, uBAYC, dataProvider, debtMarket } = testEnv;

      // Get the Id before reset to 0
      const debtIdBefore = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);
      const balanceBefore = await nftSeller.signer.getBalance();
      console.log("Balance before: ", balanceBefore.toString());

      // Buyer bids the debt
      await wethGateway.connect(nftBuyer.signer).bidDebtETH(nftAsset, tokenId, nftBuyer.address, { value: 4 });
      await increaseTime(2000000);

      // auctionsBuyer bids on Auction to change state to auction
      await pool.connect(auctionBuyer.signer).auction(nftAsset, tokenId, "11000000000000000000", auctionBuyer.address);

      // Seller redeems the auction HF < 1
      await pool.connect(nftSeller.signer).redeem(nftAsset, tokenId, "6000000000000000000", "1000000000000000000");

      const balanceAfter = await nftSeller.signer.getBalance();
      console.log("Balance after: ", balanceAfter.toString());

      const nftDebtData = await pool.getNftDebtData(nftAsset, tokenId);
      expect(nftDebtData.healthFactor.toString()).to.be.bignumber.gt(
        oneEther.toFixed(0),
        ProtocolErrors.VL_INVALID_HEALTH_FACTOR
      );
    });

    // it("If debt auction ends after marketplace auction and debt claims 1st", async () => {
    //     const { pool, wethGateway, uBAYC, dataProvider, debtMarket, users, weth } = testEnv;

    //     console.log("1");
    //     const auctionBuyer = users[2];
    //     await fundWithERC20("WETH", auctionBuyer.address, "1000");
    //     await approveERC20(testEnv, auctionBuyer, "WETH");
    //     //console.log(await weth.balanceOf(auctionBuyer.address).toString());

    //     await pool.connect(auctionBuyer.signer).auction(nftAsset, tokenId, "12000000000000000000", auctionBuyer.address);
    //     console.log("2");
    //     // Get the Id before reset to 0
    //     const debtIdBefore = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);
    //     console.log("3");
    //     // Buyer buys the debt
    //     console.log(nftBuyer.address);
    //     await debtMarket.connect(nftBuyer.signer).bid(nftAsset, tokenId, nftBuyer.address, "4000000000000000000");
    //     console.log("4");
    //     await increaseTime(2000000);
    //     console.log("5");
    //     await debtMarket.connect(nftBuyer.signer).claim(nftAsset, tokenId, nftBuyer.address);

    //     //console.log(await weth.balanceOf(auctionBuyer.address).toString());
    //     // // Confirm the debt is sold
    //     // const debtIdAfter = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);

    //     // expect(debtIdBefore[2]).to.not.equal(debtIdAfter[2], "Seller and buyer should be different");
    //     // expect(uBAYC.balanceOf(nftSeller.address), 0, "Invalid balance of UToken");
    //     // expect(uBAYC.balanceOf(nftBuyer.address), 1, "Invalid balance of UToken");

    //     // // confirms health factor is below 1
    //     // const nftDebtDataAfter = await pool.getNftDebtData(nftAsset, tokenId);
    //     // expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
    //     //     oneEther.toFixed(0),
    //     //     ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    //     // );
    // });
    // If auction time higher than HFAuction?? Tokens Returned?
  });
});
