// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @title IReservoir
 * @author Unlockd
 * @notice Defines the basic interface for the Reservoir router.
 **/
interface IReservoir {
  struct ExecutionInfo {
    address module;
    bytes data;
    uint256 value;
  }

  function execute(ExecutionInfo[] calldata executionInfos) external payable;
}
