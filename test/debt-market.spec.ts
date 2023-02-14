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
    const buyer = users[5];

    await borrow(seller, 101, 10);

    await debtMarket.connect(seller.signer).createDebtListing(bayc.address, 101, 50, seller.address);

    const debtId = await debtMarket.getDebtId(bayc.address, 101);
    const debt = await debtMarket.getDebt(debtId);
    expect(debt.debtor).equals(seller.address, "Invalid debtor");
    expect(debt.nftAsset).equals(bayc.address, "Invalid nftAsset");
    expect(debt.tokenId).equals(101, "Invalid tokenId");
    expect(debt.debtId).equals(debtId, "Invalid debtId");
    expect(debt.sellPrice.toString()).to.be.bignumber.gt("9", "Invalid sell price");
  });
});
