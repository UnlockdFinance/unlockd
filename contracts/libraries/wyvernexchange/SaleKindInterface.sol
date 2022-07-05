// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @dev https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/contracts/exchange/SaleKindInterface.sol
 */
library SaleKindInterface {
  enum Side {
    Buy,
    Sell
  }

  enum SaleKind {
    FixedPrice,
    DutchAuction
  }
}
