// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

interface IYVault {
  function token() external view returns (address);

  function pricePerShare() external view returns (uint256);

  function deposit(uint256) external;

  function withdraw(uint256) external;
}
