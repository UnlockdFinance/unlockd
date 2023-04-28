// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

// Convex reward contracts interface
interface IConvexRewards {
  //get balance of an address
  function balanceOf(address _account) external view returns (uint256);

  //withdraw to a convex tokenized deposit
  function withdraw(uint256 _amount, bool _claim) external returns (bool);

  //withdraw directly to curve LP token
  function withdrawAndUnwrap(uint256 _amount, bool _claim) external returns (bool);

  //claim rewards
  function getReward(address _account, bool _claimExtras) external returns (bool);

  //stake a convex tokenized deposit
  function stake(uint256 _amount) external returns (bool);

  //stake a convex tokenized deposit for another address(transfering ownership)
  function stakeFor(address _account, uint256 _amount) external returns (bool);

  // Used to determine what token is rewarded
  function rewardToken() external view returns (address);

  // See how much rewards an address will receive if they claim their rewards now.
  function earned(address account) external view returns (uint256);

  function extraRewardsLength() external view returns (uint256);

  function extraRewards(uint256 index) external view returns (address);
}
