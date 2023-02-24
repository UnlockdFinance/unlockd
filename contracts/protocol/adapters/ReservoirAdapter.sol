// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IReservoir} from "../../interfaces/reservoir/IReservoir.sol";

import {BaseAdapter} from "./abstracts/BaseAdapter.sol";

contract ReservoirAdapter is BaseAdapter, IReservoir {
  IReservoir internal _reservoir;

  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider provider, IReservoir reservoir) external initializer {
    if (address(reservoir) == address(0)) revert InvalidZeroAddress();

    __BaseAdapter_init(provider);
    _reservoir = reservoir;
  }

  function liquidateReservoir(
    address nftAsset,
    uint256 tokenId,
    ExecutionInfo calldata executionInfo
  ) external override nonReentrant {
    _performInitialChecks(nftAsset, tokenId);

    _updateReserveState(nftAsset, tokenId);

    _updateReserveInterestRates(nftAsset, tokenId);

    _validateLoanHealthFactor(nftAsset, tokenId);

    //@todo burn UNFT and transfer it
  }
}
