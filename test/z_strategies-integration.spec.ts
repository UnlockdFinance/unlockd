import { BigNumber as BN } from "bignumber.js";
import { zeroAddress } from "ethereumjs-util";
import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../helpers/configuration";
import { CRV, CRV_HOLDER, CVX, CVX_HOLDER } from "../helpers/constants";
import { deployGenericYVaultStrategy, deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getCRVVault,
  getLendPoolAddressesProvider,
  getMintableERC20,
  getRewardPool,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getYVault,
} from "../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  evmRevert,
  evmSnapshot,
  fundWithERC20,
  fundWithERC721,
  fundWithETH,
  notFalsyOrZeroAddress,
} from "../helpers/misc-utils";
import { eContractid, eNetwork, IConfigNftAsCollateralInput } from "../helpers/types";
import { MintableERC20 } from "../types";
import { ICurveFactory } from "../types/ICurveFactory";
import { approveERC20, deposit, getYVaultLockedValueInUnderlying, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { computeAvailableCredit, lpValue, shareValue } from "./helpers/utils/helpers";
import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Strategies integration", (testEnv: TestEnv) => {
  let snapshotId;
  let vault;
  let erc20YVault;
  let rewardPool;
  let curve;
  let crv: MintableERC20;
  let cvx: MintableERC20;
  before("Initializing configuration", async () => {
    const { genericConvexETHStrategy, genericYVaultStrategy, uWETH, configurator, deployer, nftOracle } = testEnv;
    // Yearn Vault helpers
    vault = await getYVault(await genericYVaultStrategy.yVault());
    erc20YVault = await getMintableERC20(await genericYVaultStrategy.yVault());

    // Convex helpers
    rewardPool = await getRewardPool(await genericConvexETHStrategy.convexRewardPool());
    curve = await getCRVVault(await genericConvexETHStrategy.curvePool());

    // General configurations
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    // Tokens
    crv = await getMintableERC20(CRV);
    cvx = await getMintableERC20(CVX);
  });

  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });

  it("(FLOW 1) - (1). Depositor deposits 10 WETH. (2). Harvest takes place in both strategies. (3). Borrower tries to borrow 1 ETH (there is enough funds in UToken, no withdraw from strategies (both yearn and convex due to max debt limits) needed. (4) Depositor tries to withdraw 5 WETH back", async () => {
    const { users, weth, uWETH, genericConvexETHStrategy, genericYVaultStrategy, pool, bayc, configurator, deployer } =
      testEnv;
    const depositor = users[1];
    const borrower = users[2];
    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 0: Setup strategies
    //////////////////////////////////////////////////////////////*/
    // Add Yearn Strategy (30% debt ratio)
    await uWETH.addStrategy(
      genericYVaultStrategy.address, // STRATEGY
      3000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    // Add Convex Strategy (50% debt ratio)
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, // STRATEGY
      5000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 1: Depositor deposits 10 ETH
    //////////////////////////////////////////////////////////////*/

    await fundWithERC20("WETH", depositor.address, "10");
    await approveERC20(testEnv, depositor, "WETH");

    await pool.connect(depositor.signer).deposit(weth.address, parseEther("10"), depositor.address, 0);

    // Expect user utoken balance to be 10
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(parseEther("10"));
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 2: Harvest takes place in both strategies
    //////////////////////////////////////////////////////////////*/
    let initialUTokenBalance = await weth.balanceOf(uWETH.address);
    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 80%
    expect(await uWETH.debtRatio()).to.be.eq(8000);
    // Expect yearn strategy debt ratio to be 30%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(3000);
    // Expect yearn strategy debt ratio to be 50%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(5000);
    // Expect utoken total debt to be 80% of initial funds
    expect(await uWETH.totalDebt()).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(8000)).toString())
    );
    // Expect yearn strategy total debt to be 30% of initial funds
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(3000)).toString())
    );
    // Expect convex strategy total debt to be 50% of initial funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(5000)).toString())
    );
    // Expect value held by yearn strategy to be close to deployed debt
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await getYVaultLockedValueInUnderlying(vault, erc20YVault, genericYVaultStrategy.address),
      10
    );
    // Expect value held by convex strategy to be close to deployed debt
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await lpValue(await rewardPool.balanceOf(genericConvexETHStrategy.address), curve),
      parseEther("1")
    );
    // Expect available liquidity to be the same as underlying assets + deployed debt
    expect(await uWETH.getAvailableLiquidity()).to.be.eq(
      (await weth.balanceOf(uWETH.address)).add(await uWETH.totalDebt())
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 3: Borrower tries to borrow 1 ETH (there is enough funds in UToken)
    //////////////////////////////////////////////////////////////*/

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", borrower.address, tokenIdNum);
    await setApprovalForAll(testEnv, borrower, "BAYC");

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };

    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    let borrowerBalanceBefore = await weth.balanceOf(borrower.address);

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("1"), bayc.address, tokenId, borrower.address, 0);

    // Expect user to have borrrowed successfully
    expect(await weth.balanceOf(borrower.address)).to.be.eq(borrowerBalanceBefore.add(parseEther("1")));

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 4: Depositor tries to withdraw 5 WETH back
    //////////////////////////////////////////////////////////////*/
    let depositorBalanceBefore = await weth.balanceOf(depositor.address);
    let depositorUTokenBalanceBefore = await uWETH.balanceOf(depositor.address);
    let yearnStrategyDataBefore = await uWETH.getStrategy(genericYVaultStrategy.address);
    let convexStrategyDataBefore = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let uTokenPreviousTotalDebt = await uWETH.totalDebt();
    let uTokenPreviousTotalDebtRatio = await uWETH.debtRatio();
    await uWETH.setMaxLoss("1000"); // Set max loss at 10%
    await pool.connect(depositor.signer).withdraw(weth.address, parseEther("5"), depositor.address);

    let depositorBalanceAfter = await weth.balanceOf(depositor.address);
    let depositorUTokenBalanceAfter = await uWETH.balanceOf(depositor.address);
    let yearnStrategyDataAfter = await uWETH.getStrategy(genericYVaultStrategy.address);
    let convexStrategyDataAfter = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect depositor balance to have increased by the withdrawal amount
    expect(depositorBalanceAfter).to.be.gt(depositorBalanceBefore);
    // Expect yearn strategy to have incurred a small loss
    expect(yearnStrategyDataAfter.totalLoss).to.be.gt(0);
    // Expect convex strategy to have incurred a small loss
    expect(convexStrategyDataAfter.totalLoss).to.be.gt(0);
    // Expect yearn strategy total debt to have decreased due to withdrawing funds
    expect(yearnStrategyDataAfter.totalDebt).to.be.lt(yearnStrategyDataBefore.totalDebt);
    // Expect convex strategy total debt to have decreased due to withdrawing funds
    expect(convexStrategyDataAfter.totalDebt).to.be.lt(convexStrategyDataBefore.totalDebt);
    // Expect yearn strategy debt ratio to not have decreased due to a really small loss on withdrawals
    expect(yearnStrategyDataAfter.debtRatio).to.be.eq(yearnStrategyDataBefore.debtRatio);
    // Expect convex strategy debt ratio to have decreased due to loss on withdrawal
    expect(convexStrategyDataAfter.debtRatio).to.be.lt(convexStrategyDataBefore.debtRatio);
    // Expect total utoken debt to have decreased due to withdrawals
    expect(await uWETH.totalDebt()).to.be.lt(uTokenPreviousTotalDebt);
    // Expect total utoken debt ratio to have decreased due to withdrawals
    expect(await uWETH.debtRatio()).to.be.lt(uTokenPreviousTotalDebtRatio);
    // #endregion
  });
  it("(FLOW 2) - (1). Depositor deposits 250 WETH. (2). Harvest takes place in both strategies. (3). Admin modifies strategies debt ratio and harvest takes place (4) User 1 tries to withdraw all of his UToken balance back", async () => {
    const { users, weth, uWETH, genericConvexETHStrategy, genericYVaultStrategy, pool, bayc, configurator, deployer } =
      testEnv;
    const depositor = users[1];
    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 0: Setup strategies
    //////////////////////////////////////////////////////////////*/
    // Add Yearn Strategy (30% debt ratio)
    await uWETH.addStrategy(
      genericYVaultStrategy.address, // STRATEGY
      3000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    // Add Convex Strategy (50% debt ratio)
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, // STRATEGY
      5000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 1: Depositor deposits 250 ETH
    //////////////////////////////////////////////////////////////*/

    await fundWithERC20("WETH", depositor.address, "250");
    await approveERC20(testEnv, depositor, "WETH");

    await pool.connect(depositor.signer).deposit(weth.address, parseEther("250"), depositor.address, 0);

    // Expect user utoken balance to be 250
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(parseEther("250"));
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 2: Harvest takes place in both strategies
    //////////////////////////////////////////////////////////////*/

    let initialUTokenBalance = await weth.balanceOf(uWETH.address);

    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 80%
    expect(await uWETH.debtRatio()).to.be.eq(8000);
    // Expect yearn strategy debt ratio to be 30%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(3000);
    // Expect yearn strategy debt ratio to be 50%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(5000);
    // Expect utoken total debt to be 80% of initial funds
    expect(await uWETH.totalDebt()).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(8000)).toString())
    );
    // Expect yearn strategy total debt to be 30% of initial funds
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(3000)).toString())
    );
    // Expect yearn strategy total debt to be 50% of initial funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(5000)).toString())
    );
    // Expect value held by yearn strategy to be close to deployed debt
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await getYVaultLockedValueInUnderlying(vault, erc20YVault, genericYVaultStrategy.address),
      10
    );
    // Expect value held by convex strategy to be close to deployed debt
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await lpValue(await rewardPool.balanceOf(genericConvexETHStrategy.address), curve),
      parseEther("5")
    );
    // Expect available liquidity to be the same as underlying assets + deployed debt
    expect(await uWETH.getAvailableLiquidity()).to.be.eq(
      (await weth.balanceOf(uWETH.address)).add(await uWETH.totalDebt())
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
          PHASE 3: Admin modifies strategies debt ratio and harvest takes place
    //////////////////////////////////////////////////////////////*/

    await uWETH.updateStrategyParams(
      genericConvexETHStrategy.address, // strategy
      "2000", // debt ratio (20%)
      0, // min debt per harvest
      (
        await uWETH.getStrategy(genericConvexETHStrategy.address)
      ).maxDebtPerHarvest // max debt per harvest
    );

    await uWETH.updateStrategyParams(
      genericYVaultStrategy.address, // strategy
      "7000", // debt ratio (70%)
      0, // min debt per harvest
      (
        await uWETH.getStrategy(genericYVaultStrategy.address)
      ).maxDebtPerHarvest // max debt per harvest
    );

    let uTokenPreviousTotalDebtRatio = await uWETH.debtRatio();
    let uTokenPreviousTotalDebt = await uWETH.totalDebt();
    let uTokenPreviousWETHBalance = await weth.balanceOf(uWETH.address);
    let genericYVaultStrategyDataBeforeHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexStrategyDataBeforeHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let totalAssetsBeforeHarvest = await uWETH.getAvailableLiquidity();
    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 90%
    expect(await uWETH.debtRatio()).to.be.eq(9000);
    // Expect yearn strategy debt ratio to be 70%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(7000);
    // Expect convex strategy debt ratio to be 20%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(2000);
    // Expect total credit to have increased by the debt limit (due to the fact that yearn is harvested first)
    const availableCreditYearn = await computeAvailableCredit(
      await uWETH.getAvailableLiquidity(),
      uTokenPreviousTotalDebtRatio,
      genericYVaultStrategyDataBeforeHarvest.debtRatio,
      genericYVaultStrategyDataBeforeHarvest.totalDebt,
      uTokenPreviousTotalDebt,
      uTokenPreviousWETHBalance,
      genericYVaultStrategyDataBeforeHarvest.minDebtPerHarvest,
      genericYVaultStrategyDataBeforeHarvest.maxDebtPerHarvest
    );
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      genericYVaultStrategyDataBeforeHarvest.totalDebt.add(availableCreditYearn),
      parseEther("1")
    );
    // Expect total credit for convex strategy to be 0
    const availableCreditConvex = await computeAvailableCredit(
      await uWETH.getAvailableLiquidity(),
      uTokenPreviousTotalDebtRatio,
      genericConvexStrategyDataBeforeHarvest.debtRatio,
      genericConvexStrategyDataBeforeHarvest.totalDebt,
      uTokenPreviousTotalDebt,
      uTokenPreviousWETHBalance,
      genericConvexStrategyDataBeforeHarvest.minDebtPerHarvest,
      genericConvexStrategyDataBeforeHarvest.maxDebtPerHarvest
    );
    expect(availableCreditConvex).to.be.eq(0);
    // Expect total credit for convex to be 20% of funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      BigNumber.from(new BN(totalAssetsBeforeHarvest.toString()).percentMul(new BN(2000)).toString()),
      parseEther("1")
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 4: Depositor tries to withdraw all of his UToken balance back
    //////////////////////////////////////////////////////////////*/

    let depositorWETHBalanceBeforeWithdraw = await weth.balanceOf(depositor.address);
    await uWETH.setMaxLoss("1000"); // Set max loss at 10%

    let genericYVaultStrategyDataBeforeWithdraw = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexStrategyDataBeforeWithdraw = await uWETH.getStrategy(genericConvexETHStrategy.address);

    await pool
      .connect(depositor.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor.address
      );

    let genericYVaultStrategyDataAfterWithdraw = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexStrategyDataAfterWithdraw = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect depositor balance of UTokens to be 0
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(0);
    // Expect depositor reserve balance to have increased by 250 ETH
    expect(await weth.balanceOf(depositor.address)).to.be.closeTo(
      depositorWETHBalanceBeforeWithdraw.add(parseEther("250")).sub(parseEther("1")),
      depositorWETHBalanceBeforeWithdraw.add(parseEther("250")).add(parseEther("1"))
    );
    // Expect total debt for yearn strategy to have decreased due to withdrawal
    expect(genericYVaultStrategyDataAfterWithdraw.totalDebt).to.be.lt(
      genericYVaultStrategyDataBeforeWithdraw.totalDebt
    );
    // Expect total debt for convex strategy to have decreased due to withdrawal
    expect(genericConvexStrategyDataAfterWithdraw.totalDebt).to.be.lt(
      genericConvexStrategyDataBeforeWithdraw.totalDebt
    );
    // Expect total debt ratio for yearn strategy to have decreased/stayed equal due to withdrawal loss (depending on if it was minimal or not)
    expect(genericYVaultStrategyDataAfterWithdraw.debtRatio).to.be.closeTo(
      genericYVaultStrategyDataBeforeWithdraw.debtRatio,
      1000
    );
    // Expect total debt ratio for convex strategy to have decreased due to withdrawal
    expect(genericConvexStrategyDataAfterWithdraw.debtRatio).to.be.closeTo(
      genericConvexStrategyDataBeforeWithdraw.debtRatio,
      1000
    );
  });
  it("(FLOW 3) - (1). Depositor deposits 100 WETH. (2). Harvest takes place in both strategies. (3). Borrower tries to borrow 50 ETH (there is NOT enough funds in UToken, withdrawal ONLY from Yearn Strategy expected) (4) Borrower repays all of his debt back (5) Depositor tries to withdraw all his 100 WETH back", async () => {
    const {
      users,
      weth,
      uWETH,
      genericConvexETHStrategy,
      genericYVaultStrategy,
      pool,
      bayc,
      configurator,
      deployer,
      dataProvider,
    } = testEnv;
    const depositor = users[1];
    const borrower = users[2];
    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 0: Setup strategies
    //////////////////////////////////////////////////////////////*/
    // Add Yearn Strategy (60% debt ratio)
    await uWETH.addStrategy(
      genericYVaultStrategy.address, // STRATEGY
      6000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    // Add Convex Strategy (15% debt ratio)
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, // STRATEGY
      1500, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 1: Depositor deposits 100 ETH
    //////////////////////////////////////////////////////////////*/

    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    await pool.connect(depositor.signer).deposit(weth.address, parseEther("100"), depositor.address, 0);

    // Expect user utoken balance to be 100
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(parseEther("100"));
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 2: Harvest takes place in both strategies
    //////////////////////////////////////////////////////////////*/
    let initialUTokenBalance = await weth.balanceOf(uWETH.address);
    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 75%
    expect(await uWETH.debtRatio()).to.be.eq(7500);
    // Expect yearn strategy debt ratio to be 60%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(6000);
    // Expect yearn strategy debt ratio to be 15%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(1500);
    // Expect utoken total debt to be 75% of initial funds
    expect(await uWETH.totalDebt()).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(7500)).toString())
    );
    // Expect yearn strategy total debt to be 60% of initial funds
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(6000)).toString())
    );
    // Expect convex strategy total debt to be 15% of initial funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(1500)).toString())
    );
    // Expect value held by yearn strategy to be close to total strategy debt debt
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await getYVaultLockedValueInUnderlying(vault, erc20YVault, genericYVaultStrategy.address),
      10
    );
    // Expect value held by convex strategy to be close to total strategy debt debt
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await lpValue(await rewardPool.balanceOf(genericConvexETHStrategy.address), curve),
      parseEther("1")
    );
    // Expect available liquidity to be the same as underlying assets + deployed debt
    expect(await uWETH.getAvailableLiquidity()).to.be.eq(
      (await weth.balanceOf(uWETH.address)).add(await uWETH.totalDebt())
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
      PHASE 3: Borrower tries to borrow 50 ETH (there is NOT enough funds in UToken, withdrawal ONLY from Yearn Strategy expected)
    //////////////////////////////////////////////////////////////*/
    await uWETH.setMaxLoss("1000"); // Set max loss at 10%
    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", borrower.address, tokenIdNum);
    await setApprovalForAll(testEnv, borrower, "BAYC");

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("200"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };

    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    let borrowerBalanceBefore = await weth.balanceOf(borrower.address);
    let genericYVaultStrategyDataBeforeBorrow = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataBeforeBorrow = await uWETH.getStrategy(genericConvexETHStrategy.address);

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("50"), bayc.address, tokenId, borrower.address, 0);

    let genericYVaultStrategyDataAfterBorrow = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterBorrow = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect user to have borrowed successfully
    expect(await weth.balanceOf(borrower.address)).to.be.closeTo(
      borrowerBalanceBefore.add(parseEther("50")),
      parseEther("1")
    );
    // Expect yearn strategy debt to have decreased due to withdrawal amount
    expect(genericYVaultStrategyDataAfterBorrow.totalDebt).to.be.lt(genericYVaultStrategyDataBeforeBorrow.totalDebt);
    // Expect convex strategy debt to be the same due to no withdrawal occured
    expect(genericConvexETHStrategyDataAfterBorrow.totalDebt).to.be.eq(
      genericConvexETHStrategyDataBeforeBorrow.totalDebt
    );
    // Expect yearn strategy loss to be greater than previous loss due to withdrawal amount
    expect(genericYVaultStrategyDataAfterBorrow.totalLoss).to.be.gt(genericYVaultStrategyDataBeforeBorrow.totalLoss);
    // Expect convex strategy loss to be equal than previous loss due to no withdrawal occured
    expect(genericConvexETHStrategyDataAfterBorrow.totalLoss).to.be.eq(
      genericConvexETHStrategyDataBeforeBorrow.totalLoss
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 4: Borrower repays all of his debt back
    //////////////////////////////////////////////////////////////*/
    let yearnStrategyDataBefore = await uWETH.getStrategy(genericYVaultStrategy.address);
    let convexStrategyDataBefore = await uWETH.getStrategy(genericConvexETHStrategy.address);
    let uTokenPreviousTotalDebt = await uWETH.totalDebt();
    let uTokenPreviousTotalDebtRatio = await uWETH.debtRatio();

    await fundWithERC20("WETH", borrower.address, "10");
    await approveERC20(testEnv, borrower, "WETH");

    borrowerBalanceBefore = await weth.balanceOf(borrower.address);
    let owningAmount = await dataProvider.getLoanDataByCollateral(bayc.address, tokenId);
    let uTokenReserveBalanceBefore = await weth.balanceOf(uWETH.address);

    await pool.connect(borrower.signer).repay(bayc.address, tokenId, parseEther("10000000000"));

    let borrowerBalanceAfter = await weth.balanceOf(borrower.address);
    let uTokenReserveBalanceAfter = await weth.balanceOf(uWETH.address);

    // Expect borrower reserve balance to be 0
    expect(borrowerBalanceAfter).to.be.closeTo(
      borrowerBalanceBefore.sub(parseEther("55")),
      borrowerBalanceBefore.sub(parseEther("50"))
    );
    // Expect UToken weth balance to have increased by amount borrower owes
    expect(uTokenReserveBalanceAfter).to.be.closeTo(
      uTokenReserveBalanceBefore.add(owningAmount.currentAmount),
      uTokenReserveBalanceBefore.add(owningAmount.currentAmount).add(parseEther("0.5"))
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 5: Depositor tries to withdraw all his 100 WETH back
    //////////////////////////////////////////////////////////////*/
    initialUTokenBalance = await weth.balanceOf(uWETH.address);

    let genericYVaultETHStrategyDataBeforeWithdraw = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataBeforeWithdraw = await uWETH.getStrategy(genericYVaultStrategy.address);

    await pool
      .connect(depositor.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor.address
      );

    let genericYVaultETHStrategyDataAfterWithdraw = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterWithdraw = await uWETH.getStrategy(genericYVaultStrategy.address);

    // Expect yearn strategy to incur loss after withdrawal
    expect(genericYVaultETHStrategyDataAfterWithdraw.totalLoss).to.be.gt(
      genericYVaultETHStrategyDataBeforeWithdraw.totalLoss
    );
    // Expect convex strategy to incur loss after withdrawal
    expect(genericConvexETHStrategyDataAfterWithdraw.totalLoss).to.be.gt(
      genericConvexETHStrategyDataBeforeWithdraw.totalLoss
    );
    // Expect balance of depositor UTokens to be 0
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(0);
    // #endregion
  });
  it("(FLOW 4 / Emergency Shutdown) - (1). Depositor deposits 100 WETH. (2). Harvest takes place in both strategies. (3). Emergency shutdown mode is activated (4) Harvest takes place again (Expect receive all funds from strategies back)", async () => {
    const {
      users,
      weth,
      uWETH,
      genericConvexETHStrategy,
      genericYVaultStrategy,
      pool,
      bayc,
      configurator,
      deployer,
      dataProvider,
    } = testEnv;
    const depositor = users[1];

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 0: Setup strategies
    //////////////////////////////////////////////////////////////*/
    // Add Yearn Strategy (60% debt ratio)
    await uWETH.addStrategy(
      genericYVaultStrategy.address, // STRATEGY
      6000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    // Add Convex Strategy (15% debt ratio)
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, // STRATEGY
      1500, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 1: Depositor deposits 100 ETH
    //////////////////////////////////////////////////////////////*/

    let uTokenInitialWethBalance = await weth.balanceOf(uWETH.address);

    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    await pool.connect(depositor.signer).deposit(weth.address, parseEther("100"), depositor.address, 0);

    // Expect user utoken balance to be 100
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(parseEther("100"));
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 2: Harvest takes place in both strategies
    //////////////////////////////////////////////////////////////*/
    let initialUTokenBalance = await weth.balanceOf(uWETH.address);
    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 75%
    expect(await uWETH.debtRatio()).to.be.eq(7500);
    // Expect yearn strategy debt ratio to be 60%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(6000);
    // Expect yearn strategy debt ratio to be 15%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(1500);
    // Expect utoken total debt to be 75% of initial funds
    expect(await uWETH.totalDebt()).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(7500)).toString())
    );
    // Expect yearn strategy total debt to be 60% of initial funds
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(6000)).toString())
    );
    // Expect convex strategy total debt to be 15% of initial funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(1500)).toString())
    );
    // Expect value held by yearn strategy to be close to total strategy debt debt
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await getYVaultLockedValueInUnderlying(vault, erc20YVault, genericYVaultStrategy.address),
      10
    );
    // Expect value held by convex strategy to be close to total strategy debt debt
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await lpValue(await rewardPool.balanceOf(genericConvexETHStrategy.address), curve),
      parseEther("1")
    );
    // Expect available liquidity to be the same as underlying assets + deployed debt
    expect(await uWETH.getAvailableLiquidity()).to.be.eq(
      (await weth.balanceOf(uWETH.address)).add(await uWETH.totalDebt())
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
      PHASE 3: Emergency shutdown mode is activated
    //////////////////////////////////////////////////////////////*/

    await uWETH.setEmergencyShutdown(true);

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 4: Harvest takes place again
    //////////////////////////////////////////////////////////////*/
    // Mock gains in Yearn Strategy
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "100");
    // Mock gains in Convex Strategy
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

    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let yearnStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    let convexStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);
    // Expect yearn's debt to become 0 due to emergency shutdown
    expect(await yearnStrategyData.totalDebt).to.be.eq(0);
    // Expect convex's debt to become 0 due to emergency shutdown
    expect(await convexStrategyData.totalDebt).to.be.eq(0);
    // Expect uToken total debt to become 0 due to emergency shutdown
    expect(await uWETH.totalDebt()).to.be.eq(0);
    // Expect uToken reserve balance to be close to inicial balance
    expect(await weth.balanceOf(uWETH.address)).to.be.closeTo(
      uTokenInitialWethBalance.add(parseEther("100")),
      parseEther("1")
    );
    // #endregion
  });
  it("(FLOW 5 / Yearn Emergency Exit) - (1). Depositor deposits 100 WETH. (2). Harvest takes place in both strategies. (3). Emergency exit mode is activated in Yearn Strategy (4) Harvest takes place again (Expect receive all funds from Yearn Strategy back)", async () => {
    const {
      users,
      weth,
      uWETH,
      genericConvexETHStrategy,
      genericYVaultStrategy,
      pool,
      bayc,
      configurator,
      deployer,
      dataProvider,
    } = testEnv;
    const depositor = users[1];

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 0: Setup strategies
    //////////////////////////////////////////////////////////////*/
    // Add Yearn Strategy (60% debt ratio)
    await uWETH.addStrategy(
      genericYVaultStrategy.address, // STRATEGY
      6000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    // Add Convex Strategy (15% debt ratio)
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, // STRATEGY
      1500, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 1: Depositor deposits 100 ETH
    //////////////////////////////////////////////////////////////*/

    let uTokenInitialWethBalance = await weth.balanceOf(uWETH.address);

    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    await pool.connect(depositor.signer).deposit(weth.address, parseEther("100"), depositor.address, 0);

    // Expect user utoken balance to be 100
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(parseEther("100"));
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 2: Harvest takes place in both strategies
    //////////////////////////////////////////////////////////////*/
    let initialUTokenBalance = await weth.balanceOf(uWETH.address);

    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 75%
    expect(await uWETH.debtRatio()).to.be.eq(7500);
    // Expect yearn strategy debt ratio to be 60%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(6000);
    // Expect yearn strategy debt ratio to be 15%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(1500);
    // Expect utoken total debt to be 75% of initial funds
    expect(await uWETH.totalDebt()).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(7500)).toString())
    );
    // Expect yearn strategy total debt to be 60% of initial funds
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(6000)).toString())
    );
    // Expect convex strategy total debt to be 15% of initial funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(1500)).toString())
    );
    // Expect value held by yearn strategy to be close to total strategy debt debt
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await getYVaultLockedValueInUnderlying(vault, erc20YVault, genericYVaultStrategy.address),
      10
    );
    // Expect value held by convex strategy to be close to total strategy debt debt
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await lpValue(await rewardPool.balanceOf(genericConvexETHStrategy.address), curve),
      parseEther("1")
    );
    // Expect available liquidity to be the same as underlying assets + deployed debt
    expect(await uWETH.getAvailableLiquidity()).to.be.eq(
      (await weth.balanceOf(uWETH.address)).add(await uWETH.totalDebt())
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
      PHASE 3: Emergency exit mode is activated in Yearn Strategy
    //////////////////////////////////////////////////////////////*/

    await genericYVaultStrategy.setEmergencyExit(true);

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 4: Harvest takes place again
    //////////////////////////////////////////////////////////////*/
    // Mock gains in Yearn Strategy
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "100");
    // Mock gains in Convex Strategy
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

    let yearnStrategyDataBefore = await uWETH.getStrategy(genericYVaultStrategy.address);
    uTokenInitialWethBalance = await weth.balanceOf(uWETH.address);

    // Harvest yearn strategy
    await genericYVaultStrategy.harvest();

    let yearnStrategyData = await uWETH.getStrategy(genericYVaultStrategy.address);

    // Expect yearn's debt to be the same as before due to the fact that emergency exit does not alter debt distribution
    expect(await yearnStrategyData.totalDebt).to.be.eq(yearnStrategyDataBefore.totalDebt);
    // Expect uToken reserve balance to be close to balance before harvest + debt in yearn strategy
    expect(await weth.balanceOf(uWETH.address)).to.be.closeTo(
      uTokenInitialWethBalance.add(yearnStrategyData.totalDebt),
      parseEther("1")
    );
    // #endregion
  });
  it("(FLOW 6 / Convex Emergency Exit) - (1). Depositor deposits 100 WETH. (2). Harvest takes place in both strategies. (3). Emergency exit mode is activated in Convex Strategy (4) Harvest takes place again (Expect receive all funds from Convex Strategy back)", async () => {
    const {
      users,
      weth,
      uWETH,
      genericConvexETHStrategy,
      genericYVaultStrategy,
      pool,
      bayc,
      configurator,
      deployer,
      dataProvider,
    } = testEnv;
    const depositor = users[1];

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 0: Setup strategies
    //////////////////////////////////////////////////////////////*/
    // Add Yearn Strategy (60% debt ratio)
    await uWETH.addStrategy(
      genericYVaultStrategy.address, // STRATEGY
      6000, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );

    // Add Convex Strategy (15% debt ratio)
    await uWETH.addStrategy(
      genericConvexETHStrategy.address, // STRATEGY
      1500, // DEBT RATIO
      0, // MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 1: Depositor deposits 100 ETH
    //////////////////////////////////////////////////////////////*/

    let uTokenInitialWethBalance = await weth.balanceOf(uWETH.address);

    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    await pool.connect(depositor.signer).deposit(weth.address, parseEther("100"), depositor.address, 0);

    // Expect user utoken balance to be 100
    expect(await uWETH.balanceOf(depositor.address)).to.be.eq(parseEther("100"));
    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
                  PHASE 2: Harvest takes place in both strategies
    //////////////////////////////////////////////////////////////*/
    let initialUTokenBalance = await weth.balanceOf(uWETH.address);

    // HARVEST both yearn and convex
    await genericYVaultStrategy.harvest();
    await genericConvexETHStrategy.harvest();

    let genericYVaultStrategyDataAfterHarvest = await uWETH.getStrategy(genericYVaultStrategy.address);
    let genericConvexETHStrategyDataAfterHarvest = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect UToken debt ratio to be 75%
    expect(await uWETH.debtRatio()).to.be.eq(7500);
    // Expect yearn strategy debt ratio to be 60%
    expect(genericYVaultStrategyDataAfterHarvest.debtRatio).to.be.eq(6000);
    // Expect yearn strategy debt ratio to be 15%
    expect(genericConvexETHStrategyDataAfterHarvest.debtRatio).to.be.eq(1500);
    // Expect utoken total debt to be 75% of initial funds
    expect(await uWETH.totalDebt()).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(7500)).toString())
    );
    // Expect yearn strategy total debt to be 60% of initial funds
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(6000)).toString())
    );
    // Expect convex strategy total debt to be 15% of initial funds
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.eq(
      BigNumber.from(new BN(initialUTokenBalance.toString()).percentMul(new BN(1500)).toString())
    );
    // Expect value held by yearn strategy to be close to total strategy debt debt
    expect(genericYVaultStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await getYVaultLockedValueInUnderlying(vault, erc20YVault, genericYVaultStrategy.address),
      10
    );
    // Expect value held by convex strategy to be close to total strategy debt debt
    expect(genericConvexETHStrategyDataAfterHarvest.totalDebt).to.be.closeTo(
      await lpValue(await rewardPool.balanceOf(genericConvexETHStrategy.address), curve),
      parseEther("1")
    );
    // Expect available liquidity to be the same as underlying assets + deployed debt
    expect(await uWETH.getAvailableLiquidity()).to.be.eq(
      (await weth.balanceOf(uWETH.address)).add(await uWETH.totalDebt())
    );

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
      PHASE 3: Emergency exit mode is activated in Convex Strategy
    //////////////////////////////////////////////////////////////*/

    await genericConvexETHStrategy.setEmergencyExit(true);

    // #endregion

    // #region
    /*//////////////////////////////////////////////////////////////
              PHASE 4: Harvest takes place again
    //////////////////////////////////////////////////////////////*/
    // Mock gains in Yearn Strategy
    await fundWithERC20("WETH", await genericYVaultStrategy.yVault(), "100");
    // Mock gains in Convex Strategy
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

    let convexStrategyDataBefore = await uWETH.getStrategy(genericConvexETHStrategy.address);
    uTokenInitialWethBalance = await weth.balanceOf(uWETH.address);

    // Harvest convex
    await genericConvexETHStrategy.harvest();

    let convexStrategyData = await uWETH.getStrategy(genericConvexETHStrategy.address);

    // Expect Convex's debt to be the same as before due to the fact that emergency exit does not alter debt distribution
    expect(await convexStrategyData.totalDebt).to.be.eq(convexStrategyDataBefore.totalDebt);
    // Expect uToken reserve balance to be close to balance before harvest + debt in convex strategy
    expect(await weth.balanceOf(uWETH.address)).to.be.closeTo(
      uTokenInitialWethBalance.add(convexStrategyData.totalDebt),
      parseEther("1")
    );
    // #endregion
  });
});
