// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @title IReservoirAdapter
 * @author Unlockd
 * @notice Defines the basic interface for Unlockd's Reservoir Adapter contract.
 **/
interface IReservoirAdapter {
  error NotReservoirLiquidator();
  error InvalidReservoirModule();
  error TransferToNonERC721Receiver();

  struct ExecutionInfo {
    address module;
    bytes data;
    uint256 value;
  }

  function liquidateReservoir(address nftAsset, uint256 tokenId, ExecutionInfo calldata executionInfo) external;

  function updateModules(address[] calldata modules, bool flag) external;

  function updateLiquidators(address[] calldata liquidators, bool flag) external;
}
