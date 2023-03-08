// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @title IReservoirAdapter
 * @author Unlockd
 * @notice Defines the basic interface for Unlockd's Reservoir Adapter contract.
 **/
interface IReservoirAdapter {
  error NotReservoirLiquidator();
  error TakerNotReservoirAdapter();
  error InvalidReservoirModule();
  error InvalidSafeTransferFromExpectedSelector();
  error InvalidExecuteExpectedSelector();
  error InvalidReservoirFromAddress();
  error InvalidReservoirModuleOnExecute();
  error LowLevelSafeTransferFromFailed();

  struct ExecutionInfo {
    address module;
    bytes data;
    uint256 value;
  }

  function liquidateReservoir(address nftAsset, bytes calldata data) external;

  function updateModules(address[] calldata modules, bool flag) external;

  function updateLiquidators(address[] calldata liquidators, bool flag) external;
}
