// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {DataTypes} from "../libraries/types/DataTypes.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

interface IDebtMarket {
  /**
   * @dev Emitted on initialization to share location of dependent notes
   * @param pool The address of the associated lend pool
   */
  event Initialized(address indexed pool);

  /**
   * @dev Emitted when a debt listing  is created with a fixed price
   * @param debtId The debt listing identifier
   * @param debtor The owner of the debt listing
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param sellType The type of sell ( Fixed price or Auction )
   * @param state The state of the actual debt offer ( New,Active,Sold,Canceled )
   * @param sellPrice The price for to sell the debt
   * @param reserveAsset The asset from the reserve
   * @param debtAmount The total debt value
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

  /**
   * @dev Emitted when a debt with auction listing  is created
   * @param debtId The debt listing identifier
   * @param debtor The owner of the debt listing
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param sellType The type of sell ( Fixed price or Auction )
   * @param state The state of the actual debt offer ( New,Active,Sold,Canceled )
   * @param sellPrice The price for to sell the debt
   * @param reserveAsset The asset from the reserve
   * @param debtAmount The total debt value
   */
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
   * @param onBehalfOf Address of the user who will receive
   * @param debtId The debt listing identifier
   * @param marketListing The object of the debt
   * @param totalByCollection Total debts listings by collection from the actual debtId collection
   * @param totalByUserAndCollection Total debts listings by user from the actual debtId user
   */
  event DebtListingCanceled(
    address indexed onBehalfOf,
    uint256 indexed debtId,
    DataTypes.DebtMarketListing marketListing,
    uint256 totalByCollection,
    uint256 totalByUserAndCollection
  );

  /**
   * @dev Emitted when a bid is placed on a debt listing with auction
   * @param bidderAddress Address of the last bidder
   * @param reserveAsset The asset from the reserve
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param debtId The debt listing identifier
   * @param bidPrice Amount that bidder spend on the bid
   */
  event BidPlaced(
    address bidderAddress,
    address reserveAsset,
    address indexed nftAsset,
    uint256 indexed tokenId,
    uint256 debtId,
    uint256 bidPrice
  );

  /**
   * @dev Emitted when a debt is bought
   * @param from Address of owner of the debt
   * @param to Buyer address
   * @param debtId The debt listing identifier
   */
  event DebtSold(address indexed from, address indexed to, uint256 indexed debtId);

  /**
   * @dev Emitted when a debt is claimed
   * @param from Address of owner of the debt
   * @param to Claimer address
   * @param debtId The debt listing identifier
   */
  event DebtClaimed(address indexed from, address indexed to, uint256 indexed debtId);

  /**
   * @dev Buy a fixed price debt listing
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param onBehalfOf Address of the user who will receive
   * @param amount Amount in wei
   */
  function buy(address nftAsset, uint256 tokenId, address onBehalfOf, uint256 amount) external;

  /**
   * @dev Bid an auction
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param bidPrice Amount in wei
   * @param onBehalfOf Address of the user who will receive
   */
  function bid(address nftAsset, uint256 tokenId, uint256 bidPrice, address onBehalfOf) external;

  /**
   * @dev Claim a finished auction
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param onBehalfOf Address of the user who will receive
   */
  function claim(address nftAsset, uint256 tokenId, address onBehalfOf) external;

  /**
   * @dev Return Debt identifier
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   */
  function getDebtId(address nftAsset, uint256 tokenId) external view returns (uint256);

  /**
   * @dev Return a Debt listing position
   * @param debtId The debt listing identifier
   */
  function getDebt(uint256 debtId) external view returns (DataTypes.DebtMarketListing memory sellDebt);

  /**
   * @dev Return a last debt id identifier
   */
  function getDebtIdTracker() external view returns (CountersUpgradeable.Counter memory);

  /**
   * @dev Update the percentage value between 2 bids
   * @param value delta bid percentage
   */
  function setDeltaBidPercent(uint256 value) external;

  /**
   * @dev Create a debt listing position with fixed price
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param sellPrice Price to sell in wei
   * @param onBehalfOf Address of the user who will receive
   */
  function createDebtListing(address nftAsset, uint256 tokenId, uint256 sellPrice, address onBehalfOf) external;

  /**
   * @dev Create a debt listing position as a auction
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   * @param sellPrice Price to sell in wei,  min bid
   * @param onBehalfOf Address of the user who will receive
   * @param auctionEndTimestamp When the auction will be finished
   */
  function createDebtListingWithAuction(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    uint256 auctionEndTimestamp
  ) external;

  /**
   * @dev Close a debt listing position
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param tokenId The token id of the underlying NFT used as collateral
   */
  function cancelDebtListing(address nftAsset, uint256 tokenId) external;
}
