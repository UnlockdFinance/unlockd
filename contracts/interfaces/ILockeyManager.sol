// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILockeyManager {
  /**
   * @dev Emitted when the lockey discount percentage is set
   * @param discountPercentage The percentage of the discount
   **/
  event LockeyDiscountPercentageSet(uint256 discountPercentage);

  /**
   * @dev Emitted when _rescuer is modified in the LendPool
   * @param newRescuer The address of the new rescuer
   **/
  event RescuerChanged(address indexed newRescuer);

  /**
   * @dev sets the discount percentage that the lockey holders can get on buyouts
   * @param discountPercentage the percentage lockey holders will have
   */
  function setLockeyDiscountPercentage(uint256 discountPercentage) external;

  /**
   * @notice Rescue tokens and ETH locked up in this contract.
   * @param tokenContract ERC20 token contract address
   * @param to        Recipient address
   * @param amount    Amount to withdraw
   */
  function rescue(IERC20 tokenContract, address to, uint256 amount, bool rescueETH) external;

  /**
   * @notice Assign the rescuer role to a given address.
   * @param newRescuer New rescuer's address
   */
  function updateRescuer(address newRescuer) external;

  /**
   * @notice Returns current rescuer
   * @return Rescuer's address
   */
  function rescuer() external view returns (address);

  /**
   * @dev Returns the lockeys discount percentage
   **/
  function getLockeyDiscountPercentage() external view returns (uint256);
}
