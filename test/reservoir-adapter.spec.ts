import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  evmRevert,
  evmSnapshot,
  fetchAndFilterReservoirBids,
  fundWithERC20,
  fundWithERC721,
} from "../helpers/misc-utils";
import { ExecutionInfo, IConfigNftAsCollateralInput } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";

import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Reservoir adapter tests", (testEnv: TestEnv) => {
  let snapshotId;
  before(async () => {
    const { reservoirAdapter, configurator, deployer, nftOracle, loan, reservoirModules } = testEnv;
    const poolAdmin = deployer;
    // Add deployer as LTV Manager
    await configurator.setLtvManagerStatus(deployer.address, true);
    // Add configurator and deployer as Oracle Price Manager
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    await nftOracle.setPriceManagerStatus(deployer.address, true);

    // Add reservoiradapter as market adapter in pool loan
    loan.updateMarketAdapters([reservoirAdapter.address], true);

    // Add deployer as a liquidator
    await reservoirAdapter.connect(poolAdmin.signer).updateLiquidators([deployer.address], true);

    // Add reservoir modules

    await reservoirAdapter.connect(poolAdmin.signer).updateModules(
      reservoirModules.map((mod) => mod.contract.address),
      true
    );
  });
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });
  it("ReservoirAdapter: liquidate an unhealthy NFT in Seaport v1.4", async () => {
    if (FORK_BLOCK_NUMBER == "16784435") {
      //block number for calldata for BAYC #100

      const { reservoirAdapter, bayc, pool, nftOracle, weth, deployer, users, configurator } = testEnv;
      const depositor = users[1];
      const borrower = users[2];
      const bidder = users[3];
      const tokenId = "100";

      /*//////////////////////////////////////////////////////////////
                        BORROW PROCESS
      //////////////////////////////////////////////////////////////*/

      //mints WETH to the depositor
      await fundWithERC20("WETH", depositor.address, "1000");
      await approveERC20(testEnv, depositor, "WETH");

      //deposits WETH
      const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000");

      await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

      //mints BAYC to borrower
      await fundWithERC721("BAYC", borrower.address, parseInt(tokenId));
      //approve protocol to access borrower wallet
      await setApprovalForAll(testEnv, borrower, "BAYC");

      //borrows
      const collData: IConfigNftAsCollateralInput = {
        asset: bayc.address,
        nftTokenId: tokenId,
        newPrice: parseEther("100"), //100 ETH valuation
        ltv: 6000,
        liquidationThreshold: 7500,
        redeemThreshold: 5000,
        liquidationBonus: 500,
        redeemDuration: 100,
        auctionDuration: 200,
        redeemFine: 500,
        minBidFine: 2000,
      };

      await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

      // Borrow 40 WETH
      await pool
        .connect(borrower.signer)
        .borrow(weth.address, parseEther("40"), bayc.address, tokenId, borrower.address, "0");

      /*//////////////////////////////////////////////////////////////
                        LOWER HEALTH FACTOR
      //////////////////////////////////////////////////////////////*/
      await nftOracle.setNFTPrice(bayc.address, tokenId, parseEther("50"));

      /*//////////////////////////////////////////////////////////////
                      SETUP SEAPORT v1.4 LISTING
      //////////////////////////////////////////////////////////////*/
      const calldata =
        "0xb88d4fde000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000004e4760f2a0b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e4267bf79700000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000aad52a86f916f46c2dc87f2bfcea0b03aeaa8ae1000000000000000000000000aad52a86f916f46c2dc87f2bfcea0b03aeaa8ae1000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e000000000000000000000000000000000000000000000003bd913e6c1df400000000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000264800000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005705b71c9581208fbab754562447185b6895f3ac000000000000000000000000bc4ca0eda7647a8ab7c2061c2e118a18a936f13d000000000000000000000000000000000000000000000003bd913e6c1df400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000009f93623019049c76209c26517acc2af9d49c69b000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000006407bf9c000000000000000000000000000000000000000000000000000000006409111900000000000000000000000000000000000000000000000000000000000026480000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001c9cfd9548580c9e5edffd87574fe96125ac7fd541750c44c1265e4fb92522fb2a7a5e5bd0f77641238feb100af3db4995e97d49e12076c97421a43461857a12c4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

      /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
      //////////////////////////////////////////////////////////////*/
      await reservoirAdapter.liquidateReservoir(bayc.address, calldata);
    }
  });
});
