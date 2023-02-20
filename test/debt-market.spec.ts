import { parseEther } from "ethers/lib/utils";
import { borrowBayc } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("Buy and sell the debts", (testEnv) => {
  it("Create a debt listting", async () => {
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

  it("Cancel a debt listting", async () => {
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
});
