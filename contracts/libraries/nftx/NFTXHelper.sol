// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {INFTXVaultFactoryV2} from "../../interfaces/INFTXVaultFactoryV2.sol";
import {INFTXVault} from "../../interfaces/INFTXVault.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

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
   * @param borrowAmount The user borrow amount
   */
  function sellNFTX(
    ILendPoolAddressesProvider addressesProvider,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset
  ) internal returns (uint256) {
    address vaultFactoryAddress = addressesProvider.getNFTXVaultFactory();
    address sushiSwapRouterAddress = addressesProvider.getSushiSwapRouter();
    address lendPoolAddress = addressesProvider.getLendPool();

    // Get NFTX Vaults for the asset
    address[] memory vaultAddresses = INFTXVaultFactoryV2(vaultFactoryAddress).vaultsForAsset(nftAsset);

    uint256[] memory tokenIds = new uint256[](1);
    tokenIds[0] = nftTokenId;

    for (uint256 i = 0; i < vaultAddresses.length; i += 1) {
      address vaultAddress = vaultAddresses[i];
      INFTXVault nftxVault = INFTXVault(vaultAddress);

      if (nftxVault.allValidNFTs(tokenIds)) {
        // Deposit NFT to NFTX Vault
        IERC721Upgradeable(nftAsset).setApprovalForAll(vaultAddress, true);
        nftxVault.mint(tokenIds, new uint256[](1));
        uint256 depositAmount = IERC20Upgradeable(vaultAddress).balanceOf(address(this));

        // Swap on SushiSwap
        IERC20Upgradeable(vaultAddress).approve(sushiSwapRouterAddress, depositAmount);
        address[] memory swapPath = new address[](2);
        swapPath[0] = vaultAddress;
        swapPath[1] = reserveAsset;
        uint256[] memory amounts = IUniswapV2Router02(sushiSwapRouterAddress).swapExactTokensForTokens(
          depositAmount,
          0,
          swapPath,
          lendPoolAddress,
          block.timestamp
        );

        return amounts[1];
      }
    }

    revert("NFTX: vault not available");
  }
}
