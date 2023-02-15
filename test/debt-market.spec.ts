import { parseEther } from "ethers/lib/utils";
import { oneEther } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, borrow, setApprovalForAll } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("Buy and sell the debts", (testEnv) => {
  async function borrow(borrower, nftTokenId, amountBorrow) {
    const { users, pool, nftOracle, weth, bayc, configurator, deployer } = testEnv;
    const depositor = users[3];

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000"); //deployer

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, nftTokenId);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(deployer.address, true);

    type NewType = IConfigNftAsCollateralInput;

    const collData: NewType = {
      asset: bayc.address,
      nftTokenId: `${nftTokenId}`,
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

    const amountToBorrow = await convertToCurrencyDecimals(deployer, weth, `${amountBorrow}`);

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountToBorrow.toString(), bayc.address, `${nftTokenId}`, borrower.address, "0");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, `${nftTokenId}`);

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  }
  it("Create a debt listting", async () => {
    const { users, debtMarket, bayc } = testEnv;
    const seller = users[4];
    const nftAsset = bayc.address;
    const tokenId = 101;
    await borrow(seller, tokenId, 10);

    await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address);

    const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
    const debt = await debtMarket.getDebt(debtId);
    expect(debt.debtor).equals(seller.address, "Invalid debtor");
    expect(debt.nftAsset).equals(nftAsset, "Invalid nftAsset");
    expect(debt.tokenId).equals(tokenId, "Invalid tokenId");
    expect(debt.debtId).equals(debtId, "Invalid debtId");
    expect(debt.sellPrice.toString()).to.be.bignumber.gt("49", "Invalid sell price");
    expect(debt.sellPrice.toString()).to.be.bignumber.lt("51", "Invalid sell price");
    expect(debt.sellPrice.toString()).to.be.bignumber.eq("50", "Invalid sell price");
  });
  it("Buy a debt", async () => {
    const { users, debtMarket, bayc, uBAYC, dataProvider } = testEnv;
    const seller = users[4];
    const buyer = users[5];
    const nftAsset = bayc.address;
    const tokenId = 102;
    console.log(seller.address);
    console.log(buyer.address);

    await borrow(seller, tokenId, 10);

    const oldLoan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

    await debtMarket.connect(seller.signer).createDebtListing(nftAsset, tokenId, 50, seller.address);
    await debtMarket.connect(buyer.signer).buy(nftAsset, tokenId, { value: 50 });

    const debtId = await debtMarket.getDebtId(nftAsset, tokenId);
    const debt = await debtMarket.getDebt(debtId);
    expect(debt.state).equals(2, "Invalid debt offer state");

    const loan = await dataProvider.getLoanDataByCollateral(bayc.address, `${tokenId}`);

    //Check previous unft brn and minted on the new
    expect(uBAYC.balanceOf(seller.address), 0, "Invalid balance of UToken");
    expect(uBAYC.balanceOf(buyer.address), 1, "Invalid balance of UToken");
    //Check previous debt amount of the loan is same as actual
    expect(oldLoan.currentAmount).equals(loan.currentAmount, "Invalid amount between old and new loan");
    //Check previous owner of the loan
    expect(oldLoan.borrower).equals(seller.address, "Invalid previuos loan debtor");
    expect(loan.borrower).equals(buyer.address, "Invalid new loan debtor");
  });
});
