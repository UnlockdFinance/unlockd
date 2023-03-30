// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

interface IStrategy {
  error CallerNotPoolAdmin();
  error InvalidZeroAddress();
  error InvalidKeeper();
  error OnlyUToken();
  error HealthCheckFailed();
  error StrategyNotManagingSameUnderlying();

  event SetDoHealthCheck(bool doHealthCheck);
  event SetHealthCheck(address indexed healthCheck);
  event Harvested(uint256 indexed profit, uint256 indexed loss, uint256 indexed debtPayment, uint256 debtOutstanding);
  event KeepersUpdated(address[] indexed _keepers, bool flag);

  function updateKeepers(address[] calldata _keepers, bool flag) external;

  function estimatedTotalAssets() external view returns (uint256);

  function withdraw(uint256 _amountNeeded) external returns (uint256, uint256);
}
