import { zeroAddress } from "ethereumjs-util";
import { BigNumber, ethers } from "ethers";

import { BigNumber as BN } from "bignumber.js";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import { ConfigNames, loadPoolConfig } from "../helpers/configuration";
import { ALETH, CRV, CRV_HOLDER, CVX, CVX_HOLDER } from "../helpers/constants";
import { deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getCRVVault,
  getLendPoolAddressesProvider,
  getMintableERC20,
  getRewardPool,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
} from "../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../helpers/contracts-helpers";
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
import { MintableERC20 } from "../types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { lpValue, shareValue } from "./helpers/utils/helpers";
import "./helpers/utils/math";
const chai = require("chai");

const { expect } = chai;

makeSuite("Convex ETH Strategy", (testEnv: TestEnv) => {
  let snapshotId;
  let crv: MintableERC20;
  let cvx: MintableERC20;
  before(async () => {
    const { genericConvexETHStrategy, deployer } = testEnv;
    await genericConvexETHStrategy.updateKeepers([deployer.address], true);

    crv = await getMintableERC20(CRV);
    cvx = await getMintableERC20(CVX);
  });
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });
  it("ConvexETHStrategy: 40% debt ratio flow (no loss)", async () => {
    const { genericConvexETHStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, //STRATEGY ADDRESS
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

    await genericConvexETHStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));
    let uTokenDebtRatio = await uWETH.debtRatio();

    const ethAlEthPool = await getCRVVault(await genericConvexETHStrategy.curvePool());
    const rewardPool = await getCRVVault(await genericConvexETHStrategy.convexRewardPool());
    const erc20RewardPool = await getMintableERC20(rewardPool.address);
    let lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    let expectedLPValue = await lpValue(lpAmount, ethAlEthPool);

    let underlying = await weth.balanceOf(genericConvexETHStrategy.address);

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
    expect(underlying.add(expectedLPValue)).to.be.eq(await genericConvexETHStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Gains in both CRV and CVX (10 tokens)
        - Underlying is transferred from Strategy to UToken
        - Expected:
          - Total UToken debtRatio to REMAIN in 4000 BPS
          - Strategy debt ratio to REMAIN in 4000 BPS
          - UToken total debt to still be 40% of initial assets
          - Strategy total debt to still be 40% of initial assets
          - Strategy total gain to be greater than 0
          - Strategy total loss to be equal to 0
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // MOCK CRV GAINS
    let crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("10"));

    // MOCK CVX GAINS
    let cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("10"));

    let estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    // 40% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(4000);
    // Check Strategy debt ratio to be be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(4000);
    // Check UToken total debt to still be 40% of initial assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 40% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be almost equal to stakedBalance - debt

    expect(strategyData.totalGain).to.be.gt(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (40% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000)).toString()
    );

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - Gains in both CRV and CVX (100 CVX and 50 CRV)
        - Expected:
          - Total UToken debtRatio to be equal to 4000 BPS
          - Strategy debt ratio to be equal to 4000 BPS
          - UToken total debt to be increased from previous total debt
          - Strategy total debt to be increased from previous total debt
          - Strategy total gain to be greater than previous total gain
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the previous estimated total assets
    //////////////////////////////////////////////////////////////*/

    let previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    let previousStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let previousUTokenTotalDebt = await uWETH.totalDebt();

    // MOCK CRV GAINS
    crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("100"));

    // MOCK CVX GAINS
    cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("50"));

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    let estimatedTotalAssetsAfterHarvest = await genericConvexETHStrategy.estimatedTotalAssets();
    let harvestedUTokenWethBalance = await weth.balanceOf(uWETH.address);

    // Total UToken debtRatio to be 4000 BPS
    expect(uTokenDebtRatio).to.be.eq(4000);
    // Check Strategy debt ratio to be 4000 BPS
    expect(strategyData.debtRatio).to.be.eq(4000);
    // Check UToken total debt to be increased from previous total debt
    expect(await uWETH.totalDebt()).to.be.gt(previousUTokenTotalDebt);
    // Check Strategy total debt to be increased from previous total debt
    expect(strategyData.totalDebt).to.be.gt(previousStrategyData.totalDebt);
    // Check Strategy total gain to be greater than previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
    // Check Balance of underlying of UToken to have increased by the reported gain
    expect(harvestedUTokenWethBalance).to.be.gt(previousUTokenWethBalance);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the previous estimated total assets
    expect(estimatedTotalAssetsAfterHarvest).to.be.gt(estimatedTotalAssetsInStrategy);
  });
  it("ConvexETHStrategy: 80% debt ratio flow (no loss)", async () => {
    const { genericConvexETHStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, //STRATEGY ADDRESS
      8000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 10 additional ETH deposited.
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

    await genericConvexETHStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000));
    let uTokenDebtRatio = await uWETH.debtRatio();

    const ethAlEthPool = await getCRVVault(await genericConvexETHStrategy.curvePool());
    const rewardPool = await getCRVVault(await genericConvexETHStrategy.convexRewardPool());
    const erc20RewardPool = await getMintableERC20(rewardPool.address);
    let lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    let expectedLPValue = await lpValue(lpAmount, ethAlEthPool);

    let underlying = await weth.balanceOf(genericConvexETHStrategy.address);

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
    expect(underlying.add(expectedLPValue)).to.be.eq(await genericConvexETHStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Gains in both CRV and CVX (10 tokens)
        - Underlying is transferred from Strategy to UToken
        - Expected:
          - Total UToken debtRatio to REMAIN in 8000 BPS
          - Strategy debt ratio to REMAIN in 8000 BPS
          - UToken total debt to still be 80% of initial assets
          - Strategy total debt to still be 80% of initial assets
          - Strategy total gain to be greater than 0
          - Strategy total loss to be equal to 0
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (80% of total initial assets)
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // MOCK CRV GAINS
    let crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("10"));

    // MOCK CVX GAINS
    let cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("10"));

    let estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    // 80% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check Total UToken debtRatio to be 8000 BPS
    expect(uTokenDebtRatio).to.be.eq(8000);
    // Check Strategy debt ratio to be be 8000 BPS
    expect(strategyData.debtRatio).to.be.eq(8000);
    // Check UToken total debt to still be 80% of initial assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 80% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be almost equal to stakedBalance - debt

    expect(strategyData.totalGain).to.be.gt(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (80% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000)).toString()
    );

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - Gains in both CRV and CVX (100 CVX and 50 CRV)
        - Expected:
          - Total UToken debtRatio to be equal to 8000 BPS
          - Strategy debt ratio to be equal to 8000 BPS
          - UToken total debt to be increased from previous total debt
          - Strategy total debt to be increased from previous total debt
          - Strategy total gain to be greater than previous total gain
          - Balance of underlying of Strategy to have increased (gains un UToken are transferred to strategy)
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the previous estimated total assets
    //////////////////////////////////////////////////////////////*/

    let previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    let previousStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let previousUTokenTotalDebt = await uWETH.totalDebt();

    // MOCK CRV GAINS
    crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("100"));

    // MOCK CVX GAINS
    cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("50"));

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(8000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    let estimatedTotalAssetsAfterHarvest = await genericConvexETHStrategy.estimatedTotalAssets();
    let harvestedUTokenWethBalance = await weth.balanceOf(uWETH.address);

    // Total UToken debtRatio to be 8000 BPS
    expect(uTokenDebtRatio).to.be.eq(8000);
    // Check Strategy debt ratio to be 8000 BPS
    expect(strategyData.debtRatio).to.be.eq(8000);
    // Check UToken total debt to be increased from previous total debt
    expect(await uWETH.totalDebt()).to.be.gt(previousUTokenTotalDebt);
    // Check Strategy total debt to be increased from previous total debt
    expect(strategyData.totalDebt).to.be.gt(previousStrategyData.totalDebt);
    // Check Strategy total gain to be greater than previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
    // Check Balance of underlying of Strategy to have increased (UToken balance decreased)
    // due to gains un UToken are transferred to strategy
    expect(previousUTokenWethBalance).to.be.gt(harvestedUTokenWethBalance);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the previous estimated total assets
    expect(estimatedTotalAssetsAfterHarvest).to.be.gt(estimatedTotalAssetsInStrategy);
  });
  it("ConvexETHStrategy: 100% debt ratio flow (no loss)", async () => {
    const { genericConvexETHStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, //STRATEGY ADDRESS
      10000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

    /*//////////////////////////////////////////////////////////////
        FIRST HARVEST: 
        - 10 additional ETH deposited.
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

    await genericConvexETHStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));
    let uTokenDebtRatio = await uWETH.debtRatio();

    const ethAlEthPool = await getCRVVault(await genericConvexETHStrategy.curvePool());
    const rewardPool = await getCRVVault(await genericConvexETHStrategy.convexRewardPool());
    const erc20RewardPool = await getMintableERC20(rewardPool.address);
    let lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    let expectedLPValue = await lpValue(lpAmount, ethAlEthPool);

    let underlying = await weth.balanceOf(genericConvexETHStrategy.address);

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
    expect(underlying.add(expectedLPValue)).to.be.eq(await genericConvexETHStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Gains in both CRV and CVX (10 tokens)
        - Underlying is transferred from Strategy to UToken
        - Expected:
          - Total UToken debtRatio to REMAIN in 10000 BPS
          - Strategy debt ratio to REMAIN in 10000 BPS
          - UToken total debt to still be 100% of initial assets
          - Strategy total debt to still be 100% of initial assets
          - Strategy total gain to be greater than 0
          - Strategy total loss to be equal to 0
          - Balance of underlying of UToken to have increased by the reported gain
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // MOCK CRV GAINS
    let crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("10"));

    // MOCK CVX GAINS
    let cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("10"));

    let estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    // 100% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(10000);
    // Check Strategy debt ratio to be be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(10000);
    // Check UToken total debt to still be 100% of initial assets
    expect(await uWETH.totalDebt()).to.be.eq(BigNumber.from(expectedDebt.toString()));
    // Check Strategy total debt to be 100% of assets
    expect(strategyData.totalDebt).to.be.eq(BigNumber.from(expectedDebt.toString()));
    //Check Strategy total gain to be almost equal to stakedBalance - debt

    expect(strategyData.totalGain).to.be.gt(0);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the initial liquidity (100% of total initial assets)
    expect(estimatedTotalAssetsInStrategy).to.be.gt(
      new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000)).toString()
    );

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - Gains in both CRV and CVX (100 CVX and 50 CRV)
        - Expected:
          - Total UToken debtRatio to be equal to 10000 BPS
          - Strategy debt ratio to be equal to 10000 BPS
          - UToken total debt to be increased from previous total debt
          - Strategy total debt to be increased from previous total debt
          - Strategy total gain to be greater than previous total gain
          - Balance of underlying of Strategy to have increased (gains un UToken are transferred to strategy)
          - Strategy total loss to be 0
          - `estimatedTotalAssets()` to be greater than the previous estimated total assets
    //////////////////////////////////////////////////////////////*/

    let previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    let previousStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let previousUTokenTotalDebt = await uWETH.totalDebt();

    // MOCK CRV GAINS
    crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("100"));

    // MOCK CVX GAINS
    cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("50"));

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    let estimatedTotalAssetsAfterHarvest = await genericConvexETHStrategy.estimatedTotalAssets();
    let harvestedUTokenWethBalance = await weth.balanceOf(uWETH.address);

    // Total UToken debtRatio to be 10000 BPS
    expect(uTokenDebtRatio).to.be.eq(10000);
    // Check Strategy debt ratio to be 10000 BPS
    expect(strategyData.debtRatio).to.be.eq(10000);
    // Check UToken total debt to be increased from previous total debt
    expect(await uWETH.totalDebt()).to.be.gt(previousUTokenTotalDebt);
    // Check Strategy total debt to be increased from previous total debt
    expect(strategyData.totalDebt).to.be.gt(previousStrategyData.totalDebt);
    // Check Strategy total gain to be greater than previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
    // Check Balance of underlying of Strategy to have increased (UToken balance decreased)
    // due to gains un UToken are transferred to strategy
    expect(previousUTokenWethBalance).to.be.gt(harvestedUTokenWethBalance);
    // Check Strategy total loss to be 0
    expect(strategyData.totalLoss).to.be.eq(0);
    // Check `estimatedTotalAssets()` to be greater than the previous estimated total assets
    expect(estimatedTotalAssetsAfterHarvest).to.be.gt(estimatedTotalAssetsInStrategy);
  });
  it("ConvexETHStrategy: 1% debt ratio flow (incur loss in second harvest + obtain gain in third harvest)", async () => {
    const { genericConvexETHStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, //STRATEGY ADDRESS
      100, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

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

    await genericConvexETHStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100));
    let uTokenDebtRatio = await uWETH.debtRatio();

    const ethAlEthPool = await getCRVVault(await genericConvexETHStrategy.curvePool());
    const rewardPool = await getCRVVault(await genericConvexETHStrategy.convexRewardPool());
    const erc20RewardPool = await getMintableERC20(rewardPool.address);
    let lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    let expectedLPValue = await lpValue(lpAmount, ethAlEthPool);

    let underlying = await weth.balanceOf(genericConvexETHStrategy.address);

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
    expect(underlying.add(expectedLPValue)).to.be.eq(await genericConvexETHStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Strategy incurs 0.5 ETH loss (aroung 50%)
        - Expected:debt
          - Total UToken debtRatio to be reduced
          - Strategy debt ratio to be reduced
          - UToken total debt to be less than previous debt
          - Strategy total debt to be less than previous debt
          - Strategy total loss to be higher than previous loss
          - Balance of underlying of UToken to have decreased by the reported loss
          - Strategy total loss to be greater than 0
          - `estimatedTotalAssets()` to be less than the initial liquidity (1% of total initial assets)
          - UToken to still transfer funds to Strategy due to debt ratio    
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // Mock loss on Reward Pool removing staked balance
    const rewards = await getRewardPool(await genericConvexETHStrategy.convexRewardPool());
    let strategySigner = await getEthersSignerByAddress(genericConvexETHStrategy.address);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [genericConvexETHStrategy.address],
    });

    await fundWithETH(genericConvexETHStrategy.address, "10");

    await rewards.connect(strategySigner).withdrawAndUnwrap(parseEther("0.5"), false);

    let estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();
    let previousStrategyData = await uWETH.getStrategy(await genericConvexETHStrategy.address);
    let previousUtokenDebt = await uWETH.totalDebt();
    let previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    // 1% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check Total UToken debtRatio to be reduced
    expect(uTokenDebtRatio).to.be.lt(100);
    // Check Strategy debt ratio to be reduced
    expect(strategyData.debtRatio).to.be.lt(100);
    // Check UToken total debt to be less than previous debt
    expect(await uWETH.totalDebt()).to.be.lt(previousUtokenDebt);
    // Check Strategy total debt to be less than previous debt
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be higher than previous loss
    expect(strategyData.totalLoss).to.be.gt(previousStrategyData.totalLoss);
    // Check Balance of underlying of UToken to have decreased by the reported loss
    expect(await weth.balanceOf(genericConvexETHStrategy.address)).to.be.lt(previousUTokenWethBalance);
    // Check `estimatedTotalAssets()` to be less than the initial liquidity (1% of total initial assets)
    expect(await genericConvexETHStrategy.estimatedTotalAssets()).to.be.lt(parseEther("1"));

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - Gains in both CRV and CVX (1000 CVX and 1000 CRV)
        - Expected:
          - Total UToken debtRatio to be the same as the previous value (no loss incurred)
          - Strategy debt ratio  to be the same as the previous value (no loss incurred)
          - UToken total debt  to be the less than the previous value (due to debt payment)
          - Strategy total debt to be the less than the previous value (due to debt payment)
          - Strategy total loss to be the same as the previous total loss 
          - Strategy total gain to be the higher as the previous total gain
    //////////////////////////////////////////////////////////////*/

    previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);

    let previousUTokenDebtRatio = await uWETH.debtRatio();
    // MOCK CRV GAINS
    let crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("1000"));

    // MOCK CVX GAINS
    let cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("1000"));
    let previousUTokenTotalDebt = await uWETH.totalDebt();
    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(100));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check total UToken debtRatio to be the same as the previous value (no loss incurred)
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be the same as the previous value (no loss incurred)
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // CheckUToken total debt  to be the less than the previous value (due to debt payment)
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be the less than the previous value (due to debt payment)
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be the same as the previous total loss
    expect(strategyData.totalLoss).to.be.eq(previousStrategyData.totalLoss);
    // Strategy total gain to be the higher as the previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
  });
  it("ConvexETHStrategy: 40% debt ratio flow (incur loss in second harvest + obtain gain in third harvest)", async () => {
    const { genericConvexETHStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, //STRATEGY ADDRESS
      4000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // 100 ETH are "deposited" to the UToken
    await fundWithERC20("WETH", uWETH.address, "100");
    let initialUTokenWETHBalance = await weth.balanceOf(uWETH.address);

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

    await genericConvexETHStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));
    let uTokenDebtRatio = await uWETH.debtRatio();

    const ethAlEthPool = await getCRVVault(await genericConvexETHStrategy.curvePool());
    const rewardPool = await getCRVVault(await genericConvexETHStrategy.convexRewardPool());
    const erc20RewardPool = await getMintableERC20(rewardPool.address);
    let lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    let expectedLPValue = await lpValue(lpAmount, ethAlEthPool);

    let underlying = await weth.balanceOf(genericConvexETHStrategy.address);

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
    expect(underlying.add(expectedLPValue)).to.be.eq(await genericConvexETHStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Strategy incurs 15 ETH loss (aroung 75%)
        - Expected:
          - Total UToken debtRatio to be reduced
          - Strategy debt ratio to be reduced
          - UToken total debt to be less than previous debt
          - Strategy total debt to be less than previous debt
          - Strategy total loss to be higher than previous loss
          - Balance of underlying of UToken to have decreased by the reported loss
          - Strategy total loss to be greater than 0
          - `estimatedTotalAssets()` to be less than the initial liquidity (1% of total initial assets)
          - UToken to still transfer funds to Strategy due to debt ratio    
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // Mock loss on Reward Pool removing staked balance
    const rewards = await getRewardPool(await genericConvexETHStrategy.convexRewardPool());
    let strategySigner = await getEthersSignerByAddress(genericConvexETHStrategy.address);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [genericConvexETHStrategy.address],
    });

    await fundWithETH(genericConvexETHStrategy.address, "10");

    await rewards.connect(strategySigner).withdrawAndUnwrap(parseEther("15"), false);

    let estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();
    let previousStrategyData = await uWETH.getStrategy(await genericConvexETHStrategy.address);
    let previousUtokenDebt = await uWETH.totalDebt();
    let previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    // 1% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check Total UToken debtRatio to be reduced
    expect(uTokenDebtRatio).to.be.lt(4000);
    // Check Strategy debt ratio to be reduced
    expect(strategyData.debtRatio).to.be.lt(4000);
    // Check UToken total debt to be less than previous debt
    expect(await uWETH.totalDebt()).to.be.lt(previousUtokenDebt);
    // Check Strategy total debt to be less than previous debt
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be higher than previous loss
    expect(strategyData.totalLoss).to.be.gt(previousStrategyData.totalLoss);
    // Check Balance of underlying of UToken to have decreased by the reported loss
    expect(await weth.balanceOf(genericConvexETHStrategy.address)).to.be.lt(previousUTokenWethBalance);
    // Check `estimatedTotalAssets()` to be less than the initial liquidity (40% of total initial assets)
    expect(await genericConvexETHStrategy.estimatedTotalAssets()).to.be.lt(parseEther("40"));

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - Gains in both CRV and CVX (1000 CVX and 1000 CRV)
        - Expected:
          - Total UToken debtRatio to be the same as the previous value (no loss incurred)
          - Strategy debt ratio  to be the same as the previous value (no loss incurred)
          - UToken total debt  to be the less than the previous value (due to debt payment)
          - Strategy total debt to be the less than the previous value (due to debt payment)
          - Strategy total loss to be the same as the previous total loss 
          - Strategy total gain to be the higher as the previous total gain
    //////////////////////////////////////////////////////////////*/

    previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);

    let previousUTokenDebtRatio = await uWETH.debtRatio();
    // MOCK CRV GAINS
    let crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("1000"));

    // MOCK CVX GAINS
    let cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("1000"));
    let previousUTokenTotalDebt = await uWETH.totalDebt();
    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(4000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check total UToken debtRatio to be the same as the previous value (no loss incurred)
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be the same as the previous value (no loss incurred)
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // CheckUToken total debt  to be the less than the previous value (due to debt payment)
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be the less than the previous value (due to debt payment)
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be the same as the previous total loss
    expect(strategyData.totalLoss).to.be.eq(previousStrategyData.totalLoss);
    // Strategy total gain to be the higher as the previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
  });
  it("ConvexETHStrategy: 100% debt ratio flow (incur loss in second harvest + obtain gain in third harvest)", async () => {
    const { genericConvexETHStrategy, uWETH, weth } = testEnv;

    // Add strategy from scratch
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, //STRATEGY ADDRESS
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
          - UToken to transfer funds to Strategy (i.e total assets before harvest to be less than debt after harvest)
    //////////////////////////////////////////////////////////////*/

    await genericConvexETHStrategy.harvest();

    let strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));
    let uTokenDebtRatio = await uWETH.debtRatio();

    const ethAlEthPool = await getCRVVault(await genericConvexETHStrategy.curvePool());
    const rewardPool = await getCRVVault(await genericConvexETHStrategy.convexRewardPool());
    const erc20RewardPool = await getMintableERC20(rewardPool.address);
    let lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    let expectedLPValue = await lpValue(lpAmount, ethAlEthPool);

    let underlying = await weth.balanceOf(genericConvexETHStrategy.address);

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
    expect(underlying.add(expectedLPValue)).to.be.eq(await genericConvexETHStrategy.estimatedTotalAssets());

    /*//////////////////////////////////////////////////////////////
        SECOND HARVEST: 
        - Advance 1 month (30 days)
        - Strategy incurs 15 ETH loss (aroung 75%)
        - Expected:
          - Total UToken debtRatio to be reduced
          - Strategy debt ratio to be reduced
          - UToken total debt to be less than previous debt
          - Strategy total debt to be less than previous debt
          - Strategy total loss to be higher than previous loss
          - Strategy total loss to be greater than 0
          - `estimatedTotalAssets()` to be less than the initial liquidity (1% of total initial assets)
          - UToken to still transfer funds to Strategy due to debt ratio    
    //////////////////////////////////////////////////////////////*/

    await advanceTimeAndBlock(2592000); // 30 days

    // Mock loss on Reward Pool removing staked balance
    const rewards = await getRewardPool(await genericConvexETHStrategy.convexRewardPool());
    let strategySigner = await getEthersSignerByAddress(genericConvexETHStrategy.address);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [genericConvexETHStrategy.address],
    });

    await fundWithETH(genericConvexETHStrategy.address, "10");

    await rewards.connect(strategySigner).withdrawAndUnwrap(parseEther("15"), false);

    let estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();
    let previousStrategyData = await uWETH.getStrategy(await genericConvexETHStrategy.address);
    let previousUtokenDebt = await uWETH.totalDebt();
    let previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    // 1% of initial balance
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check Total UToken debtRatio to be reduced
    expect(uTokenDebtRatio).to.be.lt(10000);
    // Check Strategy debt ratio to be reduced
    expect(strategyData.debtRatio).to.be.lt(10000);
    // Check UToken total debt to be less than previous debt
    expect(await uWETH.totalDebt()).to.be.lt(previousUtokenDebt);
    // Check Strategy total debt to be less than previous debt
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be higher than previous loss
    expect(strategyData.totalLoss).to.be.gt(previousStrategyData.totalLoss);
    // Check `estimatedTotalAssets()` to be less than the initial liquidity (100% of total initial assets)
    expect(await genericConvexETHStrategy.estimatedTotalAssets()).to.be.lt(parseEther("100"));

    /*//////////////////////////////////////////////////////////////
        THIRD HARVEST: 
        - Advance 1 month (30 days)
        - Previous gains are considered, debt limit increases and funds are sent to the strategy
        - Gains in both CRV and CVX (1000 CVX and 1000 CRV)
        - Expected:
          - Total UToken debtRatio to be the same as the previous value (no loss incurred)
          - Strategy debt ratio  to be the same as the previous value (no loss incurred)
          - UToken total debt  to be the less than the previous value (due to debt payment)
          - Strategy total debt to be the less than the previous value (due to debt payment)
          - Strategy total loss to be the same as the previous total loss 
          - Strategy total gain to be the higher as the previous total gain
    //////////////////////////////////////////////////////////////*/

    previousUTokenWethBalance = await weth.balanceOf(uWETH.address);

    estimatedTotalAssetsInStrategy = await genericConvexETHStrategy.estimatedTotalAssets();

    previousStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);

    let previousUTokenDebtRatio = await uWETH.debtRatio();
    // MOCK CRV GAINS
    let crvHolder = await getEthersSignerByAddress(CRV_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CRV_HOLDER],
    });

    await fundWithETH(CRV_HOLDER, "10");

    await crv.connect(crvHolder).transfer(genericConvexETHStrategy.address, parseEther("1000"));

    // MOCK CVX GAINS
    let cvxHolder = await getEthersSignerByAddress(CVX_HOLDER);
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CVX_HOLDER],
    });

    await fundWithETH(CVX_HOLDER, "10");

    await cvx.connect(cvxHolder).transfer(genericConvexETHStrategy.address, parseEther("1000"));
    let previousUTokenTotalDebt = await uWETH.totalDebt();
    await genericConvexETHStrategy.harvest();

    strategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);
    expectedDebt = new BN(initialUTokenWETHBalance.toString()).percentMul(new BN(10000));

    uTokenDebtRatio = await uWETH.debtRatio();
    lpAmount = await erc20RewardPool.balanceOf(genericConvexETHStrategy.address);

    expectedLPValue = await lpValue(lpAmount, ethAlEthPool);
    underlying = await weth.balanceOf(genericConvexETHStrategy.address);

    // Check total UToken debtRatio to be the same as the previous value (no loss incurred)
    expect(uTokenDebtRatio).to.be.eq(previousUTokenDebtRatio);
    // Check Strategy debt ratio to be the same as the previous value (no loss incurred)
    expect(strategyData.debtRatio).to.be.eq(previousStrategyData.debtRatio);
    // CheckUToken total debt  to be the less than the previous value (due to debt payment)
    expect(await uWETH.totalDebt()).to.be.lt(previousUTokenTotalDebt);
    // Check Strategy total debt to be the less than the previous value (due to debt payment)
    expect(strategyData.totalDebt).to.be.lt(previousStrategyData.totalDebt);
    // Strategy total loss to be the same as the previous total loss
    expect(strategyData.totalLoss).to.be.eq(previousStrategyData.totalLoss);
    // Strategy total gain to be the higher as the previous total gain
    expect(strategyData.totalGain).to.be.gt(previousStrategyData.totalGain);
  });
});
