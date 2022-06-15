// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {INFTXVaultFactory} from "../../interfaces/INFTXVaultFactory.sol";
import {INFTXVault} from "../../interfaces/INFTXVault.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

library NFTXHelper {
  function getHighestVault(
    ILendPoolAddressesProvider addressesProvider,
    address nftAsset,
    uint256[] memory tokenIds,
    address reserveAsset
  ) internal view returns (address) {
    INFTXVaultFactory vaultFactory = INFTXVaultFactory(addressesProvider.getNFTXVaultFactory());
    IUniswapV2Router02 sushiSwapRouter = IUniswapV2Router02(addressesProvider.getSushiSwapRouter());

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
    ILendPoolAddressesProvider addressesProvider,
    address nftAsset,
    uint256[] memory tokenIds,
    address reserveAsset,
    uint256 borrowAmount
  ) internal returns (uint256) {
    address vault = getHighestVault(addressesProvider, nftAsset, tokenIds, reserveAsset);

    require(vault != address(0), "NFTX: vault not available");

    // Mint NFT
    uint256 vaultAmount = INFTXVault(vault).mint(tokenIds, new uint256[](1));

    // Swap on SushiSwap
    IUniswapV2Router02 sushiSwapRouter = IUniswapV2Router02(addressesProvider.getSushiSwapRouter());
    address[] memory swapPath = new address[](2);
    swapPath[0] = vault;
    swapPath[1] = reserveAsset;
    uint256[] memory amounts = sushiSwapRouter.swapExactTokensForTokens(
      vaultAmount,
      borrowAmount,
      swapPath,
      address(this),
      0
    );

    return amounts[1];
  }
}
