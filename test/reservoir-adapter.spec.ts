import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";

import { parseEther } from "ethers/lib/utils";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import { ConfigNames, getTreasuryAddress, loadPoolConfig } from "../helpers/configuration";

import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  evmRevert,
  evmSnapshot,
  fetchAndFilterReservoirBids,
  fundWithERC20,
  fundWithERC721,
  increaseTime,
} from "../helpers/misc-utils";
import { ExecutionInfo, IConfigNftAsCollateralInput } from "../helpers/types";
import { approveERC20, approveERC20Adapter, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { getUserData } from "./helpers/utils/helpers";

import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Reservoir adapter tests", (testEnv: TestEnv) => {
  let snapshotId;
  before(async () => {
    const { reservoirAdapter, configurator, deployer, nftOracle, loan, reservoirModules, dWETH, uWETH, pool } = testEnv;
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
    // Add reservoir adapter as debt token burner
    await dWETH.updateTokenManagers([reservoirAdapter.address], true);

    // Add reservoir adapter as utoken manager
    await uWETH.updateUTokenManagers([reservoirAdapter.address, pool.address], true);
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

      const { reservoirAdapter, bayc, pool, nftOracle, weth, deployer, users, configurator, dataProvider } = testEnv;
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
        "000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000004e4760f2a0b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e4267bf79700000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e000000000000000000000000000000000000000000000003bd913e6c1df400000000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000264800000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005705b71c9581208fbab754562447185b6895f3ac000000000000000000000000bc4ca0eda7647a8ab7c2061c2e118a18a936f13d000000000000000000000000000000000000000000000003bd913e6c1df400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000009f93623019049c76209c26517acc2af9d49c69b000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000006407bf9c000000000000000000000000000000000000000000000000000000006409111900000000000000000000000000000000000000000000000000000000000026480000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001c9cfd9548580c9e5edffd87574fe96125ac7fd541750c44c1265e4fb92522fb2a7a5e5bd0f77641238feb100af3db4995e97d49e12076c97421a43461857a12c4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      /*//////////////////////////////////////////////////////////////
                      FETCH DATA BEFORE LIQUIDATION
      //////////////////////////////////////////////////////////////*/
      const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, tokenId);
      const ethReserveDataBefore = await dataProvider.getReserveData(weth.address);
      const userReserveDataBefore = await getUserData(pool, dataProvider, weth.address, borrower.address);

      /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
      //////////////////////////////////////////////////////////////*/
      await reservoirAdapter.liquidateReservoir(bayc.address, weth.address, calldata, parseEther("67.62"));

      /*//////////////////////////////////////////////////////////////
                    VALIDATE DATA AFTER LIQUIDATION
      //////////////////////////////////////////////////////////////*/
      const userReserveDataAfter = await getUserData(pool, dataProvider, weth.address, borrower.address);
      const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);
      const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
        new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
      );

      //the liquidity index of the principal reserve needs to be bigger than the index before
      expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
        ethReserveDataBefore.liquidityIndex.toString(),
        "Invalid liquidity index"
      );

      //the principal APY after a liquidation needs to be lower than the APY before
      expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
        ethReserveDataBefore.liquidityRate.toString(),
        "Invalid liquidity APY"
      );

      // expect debt amount to be liquidated
      const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
        new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
      );

      expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
        userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
        "Invalid user debt after liquidation"
      );
    }
  });
  it("ReservoirAdapter: liquidate an unhealthy NFT in Seaport v1.4 and verify the debt listing was cancelled.", async () => {
    if (FORK_BLOCK_NUMBER == "16784435") {
      //block number for calldata for BAYC #100

      const { reservoirAdapter, bayc, pool, nftOracle, weth, deployer, users, configurator, dataProvider, debtMarket } =
        testEnv;
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
      //allow reservoir to cancel listings
      await debtMarket.setAuthorizedAddress(reservoirAdapter.address, true);

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

      await debtMarket
        .connect(borrower.signer)
        .createDebtListing(bayc.address, tokenId, parseEther("10"), borrower.address, 0, 0);

      const debtIdBefore = await debtMarket.getDebtId(bayc.address, tokenId);
      expect(debtIdBefore).to.be.not.equal(0);
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
        "000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000004e4760f2a0b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e4267bf79700000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e000000000000000000000000000000000000000000000003bd913e6c1df400000000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000264800000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005705b71c9581208fbab754562447185b6895f3ac000000000000000000000000bc4ca0eda7647a8ab7c2061c2e118a18a936f13d000000000000000000000000000000000000000000000003bd913e6c1df400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000009f93623019049c76209c26517acc2af9d49c69b000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000006407bf9c000000000000000000000000000000000000000000000000000000006409111900000000000000000000000000000000000000000000000000000000000026480000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001c9cfd9548580c9e5edffd87574fe96125ac7fd541750c44c1265e4fb92522fb2a7a5e5bd0f77641238feb100af3db4995e97d49e12076c97421a43461857a12c4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      /*//////////////////////////////////////////////////////////////
                      FETCH DATA BEFORE LIQUIDATION
      //////////////////////////////////////////////////////////////*/
      const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, tokenId);
      const ethReserveDataBefore = await dataProvider.getReserveData(weth.address);
      const userReserveDataBefore = await getUserData(pool, dataProvider, weth.address, borrower.address);

      /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
      //////////////////////////////////////////////////////////////*/
      await reservoirAdapter.liquidateReservoir(bayc.address, weth.address, calldata, parseEther("67.62"));

      /*//////////////////////////////////////////////////////////////
                    VALIDATE DATA AFTER LIQUIDATION
      //////////////////////////////////////////////////////////////*/
      const userReserveDataAfter = await getUserData(pool, dataProvider, weth.address, borrower.address);
      const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);
      const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
        new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
      );

      //the liquidity index of the principal reserve needs to be bigger than the index before
      expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
        ethReserveDataBefore.liquidityIndex.toString(),
        "Invalid liquidity index"
      );

      //the principal APY after a liquidation needs to be lower than the APY before
      expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
        ethReserveDataBefore.liquidityRate.toString(),
        "Invalid liquidity APY"
      );

      // expect debt amount to be liquidated
      const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
        new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
      );

      expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
        userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
        "Invalid user debt after liquidation"
      );

      const debtIdAfter = await debtMarket.getDebtId(bayc.address, tokenId);
      expect(debtIdAfter).to.be.equal(0);
    }
  });
  it("ReservoirAdapter: liquidate an unhealthy NFT in LooksRare, cover with extra debt by treasury", async () => {
    if (FORK_BLOCK_NUMBER == "16784435") {
      const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
      await increaseTime(86388); // forward time to valid looksrare calldata timestamp
      //block number for calldata for BAYC #5351
      const { reservoirAdapter, bayc, pool, nftOracle, weth, deployer, users, configurator, uWETH, dataProvider } =
        testEnv;
      const depositor = users[1];
      const borrower = users[2];
      const treasury = users[3];
      const tokenId = "5351";

      const prevTreasury = await getTreasuryAddress(poolConfig);
      await uWETH.setTreasuryAddress(treasury.address);

      await fundWithERC20("WETH", treasury.address, "1000");
      await approveERC20Adapter(testEnv, treasury, "WETH");

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
        newPrice: parseEther("300"), //300 ETH valuation
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
        .borrow(weth.address, parseEther("150"), bayc.address, tokenId, borrower.address, "0");

      /*//////////////////////////////////////////////////////////////
                        LOWER HEALTH FACTOR
      //////////////////////////////////////////////////////////////*/
      await nftOracle.setNFTPrice(bayc.address, tokenId, parseEther("30"));

      /*//////////////////////////////////////////////////////////////
                      SETUP LOOKSRARE LISTING
      //////////////////////////////////////////////////////////////*/
      const calldata =
        "0xb88d4fde000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e00000000000000000000000000000000000000000000000000000000000014e7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000004e4760f2a0b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e4267bf79700000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000" +
        reservoirAdapter.address.substring(2) +
        "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000385df8cbc196f5f780367f3cdc96af072a916f7e000000000000000000000000000000000000000000000003a1d35e8373f2800000000000000000000000000000000000000000000000000000000000000014e7000000000000000000000000000000000000000000000000000000000000264800000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b3dbf4147183492a7bc544e8abed20ad6831fecb000000000000000000000000bc4ca0eda7647a8ab7c2061c2e118a18a936f13d000000000000000000000000000000000000000000000003a1d35e8373f280000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000009f93623019049c76209c26517acc2af9d49c69b000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000002df6b000000000000000000000000000000000000000000000000000000006409fb18000000000000000000000000000000000000000000000000000000006409fc4400000000000000000000000000000000000000000000000000000000000021340000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001bf2da6d12f6169fff7711af332aa9119758b5835dd94f97809783686b3709fbaf0ce50b5ad9b3a165c8f71d35dba0dbf0ec3c4de2c7080ce8f44891b7f09afde2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      /*//////////////////////////////////////////////////////////////
                      FETCH DATA BEFORE LIQUIDATION
      //////////////////////////////////////////////////////////////*/
      const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, tokenId);
      const ethReserveDataBefore = await dataProvider.getReserveData(weth.address);
      const userReserveDataBefore = await getUserData(pool, dataProvider, weth.address, borrower.address);
      const treasuryBalanceBefore = await weth.balanceOf(treasury.address);

      /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
      //////////////////////////////////////////////////////////////*/
      await reservoirAdapter.liquidateReservoir(bayc.address, weth.address, calldata, parseEther("65.66098"));

      await uWETH.setTreasuryAddress(prevTreasury);

      /*//////////////////////////////////////////////////////////////
                    VALIDATE DATA AFTER LIQUIDATION
      //////////////////////////////////////////////////////////////*/
      const userReserveDataAfter = await getUserData(pool, dataProvider, weth.address, borrower.address);
      const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);
      const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
        new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
      );
      const treasuryBalanceAfter = await weth.balanceOf(treasury.address);

      //the liquidity index of the principal reserve needs to be bigger than the index before
      expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
        ethReserveDataBefore.liquidityIndex.toString(),
        "Invalid liquidity index"
      );

      //the principal APY after a liquidation needs to be lower than the APY before
      expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
        ethReserveDataBefore.liquidityRate.toString(),
        "Invalid liquidity APY"
      );

      // expect debt amount to be liquidated
      const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
        new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
      );

      expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
        userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
        "Invalid user debt after liquidation"
      );

      expect(treasuryBalanceAfter).to.be.bignumber.lt(
        treasuryBalanceBefore,
        "Invalid treasury balance after liquidation"
      );
    }
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
