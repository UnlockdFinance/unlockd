// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IUToken} from "../../interfaces/IUToken.sol";
import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IStrategy} from "../../interfaces/strategies/IStrategy.sol";
import {IHealthCheck} from "../../interfaces/strategies/IHealthCheck.sol";

/** @title BaseStrategy
 * @author Forked and adapted from https://github.com/yearn/yearn-vaults/blob/master/contracts/BaseStrategy.sol
 * @notice `BaseStrategy` sets the base functionality to be implemented by Unlockd strategies.
 * @dev Inheriting strategies should implement functionality according to the standards defined in this
 * contract.
 **/
abstract contract BaseStrategy is Initializable, IStrategy {
  using SafeERC20 for IERC20;

  /*//////////////////////////////////////////////////////////////
                      STATE VARIABLES
  //////////////////////////////////////////////////////////////*/
  IUToken public uToken;
  ILendPoolAddressesProvider public addressesProvider;
  IERC20 public underlyingAsset;
  mapping(address => bool) public keepers;

  // health checks
  bool public doHealthCheck;
  address public healthCheck;
  bool public emergencyExit;

  // Gap for upgradeability
  uint256[20] private __gap;

  /*//////////////////////////////////////////////////////////////
                      MODIFIERS
  //////////////////////////////////////////////////////////////*/

  /**
   * @dev Only pool admin can call functions marked by this modifier
   **/
  modifier onlyPoolAdmin() {
    if (msg.sender != addressesProvider.getPoolAdmin()) _revert(CallerNotPoolAdmin.selector);
    _;
  }

  /**
   * @dev Only valid keepers can call functions marked by this modifier
   **/
  modifier onlyKeepers() {
    if (!keepers[msg.sender]) _revert(InvalidKeeper.selector);
    _;
  }
  /**
   * @dev Only the UToken associated with this strategy can call functions marked by this modifier
   **/
  modifier onlyUToken() {
    if (msg.sender != address(uToken)) _revert(OnlyUToken.selector);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                        INITIALIZATION
  //////////////////////////////////////////////////////////////*/

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  /**
   * @notice Initialize a new Strategy.
   * @param _provider The address of the LendPoolAddressesProvider.
   * @param _uToken The address of the UToken associated to the strategy.
   * @param _keepers The addresses of the keepers to be added as valid keepers to the strategy.
   */
  function __BaseStrategy_init(
    ILendPoolAddressesProvider _provider,
    IUToken _uToken,
    address[] calldata _keepers
  ) internal onlyInitializing {
    if (address(_provider) == address(0)) _revert(InvalidZeroAddress.selector);
    if (address(_uToken) == address(0)) _revert(InvalidZeroAddress.selector);
    addressesProvider = _provider;
    uToken = _uToken;
    underlyingAsset = IERC20(_uToken.UNDERLYING_ASSET_ADDRESS());
    // Approve UToken
    underlyingAsset.safeApprove(address(_uToken), type(uint256).max);

    // Initialize keepers
    uint256 cachedLength = _keepers.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (_keepers[i] == address(0)) _revert(InvalidZeroAddress.selector);
      keepers[_keepers[i]] = true;
      unchecked {
        ++i;
      }
    }
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
  function harvest() external onlyKeepers {
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
    uint256 totalDebt = uToken.getStrategy(address(this)).totalDebt;
    debtOutstanding = uToken.report(profit, loss, debtPayment);

    // Check if free returns are left, and re-invest them
    _adjustPosition(debtOutstanding);

    _performHealthCheck(profit, loss, debtPayment, debtOutstanding, totalDebt);

    emit Harvested(profit, loss, debtPayment, debtOutstanding);
  }

  /**
   * @notice Withdraws `_amountNeeded` to `_uToken`.
   *  This may only be called by the respective UToken.
   * @param _amountNeeded How much `underlyingAsset` to withdraw.
   * @return amountFreed Any realized gains
   * @return _loss Any realized losses
   */
  function withdraw(uint256 _amountNeeded) external override onlyUToken returns (uint256 amountFreed, uint256 _loss) {
    // Liquidate as much as possible to `underlyingAsset`, up to `_amountNeeded`
    (amountFreed, _loss) = _liquidatePosition(_amountNeeded);
    // Send it directly back
    underlyingAsset.safeTransfer(msg.sender, amountFreed);
    // NOTE: Reinvest anything leftover on next `harvest`
  }

  /**
   * @notice Transfers all `underlyingAsset` from this Strategy to `_newStrategy`.
   *  This may only be called by the UToken.
   * @dev The new Strategy's UToken must be the same as this Strategy's UToken.
   *  The migration process should be carefully performed to make sure all
   * the assets are migrated to the new address, which should have never
   * interacted with the UToken before.
   * @param _newStrategy The Strategy to migrate to.
   */
  function migrate(address _newStrategy) external onlyPoolAdmin {
    if (address(IStrategy(_newStrategy).getUToken()) != address(uToken))
      _revert(StrategyNotManagingSameUnderlying.selector);
    _prepareMigration(_newStrategy);
    underlyingAsset.safeTransfer(_newStrategy, underlyingAsset.balanceOf(address(this)));
  }

  /*//////////////////////////////////////////////////////////////
                          SETTERS
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Sets/unsets a set of addresses as `keepers`
   * @param _keepers the keepers to be updated
   * @param flag `true` to set addresses as keepers, `false` otherwise
   **/
  function updateKeepers(address[] calldata _keepers, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = _keepers.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (_keepers[i] == address(0)) _revert(InvalidZeroAddress.selector);
      keepers[_keepers[i]] = flag;
      unchecked {
        ++i;
      }
    }
    emit KeepersUpdated(_keepers, flag);
  }

  /**
   * @dev Sets healthcheck contract address
   * @param _healthCheck the new healthcheck contract
   **/
  function setHealthCheck(address _healthCheck) external onlyPoolAdmin {
    healthCheck = _healthCheck;
    emit SetHealthCheck(_healthCheck);
  }

  /**
   * @dev Sets boolean to handle whether healthcheck should be executed or not
   * @param _doHealthCheck the new `doHealthCheck` status
   **/
  function setDoHealthCheck(bool _doHealthCheck) external onlyPoolAdmin {
    doHealthCheck = _doHealthCheck;
    emit SetDoHealthCheck(_doHealthCheck);
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
  function estimatedTotalAssets() public view virtual override returns (uint256);

  /**
   *  @notice Provides an indication of whether this strategy is currently "active"
   *  in that it is managing an active position, or will manage a position in
   *  the future. This should correlate to `harvest()` activity, so that Harvest
   *  events can be tracked externally by indexing agents.
   *  @return True if the strategy is actively managing a position.
   */
  function isActive() public view returns (bool) {
    return estimatedTotalAssets() != 0;
  }

  /**
   *  @notice Returns the Strategy's uToken
   *  @return the uToken
   */
  function getUToken() public view override returns (IUToken) {
    return uToken;
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNALS
  //////////////////////////////////////////////////////////////*/
  /*
   * @notice Performs any adjustments to the core position(s) of this Strategy given
   * what change the UToken made in the "investable capital" available to the
   * Strategy.
   * @dev Note that all "free capital" (capital not invested) in the Strategy after the report
   * was made is available for reinvestment. This number could be 0, and this scenario should be handled accordingly.
   * @param debtOutstanding Total principal + interest of debt yet to be paid back
   */
  function _adjustPosition(uint256 debtOutstanding) internal virtual;

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
  function _liquidatePosition(uint256 amountNeeded) internal virtual returns (uint256 liquidatedAmount, uint256 loss);

  /**
   * @notice Liquidates everything and returns the amount that got freed.
   * @dev This function is used during emergency exit instead of `_prepareReturn()` to
   * liquidate all of the Strategy's positions back to the UToken.
   */
  function _liquidateAllPositions() internal virtual returns (uint256 amountFreed);

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
   * `underlyingAsset.balanceOf(this) >= debtPayment + profit`).
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
  ) internal virtual returns (uint256 profit, uint256 loss, uint256 debtPayment);

  function _performHealthCheck(
    uint256 profit,
    uint256 loss,
    uint256 debtPayment,
    uint256 debtOutstanding,
    uint256 totalDebt
  ) internal {
    // call healthCheck contract
    if (doHealthCheck && healthCheck != address(0)) {
      if (!IHealthCheck(healthCheck).check(profit, loss, debtPayment, debtOutstanding, totalDebt))
        _revert(HealthCheckFailed.selector);
    } else {
      doHealthCheck = true;
      emit SetDoHealthCheck(true);
    }
  }

  /**
   * @notice Do anything necessary to prepare this Strategy for migration, such as
   * transferring any reserve or LP tokens, CDPs, or other tokens or stores of
   * value.
   * @param newStrategy the new strategy to migrate to
   */
  function _prepareMigration(address newStrategy) internal virtual;

  /**
   * @notice Returns the current strategy's balance in underlying token
   * @return the strategy's balance of underlying token
   */
  function _underlyingBalance() internal view returns (uint256) {
    return underlyingAsset.balanceOf(address(this));
  }

  /**
   * @dev Perform more efficient reverts
   **/
  function _revert(bytes4 errorSelector) internal pure {
    //solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(0x00, errorSelector)
      revert(0x00, 0x04)
    }
  }
}
