// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {BaseStrategy, IERC20, ILendPoolAddressesProvider, IStrategy, IUToken} from "../BaseStrategy.sol";
import {IReserveOracleGetter} from "../../../interfaces/IReserveOracleGetter.sol";
import {IConvex} from "../../../interfaces/convex/IConvex.sol";
import {IConvexRewards} from "../../../interfaces/convex/IConvexRewards.sol";
import {ICurve} from "../../../interfaces/curve/ICurve.sol";
import {IWETH} from "../../../interfaces/IWETH.sol";

/** @title GenericConvexETHStrategy
 * @author Unlockd
 * @notice `GenericConvexETHStrategy` deposits liquidity in a Curve pool (without staking
 in the Curve gauge), and then stakes the received LP tokens into Convex's pool
 * to earn CVX on top of Curve's native rewards. CVX's rewards are staked in Convex to get
 * extra rewards.
 **/
contract GenericConvexETHStrategy is BaseStrategy {
  using SafeERC20 for IERC20;
  using SafeERC20 for ICurve;

  /*//////////////////////////////////////////////////////////////
                        ERRORS
  //////////////////////////////////////////////////////////////*/
  error NotEnoughFundsToInvest();
  error InvalidSlippageTolerance();
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

  uint256 public constant MAX_BPS = 10_000; // 100% [BPS]

  /*//////////////////////////////////////////////////////////////
                          STORAGE
  //////////////////////////////////////////////////////////////*/

  // Convex
  IConvex public convexBooster; // Main Convex deposit contract for LP tokens.
  uint256 public pid; // The convex pool identifier
  IConvexRewards public convexMainRewardPool; // Main convex reward contract for all Convex LP pools.
  IERC20 public convexLpToken; // Main reward token for `convexRewardPool`
  IERC20 public rewardToken; // Main reward token for `convexRewardPool`

  // Curve
  ICurve public curvePool; // Main Curve pool for this Strategy
  ICurve public crvEthPool; // CRV-ETH pool in Curve
  ICurve public cvxEthPool; // CVX-ETH pool in Curve

  IReserveOracleGetter public reserveOracle;

  uint256 public maxSingleTrade;

  uint256 public slippageTolerance; // BPS

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
    IReserveOracleGetter _reserveOracle,
    IConvex _convexBooster,
    uint256 _pid,
    ICurve _curvePool,
    ICurve _crvEthPool,
    ICurve _cvxEthPool
  ) public initializer {
    if (
      address(_reserveOracle) == address(0) ||
      address(_convexBooster) == address(0) ||
      address(_curvePool) == address(0) ||
      address(_crvEthPool) == address(0) ||
      address(_cvxEthPool) == address(0)
    ) _revert(InvalidZeroAddress.selector);

    __BaseStrategy_init(_provider, _uToken, _keepers, _strategyName);

    reserveOracle = _reserveOracle;

    // Convex Init
    convexBooster = _convexBooster;
    pid = _pid;

    (, address _token, , address _crvRewards, , bool _shutdown) = _convexBooster.poolInfo(_pid);

    if (_shutdown) _revert(ConvexPoolShutdown.selector);

    convexMainRewardPool = IConvexRewards(_crvRewards);
    convexLpToken = IERC20(_token);
    rewardToken = IERC20(convexMainRewardPool.rewardToken());

    // Curve init
    curvePool = _curvePool;

    // In Curve's ETH-peggedETH pairs, N_TOKENS index 0 should always be ETH. Make sure this is true.
    if (_curvePool.coins(0) != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) _revert(InvalidCoinIndex.selector);

    crvEthPool = _crvEthPool;
    cvxEthPool = _cvxEthPool;

    // Approve pools
    curvePool.safeApprove(address(convexBooster), type(uint256).max);
    crv.safeApprove(address(crvEthPool), type(uint256).max);
    curvePool.safeApprove(address(cvxEthPool), type(uint256).max);

    maxSingleTrade = 1_000 * 1e18;
    slippageTolerance = 30; // 0.3%
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
   * @notice Sets the new slippage tolerance percentage
   * @param _slippageTolerance The new slippage tolerance percentage
   */
  function setSlippageTolerance(uint256 _slippageTolerance) external onlyPoolAdmin {
    if (_slippageTolerance == 0) _revert(InvalidZeroAmount.selector);
    if (_slippageTolerance > MAX_BPS) _revert(InvalidSlippageTolerance.selector);
    slippageTolerance = _slippageTolerance;
  }

  function harvest() external override onlyKeepers {}

  /*//////////////////////////////////////////////////////////////
                        VIEW
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Provide an accurate estimate for the total amount of assets
   *  (principle + return) that this Strategy is currently managing,
   *  denominated in terms of `underlyingAsset` tokens.
   *
   *  This total should be "realizable" e.g. the total value that could
   *  *actually* be obtained from this Strategy if it were to divest its
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
    IReserveOracleGetter oracle = reserveOracle;

    uint256 cvxToEthPrice = oracle.getAssetPrice(address(cvx));
    return _underlyingBalance(); //todo  + balanceOf(CRV) + balanceOf(CVX)
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

    uint256 lpAmount = _lpForAmount(amount);

    uint256 lpReceived;
    if (ethBalance >= peggedEthBalance) {
      // Add ETH as liquidity to Curve pool
      // It is compulsory to unwrap WETH and deposit as ETH to the pool
      IWETH(address(underlyingAsset)).withdraw(amount);

      // Curve deposit could return less LP amount due to slippage. Make sure we manage it.
      lpReceived = curve.add_liquidity{value: amount}([amount, 0], _computeMinExpectedAmount(lpAmount));
    } else {
      // Add pegged ETH as liquidity to Curve pool
      // Swap ETH for pegged ETH asset.
      uint256 peggedReceivedAmount = curve.exchange(0, 1, amount, amount);

      lpReceived = curve.add_liquidity([0, peggedReceivedAmount], _computeMinExpectedAmount(peggedReceivedAmount));
    }

    // Deposit Curve LP into Convex pool with id `pid` and immediately stake convex LP tokens into the rewards contract
    convexBooster.deposit(pid, lpReceived, true);

    emit Invested(msg.sender, amount);

    return _lpForAmount(lpReceived);
  }

  /**
   * @notice Divests amount `shares` from the Convex pool
   * Note that divesting from the pool could potentially cause loss, so the divested amount might actually be different from
   * the requested `shares` to divest
   * @return the total amount divested, in terms of underlying
   **/
  function _divest(uint256 shares) internal returns (uint256) {
    //todo
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
    //todo
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
    //todo
  }

  /**
   * @notice Liquidates everything and returns the amount that got freed.
   * @dev This function is used during emergency exit instead of `_prepareReturn()` to
   * liquidate all of the Strategy's positions back to the UToken.
   */
  function _liquidateAllPositions() internal override returns (uint256 amountFreed) {
    //todo
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
    //todo
  }

  /**
   * @notice Transfer current pool rewards to new strategy
   * @param newStrategy the new strategy to migrate to
   */
  function _prepareMigration(address newStrategy) internal override {
    //todo
  }

  /*//////////////////////////////////////////////////////////////
                      INTERNAL VIEW
  //////////////////////////////////////////////////////////////*/

  function _cvxBalanceInUnderlying() internal view returns (uint256) {
    //uint256 crvToEthPrice = oracle.getAssetPrice(address(crv));
  }

  /**
   * @notice Determines how many lp tokens depositor of `amount` of underlying would receive.
   * @return returns the estimated amount of lp tokens computed in exchange for underlying `amount`
   */
  function _lpForAmount(uint256 amount) internal view returns (uint256) {
    return amount * curvePool.get_virtual_price();
  }

  function _computeMinExpectedAmount(uint256 amount) internal view returns (uint256) {
    return (amount * (MAX_BPS - slippageTolerance)) / MAX_BPS;
  }

  receive() external payable {}
}
