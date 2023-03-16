// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title BaseStrategy
/// @author Forked from https://github.com/yearn/yearn-managers/blob/master/contracts/BaseStrategy.sol
/// @notice `BaseStrategyUpgradeable` implements all of the required functionalities to interoperate
/// with the `PoolManager` Contract.
/// @dev This contract should be inherited and the abstract methods implemented to adapt the `Strategy`
/// to the particular needs it has to create a return.
abstract contract BaseStrategy {
  using SafeERC20 for IERC20;

  /*//////////////////////////////////////////////////////////////
                        GENERAL VARS
    //////////////////////////////////////////////////////////////*/
  ILendPoolAddressesProvider internal _addressesProvider;
  IUToken internal _uToken;
  IERC20 internal _underlyingAsset;
  mapping(address => bool) public keepers;

  /**
   * @dev Only pool admin can call functions marked by this modifier
   **/
  modifier onlyPoolAdmin() {
    if (msg.sender != _addressesProvider.getPoolAdmin()) _revert(CallerNotPoolAdmin.selector);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                          INITIALIZATION
    //////////////////////////////////////////////////////////////*/

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  /**
   * @notice Initialize a new Strategy.
   * @param provider The address of the LendPoolAddressesProvider.
   */
  function __BaseStrategy_init(
    ILendPoolAddressesProvider provider,
    IUToken uToken,
    address[] calldata _keepers
  ) internal onlyInitializing {
    if (address(provider) == address(0)) revert InvalidZeroAddress();
    if (address(uToken) == address(0)) revert InvalidZeroAddress();
    _addressesProvider = provider;
    _uToken = uToken;
    _underlyingAsset = IERC20(uToken.UNDERLYING_ASSET_ADDRESS());
    // Approve UToken
    _underlyingAsset.safeApprove(_uToken, type(uint256).max);

    // Initialize keepers
    uint256 cachedLength = _keepers.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (_keepers[i] == address(0)) _revert(InvalidZeroAddress.selector);
      keepers[_keepers[i]] = true;
      unchecked {
        ++i;
      }
    }

    // @todo check for reentrancy
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNALS
    //////////////////////////////////////////////////////////////*/

  /**
   * @dev Sets/unsets a set of addresses as `keepers`
   * @param keepers the keepers to be updated
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
   * @dev Perform more efficient reverts
   */
  function _revert(bytes4 errorSelector) internal pure {
    //solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(0x00, errorSelector)
      revert(0x00, 0x04)
    }
  }
}
