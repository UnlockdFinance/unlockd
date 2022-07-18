// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {DataTypes} from "../libraries/types/DataTypes.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

interface ILendPoolLoan {
  /**
   * @dev Emitted on initialization to share location of dependent notes
   * @param pool The address of the associated lend pool
   */
  event Initialized(address indexed pool);

  /**
   * @dev Emitted when a loan is created
   * @param user The address initiating the action
   */
  event LoanCreated(
    address indexed user,
    address indexed onBehalfOf,
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex
  );

  /**
   * @dev Emitted when a loan is updated
   * @param user The address initiating the action
   */
  event LoanUpdated(
    address indexed user,
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amountAdded,
    uint256 amountTaken,
    uint256 borrowIndex
  );

  /**
   * @dev Emitted when a loan is repaid by the borrower
   * @param user The address initiating the action
   */
  event LoanRepaid(
    address indexed user,
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex
  );

  /**
   * @dev Emitted when a loan is auction by the liquidator
   */
  event LoanAuctioned(
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount,
    uint256 borrowIndex,
    uint256 price
  );

  /**
   * @dev Emitted when a loan is redeemed
   * @param user The address initiating the action
   */
  event LoanRedeemed(
    address indexed user,
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amountTaken,
    uint256 borrowIndex
  );

  /**
   * @dev Emitted when a loan is liquidate on LooksRare
   */
  event LoanLiquidatedLooksRare(
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex,
    uint256 sellPrice
  );
  /**
   * @dev Emitted when a loan is liquidate on Opensea
   */
  event LoanLiquidatedOpensea(
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex
  );
  /**
   * @dev Emitted when a loan is liquidate on NFTX
   */
  event LoanLiquidatedNFTX(
    uint256 indexed loanId,
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex,
    uint256 sellPrice
  );

  function initNft(address nftAsset, address uNftAddress) external;

  /**
   * @dev Create store a loan object with some params
   * @param initiator The address of the user initiating the borrow
   * @param onBehalfOf The address receiving the loan
   */
  function createLoan(
    address initiator,
    address onBehalfOf,
    address nftAsset,
    uint256 nftTokenId,
    address uNftAddress,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex
  ) external returns (uint256);

  /**
   * @dev Update the given loan with some params
   *
   * Requirements:
   *  - The caller must be a holder of the loan
   *  - The loan must be in state Active
   * @param initiator The address of the user initiating the borrow
   */
  function updateLoan(
    address initiator,
    uint256 loanId,
    uint256 amountAdded,
    uint256 amountTaken,
    uint256 borrowIndex
  ) external;

  /**
   * @dev Repay the given loan
   *
   * Requirements:
   *  - The caller must be a holder of the loan
   *  - The caller must send in principal + interest
   *  - The loan must be in state Active
   *
   * @param initiator The address of the user initiating the repay
   * @param loanId The loan getting burned
   * @param uNftAddress The address of uNFT
   */
  function repayLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 amount,
    uint256 borrowIndex
  ) external;

  /**
   * @dev Auction the given loan
   *
   * Requirements:
   *  - The loan must be in state Active
   *
   * @param loanId The loan getting auctioned
   * @param uNftAddress The address of uNFT
   * @param minBidPrice The start bid price of this auction
   */
  function auctionLoan(
    uint256 loanId,
    address uNftAddress,
    uint256 minBidPrice,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external;

  /**
   * @dev Redeem the given loan with some params
   *
   * Requirements:
   *  - The caller must be a holder of the loan
   *  - The loan must be in state Auction
   * @param initiator The address of the user initiating the borrow
   */
  function redeemLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 amountTaken,
    uint256 borrowIndex
  ) external;

  /**
   * @dev Liquidate the given loan on LooksRare
   *
   * Requirements:
   *  - The caller must send in principal + interest
   *  - The loan must be in state Auction
   *
   * @param loanId The loan getting burned
   * @param uNftAddress The address of uNFT
   */
  function liquidateLoanLooksRare(
    uint256 loanId,
    address uNftAddress,
    uint256 borrowAmount,
    uint256 borrowIndex,
    DataTypes.ExecuteLiquidateLooksRareParams memory params
  ) external returns (uint256 sellPrice);

  /**
   * @dev Liquidate the given loan on Opensea
   *
   * Requirements:
   *  - The caller must send in principal + interest
   *  - The loan must be in state Auction
   *
   * @param loanId The loan getting burned
   */
  function liquidateLoanOpensea(
    uint256 loanId,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external;

  /**
   * @dev Liquidate the given loan on NFTX
   *
   * Requirements:
   *  - The caller must send in principal + interest
   *  - The loan must be in state Auction
   *
   * @param loanId The loan getting burned
   */
  function liquidateLoanNFTX(
    uint256 loanId,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external returns (uint256 sellPrice);

  function borrowerOf(uint256 loanId) external view returns (address);

  function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256);

  function getLoan(uint256 loanId) external view returns (DataTypes.LoanData memory loanData);

  function getLoanCollateralAndReserve(uint256 loanId)
    external
    view
    returns (
      address nftAsset,
      uint256 nftTokenId,
      address reserveAsset,
      uint256 scaledAmount
    );

  function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256);

  function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256);

  function getLoanMinBidPrice(uint256 loanId) external view returns (uint256);

  function getNftCollateralAmount(address nftAsset) external view returns (uint256);

  function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256);

  function getLoanIdTracker() external view returns (CountersUpgradeable.Counter memory);
}
