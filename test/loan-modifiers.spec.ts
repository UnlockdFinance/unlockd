import { expect } from "chai";
import { ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("LendPoolLoan: Modifiers", (testEnv: TestEnv) => {
  const { CT_CALLER_MUST_BE_LEND_POOL, LPL_CALLER_MUST_BE_MARKET_ADAPTER, CALLER_NOT_POOL_ADMIN } = ProtocolErrors;

  it("Tries to invoke initNft not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(loan.initNft(bayc.address, uBAYC.address)).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke createLoan not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(
      loan.createLoan(deployer.address, deployer.address, bayc.address, "1", uBAYC.address, uWETH.address, "1", "1")
    ).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke updateLoan not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(loan.updateLoan(deployer.address, "1", "1", "0", "1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke repayLoan not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(loan.repayLoan(deployer.address, "1", uBAYC.address, "1", "1")).to.be.revertedWith(
      CT_CALLER_MUST_BE_LEND_POOL
    );
  });

  it("Tries to invoke auctionLoan not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(loan.auctionLoan(deployer.address, "1", deployer.address, "1", "0", "0")).to.be.revertedWith(
      CT_CALLER_MUST_BE_LEND_POOL
    );
  });

  it("Tries to invoke redeemLoan not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(loan.redeemLoan(deployer.address, "1", "1", "1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke liquidateLoan not being the Pool", async () => {
    const { deployer, bayc, uBAYC, uWETH, loan } = testEnv;
    await expect(loan.liquidateLoan(deployer.address, "1", uBAYC.address, "1", "1")).to.be.revertedWith(
      CT_CALLER_MUST_BE_LEND_POOL
    );
  });

  it("Tries to invoke liquidateLoanMarket not being the Adapter", async () => {
    const { uBAYC, loan } = testEnv;
    await expect(loan.liquidateLoanMarket("1", uBAYC.address, "1", 0)).to.be.revertedWith(
      LPL_CALLER_MUST_BE_MARKET_ADAPTER
    );
  });
  it("Tries to invoke updateMarketAdapters not being the pool admin", async () => {
    const { uBAYC, loan, users } = testEnv;
    await expect(loan.connect(users[2].signer).updateMarketAdapters([uBAYC.address], false)).to.be.revertedWith(
      CALLER_NOT_POOL_ADMIN
    );
  });
});
