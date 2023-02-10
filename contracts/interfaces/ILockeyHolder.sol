// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

interface ILockeyHolder {
  /**
   * @dev sets the discount percentage that the lockey holders can get on buyouts
   * @param discountPercentage the percentage lockey holders will have
   */
  function setLockeyDiscountPercentage(uint256 discountPercentage) external;

  /**
   * @dev Returns the lockeys discount percentage
   **/
  function getLockeyDiscountPercentage() external view returns (uint256);
}