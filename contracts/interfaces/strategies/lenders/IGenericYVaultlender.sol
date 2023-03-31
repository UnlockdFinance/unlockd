// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

interface IGenericYVaultLender {
  event Deposited(address strategy, uint256 amountDeposited);

  event Withdrawn(address strategy, uint256 amountWithdrawn);
}
