import { expect } from "chai";
import { ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("UToken: Modifiers", (testEnv: TestEnv) => {
  const { CT_CALLER_MUST_BE_LEND_POOL, CALLER_NOT_POOL_ADMIN, CALLER_NOT_UTOKEN_MANAGER, CALLER_NOT_STRATEGY } =
    ProtocolErrors;

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

  it("Tries to invoke withdrawReserves not being the Pool", async () => {
    const { deployer, uWETH } = testEnv;
    await expect(uWETH.withdrawReserves("1")).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });
  it("Tries to invoke `updateUTokenManagers` not being the PoolAdmin", async () => {
    const { uWETH, users } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).updateUTokenManagers(
        [users[1].address], // MANAGERS
        true // FLAG
      )
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
  it("Tries to invoke `addStrategy` not being the PoolAdmin", async () => {
    const { genericYVaultStrategy, uWETH, users } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).addStrategy(
        genericYVaultStrategy.address, // STRATEGY ADDRESS
        4000, // DEBT RATIO
        0, // MIN DEBT PER HARVEST
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
  it("Tries to invoke `removeStrategyFromQueue` not being the PoolAdmin", async () => {
    const { genericYVaultStrategy, uWETH, users } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).removeStrategyFromQueue(
        genericYVaultStrategy.address // STRATEGY ADDRESS
      )
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
  it("Tries to invoke `revokeStrategy` not being the PoolAdmin", async () => {
    const { genericYVaultStrategy, uWETH, users } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).revokeStrategy(
        genericYVaultStrategy.address // STRATEGY ADDRESS
      )
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
  it("Tries to invoke `setDepositLimit` not being the PoolAdmin", async () => {
    const { uWETH, users } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).setDepositLimit(
        10 // NEW DEPOSIT LIMIT
      )
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
  it("Tries to invoke `updateStrategyParams` not being the PoolAdmin", async () => {
    const { genericYVaultStrategy, uWETH, users } = testEnv;
    await expect(
      uWETH.connect(users[2].signer).updateStrategyParams(
        genericYVaultStrategy.address, // STRATEGY ADDRESS
        10000, // DEBT RATIO
        0, // MIN DEBT PER HARVEST
        0 // MAX DEBT PER HARVEST
      )
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
  it("Tries to invoke `report` not being a Strategy", async () => {
    const { uWETH } = testEnv;
    await expect(
      uWETH.report(
        0, // GAIN
        0, // LOSS
        0 // DEBT PAYMENT
      )
    ).to.be.revertedWith(CALLER_NOT_STRATEGY);
  });
  it("Tries to invoke `withdrawReserves` not being the LendPool", async () => {
    const { uWETH } = testEnv;
    await expect(
      uWETH.withdrawReserves(
        0 // AMOUNT
      )
    ).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });
});
