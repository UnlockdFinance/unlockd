// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPoolConfigurator} from "../interfaces/ILendPoolConfigurator.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {IUToken} from "../interfaces/IUToken.sol";
import {IYVault} from "../interfaces/yearn/IYVault.sol";
import {IIncentivesController} from "../interfaces/IIncentivesController.sol";
import {IStrategy} from "../interfaces/strategies/IStrategy.sol";

import {IncentivizedERC20} from "./IncentivizedERC20.sol";

import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {LendingLogic} from "../libraries/logic/LendingLogic.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title ERC20 UToken
 * @dev Implementation of the interest bearing token for the Unlockd protocol
 * @author Unlockd
 */
contract UToken is Initializable, IUToken, IncentivizedERC20 {
  using WadRayMath for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /*//////////////////////////////////////////////////////////////
                    STATE VARIABLES
  //////////////////////////////////////////////////////////////*/
  ILendPoolAddressesProvider internal _addressProvider;
  address internal _treasury;
  address internal _underlyingAsset;
  mapping(address => bool) internal _uTokenManagers;

  uint256 public constant MAXIMUM_STRATEGIES = 20;
  uint256 public constant MAX_BPS = 10_000;
  uint256 public constant DEGRADATION_COEFFICIENT = 10 ** 18;
  // Strategies
  mapping(address => StrategyParams) public strategies;
  address[MAXIMUM_STRATEGIES] public withdrawalQueue;

  // Limit for totalAssets the UToken can hold
  uint256 public depositLimit;
  // Debt ratio for the UToken across all strategies (in BPS, <= 10k)
  uint256 public debtRatio;
  // Amount of `_underlyingAsset` that all strategies have borrowed
  uint256 public totalDebt;
  // block.timestamp of last report
  uint256 public lastReport;
  // Max tolerated loss on withdrawal (in BPS)
  uint256 public maxLossOnWithdrawal;
  // Emergency Shutdown
  bool public emergencyShutdown;

  /*//////////////////////////////////////////////////////////////
                      MODIFIERS
  //////////////////////////////////////////////////////////////*/

  modifier onlyLendPool() {
    require(_msgSender() == address(_getLendPool()), Errors.CT_CALLER_MUST_BE_LEND_POOL);
    _;
  }

  modifier onlyPoolAdmin() {
    require(_msgSender() == _addressProvider.getPoolAdmin(), Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }

  modifier onlyUTokenManager() {
    require(_uTokenManagers[_msgSender()], Errors.CALLER_NOT_UTOKEN_MANAGER);
    _;
  }

  modifier onlyStrategy() {
    require(strategies[_msgSender()].active, Errors.CALLER_NOT_STRATEGY);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                        INITIALIZATION
  //////////////////////////////////////////////////////////////*/
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  /**
   * @dev Initializes the uToken
   * @param addressProvider The address of the address provider where this uToken will be used
   * @param treasury The address of the Unlockd treasury, receiving the fees on this uToken
   * @param underlyingAsset The address of the underlying asset of this uToken
   */
  function initialize(
    ILendPoolAddressesProvider addressProvider,
    address treasury,
    address underlyingAsset,
    uint8 uTokenDecimals,
    string calldata uTokenName,
    string calldata uTokenSymbol
  ) external override initializer {
    __IncentivizedERC20_init(uTokenName, uTokenSymbol, uTokenDecimals);

    _treasury = treasury;
    _underlyingAsset = underlyingAsset;

    _addressProvider = addressProvider;

    maxLossOnWithdrawal = 10; // initially set to 0.1%
    emit Initialized(
      underlyingAsset,
      _addressProvider.getLendPool(),
      treasury,
      _addressProvider.getIncentivesController()
    );
  }

  /*//////////////////////////////////////////////////////////////
                    MINT/BURN LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Burns uTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`
   * - Only callable by the LendPool, as extra state updates there need to be managed
   * @param user The owner of the uTokens, getting them burned
   * @param receiverOfUnderlying The address that will receive the underlying
   * @param amountToBurn The amount being burned
   * @param amountToTransfer The amount to transfer to user
   * @param index The new liquidity index of the reserve
   **/
  function burn(
    address user,
    address receiverOfUnderlying,
    uint256 amountToBurn,
    uint256 amountToTransfer,
    uint256 index
  ) external override onlyLendPool {
    uint256 amountScaled = amountToBurn.rayDiv(index);

    require(amountScaled != 0, Errors.CT_INVALID_BURN_AMOUNT);
    _burn(user, amountScaled);

    IERC20Upgradeable(_underlyingAsset).safeTransfer(receiverOfUnderlying, amountToTransfer);

    emit Burn(user, receiverOfUnderlying, amountToBurn, index);
  }

  /**
   * @dev Mints `amount` uTokens to `user`
   * - Only callable by the LendPool, as extra state updates there need to be managed
   * @param user The address receiving the minted tokens
   * @param amount The amount of tokens getting minted
   * @param index The new liquidity index of the reserve
   * @return `true` if the the previous balance of the user was 0
   */
  function mint(address user, uint256 amount, uint256 index) external override onlyLendPool returns (bool) {
    uint256 previousBalance = super.balanceOf(user);

    // index is expressed in Ray, so:
    // amount.wadToRay().rayDiv(index).rayToWad() => amount.rayDiv(index)
    uint256 amountScaled = amount.rayDiv(index);
    require(amountScaled != 0, Errors.CT_INVALID_MINT_AMOUNT);
    _mint(user, amountScaled);

    emit Mint(user, amount, index);

    return previousBalance == 0;
  }

  /**
   * @dev Mints uTokens to the reserve treasury
   * - Only callable by the LendPool
   * @param amount The amount of tokens getting minted
   * @param index The new liquidity index of the reserve
   */
  function mintToTreasury(uint256 amount, uint256 index) external override onlyLendPool {
    if (amount == 0) {
      return;
    }

    address treasury = _treasury;

    // Compared to the normal mint, we don't check for rounding errors.
    // The amount to mint can easily be very small since it is a fraction of the interest ccrued.
    // In that case, the treasury will experience a (very small) loss, but it
    // wont cause potentially valid transactions to fail.
    _mint(treasury, amount.rayDiv(index));

    emit Transfer(address(0), treasury, amount);
    emit Mint(treasury, amount, index);
  }

  /*//////////////////////////////////////////////////////////////
                        MIGRATION 
  //////////////////////////////////////////////////////////////*/
  function migrateFunds(uint256 shareAmount) external onlyPoolAdmin {
    address yVaultWETH = _addressProvider.getAddress(keccak256("YVAULT_WETH"));
    IYVault(yVaultWETH).withdraw(shareAmount);
  }

  /*//////////////////////////////////////////////////////////////
                    STRATEGIES LOGIC
  //////////////////////////////////////////////////////////////*/

  /**
   *  @notice Reports the amount of assets the calling Strategy has free (usually in
   *  terms of ROI).
   *  This may only be called by a Strategy managed by this UToken.
   *  @dev For approved strategies, this is the most efficient behavior.
   *  The Strategy reports back what it has free, then UToken "decides"
   *  whether to take some back or give it more. Note that the most it can
   *  take is `gain + _debtPayment`, and the most it can give is all of the
   *  remaining reserves. It is important to stress that anything outside of those
   *  bounds is abnormal behavior.
   *  All approved strategies must have increased diligence around
   *  calling this function, as abnormal behavior could become catastrophic.
   *  @param gain Amount Strategy has realized as a gain on its investment since its
   *   last report, and is free to be given back to UToken as earnings
   *  @param loss Amount Strategy has realized as a loss on its investment since its
   *  last report, and should be accounted for on the UToken's balance sheet.
   *  The loss will reduce the debtRatio. The next time the strategy will harvest,
   *  it will pay back the debt in an attempt to adjust to the new debt limit.
   *  @param _debtPayment Amount Strategy has made available to cover outstanding debt
   *  @return Amount of debt outstanding (if totalDebt > debtLimit or emergency shutdown).
   */
  function report(uint256 gain, uint256 loss, uint256 _debtPayment) external override onlyStrategy returns (uint256) {
    // Validate that strategy's balance is actually bigger than the gains reported + the amount reported to cover outstanding debt
    if (IERC20Upgradeable(_underlyingAsset).balanceOf(msg.sender) < gain + _debtPayment)
      revert InvalidGainAndDebtPayment();

    if (loss != 0) _reportLoss(msg.sender, loss);

    // Compute the available credit for the current Strategy (if any)
    uint256 availableCredit = _computeAvailableCredit(msg.sender);

    // Increase strategy's total gain by the current report realized gains
    strategies[msg.sender].totalGain += gain;

    // Report takes up to the outstanding debt if the current debt payment exceeds it
    uint256 strategyDebt = _debtOutstanding(msg.sender);

    uint256 debtPayment = Math.min(strategyDebt, _debtPayment);

    // Adjust debts debt considering the current report's debt payment
    if (debtPayment != 0) {
      strategies[msg.sender].totalDebt -= debtPayment;
      totalDebt -= debtPayment;
      strategyDebt -= debtPayment;
    }
    // Update the actual debt based on the full credit we are extending to the Strategy
    // NOTE: `availableCredit` + `strategies[msg.sender].totalDebt` is always < `debtLimit`
    // NOTE: At least one of `availableCredit` or `strategyDebt` is always 0 (both can be 0)
    if (availableCredit != 0) {
      strategies[msg.sender].totalDebt += availableCredit;
      totalDebt += availableCredit;
    }

    // Give/take balance to Strategy, based on the difference between the reported gains
    // (if any), the debt payment (if any), the credit increase we are offering (if any),
    // and the debt needed to be paid off (if any)
    // NOTE: This is just used to adjust the balance of tokens between the Strategy and
    // the UToken based on the Strategy's debt limit (as well as the UToken's).
    uint256 totalAvailableFromStrategy = gain + debtPayment;
    if (availableCredit > totalAvailableFromStrategy) {
      // Credit surplus, give to Strategy
      IERC20Upgradeable(_underlyingAsset).safeTransfer(msg.sender, availableCredit - totalAvailableFromStrategy);
    } else if (totalAvailableFromStrategy > availableCredit) {
      // Credit deficit, take from Strategy
      IERC20Upgradeable(_underlyingAsset).safeTransferFrom(
        msg.sender,
        address(this),
        totalAvailableFromStrategy - availableCredit
      );
      // else don't do anything (it is balanced)
    }

    // Update reporting time
    strategies[msg.sender].lastReport = block.timestamp;
    lastReport = block.timestamp;

    emit StrategyReported(
      msg.sender,
      gain,
      loss,
      debtPayment,
      strategies[msg.sender].totalGain,
      strategies[msg.sender].totalLoss,
      strategies[msg.sender].totalDebt,
      availableCredit,
      strategies[msg.sender].debtRatio
    );

    if (strategies[msg.sender].debtRatio == 0 || emergencyShutdown) return IStrategy(msg.sender).estimatedTotalAssets();

    return strategyDebt;
  }

  /**
    @notice Withdraws the calling account's underlying tokens from this UToken, redeeming
    amount `amount` of underlying.
    See note on `setWithdrawalQueue` for further details of withdrawal
    ordering and behavior.
    @dev Always make sure to call this function if `amount` is greater than the UToken's underlying balance
  */
  function withdrawReserves(uint256 amount) external override onlyLendPool returns (uint256) {
    // UToken balance is not enough to cover withdrawal. Withdrawing from strategies is required
    if (amount > IERC20Upgradeable(_underlyingAsset).balanceOf(address(this))) {
      uint256 len = withdrawalQueue.length;
      uint256 totalLoss;
      for (uint256 i; i < len; ) {
        address strategy = withdrawalQueue[i];

        // We reached the queue limit
        if (strategy == address(0)) break;

        uint256 initialBalanceOfUnderlying = IERC20Upgradeable(_underlyingAsset).balanceOf(address(this));
        // We can finish withdrawing from strategies as we have enough funds
        if (initialBalanceOfUnderlying >= amount) break;

        uint256 amountNeeded = amount - initialBalanceOfUnderlying;

        // Don't withdraw more than the amount loaned to strategy, so that
        // the strategy can keep working based on the profits it has
        // NOTE: This means the user will lose out on any profits that each
        // strategy in the queue would return on next harvest, benefiting others
        amountNeeded = Math.min(amountNeeded, strategies[strategy].totalDebt);
        if (amountNeeded == 0)
          // Nothing to withdraw from this strategy, try the next one
          continue;

        (uint256 amountWithdrawn, uint256 loss) = IStrategy(strategy).withdraw(amountNeeded);

        // Ensure the amount withdrawn returned from the strategy is the actual balance adjustement after withdrawal
        if (
          amountWithdrawn != (IERC20Upgradeable(_underlyingAsset).balanceOf(address(this)) - initialBalanceOfUnderlying)
        ) revert BalanceMismatch();

        // Withdrawer incurs any losses from the withdrawal of the strategy
        if (loss != 0) {
          amount -= loss;
          totalLoss += loss;
          _reportLoss(strategy, loss);
        }
        // Reduce the strategy's debt by the amount withdrawn
        // Note: This doesn't add to total gains as it's not earned by "normal means"
        strategies[strategy].totalDebt -= amountWithdrawn;
        totalDebt -= amountWithdrawn;

        emit WithdrawnFromStrategy(strategy, amountWithdrawn, loss);

        unchecked {
          ++i;
        }
      }
      // We have withdrawn everything possible. Check if it is enough
      if (amount < IERC20Upgradeable(_underlyingAsset).balanceOf(address(this))) revert NotEnoughLiquidity();
      // Ensure max loss has not been reached
      if (totalLoss > ((maxLossOnWithdrawal * (amount + totalLoss)) / MAX_BPS)) revert MaxLossExceeded();

      emit ReservesWithdrawn(amount);
    }

    return amount;
  }

  /**
   * @notice Determines if `strategy` is past its debt limit and if any amount of tokens
   *  should be withdrawn to the UToken.
   * @param strategy The Strategy to check.
   * @return The quantity of tokens to withdraw.
   */

  function debtOutstanding(address strategy) external view override returns (uint256) {
    return _debtOutstanding(strategy);
  }

  /*//////////////////////////////////////////////////////////////
                        SETTERS
  //////////////////////////////////////////////////////////////*/
  function updateUTokenManagers(address[] calldata managers, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = managers.length;
    for (uint256 i = 0; i < cachedLength; ) {
      require(managers[i] != address(0), Errors.INVALID_ZERO_ADDRESS);
      _uTokenManagers[managers[i]] = flag;
      unchecked {
        ++i;
      }
    }
    emit UTokenManagersUpdated(managers, flag);
  }

  /**
   * @notice Add a Strategy to the UToken.
   * @dev The Strategy will be appended to `withdrawalQueue`, call
   * `setWithdrawalQueue` to change the order.
   * @param strategy The address of the Strategy to add.
   * @param strategyDebtRatio The share of the total assets in the UToken that `strategy` has access to.
   * @param strategyMinDebtPerHarvest Lower limit on the increase of debt since last harvest
   * @param strategyMaxDebtPerHarvest Upper limit on the increase of debt since last harvest
   */
  function addStrategy(
    address strategy,
    uint256 strategyDebtRatio,
    uint256 strategyMinDebtPerHarvest,
    uint256 strategyMaxDebtPerHarvest
  ) external override onlyPoolAdmin {
    if (withdrawalQueue[MAXIMUM_STRATEGIES - 1] != address(0)) revert MaxStrategiesReached();
    if (strategy == address(0)) revert InvalidZeroAddress();
    if (address(IStrategy(strategy).getUToken()) != address(this)) revert InvalidStrategyUToken();
    if (debtRatio + strategyDebtRatio > MAX_BPS) revert InvalidDebtRatio();
    if (strategyMinDebtPerHarvest > strategyMaxDebtPerHarvest) revert InvalidHarvestAmounts();

    strategies[strategy] = StrategyParams({
      debtRatio: strategyDebtRatio,
      lastReport: block.timestamp,
      totalDebt: 0,
      totalGain: 0,
      totalLoss: 0,
      minDebtPerHarvest: strategyMinDebtPerHarvest,
      maxDebtPerHarvest: strategyMaxDebtPerHarvest,
      active: true
    });

    emit StrategyAdded(strategy, strategyDebtRatio, strategyMinDebtPerHarvest, strategyMaxDebtPerHarvest);
    debtRatio += strategyDebtRatio;
    withdrawalQueue[MAXIMUM_STRATEGIES - 1] = strategy;

    _organizeWithdrawalQueue();
  }

  /**
   * @notice Revoke a Strategy, setting its debt limit to 0 and preventing any
   * future deposits.
   * This function should only be used in the scenario where the Strategy is
   * being retired but no migration of the positions are possible, or in the
   * extreme scenario that the Strategy needs to be put into "Emergency Exit"
   * mode in order for it to exit as quickly as possible. The latter scenario
   * could be for any reason that is considered "critical" that the Strategy
   * exits its position as fast as possible, such as a sudden change in market
   * conditions leading to losses, or an imminent failure in an external
   * dependency.
    @param strategy The strategy to revoke.
   */
  function revokeStrategy(address strategy) external override onlyPoolAdmin {
    if (strategies[strategy].debtRatio == 0) revert StrategyDebtRatioAlreadyZero();
    debtRatio -= strategies[strategy].debtRatio;
    strategies[strategy].debtRatio = 0;
    strategies[strategy].active = false;
    emit StrategyRevoked(strategy);
  }

  function setDepositLimit(uint256 newDepositLimit) external override onlyPoolAdmin {
    depositLimit = newDepositLimit;
    emit DepositLimitUpdated(newDepositLimit);
  }

  /**
   * @notice Updates the `manageable` params for the strategy
   * @param strategy the strategy to update
   * @param strategyDebtRatio New quantity of assets `strategy` may manage.
   * @param strategyMinDebtPerHarvest  Lower limit on the increase of debt since last harvest
   * @param strategyMaxDebtPerHarvest  Upper limit on the increase of debt since last harvest
   */
  function updateStrategyParams(
    address strategy,
    uint256 strategyDebtRatio,
    uint256 strategyMinDebtPerHarvest,
    uint256 strategyMaxDebtPerHarvest
  ) external override onlyPoolAdmin {
    if (!strategies[strategy].active) revert InvalidStrategy();
    if (strategyMinDebtPerHarvest > strategyMaxDebtPerHarvest) revert InvalidHarvestAmounts();

    debtRatio -= strategies[strategy].debtRatio;
    strategies[strategy].debtRatio = strategyDebtRatio;
    debtRatio += strategyDebtRatio;

    if (debtRatio > MAX_BPS) revert InvalidDebtRatio();

    strategies[strategy].minDebtPerHarvest = strategyMinDebtPerHarvest;
    strategies[strategy].maxDebtPerHarvest = strategyMaxDebtPerHarvest;

    emit StrategyParamsUpdated(strategy, strategyDebtRatio, strategyMinDebtPerHarvest, strategyMaxDebtPerHarvest);
  }

  /**
   * @notice Remove `strategy` from `withdrawalQueue`.
   * @dev We don't do this with revokeStrategy because it should still be possible to
   * withdraw from the Strategy if it's unwinding.
   * @param strategy The Strategy to remove.
   */
  function removeStrategyFromQueue(address strategy) external override onlyPoolAdmin {
    for (uint256 i; i < MAXIMUM_STRATEGIES; ) {
      if (withdrawalQueue[i] == strategy) {
        withdrawalQueue[i] = address(0);
        _organizeWithdrawalQueue();
        emit StrategyRemoved(strategy);
        return;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @notice Sets the vault in emergency shutdown mode
   * @param _emergencyShutdown The new emergency shutdown value
   */
  function setEmergencyShutdown(bool _emergencyShutdown) external override onlyPoolAdmin {
    emergencyShutdown = _emergencyShutdown;
    emit EmergencyShutdownUpdated(_emergencyShutdown, block.timestamp);
  }

  /**
   * @notice Sets the maximum allowed loss value (in BPS) for withdrawals
   * @param maxLoss The new max loss value
   */
  function setMaxLoss(uint256 maxLoss) external override onlyPoolAdmin {
    if (maxLoss > MAX_BPS) revert InvalidMaxLoss();
    maxLossOnWithdrawal = maxLoss;
    emit MaxLossUpdated(maxLoss);
  }

  /*//////////////////////////////////////////////////////////////
                  INTERNAL FUNCTIONS 
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Reports the loss, adjusting debt parameters accordingly
   * @param strategy the strategy reporting the loss
   * @param loss the amount of loss to report
   */
  function _reportLoss(address strategy, uint256 loss) internal {
    // It is not possible for the strategy to lose more than the amount lent. Verify this assumption
    uint256 _totalDebt = strategies[strategy].totalDebt;

    if (loss > _totalDebt) revert LossHigherThanStrategyTotalDebt();
    // If UToken actually has deployed capital to **any** strategy, adjust the debt ratios for both the UToken
    // and the reporting strategy
    if (debtRatio != 0) {
      uint256 ratioAdjustment = Math.min((loss * debtRatio) / totalDebt, strategies[strategy].debtRatio);

      strategies[strategy].debtRatio -= ratioAdjustment;
      debtRatio -= ratioAdjustment;
    }

    // Adjust loss parameters
    strategies[strategy].totalLoss += loss;
    strategies[strategy].totalDebt = _totalDebt - loss;
    totalDebt -= loss;
  }

  /**
   * @notice Determines if `strategy` is past its debt limit and if any amount of tokens
   *  should be withdrawn to the UToken.
   * @dev see `debtOutstanding()`
   */
  function _debtOutstanding(address strategy) internal view returns (uint256) {
    uint256 strategyTotalDebt = strategies[strategy].totalDebt;
    // No amount of tokens are deployed to the Strategy. Return
    // the known Strategy's debt
    if (debtRatio == 0) return strategyTotalDebt;

    uint256 strategyDebtLimit = _computeDebtLimit(strategies[strategy].debtRatio, _totalAssets());
    if (emergencyShutdown) {
      // Strategy's total debt is returned when in emergency shutdown
      return strategyTotalDebt;
    } else if (strategyTotalDebt <= strategyDebtLimit) {
      // No debt outstanding in case the current strategy debt has not reached its debt limit
      return 0;
    }
    // Return outstanding debt in case the debt limit is reached
    return strategyTotalDebt - strategyDebtLimit;
  }

  /**
   * @notice Amount of underlying tokens from UToken a Strategy has access to as a credit line.
   * This will check the Strategy's debt limit, as well as the underlying tokens
   * available in the UToken, and determine the maximum amount of underlying
   * (if any) the Strategy may draw on.
   * @dev In the rare case the UToken is in emergency shutdown this will return 0.
   * @param strategy The Strategy to check. Defaults to caller.
   * @return The quantity of underlying tokens available for the Strategy to draw on.
   */
  function _computeAvailableCredit(address strategy) internal view returns (uint256) {
    if (emergencyShutdown) return 0;

    StrategyParams memory strat = strategies[strategy];
    uint256 uTokenTotalDebt = totalDebt;
    uint256 totalAssets = _totalAssets();
    uint256 uTokenDebtLimit = _computeDebtLimit(debtRatio, totalAssets);
    uint256 strategyDebtLimit = _computeDebtLimit(strat.debtRatio, totalAssets);

    // Check if strategy or UToken debt have exceeded their own maximum debt limit
    if (strat.totalDebt > strategyDebtLimit || uTokenTotalDebt > uTokenDebtLimit) return 0;

    uint256 availableCredit = strategyDebtLimit - strat.totalDebt;
    // Adjust by global debt limit
    availableCredit = Math.min(availableCredit, uTokenDebtLimit - uTokenTotalDebt);

    // Can only borrow up to what the contract has in reserve. It is discouraged
    // to loan up to 100% of current deposited funds
    availableCredit = Math.min(availableCredit, IERC20Upgradeable(_underlyingAsset).balanceOf(address(this)));

    // Adjust by min and max borrow limits per harvest

    // Min debt per harvest can be used to ensure that if a strategy has a minimum
    // amount of capital needed to purchase a position, it's not given capital
    // it can't make use of yet.
    if (availableCredit < strat.minDebtPerHarvest) return 0;

    // Max debt per harvest is used to make sure each harvest isn't bigger than what
    // it is authorized.
    return Math.min(availableCredit, strat.maxDebtPerHarvest);
  }

  /**
   * @notice Calculates a debt limit given an amount of assets and a debt ratio
   * @param debtRatio_ the debt ratio
   * @param totalAssets_ the total assets to use as reference to compute the limit
   */
  function _computeDebtLimit(uint256 debtRatio_, uint256 totalAssets_) internal pure returns (uint256) {
    return (totalAssets_ * debtRatio_) / MAX_BPS;
  }

  /**
   * @notice Reorganize `withdrawalQueue` based on premise that if there is an
   * empty value between two actual values, then the empty value should be
   * replaced by the later value.
   * @dev Relative ordering of non-zero values is maintained.
   */
  function _organizeWithdrawalQueue() internal {
    uint256 offset;
    for (uint256 i; i < MAXIMUM_STRATEGIES; ) {
      address strategy = withdrawalQueue[i];
      if (strategy == address(0)) {
        unchecked {
          ++offset;
        }
      } else if (offset > 0) {
        withdrawalQueue[i - offset] = strategy;
        withdrawalQueue[i] = address(0);
      }

      unchecked {
        ++i;
      }
    }
  }

  /**
  @notice Returns the total quantity of all assets under control of this
   * UToken, whether they're loaned out to a Strategy, or currently held in
   * the UToken.
   *  @return The total assets under control of this UToken.
   */
  function _totalAssets() internal view returns (uint256) {
    return IERC20Upgradeable(_underlyingAsset).balanceOf(address(this)) + totalDebt;
  }

  /**
   * @dev Calculates the balance of the user: principal balance + interest generated by the principal
   * @param user The user whose balance is calculated
   * @return The balance of the user
   **/
  function balanceOf(address user) public view override returns (uint256) {
    ILendPool pool = _getLendPool();
    return super.balanceOf(user).rayMul(pool.getReserveNormalizedIncome(_underlyingAsset));
  }

  /**
   * @dev Returns the scaled balance of the user. The scaled balance is the sum of all the
   * updated stored balance divided by the reserve's liquidity index at the moment of the update
   * @param user The user whose balance is calculated
   * @return The scaled balance of the user
   **/
  function scaledBalanceOf(address user) external view override returns (uint256) {
    return super.balanceOf(user);
  }

  /**
   * @dev Returns the scaled balance of the user and the scaled total supply.
   * @param user The address of the user
   * @return The scaled balance of the user
   * @return The scaled balance and the scaled total supply
   **/
  function getScaledUserBalanceAndSupply(address user) external view override returns (uint256, uint256) {
    return (super.balanceOf(user), super.totalSupply());
  }

  /**
   * @notice Returns the available liquidity for the UToken's reserve
   * @dev does not consider the current gains by the strategues still not realized
   * @return The available liquidity in reserve
   */
  function getAvailableLiquidity() public view override returns (uint256) {
    return _totalAssets();
  }

  /**
   * @dev Returns the params of a requested strategy
   * @return The strategy params of the requested strategy
   **/
  function getStrategy(address strategy) external view override returns (StrategyParams memory) {
    return strategies[strategy];
  }

  /**
   * @dev Returns if the requested address is actually a manager
   * @return Flag indicating if the requested address is manager
   **/
  function isManager(address manager) external view override returns (bool) {
    return _uTokenManagers[manager];
  }

  /**
   * @dev calculates the total supply of the specific uToken
   * since the balance of every single user increases over time, the total supply
   * does that too.
   * @return the current total supply
   **/
  function totalSupply() public view override returns (uint256) {
    uint256 currentSupplyScaled = super.totalSupply();

    if (currentSupplyScaled == 0) {
      return 0;
    }

    ILendPool pool = _getLendPool();
    return currentSupplyScaled.rayMul(pool.getReserveNormalizedIncome(_underlyingAsset));
  }

  /**
   * @dev Returns the scaled total supply of the variable debt token. Represents sum(debt/index)
   * @return the scaled total supply
   **/
  function scaledTotalSupply() public view virtual override returns (uint256) {
    return super.totalSupply();
  }

  /**
   * @dev Sets new treasury to the specified UToken
   * @param treasury the new treasury address
   **/
  function setTreasuryAddress(address treasury) external override onlyPoolAdmin {
    require(treasury != address(0), Errors.INVALID_ZERO_ADDRESS);
    _treasury = treasury;
    emit TreasuryAddressUpdated(treasury);
  }

  /**
   * @dev Returns the address of the Unlockd treasury, receiving the fees on this uToken
   **/
  function RESERVE_TREASURY_ADDRESS() public view override returns (address) {
    return _treasury;
  }

  /**
   * @dev Returns the address of the underlying asset of this uToken
   **/
  function UNDERLYING_ASSET_ADDRESS() public view override returns (address) {
    return _underlyingAsset;
  }

  /**
   * @dev Returns the address of the lending pool where this uToken is used
   **/
  function POOL() public view returns (ILendPool) {
    return _getLendPool();
  }

  /**
   * @dev For internal usage in the logic of the parent contract IncentivizedERC20
   **/
  function _getIncentivesController() internal view override returns (IIncentivesController) {
    return IIncentivesController(_addressProvider.getIncentivesController());
  }

  function _getUnderlyingAssetAddress() internal view override returns (address) {
    return _underlyingAsset;
  }

  /**
   * @dev Returns the address of the incentives controller contract
   **/
  function getIncentivesController() external view override returns (IIncentivesController) {
    return _getIncentivesController();
  }

  /**
   * @dev Transfers the underlying asset to `target`. Used by the LendPool to transfer
   * assets in borrow() and withdraw()
   * @param target The recipient of the uTokens
   * @param amount The amount getting transferred
   * @return The amount transferred
   **/
  function transferUnderlyingTo(address target, uint256 amount) external override onlyLendPool returns (uint256) {
    IERC20Upgradeable(_underlyingAsset).safeTransfer(target, amount);
    return amount;
  }

  /**
   * @dev Transfers the uTokens between two users. Validates the transfer
   * (ie checks for valid HF after the transfer) if required
   * @param from The source address
   * @param to The destination address
   * @param amount The amount getting transferred
   * @param validate `true` if the transfer needs to be validated
   **/
  function _transfer(address from, address to, uint256 amount, bool validate) internal {
    address underlyingAsset = _underlyingAsset;
    ILendPool pool = _getLendPool();

    uint256 index = pool.getReserveNormalizedIncome(underlyingAsset);

    uint256 fromBalanceBefore = super.balanceOf(from).rayMul(index);
    uint256 toBalanceBefore = super.balanceOf(to).rayMul(index);

    super._transfer(from, to, amount.rayDiv(index));

    if (validate) {
      pool.finalizeTransfer(underlyingAsset, from, to, amount, fromBalanceBefore, toBalanceBefore);
    }

    emit BalanceTransfer(from, to, amount, index);
  }

  function _getLendPool() internal view returns (ILendPool) {
    return ILendPool(_addressProvider.getLendPool());
  }

  function _getLendPoolConfigurator() internal view returns (ILendPoolConfigurator) {
    return ILendPoolConfigurator(_addressProvider.getLendPoolConfigurator());
  }

  /**
   * @dev Overrides the parent _transfer to force validated transfer() and transferFrom()
   * @param from The source address
   * @param to The destination address
   * @param amount The amount getting transferred
   **/
  function _transfer(address from, address to, uint256 amount) internal override {
    _transfer(from, to, amount, true);
  }
}
