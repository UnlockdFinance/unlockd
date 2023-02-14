// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;
import {DataTypes} from "../libraries/types/DataTypes.sol";

interface IDebtSeller {
  /**
   * @dev Emitted on initialization to share location of dependent notes
   * @param pool The address of the associated lend pool
   */
  event Initialized(address indexed pool);

  /**
   * @dev Emitted when a debt listting  is created
   */
  event DebtListtingCreated(
    DataTypes.DebtMarketListing marketListing,
    uint256 totalByCollection,
    uint256 totalByUserAndCollection
  );

  /**
   * @dev Emitted when a debt listting  is canceled
   */
  event DebtListtingCanceled(
    address indexed onBehalfOf,
    uint256 indexed debtId,
    DataTypes.DebtMarketListing marketListing,
    uint256 totalByCollection,
    uint256 totalByUserAndCollection
  );

  /**
   * @dev Emitted when a debt is bougth
   */
  event DebtSold(address indexed from, address indexed to, uint256 indexed debtId);
}
