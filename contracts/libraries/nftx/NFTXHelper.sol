// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {INFTXVaultFactory} from "../../interfaces/INFTXVaultFactory.sol";
import {INFTXVault} from "../../interfaces/INFTXVault.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

import {IERC20MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {console} from "hardhat/console.sol";

library NFTXHelper {
  function getHighestVault(
    address vaultFactoryAddress,
    address sushiSwapRouterAddress,
    address nftAsset,
    uint256[] memory tokenIds,
    address reserveAsset
  ) internal view returns (address) {
    INFTXVaultFactory vaultFactory = INFTXVaultFactory(vaultFactoryAddress);
    IUniswapV2Router02 sushiSwapRouter = IUniswapV2Router02(sushiSwapRouterAddress);

    address[] memory vaults = vaultFactory.vaultsForAsset(nftAsset);

    address vault;
    uint256 vaultPriceInReserve = 0;
    for (uint256 index = 0; index < vaults.length; index += 1) {
      INFTXVault currentVault = INFTXVault(vaults[index]);

      if (currentVault.allValidNFTs(tokenIds)) {
        uint256 mintFee = currentVault.mintFee();

        address[] memory swapPath = new address[](2);
        swapPath[0] = address(currentVault);
        swapPath[1] = reserveAsset;
        uint256[] memory amounts = sushiSwapRouter.getAmountsOut(1, swapPath);

        uint256 currentVaultPriceInReserve = amounts[1] * (1 ether - mintFee);
        if (currentVaultPriceInReserve > vaultPriceInReserve) {
          vault = address(currentVault);
        }
      }
    }

    return vault;
  }

  function sellNFTX(
    address vaultFactoryAddress,
    address sushiSwapRouterAddress,
    address nftAsset,
    uint256[] memory tokenIds,
    address reserveAsset,
    uint256 borrowAmount
  ) internal returns (uint256) {
    // address vault = getHighestVault(addressesProvider, nftAsset, tokenIds, reserveAsset);
    INFTXVaultFactory vaultFactory = INFTXVaultFactory(vaultFactoryAddress);
    address[] memory vaults = vaultFactory.vaultsForAsset(nftAsset);
    address vault = vaults[0];

    require(vault != address(0), "NFTX: vault not available");

    // Mint NFT
    IERC721Upgradeable(nftAsset).setApprovalForAll(vault, true);
    uint256 vaultAmount = INFTXVault(vault).mint(tokenIds, new uint256[](1));

    // Swap on SushiSwap
    IUniswapV2Router02 sushiSwapRouter = IUniswapV2Router02(sushiSwapRouterAddress);
    address[] memory swapPath = new address[](2);
    swapPath[0] = vault;
    swapPath[1] = reserveAsset;
    uint256[] memory amounts = sushiSwapRouter.swapExactTokensForTokens(
      10**IERC20MetadataUpgradeable(vault).decimals() * vaultAmount,
      0,
      swapPath,
      address(this),
      block.timestamp + 1000
    );

    return amounts[1];
  }
}
