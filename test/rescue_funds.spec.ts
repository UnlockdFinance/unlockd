import { TestEnv, makeSuite } from "./helpers/make-suite";
import {
  mintERC20,
  approveERC20,
  transferERC20,
  deposit,
  setPoolRescuer,
  rescue,
  getERC20Balance,
} from "./helpers/actions";
import { configuration as actionsConfiguration } from "./helpers/actions";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { UnlockdPools, iUnlockdPoolAssets, IReserveParams } from "../helpers/types";
import { waitForTx } from "../helpers/misc-utils";

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

  it("User 1 transfers 100 DAI directly to pool, and rescuer returns funds", async () => {
    const { users, pool } = testEnv;
    const rescuer = users[0];
    const user1 = users[1];

    await mintERC20(testEnv, user1, "DAI", "1000");

    const initialBalance = await getERC20Balance(testEnv, user1, "DAI");
    console.log(initialBalance);
    await transferERC20(testEnv, user1, pool, "DAI", "100");

    //Set new rescuer
    await setPoolRescuer(testEnv, rescuer);

    await rescue(testEnv, rescuer, user1, "DAI", "100", false);

    const finalBalance = await getERC20Balance(testEnv, user1, "DAI");

    expect(initialBalance).to.be.equal(finalBalance, "Tokens not rescued properly");
  });
  it("Prevents a random user from rescuing tokens ", async () => {
    const { users, pool } = testEnv;
    const fakeRescuer = users[0];
    const realRescuer = users[1];
    const recipient = users[2];
    await mintERC20(testEnv, fakeRescuer, "DAI", "1000");

    const initialBalance = await getERC20Balance(testEnv, fakeRescuer, "DAI");
    console.log(initialBalance);

    //Set new rescuer
    await setPoolRescuer(testEnv, realRescuer);
    await expect(rescue(testEnv, fakeRescuer, recipient, "DAI", "100", false)).to.be.revertedWith(
      "Rescuable: caller is not the rescuer"
    );
  });
});
