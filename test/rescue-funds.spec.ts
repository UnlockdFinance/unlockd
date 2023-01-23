import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { getDeploySigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, waitForTx } from "../helpers/misc-utils";
import { IReserveParams, iUnlockdPoolAssets, UnlockdPools } from "../helpers/types";
import { SelfdestructTransferFactory } from "../types";
import {
  configuration as actionsConfiguration,
  getERC20Balance,
  mintERC20,
  rescue,
  setPoolRescuer,
  transferERC20,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("LendPool: Rescue locked funds", (testEnv: TestEnv) => {
  before("Initializing configuration", async () => {
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <iUnlockdPoolAssets<IReserveParams>>(
      getReservesConfigByPool(UnlockdPools.proto)
    );
  });
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("User 1 transfers 100 WETH directly to pool, and rescuer returns funds", async () => {
    const { users, pool, weth } = testEnv;
    const rescuer = users[0];
    const user1 = users[1];

    await fundWithERC20("WETH", user1.address, "1000");
    const initialBalance = await getERC20Balance(testEnv, user1, "WETH");
    console.log(initialBalance);

    await weth.connect(user1.signer).transfer(pool.address, await convertToCurrencyDecimals(user1, weth, "100"));
    //Set new rescuer
    await setPoolRescuer(testEnv, rescuer);

    await testEnv.pool
      .connect(rescuer.signer)
      .rescue(weth.address, user1.address, await convertToCurrencyDecimals(rescuer, weth, "100"), false);

    //await rescue(testEnv, rescuer, user1, "DAI", "100", false);

    const finalBalance = await getERC20Balance(testEnv, user1, "WETH");

    expect(initialBalance).to.be.equal(finalBalance, "Tokens not rescued properly");
  });
  it("Prevents a random user from rescuing tokens ", async () => {
    const { users, pool, weth } = testEnv;
    const fakeRescuer = users[0];
    const realRescuer = users[1];
    const recipient = users[2];

    await fundWithERC20("WETH", fakeRescuer.address, "1000");
    const initialBalance = await getERC20Balance(testEnv, fakeRescuer, "WETH");
    console.log(initialBalance);

    //Set new rescuer
    await setPoolRescuer(testEnv, realRescuer);
    await expect(
      testEnv.pool
        .connect(fakeRescuer.signer)
        .rescue(weth.address, fakeRescuer.address, await convertToCurrencyDecimals(realRescuer, weth, "100"), false)
    ).to.be.revertedWith("Rescuable: caller is not the rescuer");
  });
});
