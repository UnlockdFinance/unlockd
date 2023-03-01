// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IReservoirAdapter} from "../../interfaces/reservoir/IReservoirAdapter.sol";

import {BaseAdapter} from "./abstracts/BaseAdapter.sol";

contract ReservoirAdapter is BaseAdapter, IReservoirAdapter {
  /*//////////////////////////////////////////////////////////////
                          GENERAL VARS
  //////////////////////////////////////////////////////////////*/
  mapping(address => bool) private _liquidators;
  mapping(address => bool) private _reservoirModules;

  /*//////////////////////////////////////////////////////////////
                          MODIFIERS
  //////////////////////////////////////////////////////////////*/
  modifier onlyReservoirLiquidator() {
    if (!_liquidators[msg.sender]) _revert(NotReservoirLiquidator.selector);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                          PROXY INIT LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider provider) external initializer {
    if (address(provider) == address(0)) _revert(InvalidZeroAddress.selector);
    __BaseAdapter_init(provider);
  }

  /*//////////////////////////////////////////////////////////////
                          MAIN LOGIC
  //////////////////////////////////////////////////////////////*/
  function liquidateReservoir(
    address nftAsset,
    uint256 tokenId,
    ExecutionInfo calldata executionInfo
  ) external override nonReentrant onlyReservoirLiquidator {
    _performInitialChecks(nftAsset, tokenId);

    _updateReserveState(nftAsset, tokenId);

    _updateReserveInterestRates(nftAsset, tokenId);

    _validateLoanHealthFactor(nftAsset, tokenId);

    //@todo burn UNFT and transfer it
  }

  /*//////////////////////////////////////////////////////////////
                          SETTERS / GETTERS
  //////////////////////////////////////////////////////////////*/
  function updateModules(address[] calldata modules, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = modules.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (modules[i] == address(0)) _revert(InvalidZeroAddress.selector);
      _reservoirModules[modules[i]] = flag;
      unchecked {
        ++i;
      }
    }
  }

  function updateLiquidators(address[] calldata liquidators, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = liquidators.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (liquidators[i] == address(0)) _revert(InvalidZeroAddress.selector);
      _liquidators[liquidators[i]] = flag;
      unchecked {
        ++i;
      }
    }
  }
}
