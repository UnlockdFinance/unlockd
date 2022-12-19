import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { fundWithERC20, fundWithERC721, waitForTx } from "../helpers/misc-utils";
import { IReserveParams, iUnlockdPoolAssets, ProtocolErrors, UnlockdPools } from "../helpers/types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  delegateBorrowAllowance,
  deposit,
  mintERC20,
  mintERC721,
  setApprovalForAll,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("LendPool: Borrow/repay test cases", (testEnv: TestEnv) => {
  let cachedTokenId;

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

  it("Delegatee try to Borrow WETH to different onBehalf", async () => {
    const { users, bayc, configurator, deployer, nftOracle } = testEnv;
    const depositor = users[1];
    const borrower = users[2];
    const delegatee = users[3];

    // WETH
    await fundWithERC20("WETH", depositor.address, "10");

    await approveERC20(testEnv, depositor, "WETH");

    await deposit(testEnv, depositor, "", "WETH", "10", depositor.address, "success", "");

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await fundWithERC721("BAYC", borrower.address, tokenIdNum);

    await bayc.connect(borrower.signer).transferFrom(borrower.address, delegatee.address, tokenId);

    await setApprovalForAll(testEnv, delegatee, "BAYC");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, parseEther("100"), 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(
      testEnv,
      delegatee,
      "WETH",
      "1",
      "BAYC",
      tokenId,
      borrower.address,
      "365",
      "revert",
      ProtocolErrors.CT_BORROW_ALLOWANCE_NOT_ENOUGH
    );

    await delegateBorrowAllowance(testEnv, borrower, "WETH", "1", delegatee.address, "success", "");

    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .configureNftAsCollateral(bayc.address, tokenId, parseEther("100"), 4000, 7000, 500, 1, 2, 25, true, false)
    );

    await borrow(testEnv, delegatee, "WETH", "1", "BAYC", tokenId, borrower.address, "365", "success", "");
  });
});
