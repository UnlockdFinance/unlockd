import { BigNumber as BN, Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import moment from "moment";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import { MAX_UINT_AMOUNT } from "../helpers/constants";
import { getDebtToken, getPoolAdminSigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  DRE,
  fundWithERC20,
  fundWithERC721,
  fundWithWrappedPunk,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput } from "../helpers/types";
import { approveERC20, approveERC20PunkGateway, borrowBayc, deposit } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("Buy and sell the debts", (testEnv) => {
  describe("Positive", function () {
    describe("FIXED PRICE type debt", function () {
      it("Create a debt listing", async () => {
        const { users, debtMarket, bayc } = testEnv;
        const seller = users[4];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);

        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);

        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.debtor).equals(seller.address, "Invalid debtor");
        expect(debt.nftAsset).equals(nftAsset, "Invalid nftAsset");
        expect(debt.tokenId).equals(tokenId, "Invalid tokenId");
        expect(debt.debtId).equals(debtId, "Invalid debtId");
        expect(debt.sellPrice.toString()).to.be.bignumber.eq("50", "Invalid sell price");
      });
      it("Cancel a debt listing", async () => {
        const { users, debtMarket, bayc } = testEnv;
        const seller = users[4];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);

        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        await debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);

        const canceledDebt = await debtMarket.getDebt(debtId);
        expect(canceledDebt.state).to.be.equals(3);

        const canceledDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(canceledDebtId).to.be.equals(0);
      });
      it("Buy a debt with ETH ", async () => {
        const { users, debtMarket, wethGateway, bayc, uBAYC, dataProvider } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);

        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        await waitForTx(
          await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0)
        );
        await waitForTx(
          await wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 50 })
        );

        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
      });
      it("Buy a debt with a LOCKEY HOLDER discount", async () => {
        const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider, lockeyHolder, deployer } = testEnv;
        const seller = users[4];
        const buyer = users[6];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await fundWithERC721("LOCKEY", buyer.address, 1);
        await borrowBayc(testEnv, seller, tokenId, 10);
        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        await lockeyHolder.connect(deployer.signer).setLockeyDiscountPercentageOnDebtMarket(BN.from("10000")); // 0% discount
        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 100, seller.address, 0, 0);
        const tx_one = wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 1 });
        await expect(tx_one).to.be.revertedWith("1013");
        await lockeyHolder.connect(deployer.signer).setLockeyDiscountPercentageOnDebtMarket(BN.from("9700")); // 3% discount
        const tx_two = wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 96 });
        await expect(tx_two).to.be.revertedWith("1013");
        await wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 97 });

        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
      });
      it("Buy a PUNK debt with WETH", async () => {
        const {
          dataProvider,
          users,
          debtMarket,
          weth,
          configurator,
          pool,
          cryptoPunksMarket,
          wrappedPunk,
          punkGateway,
          deployer,
          uPUNK,
        } = testEnv;

        const seller = users[4];
        const buyer = users[5];
        const nftAsset = cryptoPunksMarket.address;
        const tokenId = testEnv.punkIndexTracker++;
        await fundWithWrappedPunk(seller.address, tokenId);
        const borrowSize1 = await convertToCurrencyDecimals(deployer, weth, "1");

        await waitForTx(
          await cryptoPunksMarket.connect(seller.signer).offerPunkForSaleToAddress(tokenId, 0, punkGateway.address)
        );

        const collData: IConfigNftAsCollateralInput = {
          asset: wrappedPunk.address,
          nftTokenId: tokenId.toString(),
          newPrice: parseEther("100"),
          ltv: 4000,
          liquidationThreshold: 7000,
          redeemThreshold: 9000,
          liquidationBonus: 500,
          redeemDuration: 100,
          auctionDuration: 200,
          redeemFine: 500,
          minBidFine: 2000,
        };
        await waitForTx(await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]));

        const reserveData = await pool.getReserveData(weth.address);
        const debtToken = await getDebtToken(reserveData.debtTokenAddress);

        await waitForTx(await debtToken.connect(seller.signer).approveDelegation(punkGateway.address, MAX_UINT_AMOUNT));

        await waitForTx(
          await punkGateway.connect(seller.signer).borrow(weth.address, borrowSize1, tokenId, seller.address, "0")
        );
        const oldLoan = await dataProvider.getLoanDataByCollateral(wrappedPunk.address, `${tokenId}`);

        await debtMarket
          .connect(seller.signer)
          .createDebtListing(wrappedPunk.address, tokenId, 100, seller.address, 0, 0);
        await fundWithERC20("WETH", buyer.address, "1000");
        await approveERC20PunkGateway(testEnv, buyer, "WETH");

        await punkGateway.connect(buyer.signer).buyDebtPunk(tokenId, buyer.address, 100);
        const debtId = await debtMarket.getDebtId(wrappedPunk.address, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(wrappedPunk.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uPUNK.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uPUNK.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
      });
      it("Buy a PUNK debt with ETH", async () => {
        const {
          dataProvider,
          users,
          debtMarket,
          weth,
          configurator,
          pool,
          cryptoPunksMarket,
          wrappedPunk,
          punkGateway,
          deployer,
          uPUNK,
        } = testEnv;

        const seller = users[4];
        const buyer = users[5];
        const nftAsset = cryptoPunksMarket.address;
        const tokenId = testEnv.punkIndexTracker++;
        await fundWithWrappedPunk(seller.address, tokenId);

        const borrowSize1 = await convertToCurrencyDecimals(deployer, weth, "1");

        await waitForTx(
          await cryptoPunksMarket.connect(seller.signer).offerPunkForSaleToAddress(tokenId, 0, punkGateway.address)
        );

        const collData: IConfigNftAsCollateralInput = {
          asset: wrappedPunk.address,
          nftTokenId: tokenId.toString(),
          newPrice: parseEther("100"),
          ltv: 4000,
          liquidationThreshold: 7000,
          redeemThreshold: 9000,
          liquidationBonus: 500,
          redeemDuration: 100,
          auctionDuration: 200,
          redeemFine: 500,
          minBidFine: 2000,
        };
        await waitForTx(await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]));

        const reserveData = await pool.getReserveData(weth.address);
        const debtToken = await getDebtToken(reserveData.debtTokenAddress);

        await waitForTx(await debtToken.connect(seller.signer).approveDelegation(punkGateway.address, MAX_UINT_AMOUNT));

        await waitForTx(
          await punkGateway.connect(seller.signer).borrow(weth.address, borrowSize1, tokenId, seller.address, "0")
        );
        const oldLoan = await dataProvider.getLoanDataByCollateral(wrappedPunk.address, `${tokenId}`);

        await debtMarket
          .connect(seller.signer)
          .createDebtListing(wrappedPunk.address, tokenId, 100, seller.address, 0, 0);
        await punkGateway.connect(buyer.signer).buyDebtPunkETH(tokenId, buyer.address, { value: 100 });

        const debtId = await debtMarket.getDebtId(wrappedPunk.address, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(wrappedPunk.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uPUNK.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uPUNK.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
      });
    });
    describe("AUCTION type debt", function () {
      it("Create a debt listing", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp);
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.debtor).equals(seller.address, "Invalid debtor");
        expect(debt.nftAsset).equals(nftAsset, "Invalid nftAsset");
        expect(debt.tokenId).equals(tokenId, "Invalid tokenId");
        expect(debt.debtId).equals(debtId, "Invalid debtId");
        expect(debt.sellPrice.toString()).to.be.bignumber.eq("0", "Invalid sell price");
        expect(debt.startBiddingPrice.toString()).to.be.bignumber.eq("50", "Invalid start bidding price");
        expect(debt.sellType).equals(1, "Invalid debt offer type");
      });
      it("Create a bid", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);

        expect(debt.sellType).equals(1, "Invalid debt offer type");
        expect(debt.state).equals(1, "Invalid debt offer state");
        expect(debt.bidPrice).equals(50, "Invalid bid price");
        expect(debt.bidderAddress).equals(bidder.address, "Invalid bidder address");
      });
      it("Cancel a debt listing with bids", async () => {
        const { users, debtMarket, bayc, weth, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        await debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);

        await expect(weth.balanceOf(bidder.address), 50);
        await expect(weth.balanceOf(seller.address), 0);
        const canceledDebt = await debtMarket.getDebt(debtId);
        expect(canceledDebt.state).to.be.equals(3);

        const canceledDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(canceledDebtId).to.be.equals(0);
      });
      it("Create a second bid ", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const secondBidder = users[6];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        await wethGateway
          .connect(secondBidder.signer)
          .bidDebtETH(nftAsset, tokenId, secondBidder.address, { value: 60 });
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);

        expect(debt.sellType).equals(1, "Invalid debt offer type");
        expect(debt.state).equals(1, "Invalid debt offer state");
        expect(debt.bidPrice).equals(60, "Invalid bid price");
        expect(debt.bidderAddress).equals(secondBidder.address, "Invalid bidder address");
      });
      it("Claim an auction", async () => {
        const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(5, "minutes").unix() * 1000;
        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp)
        );

        await waitForTx(
          await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 })
        );
        await increaseTime(2000000);
        await debtMarket.connect(bidder.signer).claim(nftAsset, tokenId, bidder.address);
        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);

        expect(debt.state).equals(2, "Invalid debt offer state");

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(bidder.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(bidder.address, "Invalid new loan debtor");
      });
    });
    describe("MIXED type debt", function () {
      it("Create a debt listing ", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp);
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.debtor).equals(seller.address, "Invalid debtor");
        expect(debt.nftAsset).equals(nftAsset, "Invalid nftAsset");
        expect(debt.tokenId).equals(tokenId, "Invalid tokenId");
        expect(debt.debtId).equals(debtId, "Invalid debtId");
        expect(debt.sellPrice.toString()).to.be.bignumber.eq("100", "Invalid sell price");
        expect(debt.startBiddingPrice.toString()).to.be.bignumber.eq("50", "Invalid start bidding price");
        expect(debt.sellType).equals(2, "Invalid debt offer type");
      });
      it("Buy a debt with ETH", async () => {
        const { users, debtMarket, wethGateway, bayc, uBAYC, dataProvider } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);

        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;

        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 50, seller.address, 25, auctionEndTimestamp)
        );
        await waitForTx(
          await wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 50 })
        );

        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of uNFT");
        expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of uNFT");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("0.0001")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
      });
      it("Create a bid", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);

        expect(debt.sellType).equals(2, "Invalid debt offer type");
        expect(debt.state).equals(1, "Invalid debt offer state");
        expect(debt.bidPrice).equals(50, "Invalid bid price");
        expect(debt.bidderAddress).equals(bidder.address, "Invalid bidder address");
      });
      it("Buy a debt with bids", async () => {
        const { users, debtMarket, wethGateway, bayc, uBAYC, dataProvider, weth } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const bidder = users[6];

        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);

        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;

        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 50, seller.address, 25, auctionEndTimestamp)
        );
        await waitForTx(
          await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 25 })
        );
        await waitForTx(
          await wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 50 })
        );

        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");

        await expect(weth.balanceOf(bidder.address), 25);
        await expect(weth.balanceOf(seller.address), 50);
        const soldDebt = await debtMarket.getDebt(debtId);
        expect(soldDebt.state).to.be.equals(2);

        const soldDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(soldDebtId).equals(debtId, "Invalid debt Id");
      });
      it("Buy a debt with bids same as sell amount", async () => {
        const { users, debtMarket, wethGateway, bayc, uBAYC, dataProvider, weth } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const bidder = users[6];

        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);

        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;

        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 50, seller.address, 25, auctionEndTimestamp)
        );
        await waitForTx(
          await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 30 })
        );
        await waitForTx(
          await wethGateway.connect(buyer.signer).bidDebtETH(nftAsset, tokenId, buyer.address, { value: 50 })
        );
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");

        await expect(weth.balanceOf(bidder.address), 30);
        await expect(weth.balanceOf(seller.address), 50);
        const soldDebt = await debtMarket.getDebt(debtId);
        expect(soldDebt.state).to.be.equals(2);

        const soldDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(soldDebtId).equals(debtId, "Invalid debt Id");
      });
      it("Cancel a debt listing with bids", async () => {
        const { users, debtMarket, bayc, weth, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        await debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);

        await expect(weth.balanceOf(bidder.address), 50);
        await expect(weth.balanceOf(seller.address), 0);
        const canceledDebt = await debtMarket.getDebt(debtId);
        expect(canceledDebt.state).to.be.equals(3);

        const canceledDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(canceledDebtId).to.be.equals(0);
      });
      it("Cancel a debt listing without bids", async () => {
        const { users, debtMarket, bayc } = testEnv;
        const seller = users[4];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 50, seller.address, 25, auctionEndTimestamp)
        );
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        await debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);

        const canceledDebt = await debtMarket.getDebt(debtId);
        expect(canceledDebt.state).to.be.equals(3);

        const canceledDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(canceledDebtId).to.be.equals(0);
      });
      it("Claim an auction", async () => {
        const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(5, "minutes").unix() * 1000;
        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp)
        );

        await waitForTx(
          await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 })
        );
        await increaseTime(2000000);
        await debtMarket.connect(bidder.signer).claim(nftAsset, tokenId, bidder.address);
        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);

        expect(debt.state).equals(2, "Invalid debt offer state");

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(bidder.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(bidder.address, "Invalid new loan debtor");
      });
      it("Buy a debt bids same as sell amount with a LOCKEY HOLDER discount", async () => {
        const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider, lockeyHolder, deployer, weth } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const buyer = users[6];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await fundWithERC721("LOCKEY", buyer.address, 1);
        await borrowBayc(testEnv, seller, tokenId, 10);
        const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        await lockeyHolder.connect(deployer.signer).setLockeyDiscountPercentageOnDebtMarket(BN.from("9700")); // 3% discount
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;

        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 100, seller.address, 25, auctionEndTimestamp)
        );
        await waitForTx(
          await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 99 })
        );
        await waitForTx(
          await wethGateway.connect(buyer.signer).bidDebtETH(nftAsset, tokenId, buyer.address, { value: 97 })
        );
        const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
        const debt = await debtMarket.getDebt(debtId);
        expect(debt.state).equals(2, "Invalid debt offer state");

        const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

        //Check previous unft brn and minted on the new
        expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
        expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of UToken");
        //Check previous debt amount of the loan is same as actual
        expect(loan.currentAmount).to.be.within(
          oldLoan.currentAmount,
          oldLoan.currentAmount.add(parseEther("1")).toString()
        );
        //Check previous owner of the loan
        expect(oldLoan.borrower).equals(seller.address, "Invalid previous loan debtor");
        expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");

        await expect(weth.balanceOf(bidder.address), 99);
        await expect(weth.balanceOf(seller.address), 97);
        const soldDebt = await debtMarket.getDebt(debtId);
        expect(soldDebt.state).to.be.equals(2);

        const soldDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
        expect(soldDebtId).equals(debtId, "Invalid debt Id");
      });
    });
    it("Update a debt listing delta bids", async () => {
      const { users, debtMarket, bayc, wethGateway } = testEnv;
      const seller = users[4];
      const bidder = users[5];
      const secondBidder = users[6];
      const nftAsset = bayc.address;
      const poolAdmin = await getPoolAdminSigner();

      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);
      const blockNumber = await users[0].signer.provider!.getBlockNumber();
      const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
      const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
      await debtMarket
        .connect(seller.signer)
        .createDebtListing(nftAsset, tokenId, 0, seller.address, 100, auctionEndTimestamp);
      //Delta to 10%
      await debtMarket.connect(poolAdmin).setDeltaBidPercent(1000);
      await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 100 });
      const tx = wethGateway
        .connect(secondBidder.signer)
        .bidDebtETH(nftAsset, tokenId, secondBidder.address, { value: 102 });
      await expect(tx).to.be.revertedWith("1009");
      //Delta to 1%
      await debtMarket.connect(poolAdmin).setDeltaBidPercent(100);
      await wethGateway
        .connect(secondBidder.signer)
        .bidDebtETH(nftAsset, tokenId, secondBidder.address, { value: 102 });
      const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
      const debt = await debtMarket.getDebt(debtId);

      expect(debt.sellType).equals(1, "Invalid debt offer type");
      expect(debt.state).equals(1, "Invalid debt offer state");
      expect(debt.bidPrice).equals(102, "Invalid bid price");
      expect(debt.bidderAddress).equals(secondBidder.address, "Invalid bidder address");
    });
    it("Cancel debt listing on borrow again when exist a bid", async () => {
      const { users, debtMarket, bayc, pool, weth, wethGateway } = testEnv;
      const seller = users[4];
      const bidder = users[5];

      const nftAsset = bayc.address;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);
      const blockNumber = await users[0].signer.provider!.getBlockNumber();
      const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
      const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
      await debtMarket
        .connect(seller.signer)
        .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp);
      await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });

      const debtId = await debtMarket.getDebtId(nftAsset, tokenId);

      await pool.connect(seller.signer).borrow(weth.address, "10", bayc.address, `${tokenId}`, seller.address, "0");
      await expect(weth.balanceOf(bidder.address), 50);
      await expect(weth.balanceOf(seller.address), 0);
      const canceledDebt = await debtMarket.getDebt(debtId);
      expect(canceledDebt.state).to.be.equals(3);
    });

    it("Cancel debt listing on borrow again", async () => {
      const { users, debtMarket, bayc, pool, weth } = testEnv;
      const seller = users[4];
      const nftAsset = bayc.address;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);

      await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);
      const debtId = await debtMarket.getDebtId(nftAsset, tokenId);

      await pool.connect(seller.signer).borrow(weth.address, "10", bayc.address, `${tokenId}`, seller.address, "0");
      const debt = await debtMarket.getDebt(debtId);

      expect(debt.sellType).equals(0, "Invalid debt offer type");
      expect(debt.state).equals(3, "Invalid debt offer state");
    });
  });
  describe("Negative", function () {
    const createDebtListing = async (testEnv, nftAsset, amount, seller) => {
      const { debtMarket } = testEnv;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);
      return debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, amount, seller.address, 0, 0);
    };
    describe("Revert on try to buy a debt listing", function () {
      it("When it is a the price is lowest than the offer", async () => {
        const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider, lockeyHolder, deployer } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);
        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 100, seller.address, 0, 0);
        const tx = wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 1 });
        await expect(tx).to.be.revertedWith("1013");
      });
      it("When it is a the price is highest than the offer", async () => {
        const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider, lockeyHolder, deployer } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);
        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 100, seller.address, 0, 0);
        const tx = wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 101 });
        await expect(tx).to.be.revertedWith("1013");
      });
    });
    describe("Revert on try to create listing", function () {
      it("When it is a debt listing without the ownership of the nft", async () => {
        const { users, bayc } = testEnv;
        const { debtMarket } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const debtCreationPromise = debtMarket
          .connect(buyer.signer)
          .createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);
        await expect(debtCreationPromise).to.be.revertedWith("1000");
      });
      it("When it is a debt listing with wrong on behalf of", async () => {
        const { users, bayc } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const debtCreationPromise = createDebtListing(testEnv, nftAsset, 50, {
          address: "0x0000000000000000000000000000000000000000",
        });
        await expect(debtCreationPromise).to.be.revertedWith("ERC721: transfer to the zero address");
      });
      it("When it is a debt listing with 0 sell price", async () => {
        const { users, bayc } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const debtCreationPromise = createDebtListing(testEnv, nftAsset, 0, seller);
        await expect(debtCreationPromise).to.be.revertedWith("1002");
      });
      it("When it is a debt listing that already exist", async () => {
        const { users, bayc, debtMarket } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        await createDebtListing(testEnv, nftAsset, 50, seller);

        const debtCreationPromise = debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, testEnv.tokenIdTracker - 1, 50, seller.address, 0, 0);

        await expect(debtCreationPromise).to.be.revertedWith("1005");
      });
      it("When it is a debt listing on non existing loan", async () => {
        const { users, bayc, debtMarket } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await fundWithERC721("BAYC", seller.address, tokenId);

        const debtCreationPromise = debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);

        await expect(debtCreationPromise).to.be.revertedWith("1006");
      });
    });
    describe("Revert on try to create listing with Auction", function () {
      it("When it is a debt listing with the auctionEndTimestamp past", async () => {});
    });
    describe("Revert on try to cancel listing", function () {
      it("When debt no exist", async () => {
        const { users, debtMarket, bayc } = testEnv;
        const seller = users[4];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        const sut = debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);
        await expect(sut).to.be.revertedWith("1001");
      });
      it("When it has SOLD state ", async () => {
        const { users, debtMarket, wethGateway, bayc, uBAYC, dataProvider } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;

        await borrowBayc(testEnv, seller, tokenId, 10);
        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);
        await wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 50 });

        const sut = debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);
        await expect(sut).to.be.revertedWith("1004");
      });
    });
    describe("Revert on try to bid a auction debt", function () {
      it("When debt no exist", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);

        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        await expect(sut).to.be.revertedWith("1001");
      });
      it("When the new bid price is lower than min initial bid price", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp);
        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 49 });
        await expect(sut).to.be.revertedWith("1014");
      });
      it("When the new bid price is lower than the last bid price plus delta", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50000, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50001 });
        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50002 });

        await expect(sut).to.be.revertedWith("1009");
      });
      it("When the bid type is PRICE FIXED", async () => {
        const { users, debtMarket, wethGateway, bayc } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);

        await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address, 0, 0);
        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 60 });

        await expect(sut).to.be.revertedWith("1010");
      });
      it("When auction already ended", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(12, "hour").unix() * 1000;
        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp)
        );
        await advanceTimeAndBlock(3700000 * 12);

        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 60 });

        await expect(sut).to.be.revertedWith("1007");
      });
      it("When the initial bid is lower than initialMinBidPrice", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp);
        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 49 });
        await expect(sut).to.be.revertedWith("1014");
      });
      it("When the bid is higher than sell price", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 100, seller.address, 50, auctionEndTimestamp);
        const sut = wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 101 });
        await expect(sut).to.be.revertedWith("1008");
      });
    });
    describe("Revert on try to claim a auction debt", function () {
      it("When debt no exist", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);

        const sut = debtMarket.connect(bidder.signer).claim(nftAsset, tokenId, bidder.address);
        await expect(sut).to.be.revertedWith("1001");
      });
      it("When onBehalfOf is not the last bidder", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(1, "days").unix() * 1000;
        await debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, tokenId, 0, seller.address, 50, auctionEndTimestamp);
        await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
        const sut = debtMarket.connect(bidder.signer).claim(nftAsset, tokenId, seller.address);
        await expect(sut).to.be.revertedWith("1012");
      });
      it("When bid type is not AUCTION or MIXED", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        await waitForTx(
          await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50000, seller.address, 0, 0)
        );
        const sut = debtMarket.connect(bidder.signer).claim(nftAsset, tokenId, bidder.address);
        await expect(sut).to.be.revertedWith("1010");
      });
      it("When auction is not already ended", async () => {
        const { users, debtMarket, bayc, wethGateway } = testEnv;
        const seller = users[4];
        const bidder = users[5];
        const nftAsset = bayc.address;
        const tokenId = testEnv.tokenIdTracker++;
        await borrowBayc(testEnv, seller, tokenId, 10);
        const blockNumber = await users[0].signer.provider!.getBlockNumber();
        const currTimestamp = (await users[0].signer.provider!.getBlock(blockNumber)).timestamp;
        const auctionEndTimestamp = moment(currTimestamp).add(12, "day").unix() * 1000;
        await waitForTx(
          await debtMarket
            .connect(seller.signer)
            .createDebtListing(nftAsset, tokenId, 0, seller.address, 50000, auctionEndTimestamp)
        );
        await waitForTx(
          await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50001 })
        );
        const sut = debtMarket.connect(seller.signer).claim(nftAsset, tokenId, bidder.address);
        await expect(sut).to.be.revertedWith("1011");
      });
    });
  });
});
