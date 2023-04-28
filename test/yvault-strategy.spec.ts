import { zeroAddress } from "ethereumjs-util";
import { BigNumber, ethers } from "ethers";

import { BigNumber as BN } from "bignumber.js";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../helpers/configuration";
import { deployGenericYVaultStrategy, deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getMintableERC20,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getYVault,
} from "../helpers/contracts-getters";
import {
  advanceTimeAndBlock,
  evmRevert,
  evmSnapshot,
  fundWithERC20,
  fundWithERC721,
  fundWithETH,
  impersonateAccountsHardhat,
  notFalsyOrZeroAddress,
  removeBalanceERC20,
  stopImpersonateAccountsHardhat,
} from "../helpers/misc-utils";
import { eContractid, eNetwork, ExecutionInfo, IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { shareValue } from "./helpers/utils/helpers";
import "./helpers/utils/math";
const chai = require("chai");

const { expect } = chai;

makeSuite("yVault Strategy", (testEnv: TestEnv) => {
  let snapshotId;

  before(async () => {
    const { genericYVaultStrategy, deployer } = testEnv;
    await genericYVaultStrategy.updateKeepers([deployer.address], true);
  });
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });
  it("GenericYVaultStrategy: 40% debt ratio flow (no loss)", async () => {
    const { genericYVaultStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      4000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 10 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "10");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 10 additional ETH deposited.
        - Strategy is configured with a 40% debt ratio
        - Expected:
          - Total UToken debtRatio to be 4000 BPS
          - Strategy debt ratio to be 4000 BPS
          - UToken total debt to be 40% of assets
          - Strategy total debt to be 40% of assets
          - Strategy total gain to be 0
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be the 40% initially deployed assets
    //////////////////////////////////////////////////////////////*/

    await genericYVaultStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));
    let uTokenDebtRatio = await uWETH.debtRatio();
    const vault = await getYVault(await genericYVaultStrategy.yVault());
    const erc20YVault = await getMintableERC20(await genericYVaultStrategy.yVault());
    let shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    let expectedShareValue = await shareValue(shares, vault);
    let underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(4000);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(4000);
    // Check UToken total debt to be 40% of assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 40% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be 0
    expect(strategyData.totalGain).to.be.eq(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be the 40% initially deployed assets
    expect(underlying.add(expectedShareValue)).to.be.eq(await genericYVaultStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 100 ETH
        - Gain is sent to the UToken
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be 4000 BPS
          - Strategy debt ratio to be 4000 BPS
          - UToken total debt to still be 40% of initial assets
          - Strategy total debt to still be 40% of initial assets
          - Strategy total gain to be almost equal to totalAssets() - debt
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "100");

    let estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // 40% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(4000);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(4000);
    // Check UToken total debt to still be 40% of initial assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 40% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be almost equal to totalAssets() - debt
    expect(strategyData.totalGain).to.be.closeTo(estimatedTotalAssetsInStrategy.sub(strategyData.totalDebt), 10);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000)).toString()
    );

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 20 ETH
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be 4000 BPS
          - Strategy debt ratio to be 4000 BPS
          - UToken total debt to be 40% of total assets held 
          - Strategy total debt to still be 40% of total assets held 
          - Strategy total gain to be almost equal to previous strategy gain + (totalAssets() - debt)
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
          - totaldebt is equal to the total estimated assets
    //////////////////////////////////////////////////////////////*/
    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "20");
    let balance = await weth.balanceOf(uWETH.address);
    let totalAssetsUnderManagement = balance.add(await uWETH.totalDebt());

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    let previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(4000);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(4000);
    // Check UToken total debt to be 40% of total assets held
    expect(await uWETH.totalDebt()).to.be.eq(
      new BN(totalAssetsUnderManagement.toString()).percentMul(new BN(4000)).toString()
    );
    // Check Strategy total debt to be 40% of assets
    expect(strategyData.totalDebt).to.be.eq(
      new BN(totalAssetsUnderManagement.toString()).percentMul(new BN(4000)).toString()
    );
    // Check Strategy total gain to be almost equal to previous gains + (totalAssets() - debt)
    expect(strategyData.totalGain).to.be.closeTo(
      previousStrategyData.totalGain.add(estimatedTotalAssetsInStrategy.sub(previousStrategyData.totalDebt)),
      10
    );
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000)).toString()
    );
    // Check totaldebt is equal to the total estimated assets
    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();
    expect(strategyData.totalDebt).to.be.eq(estimatedTotalAssetsInStrategy);
  });
  it("GenericYVaultStrategy: 80% debt ratio flow (no loss)", async () => {
    const { genericYVaultStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      8000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 200 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "200");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 200 additional ETH deposited.
        - Strategy is configured with a 80% debt ratio
        - Expected:
          - Total UToken debtRatio to be 8000 BPS
          - Strategy debt ratio to be 8000 BPS
          - UToken total debt to be 80% of assets
          - Strategy total debt to be 80% of assets
          - Strategy total gain to be 0
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be the 80% initially deployed assets
    //////////////////////////////////////////////////////////////*/

    await genericYVaultStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000));
    let uTokenDebtRatio = await uWETH.debtRatio();
    const vault = await getYVault(await genericYVaultStrategy.yVault());
    const erc20YVault = await getMintableERC20(await genericYVaultStrategy.yVault());
    let shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    let expectedShareValue = await shareValue(shares, vault);
    let underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 8000 BPS
    expect(uTokenDebtRatio).to.be.eq(8000);
    // Check Strategy debt ratio to be be 8000 BPS
    expect(strategyData.debtRatio).to.be.eq(8000);
    // Check UToken total debt to be 80% of assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 80% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be 0
    expect(strategyData.totalGain).to.be.eq(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be the 80% initially deployed assets
    expect(underlying.add(expectedShareValue)).to.be.eq(await genericYVaultStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 1000 ETH
        - Gain is sent to the UToken
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be 8000 BPS
          - Strategy debt ratio to be 8000 BPS
          - UToken total debt to still be 80% of initial assets
          - Strategy total debt to still be 80% of initial assets
          - Strategy total gain to be almost equal to totalAssets() - debt
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (80% of total initial assets)
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000 * 2); // 60 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "1000");

    let estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // 80% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 8000 BPS
    expect(uTokenDebtRatio).to.be.eq(8000);
    // Check Strategy debt ratio to be be 8000 BPS
    expect(strategyData.debtRatio).to.be.eq(8000);
    // Check UToken total debt to still be 80% of initial assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 80% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be almost equal to totalAssets() - debt
    expect(strategyData.totalGain).to.be.closeTo(estimatedTotalAssetsInStrategy.sub(strategyData.totalDebt), 10);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (80% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000)).toString()
    );

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 200 ETH
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be 8000 BPS
          - Strategy debt ratio to be 8000 BPS
          - UToken total debt to be 80% of total assets held 
          - Strategy total debt to still be 80% of total assets held 
          - Strategy total gain to be almost equal to previous strategy gain + (totalAssets() - debt)
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (80% of total initial assets)
          - totaldebt is equal to the total estimated assets
    //////////////////////////////////////////////////////////////*/
    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "200");
    let balance = await weth.balanceOf(uWETH.address);
    let totalAssetsUnderManagement = balance.add(await uWETH.totalDebt());

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    let previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 8000 BPS
    expect(uTokenDebtRatio).to.be.eq(8000);

    // Check Strategy debt ratio to be be 80 BPS
    expect(strategyData.debtRatio).to.be.eq(8000);

    // Check UToken total debt to be 80% of total assets held
    expect(await uWETH.totalDebt()).to.be.closeTo(
      BigNumber.from(new BN(totalAssetsUnderManagement.toString()).percentMul(new BN(8000)).toString()),
      10
    );

    // Check Strategy total debt to be 80% of assets
    expect(strategyData.totalDebt).to.be.closeTo(
      BigNumber.from(new BN(totalAssetsUnderManagement.toString()).percentMul(new BN(8000)).toString()),
      10
    );

    // Check Strategy total gain to be almost equal to previous gains + (totalAssets() - debt)
    expect(strategyData.totalGain).to.be.closeTo(
      previousStrategyData.totalGain.add(estimatedTotalAssetsInStrategy.sub(previousStrategyData.totalDebt)),
      10
    );

    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);

    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (80% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000)).toString()
    );

    // Check totaldebt is equal to the total estimated assets
    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();
    expect(strategyData.totalDebt).to.be.eq(estimatedTotalAssetsInStrategy);
  });
  it("GenericYVaultStrategy: 100% debt ratio flow (no loss)", async () => {
    const { genericYVaultStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      10000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 100 additional ETH deposited.
        - Strategy is configured with a 100% debt ratio
        - Expected:
          - Total UToken debtRatio to be 10000 BPS
          - Strategy debt ratio to be 10000 BPS
          - UToken total debt to be 100% of assets
          - Strategy total debt to be 100% of assets
          - Strategy total gain to be 0
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be the 100% initially deployed assets
    //////////////////////////////////////////////////////////////*/

    await genericYVaultStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));
    let uTokenDebtRatio = await uWETH.debtRatio();
    const vault = await getYVault(await genericYVaultStrategy.yVault());
    const erc20YVault = await getMintableERC20(await genericYVaultStrategy.yVault());
    let shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    let expectedShareValue = await shareValue(shares, vault);
    let underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(10000);
    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(10000);
    // Check UToken total debt to be 100% of assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 100% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be 0
    expect(strategyData.totalGain).to.be.eq(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be the 100% initially deployed assets
    expect(underlying.add(expectedShareValue)).to.be.eq(await genericYVaultStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 2000 ETH
        - Gain is sent to the UToken
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be 10000 BPS
          - Strategy debt ratio to be 10000 BPS
          - UToken total debt to still be 100% of initial assets
          - Strategy total debt to still be 100% of initial assets
          - Strategy total gain to be almost equal to totalAssets() - debt
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000 * 2); // 60 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "2000");

    let estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // 100% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(10000);
    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(10000);
    // Check UToken total debt to still be 100% of initial assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 100% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be almost equal to totalAssets() - debt
    expect(strategyData.totalGain).to.be.closeTo(estimatedTotalAssetsInStrategy.sub(strategyData.totalDebt), 10);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000)).toString()
    );

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 400 ETH
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be 10000 BPS
          - Strategy debt ratio to be 10000 BPS
          - UToken total debt to be 100% of total assets held 
          - Strategy total debt to still be 100% of total assets held 
          - Strategy total gain to be almost equal to previous strategy gain + (totalAssets() - debt)
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
          - totaldebt is equal to the total estimated assets
    //////////////////////////////////////////////////////////////*/
    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "400");
    let balance = await weth.balanceOf(uWETH.address);
    let totalAssetsUnderManagement = balance.add(await uWETH.totalDebt());

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    let previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(10000);

    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(10000);

    // Check UToken total debt to be 100% of total assets held
    expect(await uWETH.totalDebt()).to.be.closeTo(
      BigNumber.from(new BN(totalAssetsUnderManagement.toString()).percentMul(new BN(10000)).toString()),
      10
    );

    // Check Strategy total debt to be 100% of assets
    expect(strategyData.totalDebt).to.be.closeTo(
      BigNumber.from(new BN(totalAssetsUnderManagement.toString()).percentMul(new BN(10000)).toString()),
      10
    );

    // Check Strategy total gain to be almost equal to previous gains + (totalAssets() - debt)
    expect(strategyData.totalGain).to.be.closeTo(
      previousStrategyData.totalGain.add(estimatedTotalAssetsInStrategy.sub(previousStrategyData.totalDebt)),
      10
    );

    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);

    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000)).toString()
    );

    // Check totaldebt is equal to the total estimated assets
    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();
    expect(strategyData.totalDebt).to.be.eq(estimatedTotalAssetsInStrategy);
  });
  it("GenericYVaultStrategy: 1% debt ratio flow (incur loss in second harvest + obtain gain in third harvest)", async () => {
    const { genericYVaultStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      100, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);
    const vaultAddr = await genericYVaultStrategy.yVault();

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 100 additional ETH deposited.
        - Strategy is configured with a 1% debt ratio
        - Expected:
          - Total UToken debtRatio to be 100 BPS
          - Strategy debt ratio to be 100 BPS
          - UToken total debt to be 1% of assets
          - Strategy total debt to be 1% of assets
          - Strategy total gain to be 0
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be the 1% initially deployed assets
          - UToken to transfer funds to Strategy (i.e total assets before harvest to be less than debt after harvest)
    //////////////////////////////////////////////////////////////*/

    let previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    await genericYVaultStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100));
    let uTokenDebtRatio = await uWETH.debtRatio();
    const vault = await getYVault(vaultAddr);
    const erc20YVault = await getMintableERC20(vaultAddr);
    let shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    let expectedShareValue = await shareValue(shares, vault);
    let underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 100 BPS
    expect(uTokenDebtRatio).to.be.eq(100);
    // Check Strategy debt ratio to be be 100 BPS
    expect(strategyData.debtRatio).to.be.eq(100);
    // Check UToken total debt to be 1% of assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 1% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be 0
    expect(strategyData.totalGain).to.be.eq(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be the 1% initially deployed assets
    expect(underlying.add(expectedShareValue)).to.be.eq(await genericYVaultStrategy.estimatedTotalAssets());
    // UToken to transfer funds to strategy
    expect(strategyData.totalDebt).to.be.gt(estimatedTotalAssetsInStrategy);

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault incurs 30 ETH loss
        - Extra underlying is deployed to the strategy due to debt ratio
        - Expected:
          - Total UToken debtRatio to be equal to previous debt ratio (small loss not impacting ratio)
          - Strategy debt ratio to be equal to previous debt ratio (small loss not impacting ratio)
          - UToken total debt to be less previous debt
          - Strategy total debt to be less previous debt
          - Strategy total loss to be higher than previous loss
          - Balance of underlying of UToken to have decreased by the reported loss
          - Strategy total loss to be greater than 0
          - `estimatedTotalAssets()` to be less than the initial liquidity (1% of total initial assets)
          - UToken to still transfer funds to Strategy due to debt ratio
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // Mock loss on Yearn Vault
    await removeBalanceERC20("WETH", vaultAddr, "10");

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let previousUTokenDebtRatio = await uWETH.debtRatio();
    let previousUTokenTotalDebt = await uWETH.totalDebt();

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // 40% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be equal to 100 BPS
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to equal to 100 BPS
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // Check UToken total debt to  be less than previous debt
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be less than previous debt
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    //Check Strategy total loss to be less than previous gain
    expect(strategyData.totalLoss).to.be.gt(previousStrategyData.totalLoss);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (1% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.lt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100)).toString()
    );
    // UToken to transfer funds to strategy
    expect(strategyData.totalDebt).to.be.gt(estimatedTotalAssetsInStrategy);

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 300 ETH
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be equal to previous debt ratio
          - Strategy debt ratio to be equal to previous debt ratio
          - UToken total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
          - Strategy total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
          - Strategy total loss to be equal to previous loss
          - Strategy total gain to be higher than previous total gain
          - Balance of underlying of UToken to have increased due to gains (strategy transfer funds to UToken)
          - `estimatedTotalAssets()` to be higher than the initial liquidity (40% of total initial assets)
          - Strategy to transfer funds back to UToken

    //////////////////////////////////////////////////////////////*/
    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", vaultAddr, "300");
    let previousUTokenWethbalance = await weth.balanceOf(uWETH.address);
    let totalAssetsUnderManagement = previousUTokenWethbalance.add(await uWETH.totalDebt());

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    previousUTokenDebtRatio = await uWETH.debtRatio();
    previousUTokenTotalDebt = await uWETH.totalDebt();
    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 100 BPS
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be be 100 BPS
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // Check UToken total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
    expect(await uWETH.totalDebt()).to.be.eq(previousUTokenTotalDebt);
    // Check Strategy total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
    expect(strategyData.totalDebt).to.be.eq(previousStrategyData.totalDebt);
    // Strategy total loss to be equal to previous loss
    expect(strategyData.totalLoss).to.be.eq(previousStrategyData.totalLoss);
    // Strategy total gain to be higher than previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
    // Balance of underlying of UToken to have increased due to gains (strategy transfer funds to UToken)
    expect(await weth.balanceOf(uWETH.address)).to.be.gt(previousUTokenWethbalance);
    // `estimatedTotalAssets()` to be higher than the initial liquidity (1% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100)).toString()
    );
  });
  it("GenericYVaultStrategy: 40% debt ratio flow (incur loss in second harvest + obtain gain in third harvest)", async () => {
    const { genericYVaultStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      4000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);
    const vaultAddr = await genericYVaultStrategy.yVault();

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 100 additional ETH deposited.
        - Strategy is configured with a 40% debt ratio
        - Expected:
          - Total UToken debtRatio to be 4000 BPS
          - Strategy debt ratio to be 4000 BPS
          - UToken total debt to be 40% of assets
          - Strategy total debt to be 40% of assets
          - Strategy total gain to be 0
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be the 40% initially deployed assets
          - UToken to transfer funds to Strategy (i.e total assets before harvest to be less than debt after harvest)
    //////////////////////////////////////////////////////////////*/

    let previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    await genericYVaultStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));
    let uTokenDebtRatio = await uWETH.debtRatio();
    const vault = await getYVault(vaultAddr);
    const erc20YVault = await getMintableERC20(vaultAddr);
    let shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    let expectedShareValue = await shareValue(shares, vault);
    let underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(4000);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(4000);
    // Check UToken total debt to be 40% of assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 40% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be 0
    expect(strategyData.totalGain).to.be.eq(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be the 40% initially deployed assets
    expect(underlying.add(expectedShareValue)).to.be.eq(await genericYVaultStrategy.estimatedTotalAssets());
    // UToken to transfer funds to strategy
    expect(strategyData.totalDebt).to.be.gt(estimatedTotalAssetsInStrategy);
    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault incurs 30 ETH loss
        - Extra underlying is deployed to the strategy due to debt ratio
        - Expected:
          - Total UToken debtRatio to be less than previous debt ratio
          - Strategy debt ratio to be less than previous debt ratio
          - UToken total debt to be less than previous debt
          - Strategy total debt to be less than previous debt
          - Strategy total loss to be higher than previous loss
          - Balance of underlying of UToken to have decreased by the reported loss
          - Strategy total loss to be greater than 0
          - `estimatedTotalAssets()` to be less than the initial liquidity (40% of total initial assets)
          - UToken to still transfer funds to Strategy due to debt ratio
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // Mock loss on Yearn Vault
    await removeBalanceERC20("WETH", vaultAddr, "30");

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let previousUTokenDebtRatio = await uWETH.debtRatio();
    let previousUTokenTotalDebt = await uWETH.totalDebt();

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // 40% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be less than 4000 BPS
    expect(uTokenDebtRatio).to.be.lt(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.lt(previousStrategyData.debtRatio);
    // Check UToken total debt to  be less than previous debt
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be less than previous debt
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    //Check Strategy total loss to be less than previous gain
    expect(strategyData.totalLoss).to.be.gt(previousStrategyData.totalLoss);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.lt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000)).toString()
    );
    // UToken to still transfer funds to Strategy due to debt ratio
    expect(strategyData.totalDebt).to.be.gt(estimatedTotalAssetsInStrategy);

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 300 ETH
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be equal to previous debt ratio
          - Strategy debt ratio to be equal to previous debt ratio
          - UToken total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
          - Strategy total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
          - Strategy total loss to be equal to previous loss
          - Strategy total gain to be higher than previous total gain
          - Balance of underlying of UToken to have increased due to gains (strategy transfer funds to UToken)
          - `estimatedTotalAssets()` to be higher than the initial liquidity (50% of total initial assets)
          - Strategy to transfer funds back to UToken

    //////////////////////////////////////////////////////////////*/
    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", vaultAddr, "300");
    let previousUTokenWethbalance = await weth.balanceOf(uWETH.address);
    let totalAssetsUnderManagement = previousUTokenWethbalance.add(await uWETH.totalDebt());

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    previousUTokenDebtRatio = await uWETH.debtRatio();
    previousUTokenTotalDebt = await uWETH.totalDebt();
    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // Check UToken total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
    expect(await uWETH.totalDebt()).to.be.eq(previousUTokenTotalDebt);
    // Check Strategy total debt to be equal to previous total debt (UToken does not transfer funds to strategy)
    expect(strategyData.totalDebt).to.be.eq(previousStrategyData.totalDebt);
    // Strategy total loss to be equal to previous loss
    expect(strategyData.totalLoss).to.be.eq(previousStrategyData.totalLoss);
    // Strategy total gain to be higher than previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
    // Balance of underlying of UToken to have increased due to gains (strategy transfer funds to UToken)
    expect(await weth.balanceOf(uWETH.address)).to.be.gt(previousUTokenWethbalance);
    // `estimatedTotalAssets()` to be higher than the initial liquidity (40% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000)).toString()
    );
  });
  it("GenericYVaultStrategy: 100% debt ratio flow (incur loss in second harvest + obtain gain in third harvest)", async () => {
    const { genericYVaultStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      10000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);
    const vaultAddr = await genericYVaultStrategy.yVault();

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 100 additional ETH deposited.
        - Strategy is configured with a 100% debt ratio
        - Expected:
          - Total UToken debtRatio to be 10000 BPS
          - Strategy debt ratio to be 10000 BPS
          - UToken total debt to be 100% of assets
          - Strategy total debt to be 100% of assets
          - Strategy total gain to be 0
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be the 100% initially deployed assets
          - UToken to transfer funds to Strategy (i.e total assets before harvest to be less than debt after harvest)
    //////////////////////////////////////////////////////////////*/

    let previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    await genericYVaultStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));
    let uTokenDebtRatio = await uWETH.debtRatio();
    const vault = await getYVault(vaultAddr);
    const erc20YVault = await getMintableERC20(vaultAddr);
    let shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    let expectedShareValue = await shareValue(shares, vault);
    let underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(10000);
    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(10000);
    // Check UToken total debt to be 100% of assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 100% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be 0
    expect(strategyData.totalGain).to.be.eq(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be the 100% initially deployed assets
    expect(underlying.add(expectedShareValue)).to.be.eq(await genericYVaultStrategy.estimatedTotalAssets());
    // UToken to transfer funds to strategy
    expect(strategyData.totalDebt).to.be.gt(estimatedTotalAssetsInStrategy);
    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault incurs 30 ETH loss
        - Extra underlying is deployed to the strategy due to debt ratio
        - Expected:
          - Total UToken debtRatio to be less than previous debt ratio
          - Strategy debt ratio to be less than previous debt ratio
          - UToken total debt to be less than previous debt
          - Strategy total debt to be less than previous debt
          - Strategy total loss to be higher than previous loss
          - Balance of underlying of UToken to have decreased by the reported loss
          - Strategy total loss to be greater than 0
          - `estimatedTotalAssets()` to be less than the initial liquidity (100% of total initial assets)
          - UToken not transferring funds
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // Mock loss on Yearn Vault
    await removeBalanceERC20("WETH", vaultAddr, "30");

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let previousUTokenDebtRatio = await uWETH.debtRatio();
    let previousUTokenTotalDebt = await uWETH.totalDebt();

    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // 100% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be less than 10000 BPS
    expect(uTokenDebtRatio).to.be.lt(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.lt(previousStrategyData.debtRatio);
    // Check UToken total debt to  be less than previous debt
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be less than previous debt
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    //Check Strategy total loss to be less than previous gain
    expect(strategyData.totalLoss).to.be.gt(previousStrategyData.totalLoss);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.lt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000)).toString()
    );
    // UToken to transfer funds to strategy
    expect(strategyData.totalDebt).to.be.eq(estimatedTotalAssetsInStrategy);

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Yearn Vault profits 300 ETH
        - NO extra underlying is deployed to the strategy
        - Expected:
          - Total UToken debtRatio to be equal to previous debt ratio
          - Strategy debt ratio to be equal to previous debt ratio
          - UToken total debt to be equal to previous total debt (Strategy transfers funds back from loss)
          - Strategy total debt to be less than to previous total debt (Strategy transfers funds back from loss)
          - Strategy total loss to be equal to previous loss
          - Strategy total gain to be higher than previous total gain
          - Balance of underlying of UToken to have increased due to gains (strategy transfer funds to UToken)
          - `estimatedTotalAssets()` to be higher than the initial liquidity (40% of total initial assets)
          - Strategy to transfer funds back to UToken

    //////////////////////////////////////////////////////////////*/
    await advanceTimeAndBlock(2592000); // 30 days
    // Mock gains on Yearn Vault
    await fundWithERC20("WETH", vaultAddr, "300");
    let previousUTokenWethbalance = await weth.balanceOf(uWETH.address);
    let totalAssetsUnderManagement = previousUTokenWethbalance.add(await uWETH.totalDebt());

    estimatedTotalAssetsInStrategy = await genericYVaultStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    previousUTokenDebtRatio = await uWETH.debtRatio();
    previousUTokenTotalDebt = await uWETH.totalDebt();
    await genericYVaultStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    shares = await erc20YVault.balanceOf(genericYVaultStrategy.address);

    expectedShareValue = await shareValue(shares, vault);
    underlying = await weth.balanceOf(genericYVaultStrategy.address);

    // Check Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // Check UToken total debt to be less than previous total debt (Strategy transfers funds back from loss)
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be less than previous total debt (UToken does not transfer funds to strategy)
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be equal to previous loss
    expect(strategyData.totalLoss).to.be.eq(previousStrategyData.totalLoss);
    // Strategy total gain to be higher than previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
    // Balance of underlying of UToken to have increased due to gains (strategy transfer funds to UToken)
    expect(await weth.balanceOf(uWETH.address)).to.be.gt(previousUTokenWethbalance);
    // `estimatedTotalAssets()` to be higher than the initial liquidity (100% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000)).toString()
    );
  });
});
