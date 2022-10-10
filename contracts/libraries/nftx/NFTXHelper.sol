// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {INFTXVaultFactoryV2} from "../../interfaces/INFTXVaultFactoryV2.sol";
import {INFTXVault} from "../../interfaces/INFTXVault.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";
import {INFTXMarketplaceZap} from "../interfaces/INFTXMarketplaceZap.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title NFTXHelper library
 * @author Unlockd
 * @notice Implements NFTX selling logic
 */
library NFTXHelper {
  /**
   * @dev Sells an asset in an NFTX liquid market
   * @param addressesProvider The addresses provider
   * @param nftAsset The underlying NFT address
   * @param nftTokenId The underlying NFT token Id
   * @param reserveAsset The reserve asset to exchange for the NFT
   */
  function sellNFTX(
    ILendPoolAddressesProvider addressesProvider,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 borrowAmount
  ) internal returns (uint256) {
    address nftxMarketplaceZapAddress = addressesProvider.getNFTXVaultFactory(); //todo: change name to nftxMarketplaceZap
    address lendPoolAddress = addressesProvider.getLendPool();

    // Get NFTX Vaults for the asset
    address vaultFactoryAddress = INFTXMarketplaceZap(nftxMarketplaceZapAddress).nftxFactory();
    address[] memory vaultAddresses = INFTXVaultFactoryV2(vaultFactoryAddress).vaultsForAsset(nftAsset);

    //todo: create custom error
    require(vaultAddresses.length > 0, "Invalid vault");

    //We always get the first vault
    uint256 vaultId = INFTXVault(vaultAddresses[0]).vaultId();

    uint256[] memory tokenIds = new uint256[](1);
    tokenIds[0] = nftTokenId;

    address[] memory swapPath = new address[](2);
    swapPath[0] = vaultAddress[0];
    swapPath[1] = reserveAsset;

    INFTXMarketplaceZap(nftxMarketplaceZapAddress).mintAndSell721WETH(
      vaultId,
      tokenIds,
      0.2 * borrowAmount,
      swapPath,
      lendPoolAddress
    );
  }
}
