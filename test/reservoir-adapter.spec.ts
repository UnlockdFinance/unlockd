import { zeroAddress } from "ethereumjs-util";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { createRandomAddress } from "../helpers/misc-utils";
import { ExecutionInfo, ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Reservoir adapter tests", (testEnv: TestEnv) => {
  before(async () => {});
  it("BaseAdapter: check onlyPoolAdmin modifier on updateModules/updateLiquidators", async () => {
    const { reservoirAdapter, users, deployer, bayc } = testEnv;

    const invalidPoolAdmin = users[1];

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateModules([createRandomAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateLiquidators([createRandomAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");
  });

  it("ReservoirAdapter: check invalidZeroAddress modifier on updateModules/updateLiquidators", async () => {
    const { reservoirAdapter, users, deployer, bayc } = testEnv;

    const invalidPoolAdmin = users[1];

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateModules([zeroAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateLiquidators([zeroAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");
  });
  it("ReservoirAdapter: check onlyReservoirLiquidator modifier", async () => {
    const { reservoirAdapter, users, deployer, bayc } = testEnv;

    const poolAdmin = deployer;
    const liquidator = users[1];
    const invalidLiquidator = users[2];

    const tokenId = (testEnv.tokenIdTracker++).toString();
    // Add liquidator from pool admin
    await reservoirAdapter.connect(poolAdmin.signer).updateLiquidators([liquidator.address], true);
    const executionInfo: ExecutionInfo = {
      module: await createRandomAddress(),
      data: "0x",
      value: BigNumber.from(0),
    };
    await expect(
      reservoirAdapter.connect(invalidLiquidator.signer).liquidateReservoir(bayc.address, tokenId, executionInfo)
    ).to.be.revertedWith("NotReservoirLiquidator()");
  });
});
