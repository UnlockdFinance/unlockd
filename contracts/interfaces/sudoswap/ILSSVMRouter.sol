// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @title ILSSVMRouter
 * @author Unlockd
 * @notice Defines the basic interface for the NFTX Marketplace Zap.
 **/

struct PairSwapSpecific {
  LSSVMPair pair;
  uint256[] nftIds;
}

interface ILSSVMRouter {
  function swapNFTsForToken(
    PairSwapSpecific[] calldata swapList,
    uint256 minOutput,
    address tokenRecipient,
    uint256 deadline
  ) external returns (uint256 outputAmount);
}
