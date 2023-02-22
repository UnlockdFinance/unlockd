import { parseEther } from "ethers/lib/utils";
import moment from "moment";
import { advanceTimeAndBlock, fundWithERC721 } from "../helpers/misc-utils";
import { borrowBayc } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("Buy and sell the debts", (testEnv) => {
  describe("Positive", function () {
    it("Create a debt listing", async () => {
      const { users, debtMarket, bayc } = testEnv;
      const seller = users[4];
      const nftAsset = bayc.address;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);

      await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address);

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

      await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address);
      const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
      await debtMarket.connect(seller.signer).cancelDebtListing(nftAsset, tokenId);

      const canceledDebt = await debtMarket.getDebt(debtId);
      expect(canceledDebt.state).to.be.equals(3);

      const canceledDebtId = await debtMarket.getDebtId(nftAsset, tokenId);
      expect(canceledDebtId).to.be.equals(0);
    });

    it("Buy a debt with ETH", async () => {
      const { users, debtMarket, wethGateway, bayc, uBAYC, dataProvider } = testEnv;
      const seller = users[4];
      const buyer = users[5];
      const nftAsset = bayc.address;
      const tokenId = testEnv.tokenIdTracker++;

      await borrowBayc(testEnv, seller, tokenId, 10);

      const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

      await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address);
      await wethGateway.connect(buyer.signer).buyDebtETH(nftAsset, tokenId, buyer.address, { value: 50 });

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
      expect(oldLoan.borrower).equals(seller.address, "Invalid previuos loan debtor");
      expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
    });
    it("Create a bid", async () => {
      const { users, debtMarket, bayc, wethGateway } = testEnv;
      const seller = users[4];
      const bidder = users[5];
      const nftAsset = bayc.address;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);
      const auctionEndTimestamp = moment().add(1, "days").unix();
      await debtMarket
        .connect(seller.signer)
        .createDebtListingWithAuction(nftAsset, tokenId, 50, seller.address, auctionEndTimestamp);
      await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
      const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
      const debt = await debtMarket.getDebt(debtId);

      expect(debt.sellType).equals(1, "Invalid debt offer type");
      expect(debt.state).equals(1, "Invalid debt offer state");
      expect(debt.bidPrice).equals(50, "Invalid bid price");
      expect(debt.bidderAddress).equals(bidder.address, "Invalid bidder address");
    });
    it("Cancel a debt listing with bids", async () => {});

    it("Create a second bid ", async () => {});

    it("Claim an auction", async () => {
      const { users, debtMarket, bayc, wethGateway, uBAYC, dataProvider } = testEnv;
      const seller = users[4];
      const bidder = users[5];
      const nftAsset = bayc.address;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);
      const auctionEndTimestamp = moment().add(1, "minute").unix();
      const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

      await debtMarket
        .connect(seller.signer)
        .createDebtListingWithAuction(nftAsset, tokenId, 50, seller.address, auctionEndTimestamp);
      await wethGateway.connect(bidder.signer).bidDebtETH(nftAsset, tokenId, bidder.address, { value: 50 });
      await advanceTimeAndBlock(100);
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
      expect(oldLoan.borrower).equals(seller.address, "Invalid previuos loan debtor");
      expect(loan.borrower).equals(bidder.address, "Invalid new loan debtor");
    });
  });
  describe("Negative", function () {
    const createDebtListting = async (testEnv, nftAsset, amount, seller) => {
      const { debtMarket } = testEnv;
      const tokenId = testEnv.tokenIdTracker++;
      await borrowBayc(testEnv, seller, tokenId, 10);
      return debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, amount, seller.address);
    };
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
          .createDebtListing(nftAsset, tokenId, 50, seller.address);
        await expect(debtCreationPromise).to.be.revertedWith("1000");
      });
      it("When it is a debt listing with wrong on behalf of", async () => {
        const { users, bayc } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const debtCreationPromise = createDebtListting(testEnv, nftAsset, 50, {
          address: "0x0000000000000000000000000000000000000000",
        });
        await expect(debtCreationPromise).to.be.revertedWith("ERC721: transfer to the zero address");
      });
      it("When it is a debt listing with 0 sell price", async () => {
        const { users, bayc } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        const debtCreationPromise = createDebtListting(testEnv, nftAsset, 0, seller);
        await expect(debtCreationPromise).to.be.revertedWith("1002");
      });
      it("When it is a debt listing that alerady exist", async () => {
        const { users, bayc, debtMarket } = testEnv;
        const seller = users[4];
        const buyer = users[5];
        const nftAsset = bayc.address;
        await createDebtListting(testEnv, nftAsset, 50, seller);

        const debtCreationPromise = debtMarket
          .connect(seller.signer)
          .createDebtListing(nftAsset, testEnv.tokenIdTracker - 1, 50, seller.address);

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
          .createDebtListing(nftAsset, tokenId, 50, seller.address);

        await expect(debtCreationPromise).to.be.revertedWith("1006");
      });
    });
    describe("Revert on try to create listing with Auction", function () {
      it("When it is a debt listing with the auctionEndTimestamp past", async () => {});
    });
    describe("Revert on try to cancel listing", function () {
      it("When debt no exist", async () => {});
      it("When it has invalid state ", async () => {});
    });
    describe("Revert on try to bid a auction debt", function () {
      it("When debt no exist", async () => {});
      it("When the new bid price is lower than sellPrice", async () => {});
      it("When the new bid price is lower than the last bid price plus delta", async () => {});
      it("When the bid type is invalid", async () => {});
      it("When auction already ended", async () => {});
    });
  });
});
