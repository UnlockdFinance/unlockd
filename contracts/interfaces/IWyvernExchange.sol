// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @dev https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/Exchange.sol#L317
 */

interface IWyvernExchange {
  function atomicMatch_(
    address[14] calldata addrs,
    uint256[18] calldata uints,
    uint8[8] calldata feeMethodsSidesKindsHowToCalls,
    bytes calldata calldataBuy,
    bytes calldata calldataSell,
    bytes calldata replacementPatternBuy,
    bytes calldata replacementPatternSell,
    bytes calldata staticExtradataBuy,
    bytes calldata staticExtradataSell,
    uint8[2] calldata vs,
    bytes32[5] calldata rssMetadata
  ) external;
}
