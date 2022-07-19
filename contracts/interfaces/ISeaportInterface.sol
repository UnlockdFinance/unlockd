// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {OrderComponents} from "../libraries/seaport/ConsiderationStructs.sol";

/**
 * @dev https://github.com/ProjectOpenSea/seaport/blob/main/contracts/interfaces/SeaportInterface.sol
 */

interface ISeaportInterface {
  /**
   * @notice Cancel an arbitrary number of orders. Note that only the offerer
   *         or the zone of a given order may cancel it. Callers should ensure
   *         that the intended order was cancelled by calling `getOrderStatus`
   *         and confirming that `isCancelled` returns `true`.
   *
   * @param orders The orders to cancel.
   *
   * @return cancelled A boolean indicating whether the supplied orders have
   *                   been successfully cancelled.
   */
  function cancel(OrderComponents[] calldata orders) external returns (bool cancelled);
}
