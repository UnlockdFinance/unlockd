import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH } from "../helpers/constants";
import { getMintableERC20, getYVault } from "../helpers/contracts-getters";
import { fundWithERC20, fundWithERC721, waitForTx } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, IReserveParams, iUnlockdPoolAssets, UnlockdPools } from "../helpers/types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  deposit,
  mintERC20,
  setApprovalForAll,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import { wadDiv } from "./helpers/utils/math";

const chai = require("chai");

const { expect } = chai;

makeSuite("UToken: Yearn integration", (testEnv) => {
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

  it("User 0 deposits 1 WETH in an empty reserve, ETH is deposited into yvWETH and yvWETH wrapped tokens are given back to UToken ", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user0 = users[0];

    await fundWithERC20("WETH", user0.address, "1");
    await approveERC20(testEnv, user0, "WETH");

    await pool.connect(user0.signer).deposit(weth.address, parseEther("1"), user0.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);
    const yvWETHExpectedBalance = wadDiv(parseEther("1"), pricePerShare);

    expect(yvWETHBalance.toString()).to.be.bignumber.almostEqual(
      yvWETHExpectedBalance.toString(),
      "Proper yvWETH amount not transferred"
    );
  });
});
