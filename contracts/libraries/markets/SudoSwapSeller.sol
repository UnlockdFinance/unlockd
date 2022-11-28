// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";

import {Errors} from "../../libraries/helpers/Errors.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title SudoSwap library
 * @author Unlockd
 * @notice Implements SudoSwap selling logic
 */
library SudoSwapSeller {
  address internal constant WETH = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;

  /**
   * @dev Sells an asset in a SudoSwap liquid market
   * @param addressesProvider The addresses provider
   * @param nftAsset The underlying NFT address
   * @param nftTokenId The underlying NFT token Id
   * @param reserveAsset The reserve asset to exchange for the NFT
   */
  function sellSudoSwap(
    ILendPoolAddressesProvider addressesProvider,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset
  ) internal returns (uint256) {}
}
