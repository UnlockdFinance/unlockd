// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

// Main Convex contract(booster.sol) basic interface
interface IConvex {
  //deposit into convex, receive a tokenized deposit.  parameter to stake immediately
  function deposit(uint256 _pid, uint256 _amount, bool _stake) external returns (bool);

  //burn a tokenized deposit to receive curve lp tokens back
  function withdraw(uint256 _pid, uint256 _amount) external returns (bool);

  function poolInfo(
    uint256 _pid
  )
    external
    view
    returns (address _lptoken, address _token, address _gauge, address _crvRewards, address _stash, bool _shutdown);
}
