// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import "../libraries/looksrare/OrderTypes.sol";

/**
 * @dev https://github.com/LooksRare/contracts-exchange-v1/blob/master/contracts/interfaces/ILooksRareExchange.sol
 */
interface ILooksRareExchange {
  function matchBidWithTakerAsk(OrderTypes.TakerOrder calldata takerAsk, OrderTypes.MakerOrder calldata makerBid)
    external;
}
