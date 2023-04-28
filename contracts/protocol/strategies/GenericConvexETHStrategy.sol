// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {BaseStrategy, IERC20, ILendPoolAddressesProvider, IStrategy, IUToken} from "./BaseStrategy.sol";
import {IConvex} from "../../interfaces/convex/IConvex.sol";
import {IConvexRewards} from "../../interfaces/convex/IConvexRewards.sol";
import {ICurve} from "../../interfaces/curve/ICurve.sol";
import {IWETH} from "../../interfaces/IWETH.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

/** @title GenericConvexETHStrategy
 * @author Unlockd
 * @notice `GenericConvexETHStrategy` is a strategy specifically designed for ETH-peggedETH pairs. It deposits
 * liquidity in a Curve pool (without staking in the Curve gauge), and then deposits the received Curve LP tokens into Convex's pool
 * to earn CVX on top of Curve's native rewards. CVX's LP tokens are then staked in the Convex pool rewards contract
 * to earn extra rewards.
 **/
contract GenericConvexETHStrategy is BaseStrategy {
  using SafeERC20 for IERC20;
  using SafeERC20 for ICurve;

  /*//////////////////////////////////////////////////////////////
                        ERRORS
  //////////////////////////////////////////////////////////////*/
  error NotEnoughFundsToInvest();
  error InvalidCoinIndex();
  error ConvexPoolShutdown();

  /*//////////////////////////////////////////////////////////////
                          EVENTS
  //////////////////////////////////////////////////////////////*/
  event Invested(address indexed strategy, uint256 indexed amountInvested);
  event Divested(address indexed strategy, uint256 indexed requestedShares, uint256 indexed amountDivested);

  /*//////////////////////////////////////////////////////////////
                          CONSTANTS
  //////////////////////////////////////////////////////////////*/

  // CRV Token
  IERC20 public constant crv = IERC20(0xD533a949740bb3306d119CC777fa900bA034cd52);
  // CVX Token
  IERC20 public constant cvx = IERC20(0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B);

  uint256 public constant MIN_SWAP = 1e18;

  /*//////////////////////////////////////////////////////////////
                          STORAGE
  //////////////////////////////////////////////////////////////*/

  // Convex
  IConvex public convexBooster; // Main Convex deposit contract for LP tokens.
  uint256 public pid; // The convex pool identifier
  IConvexRewards public convexRewardPool; // Main convex reward contract for all Convex LP pools.
  IERC20 public convexLpToken; // Main reward token for `convexRewardPool`
  IERC20 public rewardToken; // Main reward token for `convexRewardPool`

  // Curve
  ICurve public curvePool; // Main Curve pool for this Strategy
  ICurve public crvWethPool; // CRV-WETH pool in Curve
  ICurve public cvxWethPool; // CVX-WETH pool in Curve

  uint256 public maxSingleTrade;

  IUniswapV2Router02 public router; // Router of preference to swap extra reward tokens

  /*//////////////////////////////////////////////////////////////
                          PROXY INIT LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param _provider The address of the LendPoolAddressesProvider
   * @param _uToken The uToken governing this strategy
   * @param _keepers The addresses of the keepers to be added as valid keepers to the strategy.

   **/
  function initialize(
    ILendPoolAddressesProvider _provider,
    IUToken _uToken,
    address[] calldata _keepers,
    bytes32 _strategyName,
    IConvex _convexBooster,
    uint256 _pid,
    ICurve _curvePool,
    ICurve _crvWethPool,
    ICurve _cvxWethPool,
    IUniswapV2Router02 _router
  ) public initializer {
    if (
      address(_convexBooster) == address(0) ||
      address(_curvePool) == address(0) ||
      address(_crvWethPool) == address(0) ||
      address(_cvxWethPool) == address(0) ||
      address(_router) == address(0)
    ) _revert(InvalidZeroAddress.selector);

    __BaseStrategy_init(_provider, _uToken, _keepers, _strategyName);

    // Convex Init
    convexBooster = _convexBooster;
    pid = _pid;

    (, address _token, , address _crvRewards, , bool _shutdown) = _convexBooster.poolInfo(_pid);

    if (_shutdown) _revert(ConvexPoolShutdown.selector);

    convexRewardPool = IConvexRewards(_crvRewards);
    convexLpToken = IERC20(_token);
    rewardToken = IERC20(convexRewardPool.rewardToken());

    // Curve init
    curvePool = _curvePool;

    // In Curve's ETH-peggedETH pairs, N_TOKENS index 0 should always be ETH. Make sure this is true.
    if (_curvePool.coins(0) != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) _revert(InvalidCoinIndex.selector);

    crvWethPool = _crvWethPool;
    cvxWethPool = _cvxWethPool;

    // Approve pools
    curvePool.safeApprove(address(convexBooster), type(uint256).max);
    crv.safeApprove(address(_crvWethPool), type(uint256).max);
    cvx.safeApprove(address(_cvxWethPool), type(uint256).max);
    IERC20(_curvePool.coins(1)).safeApprove(address(_curvePool), type(uint256).max);

    router = _router;

    maxSingleTrade = 1_000 * 1e18;
  }

  /*//////////////////////////////////////////////////////////////
                      INVEST LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Invests current Strategy underlying token balance into Convex
   * @dev Performs a direct investment rather than the usual `harvest`
   **/
  function invest(uint256 amount) external onlyPoolAdmin {
    _invest(amount);
  }

  /*//////////////////////////////////////////////////////////////
                         SETTERS
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Sets the maximum single trade amount allowed
   * @param _maxSingleTrade The new maximum single trade value
   */
  function setMaxSingleTrade(uint256 _maxSingleTrade) external onlyPoolAdmin {
    if (_maxSingleTrade == 0) _revert(InvalidZeroAmount.selector);
    maxSingleTrade = _maxSingleTrade;
  }

  /**
   * @notice Sets the new preferred router address
   * @param _router The new router
   */
  function setRouter(address _router) external onlyPoolAdmin {
    if (_router == address(0)) _revert(InvalidZeroAddress.selector);
    router = IUniswapV2Router02(_router);
  }

  /*//////////////////////////////////////////////////////////////
                      CORE LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Harvests the Strategy, recognizing any profits or losses and adjusting
   *  the Strategy's position.
   *  In the rare case the Strategy is in emergency shutdown, this will exit
   *  the Strategy's position.
   * @dev When `harvest()` is called, the Strategy reports to the UToken (via
   *  `UToken.report()`), so in some cases `harvest()` must be called in order
   *  to take in profits, to borrow newly available funds from the UToken, or
   *  otherwise adjust its position. In other cases `harvest()` must be
   *  called to report to the UToken on the Strategy's position, especially if
   *  any losses have occurred.
   */
  function harvest() external override onlyKeepers {
    uint256 profit;
    uint256 loss;
    uint256 debtPayment;
    uint256 debtOutstanding = uToken.debtOutstanding(address(this));

    if (emergencyExit) {
      // Free up as much capital as possible
      uint256 amountFreed = _liquidateAllPositions();
      if (amountFreed < debtOutstanding) {
        loss = debtOutstanding - amountFreed;
      } else if (amountFreed > debtOutstanding) {
        profit = amountFreed - debtOutstanding;
      }
      debtPayment = debtOutstanding - loss;
    } else {
      // Free up returns for UToken to pull
      (profit, loss, debtPayment) = _prepareReturn(debtOutstanding);
    }

    // Allow UToken to take up to the "harvested" balance of this contract,
    // which is the amount it has earned since the last time it reported to
    // the UToken.
    debtOutstanding = uToken.report(profit, loss, debtPayment);

    // Check if free returns are left, and re-invest them
    _adjustPosition(debtOutstanding);

    emit Harvested(profit, loss, debtPayment, debtOutstanding);
  }

  /*//////////////////////////////////////////////////////////////
                        VIEW
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Provide an accurate estimate for the total amount of assets
   *  (principle + return) that this Strategy is currently managing,
   *  denominated in terms of `underlyingAsset` tokens.
   *
   *  This total should be "realizable" e.g. the total value that could
   *  actually be obtained from this Strategy if it were to divest its
   *  entire position based on current on-chain conditions.
   * @dev Care must be taken in using this function, since it relies on external
   *  systems, which could be manipulated by the attacker to give an inflated
   *  (or reduced) value produced by this function, based on current on-chain
   *  conditions (e.g. this function is possible to influence through
   *  flashloan attacks, oracle manipulations, or other DeFi attack
   *  mechanisms).
   * @return The estimated total assets in this Strategy.
   */
  function estimatedTotalAssets() public view override returns (uint256) {
    return _underlyingBalance() + _lpValue(_stakedBalance());
  }

  /*//////////////////////////////////////////////////////////////
                        INTERNAL
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Invests `amount` of underlying into the Convex pool
   * @dev We don't perform any reward claim. All assets must have been
   * previously converted to `underlyingAsset`.
   * Note that because of Curve's bonus/penalty approach, we check if it is best to
   * add liquidity with native ETH or with pegged ETH. It is then expected to always receive
   * at least `amount` if we perform an exchange from ETH to pegged ETH.
   * @param amount The amount of underlying to be deposited in the pool
   * @return The amount of tokens received, in terms of underlying
   */
  function _invest(uint256 amount) internal returns (uint256) {
    // Don't do anything if amount to invest is 0
    if (amount == 0) return 0;

    uint256 underlyingBalance = _underlyingBalance();
    if (amount > underlyingBalance) _revert(NotEnoughFundsToInvest.selector);

    // Invested amount will be a maximum of `maxSingleTrade`
    amount = Math.min(maxSingleTrade, amount);

    ICurve curve = curvePool;
    (uint256 ethBalance, uint256 peggedEthBalance) = curvePool.get_balances();

    // Unwrap WETH to interact with Curve
    IWETH(address(underlyingAsset)).withdraw(amount);

    uint256 lpReceived;

    if (ethBalance >= peggedEthBalance) {
      // Add pegged ETH as liquidity to Curve pool
      // Swap ETH for pegged ETH asset.
      uint256 peggedReceivedAmount = curve.exchange{value: amount}(0, 1, amount, 0);

      lpReceived = curve.add_liquidity([0, peggedReceivedAmount], 0);
    } else {
      // Add ETH as liquidity to Curve pool
      // Curve deposit could return less LP amount due to slippage. Make sure we manage it.
      lpReceived = curve.add_liquidity{value: amount}([amount, 0], 0);
    }

    // Deposit Curve LP into Convex pool with id `pid` and immediately stake convex LP tokens into the rewards contract
    convexBooster.deposit(pid, lpReceived, true);

    emit Invested(msg.sender, amount);

    return _lpValue(lpReceived);
  }

  /**
   * @notice Divests amount `amount` from the Convex pool
   * Note that divesting from the pool could potentially cause loss, so the divested amount might actually be different from
   * the requested `amount` to divest
   * @dev care should be taken, as the `amount` parameter is not in terms of underlying,
   * but in terms of Curve's LP tokens
   * Note that if minimum withdrawal amount is not reached, funds will not be divested, and this
   * will be accounted as a loss later.
   * @return the total amount divested, in terms of underlying asset
   **/
  function _divest(uint256 amount) internal returns (uint256) {
    // Withdraw from Convex and unwrap directly to Curve LP tokens
    convexRewardPool.withdrawAndUnwrap(amount, false);

    uint256 amountWithdrawn = curvePool.remove_liquidity_one_coin(amount, 0, 0);

    IWETH(address(underlyingAsset)).deposit{value: amountWithdrawn}();

    return amountWithdrawn;
  }

  /**
   * @notice Claims rewards, converting them to `underlyingAsset`.
   * @dev All CRV, CVX and extra token rewards are claimed.
   **/
  function _unwindRewards() internal {
    // Claim rewards in CRV, CVX and extra rewards.
    IConvexRewards rewardPool = convexRewardPool;
    rewardPool.getReward(address(this), true);

    // Exchange CRV <> WETH
    uint256 crvBalance = _crvBalance();
    if (crvBalance > MIN_SWAP) {
      crvWethPool.exchange(1, 0, crvBalance, 0, false);
    }

    // Exchange CVX <> WETH
    uint256 cvxBalance = _cvxBalance();
    if (cvxBalance > MIN_SWAP) {
      cvxWethPool.exchange(1, 0, cvxBalance, 0, false);
    }

    // Check if reward pools has extra rewards. If so, swap rewards for WETH
    uint256 extraRewardsLength = rewardPool.extraRewardsLength();

    for (uint256 i; i < extraRewardsLength; ) {
      IConvexRewards extraReward = IConvexRewards(rewardPool.extraRewards(i));
      IERC20 extraRewardToken = IERC20(extraReward.rewardToken());

      // Swap if reward token is neither CRV nor CVX
      if (address(extraRewardToken) != address(crv) && address(extraRewardToken) != address(cvx)) {
        address[] memory path = new address[](2);
        path[0] = address(extraRewardToken);
        path[1] = address(underlyingAsset);
        uint256 balanceToSwap = extraRewardToken.balanceOf(address(this));
        if (extraRewardToken.allowance(address(this), address(router)) < balanceToSwap) {
          underlyingAsset.safeApprove(address(router), 0);
          underlyingAsset.safeApprove(address(router), type(uint256).max);
        }
        if (balanceToSwap > MIN_SWAP) {
          router.swapExactTokensForTokens(balanceToSwap, 0, path, address(this), block.timestamp);
        }
      }

      unchecked {
        ++i;
      }
    }
  }

  /*
   * @notice Performs any adjustments to the core position(s) of this Strategy given
   * what change the UToken made in the "investable capital" available to the
   * Strategy.
   * @dev Note that all "free capital" (capital not invested) in the Strategy after the report
   * was made is available for reinvestment. This number could be 0, and this scenario should be handled accordingly.
   * Also note that other implementations might use the debtOutstanding param, but not this one.
   */
  function _adjustPosition(uint256) internal override {
    uint256 toInvest = _underlyingBalance();
    if (toInvest > 0) {
      _invest(toInvest);
    }
  }

  /**
   * @notice Liquidate up to `amountNeeded` of UToken's `underlyingAsset` of this strategy's positions,
   * irregardless of slippage. Any excess will be re-invested with `_adjustPosition()`.
   * @dev This function should return the amount of UToken's `underlyingAsset` tokens made available by the
   * liquidation. If there is a difference between `amountNeeded` and `liquidatedAmount`, `loss` indicates whether the
   * difference is due to a realized loss, or if there is some other sitution at play
   * (e.g. locked funds) where the amount made available is less than what is needed.
   *
   * NOTE: The invariant `liquidatedAmount + loss <= amountNeeded` should always be maintained
   * @param amountNeeded amount of UToken's `underlyingAsset` needed to be liquidated
   * @return liquidatedAmount the actual liquidated amount
   * @return loss difference between the expected amount needed to reach `amountNeeded` and the actual liquidated amount
   */
  function _liquidatePosition(uint256 amountNeeded) internal override returns (uint256 liquidatedAmount, uint256 loss) {
    uint256 underlyingBalance = _underlyingBalance();
    // If underlying balance currently held by strategy is not enough to cover
    // the requested amount, we divest from the Yearn Vault
    if (underlyingBalance < amountNeeded) {
      uint256 amountToWithdraw;
      unchecked {
        amountToWithdraw = amountNeeded - underlyingBalance;
      }
      uint256 lp = _lpForAmount(amountToWithdraw);
      uint256 withdrawn = _divest(lp);
      if (withdrawn < amountToWithdraw) {
        unchecked {
          loss = amountToWithdraw - withdrawn;
        }
      }
    }
    liquidatedAmount = amountNeeded - loss;
  }

  /**
   * @notice Liquidates everything and returns the amount that got freed.
   * @dev This function is used during emergency exit instead of `_prepareReturn()` to
   * liquidate all of the Strategy's positions back to the UToken.
   */
  function _liquidateAllPositions() internal override returns (uint256 amountFreed) {
    _unwindRewards();
    _divest(_stakedBalance());
    amountFreed = _underlyingBalance();
  }

  /**
   * Perform any Strategy unwinding or other calls necessary to capture the
   * "free return" this Strategy has generated since the last time its core
   * position(s) were adjusted. Examples include unwrapping extra rewards.
   * This call is only used during "normal operation" of a Strategy, and
   * should be optimized to minimize losses as much as possible.
   *
   * This method returns any realized profits and/or realized losses
   * incurred, and should return the total amounts of profits/losses/debt
   * payments (in UToken's `underlyingAsset` tokens) for the UToken's accounting (e.g.
   * `_underlyingBalance() >= debtPayment + profit`).
   *
   * `debtOutstanding` will be 0 if the Strategy is not past the configured
   * debt limit, otherwise its value will be how far past the debt limit
   * the Strategy is. The Strategy's debt limit is configured in the UToken.
   *
   * NOTE: `debtPayment` should be less than or equal to `debtOutstanding`.
   *       It is okay for it to be less than `debtOutstanding`, as that
   *       should only be used as a guide for how much is left to pay back.
   *       Payments should be made to minimize loss from slippage, debt,
   *       withdrawal fees, etc.
   *
   * See `UToken.debtOutstanding()`.
   */
  function _prepareReturn(
    uint256 debtOutstanding
  ) internal override returns (uint256 profit, uint256 loss, uint256 debtPayment) {
    _unwindRewards();

    uint256 underlyingBalance = _underlyingBalance();
    // not considering `_earnedRewards` to compute `totalAssets` as they have already been realized
    uint256 totalAssets = underlyingBalance + _lpValue(_stakedBalance());

    uint256 debt = uToken.getStrategy(address(this)).totalDebt;
    if (totalAssets > debt) {
      // Strategy has obtained profit
      unchecked {
        profit = totalAssets - debt;
      }
      uint256 amountToWithdraw = profit + debtOutstanding;
      // Check if underlying funds held in the strategy are enough to cover withdrawal.
      // If not, divest from Convex
      if (amountToWithdraw > underlyingBalance) {
        uint256 expectedAmountToWithdraw = Math.min(maxSingleTrade, amountToWithdraw - underlyingBalance);
        uint256 lpToWithdraw = _lpForAmount(expectedAmountToWithdraw);
        uint256 withdrawn = _divest(lpToWithdraw);
        // Account for loss occured on withdrawal from yearn
        if (withdrawn < expectedAmountToWithdraw) {
          unchecked {
            loss = expectedAmountToWithdraw - withdrawn;
          }
        }
        // Overwrite underlyingBalance with the proper amount after withdrawing
        underlyingBalance = _underlyingBalance();
      }

      // Net off profit and loss
      if (profit >= loss) {
        unchecked {
          profit -= loss;
          loss = 0;
        }
      } else {
        unchecked {
          loss -= profit;
          profit = 0;
        }
      }

      // `profit` + `debtOutstanding` must be <= `underlyingBalance`. Prioritise profit first
      if (profit > underlyingBalance) {
        // Profit is prioritised. In this case, no `debtPayment` will be reported
        profit = underlyingBalance;
      } else if (amountToWithdraw > underlyingBalance) {
        // same as `profit` + `debtOutstanding` > `underlyingBalance`
        // Keep profit amount and reduce the expected debtPayment from `debtOutstanding` to the following substraction
        debtPayment = underlyingBalance - profit;
      } else {
        debtPayment = debtOutstanding;
      }
    } else {
      // Strategy has incurred loss
      unchecked {
        loss = debt - totalAssets;
      }
    }
  }

  function stakedBalance() external view returns (uint256) {
    return _stakedBalance();
  }

  /*//////////////////////////////////////////////////////////////
                      INTERNAL VIEW
  //////////////////////////////////////////////////////////////*/

  function _cvxBalance() internal view returns (uint256) {
    return cvx.balanceOf(address(this));
  }

  function _crvBalance() internal view returns (uint256) {
    return crv.balanceOf(address(this));
  }

  function _stakedBalance() internal view returns (uint256) {
    return convexRewardPool.balanceOf(address(this));
  }

  function _earnedRewards() internal view returns (uint256) {
    return convexRewardPool.earned(address(this));
  }

  /**
   * @notice Determines how many lp tokens depositor of `amount` of underlying would receive.
   * @dev Some loss of precision is occured, but it is not critical as this is only an underestimation of
   * the actual assets, and profit will be later accounted for.
   * @return returns the estimated amount of lp tokens computed in exchange for underlying `amount`
   */
  function _lpValue(uint256 lp) internal view returns (uint256) {
    return (lp * curvePool.get_virtual_price()) / 1e18;
  }

  /**
   * @notice Determines how many lp tokens depositor of `amount` of underlying would receive.
   * @return returns the estimated amount of lp tokens computed in exchange for underlying `amount`
   */
  function _lpForAmount(uint256 amount) internal view returns (uint256) {
    return (amount * 1e18) / curvePool.get_virtual_price();
  }

  //solhint-disable no-empty-blocks
  receive() external payable {}
}
