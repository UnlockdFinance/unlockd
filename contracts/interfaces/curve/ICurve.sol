// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICurve is IERC20 {
  function get_virtual_price() external view returns (uint256);

  function coins(uint256) external view returns (address);

  // N_COINS = 2
  function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount) external payable returns (uint256);

  // N_COINS = 2
  function remove_liquidity(uint256 _amount, uint256[2] calldata amounts) external returns (uint256[2] memory);

  // Perform an exchange between two coins
  function exchange(
    // CRV-ETH and CVX-ETH
    int128 i,
    int128 j,
    uint256 _dx,
    uint256 _min_dy
  ) external payable returns (uint256);

  function balances(uint256) external view returns (uint256);

  function price_oracle() external view returns (uint256);

  function get_balances() external view returns (uint256, uint256);
}
