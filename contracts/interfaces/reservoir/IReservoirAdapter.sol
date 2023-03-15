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
  error InvalidLiquidateAmount();

  event LiquidatedReservoir(
    address indexed nftAsset,
    uint256 indexed tokenId,
    uint256 indexed loanId,
    uint256 borrowAmount,
    uint256 liquidatedAmount,
    uint256 remainAmount,
    uint256 extraDebtAmount
  );

  event ModulesUpdated(address[] indexed modules, bool flag);

  event LiquidatorsUpdated(address[] indexed liquidators, bool flag);

  struct ExecutionInfo {
    address module;
    bytes data;
    uint256 value;
  }

  struct SafeTransferFromDecodedData {
    address from;
    address to;
    uint256 tokenId;
    bytes4 safeTransferFromSelector;
  }

  struct SettlementData {
    uint256 borrowAmount;
    uint256 balanceBeforeLiquidation;
    uint256 liquidatedAmount;
    uint256 extraDebtAmount;
    uint256 remainAmount;
  }

  function liquidateReservoir(
    address nftAsset,
    address reserveAsset,
    bytes calldata data,
    uint256 expectedLiquidateAmount
  ) external;

  function updateModules(address[] calldata modules, bool flag) external;

  function updateLiquidators(address[] calldata liquidators, bool flag) external;
}
