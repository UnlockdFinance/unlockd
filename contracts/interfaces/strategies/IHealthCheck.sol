// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

interface IHealthCheck {
  function check(
    uint256 profit,
    uint256 loss,
    uint256 debtPayment,
    uint256 debtOutstanding,
    uint256 totalDebt
  ) external view returns (bool);
}
