// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IReservoir} from "../../interfaces/reservoir/IReservoir.sol";

contract ReservoirAdapter is Initializable {
  IReservoir internal _reservoir;

  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider provider, IReservoir reservoir) external initializer {
    require(address(reservoir) != address(0), Errors.INVALID_ZERO_ADDRESS);
    __BaseAdapter_init(provider);
    _reservoir = reservoir;
  }

  function liquidateReservoir(
    address nftAsset,
    uint256 tokenId,
    ExecutionInfo executionInfo
  ) external override nonReentrant {
    _performInitialChecks(nftAsset, tokenId);

    _updateReserveState(nftAsset, tokenId);

    _updateReserveInterestRates(nftAsset, tokenId);

    _validateHealthFactor(nftAsset, tokenId);

    _reservoir.execute(executionInfo);
  }
}
