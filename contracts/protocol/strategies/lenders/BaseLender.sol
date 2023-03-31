// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {ILendPoolAddressesProvider} from "../../../interfaces/ILendPoolAddressesProvider.sol";
import {IStrategy} from "../../../interfaces/strategies/IStrategy.sol";

/** @title BaseLender
 * @author Forked and adapted from https://github.com/Grandthrax/yearnV2-generic-lender-strat/tree/master/contracts/GenericLender
 * @notice `BaseLender` sets the base functionality to be implemented by Unlockd lender contracts.
 * @dev Inheriting lenders should implement functionality according to the standards defined in this
 * contract.
 **/
abstract contract BaseLender is Initializable {
  using SafeERC20 for IERC20;

  /*//////////////////////////////////////////////////////////////
                          ERRORS
  //////////////////////////////////////////////////////////////*/
  error InvalidZeroAddress();
  error InvalidCaller();

  /*//////////////////////////////////////////////////////////////
                        STORAGE
  //////////////////////////////////////////////////////////////*/
  // Unlockd's addresses provider
  ILendPoolAddressesProvider internal _addressesProvider;

  // Strategy interacting with lender
  IStrategy public strategy;

  // Lender's underlying asset
  IERC20 public underlyingAsset;
  // Underlying decimals
  uint256 public underlyingDecimals;
  // Gap for upgradeability
  uint256[20] private __gap;

  /*//////////////////////////////////////////////////////////////
                          MODIFIERS
  //////////////////////////////////////////////////////////////*/
  modifier onlyStrategy() {
    if (msg.sender != address(strategy)) _revert(InvalidCaller.selector);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                        INITIALIZATION
  //////////////////////////////////////////////////////////////*/

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  /**
   * @notice Initialize a new Base Lender.
   */
  //solhint-disable func-name-mixedcase
  function __BaseLender_init(ILendPoolAddressesProvider _provider, IStrategy _strategy) internal onlyInitializing {
    if (address(_provider) == address(0)) _revert(InvalidZeroAddress.selector);
    if (address(_strategy) == address(0)) _revert(InvalidZeroAddress.selector);
    _addressesProvider = _provider;
    strategy = _strategy;
    underlyingAsset = IERC20(_strategy.underlyingAsset());
    underlyingDecimals = underlyingAsset.decimals();
  }

  /*//////////////////////////////////////////////////////////////
                        CORE LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Deposits current lender balance to lender's managed protocol
   **/
  function deposit() external virtual;

  /**
   * @notice Withdraws the specified amount from lender's managed protocol
   * @param amount the amount to withdraw
   * @return Withdrawn amount
   **/
  function withdraw(uint256 amount) external virtual returns (uint256);

  /** todo: see the caveats of this kind of withdrawal and handle accordingly
   * @notice Withdraws all amount from the lender without checking for errors
   * @dev lender should implement this method according to its withdrawal methodology,
   * aiming at withdrawing the provided amount and transferring all of it to the UToken
   * @param amount the amount to withdraw in the emergency state
   **/
  function emergencyWithdraw(uint256 amount) external virtual;

  /**
   * @notice Withdraws all the deposited funds in lender's managed protocol
   * @return whether all assets were successfully withdrawn or not
   **/
  function withdrawAll() external onlyStrategy returns (bool) {
    uint256 assetsUnderManagement = _assetsUnderManagement();
    uint256 returned = _withdraw(assetsUnderManagement);
    return returned >= assetsUnderManagement;
  }

  /*//////////////////////////////////////////////////////////////
                        VIEW
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Returns the total assets under management.
   * It is important to note that the total assets under management
   * consider both the amount of underlying + the lent amount to
   * the protocol
   * @dev lender should implement this method according to its withdrawal methodology,
   * aiming at withdrawing the provided amount and transferring all of it to the UToken
   * @return the total assets under management
   */
  function assetsUnderManagement() external view override returns (uint256) {
    return _assetsUnderManagement();
  }

  /**
   * @notice Provides an accurate estimate of the Annual Percentage Rate
   * @return the estimated apr value
   */
  function apr() external view override returns (uint256) {
    return _apr();
  }

  /**
   * @notice Provides an accurate estimate of the aggregated weighted Annual Percentage Rate,
   * based on the current amount of assets under management
   */
  function weightedApr() external view override returns (uint256) {
    return _apr() * _assetsUnderManagement();
  }

  /** 
   * @notice Provides an accurate estimate of the Annual Percentage Rate after depositing `amount`
   * @param amount Amount to add to the external protocol, and that we want to take into account
   in the apr computation
  */
  function aprAfterDeposit(uint256 amount) external view returns (uint256) {
    return _aprAfterDeposit(amount);
  }

  /** 
   * @notice Checks whether the lender is currently managing assets
   * @param amount Amount to add to the external protocol, and that we want to take into account
   in the apr computation
  */
  function hasAssets() external view returns (bool) {
    return _hasAssets();
  }

  /*//////////////////////////////////////////////////////////////
                        INTERNALS
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Returns the total assets under management.
   * It is important to note that the total assets under management
   * consider both the amount of underlying + the lent amount to
   * the protocol
   * @dev each inheriting lender should implement this method according to the previous described guideline
   * regarding the amount returned
   * @return the total assets under management
   */
  function _assetsUnderManagement() internal view virtual returns (uint256);

  /**
   * @notice Provides an accurate estimate of the Annual Percentage Rate
   * @dev each inheriting lender should implement this method according to its specific apr calculation
   * @return the estimated apr value
   */
  function _apr() internal view virtual returns (uint256);

  /** 
   * @notice Provides an accurate estimate of the Annual Percentage Rate after depositing `amount`
   * @dev lender contracts should implement this method according to its specific apr calculation,
   * considering the newly deposited amount
   * @param amount Amount to add to the external protocol, and that we want to take into account
   in the apr computation
  */
  function _aprAfterDeposit() internal view virtual returns (uint256);

  /** 
   * @notice Checks whether the lender is currently managing assets
   * @dev each inheriting lender should implement this method according to its specific balance of assets
   * @param amount Amount to add to the external protocol, and that we want to take into account
   in the apr computation
  */
  function _hasAssets() internal view virtual returns (uint256);

  /**
   * @dev Perform more efficient reverts
   */
  function _revert(bytes4 errorSelector) internal pure {
    // solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(0x00, errorSelector)
      revert(0x00, 0x04)
    }
  }
}
