// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {ILendPoolAddressesProviderRegistry} from "../interfaces/ILendPoolAddressesProviderRegistry.sol";

/**
 * @title LendPoolAddressesProviderRegistry contract
 * @dev Main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets
 * - Used for indexing purposes of Unlockd protocol's markets
 * - The id assigned to a LendPoolAddressesProvider refers to the market it is connected with,
 *   for example with `1` for the Unlockd main market and `2` for the next created
 * @author BendDao; Forked and edited by Unlockd
 **/
contract LendPoolAddressesProviderRegistry is Ownable, ILendPoolAddressesProviderRegistry {
  /*//////////////////////////////////////////////////////////////
                        GENERAL VARIABLES
  //////////////////////////////////////////////////////////////*/
  mapping(address => uint256) private _addressesProviders;
  address[] private _addressesProvidersList;

  /*//////////////////////////////////////////////////////////////
                          INTERNALS
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Adds provider to addresses provider list
   * @param provider The provider address to be added
   */
  function _addToAddressesProvidersList(address provider) internal {
    uint256 providersCount = _addressesProvidersList.length;

    for (uint256 i; i < providersCount; ) {
      if (_addressesProvidersList[i] == provider) {
        return;
      }

      unchecked {
        ++i;
      }
    }

    _addressesProvidersList.push(provider);
  }

  /*//////////////////////////////////////////////////////////////
                        GETTERS & SETTERS
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Returns the list of registered addresses provider
   * @return The list of addresses provider, potentially containing address(0) elements
   **/
  function getAddressesProvidersList() external view override returns (address[] memory) {
    address[] memory addressesProvidersList = _addressesProvidersList;

    uint256 maxLength = addressesProvidersList.length;

    address[] memory activeProviders = new address[](maxLength);

    for (uint256 i; i < maxLength; ) {
      if (_addressesProviders[addressesProvidersList[i]] > 0) {
        activeProviders[i] = addressesProvidersList[i];
      }

      unchecked {
        i = i + 1;
      }
    }

    return activeProviders;
  }

  /**
   * @dev Registers an addresses provider
   * @param provider The address of the new LendPoolAddressesProvider
   * @param id The id for the new LendPoolAddressesProvider, referring to the market it belongs to
   **/
  function registerAddressesProvider(address provider, uint256 id) external override onlyOwner {
    require(id != 0, Errors.LPAPR_INVALID_ADDRESSES_PROVIDER_ID);

    _addressesProviders[provider] = id;
    _addToAddressesProvidersList(provider);
    emit AddressesProviderRegistered(provider);
  }

  /**
   * @dev Removes a LendPoolAddressesProvider from the list of registered addresses provider
   * @param provider The LendPoolAddressesProvider address
   **/
  function unregisterAddressesProvider(address provider) external override onlyOwner {
    require(_addressesProviders[provider] > 0, Errors.LPAPR_PROVIDER_NOT_REGISTERED);
    _addressesProviders[provider] = 0;
    emit AddressesProviderUnregistered(provider);
  }

  /**
   * @dev Returns the id on a registered LendPoolAddressesProvider
   * @return The id or 0 if the LendPoolAddressesProvider is not registered
   */
  function getAddressesProviderIdByAddress(address addressesProvider) external view override returns (uint256) {
    return _addressesProviders[addressesProvider];
  }
}
