// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;
import {DataTypes} from "../libraries/types/DataTypes.sol";

interface IDebtMarket {
  /**
   * @dev Emitted on initialization to share location of dependent notes
   * @param pool The address of the associated lend pool
   */
  event Initialized(address indexed pool);

  /**
   * @dev Emitted when a debt listing  is created with a fixed price
   */
  event DebtListingCreated(
    uint256 debtId,
    address debtor,
    address indexed nftAsset,
    uint256 indexed tokenId,
    DataTypes.DebtMarketType indexed sellType,
    DataTypes.DebtMarketState state,
    uint256 sellPrice,
    address reserveAsset,
    uint256 debtAmount
  );

  event DebtAuctionCreated(
    uint256 debtId,
    address debtor,
    address indexed nftAsset,
    uint256 indexed tokenId,
    DataTypes.DebtMarketType indexed sellType,
    DataTypes.DebtMarketState state,
    uint256 sellPrice,
    address reserveAsset,
    uint256 debtAmount
  );

  /**
   * @dev Emitted when a debt listing  is canceled
   */
  event DebtListingCanceled(
    address indexed onBehalfOf,
    uint256 indexed debtId,
    DataTypes.DebtMarketListing marketListing,
    uint256 totalByCollection,
    uint256 totalByUserAndCollection
  );

  event BidPlaced(
    address bidderAddress,
    address reserveAsset,
    address indexed nftAsset,
    uint256 indexed tokenId,
    uint256 debtId,
    uint256 bidPrice
  );

  /**
   * @dev Emitted when a debt is bougth
   */
  event DebtSold(address indexed from, address indexed to, uint256 indexed debtId);

  event DebtClaimed(address indexed from, address indexed to, uint256 indexed debtId);

  function buy(address nftAsset, uint256 tokenId, address onBehalfOf, uint256 amount) external;

  function bid(address nftAsset, uint256 tokenId, uint256 bidPrice, address onBehalfOf) external;

  function claim(address nftAsset, uint256 tokenId, address onBehalfOf) external;

  function setDeltaBidPercent(uint256 value) external;
}
