import BigNumber from "bignumber.js";
import { parseEther } from "ethers/lib/utils";
import { getReservesConfigByPool } from "../helpers/configuration";
import { getDeploySigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { increaseTime, waitForTx } from "../helpers/misc-utils";
import { IReserveParams, iUnlockdPoolAssets, UnlockdPools } from "../helpers/types";
import { RepayAndTransferHelper, RepayAndTransferHelperFactory } from "../types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  deposit,
  mintERC20,
  mintERC721,
  repay,
  setApprovalForAll,
  setApprovalForAllExt,
} from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("Repay and transfer helper tests", async (testEnv) => {
  let saveBaycAssetPrice: string;
  let repayAndTransferHelper: RepayAndTransferHelper;

  before("Initializing configuration", async () => {
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });

    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <iUnlockdPoolAssets<IReserveParams>>(
      getReservesConfigByPool(UnlockdPools.proto)
    );

    saveBaycAssetPrice = (await testEnv.nftOracle.getNFTPrice(testEnv.bayc.address, testEnv.tokenIdTracker)).toString();

    repayAndTransferHelper = await new RepayAndTransferHelperFactory(await getDeploySigner()).deploy(
      testEnv.addressesProvider.address
    );
  });
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
  });

  it("borrow-repay-transfer", async () => {
    const { users, bayc, deployer, weth, configurator, nftOracle } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const borrower2 = users[2];

    // deposit
    await mintERC20(testEnv, depositor, "WETH", "100");
    await approveERC20(testEnv, depositor, "WETH");

    await deposit(testEnv, depositor, "", "WETH", "100", depositor.address, "success", "");

    await increaseTime(100);

    // mint nft
    await mintERC20(testEnv, borrower, "WETH", "100");
    await approveERC20(testEnv, borrower, "WETH");

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await mintERC721(testEnv, borrower, "BAYC", tokenId);

    await setApprovalForAll(testEnv, borrower, "BAYC");

    // borrow
    const price = await convertToCurrencyDecimals(weth.address, "100");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, price, 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(testEnv, borrower, "WETH", "5", "BAYC", tokenId, borrower.address, "365", "success", "");

    await increaseTime(100);

    await setApprovalForAllExt(testEnv, borrower, "BAYC", repayAndTransferHelper.address);
    await waitForTx(
      await repayAndTransferHelper.repayETHAndTransferERC721(bayc.address, tokenId, borrower2.address, {
        value: parseEther("6"),
      })
    );

    expect(await bayc.ownerOf(tokenId), "debt should gte borrowSize").to.be.eq(borrower2.address);
  });
});
