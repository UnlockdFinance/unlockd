import { expect } from "chai";
import { ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("UToken: Modifiers", (testEnv: TestEnv) => {
  const { CT_CALLER_MUST_BE_LEND_POOL, CALLER_NOT_POOL_ADMIN } = ProtocolErrors;

  it("Tries to invoke mint not being the Pool", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(uWETH.mint(deployer.address, "1", "1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke burn not being the Pool", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(uWETH.burn(deployer.address, deployer.address, "1", "1")).to.be.revertedWith(
      CT_CALLER_MUST_BE_LEND_POOL
    );
  });

  it("Tries to invoke mintToTreasury not being the Pool", async () => {
    const { deployer, users, uWETH } = testEnv;
    await expect(uWETH.mintToTreasury("1", "1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke transferUnderlyingTo not being the Pool", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(uWETH.transferUnderlyingTo(deployer.address, "1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });
  it("Tries to invoke depositReserves not being the Pool", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(uWETH.depositReserves("1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });
  it("Tries to invoke withdrawReserves not being the Pool", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(uWETH.withdrawReserves("1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke sweepUToken not being the PoolAdmin", async () => {
    const { deployer, uWETH, users } = testEnv;
    await expect(uWETH.connect(users[3].signer).sweepUToken()).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
});
