// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {ILSSVMRouter} from "../../interfaces/sudoswap/ILSSVMRouter.sol";
import {ILSSVMPair} from "../../interfaces/sudoswap/ILSSVMPair.sol";

import {Errors} from "../../libraries/helpers/Errors.sol";

/*
 * @title SudoSwap library
 * @author Unlockd
 * @notice Implements SudoSwap selling logic
 */
library SudoSwapSeller {
  struct PairSwapSpecific {
    ILSSVMPair pair;
    uint256[] nftIds;
  }

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
    address reserveAsset,
    address LSSVMPair
  ) internal returns (uint256 amount) {
    address LSSVMRouterAddress = addressesProvider.getLSSVMRouter();
    address lendPoolAddress = addressesProvider.getLendPool();

    ILSSVMRouter LSSVMRouter = ILSSVMRouter(LSSVMRouterAddress);

    uint256[] memory nftTokenIds = new uint256[](1);
    nftTokenIds[0] = nftTokenId;

    PairSwapSpecific[] memory pairSwaps = new PairSwapSpecific[](1);
    pairSwaps[0] = PairSwapSpecific({pair: ILSSVMPair(LSSVMPair), nftIds: nftTokenIds});

    amount = LSSVMRouter.swapNFTsForToken(pairSwaps, 0, lendPoolAddress, block.timestamp);
  }
}
