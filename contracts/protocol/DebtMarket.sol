// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

import {ReserveLogic} from "../libraries/logic/ReserveLogic.sol";
import {GenericLogic} from "../libraries/logic/GenericLogic.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {PercentageMath} from "../libraries/math/PercentageMath.sol";

import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IDebtMarket} from "../interfaces/IDebtMarket.sol";
import {IUNFT} from "../interfaces/IUNFT.sol";
import {IDebtToken} from "../interfaces/IDebtToken.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILockeyHolder} from "../interfaces/ILockeyHolder.sol";

/**
 * @title DebtMarket
 * @notice Main contract to manage sell the debt with a fixed price or with auctions
 * @author Unlockd
 **/

contract DebtMarket is Initializable, ContextUpgradeable, IDebtMarket {
  using CountersUpgradeable for CountersUpgradeable.Counter;
  using SafeERC20Upgradeable for IERC20Upgradeable;
  using ReserveLogic for DataTypes.ReserveData;
  using PercentageMath for uint256;

  ILendPoolAddressesProvider internal _addressesProvider;

  CountersUpgradeable.Counter private _debtIdTracker;
  mapping(uint256 => DataTypes.DebtMarketListing) private _marketListings;
  mapping(address => mapping(uint256 => uint256)) private _nftToDebtIds;
  mapping(address => mapping(address => uint256)) private _userTotalDebtByCollection;
  mapping(address => uint256) private _totalDebtsByCollection;

  uint256 private constant _NOT_ENTERED = 0;
  uint256 private constant _ENTERED = 1;
  uint256 private _status;
  uint256 private _deltaBidPercent;

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and making it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    // On the first call to nonReentrant, _notEntered will be true
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    // Any calls to nonReentrant after this point will fail
    _status = _ENTERED;

    _;

    // By storing the original value once again, a refund is triggered (see
    // https://eips.ethereum.org/EIPS/eip-2200)
    _status = _NOT_ENTERED;
  }
  /**
   * @dev Prevents a contract calling from non pool admin address, directly .
   */
  modifier onlyPoolAdmin() {
    require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }

  /**
   * @dev Prevents create debt duplicated  .
   */
  modifier nonDuplicatedDebt(address nftAsset, uint256 tokenId) {
    require(_nftToDebtIds[nftAsset][tokenId] == 0, Errors.DM_DEBT_ALREADY_EXIST);
    _;
  }

  /**
   * @dev Prevents a contract calling from non owner of the NFT  .
   */
  modifier onlyOwnerOfBorrowedNft(address nftAsset, uint256 tokenId) {
    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    require(loanId != 0, Errors.DM_LOAN_SHOULD_EXIST);

    DataTypes.LoanData memory loanData = ILendPoolLoan(lendPoolLoanAddress).getLoan(loanId);
    require(loanData.borrower == msg.sender, Errors.DM_CALLER_NOT_THE_OWNER);
    _;
  }

  /**
   * @dev Prevents fails if debt no exist  .
   */
  modifier debtShouldExistGuard(address nftAsset, uint256 tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    require(debtId != 0, Errors.DM_DEBT_SHOULD_EXIST);
    DataTypes.DebtMarketListing memory selldebt = _marketListings[debtId];
    require(_userTotalDebtByCollection[selldebt.debtor][nftAsset] >= 1, Errors.DM_DEBT_SHOULD_EXIST);
    require(_totalDebtsByCollection[nftAsset] >= 1, Errors.DM_DEBT_SHOULD_EXIST);
    _;
  }

  struct TransferLocalVars {
    address lendPoolLoanAddress;
    address lendPoolAddress;
    uint256 loanId;
    address buyer;
    uint256 debtId;
    uint256 borrowAmount;
  }

  struct BuyLocalVars {
    uint256 debtId;
    address lendPoolLoanAddress;
    uint256 loanId;
    uint256 price;
  }

  struct CreateLocalVars {
    uint256 debtId;
    bool isValidAuctionType;
    bool isValidFixedPriceType;
  }

  function initialize(ILendPoolAddressesProvider addressesProvider) external initializer {
    _addressesProvider = addressesProvider;
    _deltaBidPercent = PercentageMath.ONE_PERCENT;
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function createDebtListing(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    uint256 startBiddingPrice,
    uint256 auctionEndTimestamp
  ) external override nonReentrant nonDuplicatedDebt(nftAsset, tokenId) onlyOwnerOfBorrowedNft(nftAsset, tokenId) {
    CreateLocalVars memory vars;

    vars.isValidAuctionType = (startBiddingPrice != 0 && auctionEndTimestamp != 0);
    vars.isValidFixedPriceType = (sellPrice != 0);

    require(vars.isValidFixedPriceType || vars.isValidAuctionType, Errors.DM_INVALID_AMOUNT);

    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);

    vars.debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage marketListing = _marketListings[vars.debtId];

    marketListing.auctionEndTimestamp = auctionEndTimestamp;
    marketListing.startBiddingPrice = startBiddingPrice;

    if (vars.isValidAuctionType) {
      // solhint-disable-next-line
      require(auctionEndTimestamp >= block.timestamp, Errors.DM_AUCTION_ALREADY_ENDED);
      marketListing.sellType = DataTypes.DebtMarketType.Auction;
    }

    if (vars.isValidFixedPriceType && vars.isValidAuctionType) {
      marketListing.sellType = DataTypes.DebtMarketType.Mixed;
    }

    emit DebtListingCreated(
      marketListing.debtId,
      marketListing.debtor,
      marketListing.nftAsset,
      marketListing.tokenId,
      marketListing.sellType,
      marketListing.state,
      marketListing.sellPrice,
      marketListing.reserveAsset,
      marketListing.scaledAmount,
      marketListing.auctionEndTimestamp,
      marketListing.startBiddingPrice
    );
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function cancelDebtListing(
    address nftAsset,
    uint256 tokenId
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];

    DataTypes.DebtMarketListing storage sellDebt = _marketListings[debtId];
    require(sellDebt.state != DataTypes.DebtMarketState.Sold, Errors.DM_DEBT_SHOULD_NOT_BE_SOLD);
    sellDebt.state = DataTypes.DebtMarketState.Canceled;
    _deleteDebtOfferListing(nftAsset, tokenId);

    _nftToDebtIds[nftAsset][tokenId] = 0;

    if (sellDebt.bidderAddress != address(0)) {
      IERC20Upgradeable(sellDebt.reserveAsset).safeTransferFrom(
        address(this),
        sellDebt.bidderAddress,
        sellDebt.bidPrice
      );
    }

    emit DebtListingCanceled(
      sellDebt.debtor,
      sellDebt.debtId,
      sellDebt,
      _totalDebtsByCollection[nftAsset],
      _userTotalDebtByCollection[sellDebt.debtor][nftAsset]
    );
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function buy(
    address nftAsset,
    uint256 tokenId,
    address onBehalfOf,
    uint256 amount
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    BuyLocalVars memory vars;

    vars.debtId = _nftToDebtIds[nftAsset][tokenId];
    vars.lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    vars.loanId = ILendPoolLoan(vars.lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    require(vars.loanId != 0, Errors.DM_LOAN_SHOULD_EXIST);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.lendPoolLoanAddress).getLoan(vars.loanId);
    DataTypes.DebtMarketListing memory marketOrder = _marketListings[vars.debtId];

    require(
      marketOrder.sellType == DataTypes.DebtMarketType.Mixed ||
        marketOrder.sellType == DataTypes.DebtMarketType.FixedPrice,
      Errors.DM_INVALID_SELL_TYPE
    );

    _transferDebt(nftAsset, tokenId, onBehalfOf);
    vars.price = _priceForLockeyHolders(marketOrder.sellPrice, onBehalfOf);

    require(vars.price == amount, Errors.DM_AMOUNT_DIFFERENT_FROM_SELL_PRICE);

    // Pay to the seller with ERC20
    IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(_msgSender(), loanData.borrower, vars.price);

    if (marketOrder.bidderAddress != address(0)) {
      _returnBidFunds(vars.debtId, marketOrder.bidderAddress, marketOrder.bidPrice);
    }
    // Create a event
    emit DebtSold(loanData.borrower, onBehalfOf, vars.debtId);
  }

  struct BidLocalVars {
    address previousBidder;
    address lendPoolLoanAddress;
    uint256 loanId;
    uint256 previousBidPrice;
    uint256 borrowAmount;
    uint256 debtId;
    uint256 price;
    uint256 sellPrice;
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function bid(
    address nftAsset,
    uint256 tokenId,
    uint256 bidPrice,
    address onBehalfOf
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    BidLocalVars memory vars;
    vars.debtId = _nftToDebtIds[nftAsset][tokenId];

    DataTypes.DebtMarketListing storage marketListing = _marketListings[vars.debtId];

    vars.previousBidder = marketListing.bidderAddress;
    vars.previousBidPrice = marketListing.bidPrice;
    vars.price = bidPrice;
    vars.sellPrice = _priceForLockeyHolders(marketListing.sellPrice, onBehalfOf);

    require(
      marketListing.sellType == DataTypes.DebtMarketType.Auction ||
        marketListing.sellType == DataTypes.DebtMarketType.Mixed,
      Errors.DM_INVALID_SELL_TYPE
    );
    require(bidPrice >= marketListing.startBiddingPrice, Errors.DM_BID_PRICE_LESS_THAN_MIN_BID_PRICE);
    if (marketListing.sellType == DataTypes.DebtMarketType.Mixed) {
      require(bidPrice <= vars.sellPrice, Errors.DM_BID_PRICE_HIGHER_THAN_SELL_PRICE);
    }

    require(block.timestamp <= marketListing.auctionEndTimestamp, Errors.DM_AUCTION_ALREADY_ENDED);

    if (marketListing.sellType == DataTypes.DebtMarketType.Mixed && bidPrice == vars.sellPrice) {
      // Sell the debt
      _transferDebt(nftAsset, tokenId, onBehalfOf);
      vars.price = vars.sellPrice;
    } else {
      require(
        bidPrice > (marketListing.bidPrice + marketListing.bidPrice.percentMul(_deltaBidPercent)),
        Errors.DM_BID_PRICE_LESS_THAN_PREVIOUS_BID
      );
      marketListing.state = DataTypes.DebtMarketState.Active;
    }
    marketListing.bidderAddress = onBehalfOf;
    marketListing.bidPrice = vars.price;

    IERC20Upgradeable(marketListing.reserveAsset).safeTransferFrom(_msgSender(), address(this), vars.price);

    if (vars.previousBidder != address(0)) {
      _returnBidFunds(vars.debtId, vars.previousBidder, vars.previousBidPrice);
    }

    emit BidPlaced(
      marketListing.bidderAddress,
      marketListing.reserveAsset,
      nftAsset,
      tokenId,
      vars.debtId,
      marketListing.bidPrice
    );
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function claim(
    address nftAsset,
    uint256 tokenId,
    address onBehalfOf
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    BidLocalVars memory vars;
    vars.debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage marketListing = _marketListings[vars.debtId];

    require(
      marketListing.sellType == DataTypes.DebtMarketType.Auction ||
        marketListing.sellType == DataTypes.DebtMarketType.Mixed,
      Errors.DM_INVALID_SELL_TYPE
    );
    require(onBehalfOf == marketListing.bidderAddress, Errors.DM_INVALID_CLAIM_RECEIVER);
    require(block.timestamp > marketListing.auctionEndTimestamp, Errors.DM_AUCTION_NOT_ALREADY_ENDED);

    marketListing.state = DataTypes.DebtMarketState.Sold;

    _transferDebt(nftAsset, tokenId, onBehalfOf);

    IERC20Upgradeable(marketListing.reserveAsset).safeTransfer(marketListing.debtor, marketListing.bidPrice);

    // Create a event
    emit DebtClaimed(marketListing.debtor, onBehalfOf, vars.debtId);
  }

  function _createDebt(address nftAsset, uint256 tokenId, uint256 sellPrice, address onBehalfOf) internal {
    require(onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);

    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    require(loanId != 0, Errors.DM_LOAN_SHOULD_EXIST);

    _debtIdTracker.increment();

    uint256 debtId = _debtIdTracker.current();
    _nftToDebtIds[nftAsset][tokenId] = debtId;
    DataTypes.DebtMarketListing storage marketListing = _marketListings[debtId];

    marketListing.debtId = debtId;
    marketListing.nftAsset = nftAsset;
    marketListing.tokenId = tokenId;
    marketListing.debtor = onBehalfOf;
    marketListing.sellPrice = sellPrice;

    (, , address reserveAsset, uint256 scaledAmount) = ILendPoolLoan(lendPoolLoanAddress).getLoanCollateralAndReserve(
      loanId
    );
    marketListing.reserveAsset = reserveAsset;
    marketListing.scaledAmount = scaledAmount;
    marketListing.state = DataTypes.DebtMarketState.New;

    _userTotalDebtByCollection[onBehalfOf][nftAsset] += 1;
    _totalDebtsByCollection[nftAsset] += 1;
  }

  function _deleteDebtOfferListing(address nftAsset, uint256 tokenId) internal {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage selldebt = _marketListings[debtId];

    _userTotalDebtByCollection[selldebt.debtor][nftAsset] -= 1;
    _totalDebtsByCollection[nftAsset] -= 1;
  }

  function _transferDebt(address nftAsset, uint256 tokenId, address onBehalfOf) internal {
    TransferLocalVars memory vars;

    vars.lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    vars.lendPoolAddress = _addressesProvider.getLendPool();
    vars.loanId = ILendPoolLoan(vars.lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.lendPoolLoanAddress).getLoan(vars.loanId);
    DataTypes.ReserveData memory reserveData = ILendPool(vars.lendPoolAddress).getReserveData(loanData.reserveAsset);
    // reserveData.updateState();

    (, vars.borrowAmount) = ILendPoolLoan(vars.lendPoolLoanAddress).getLoanReserveBorrowAmount(vars.loanId);

    vars.buyer = onBehalfOf;
    vars.debtId = _nftToDebtIds[nftAsset][tokenId];

    DataTypes.DebtMarketListing storage marketOrder = _marketListings[vars.debtId];
    require(marketOrder.scaledAmount == loanData.scaledAmount, Errors.DM_BORROWED_AMOUNT_DIVERGED);
    marketOrder.state = DataTypes.DebtMarketState.Sold;

    // Burn debt from seller
    IDebtToken(reserveData.debtTokenAddress).burn(
      loanData.borrower,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );
    // Mint debt from buyer
    IDebtToken(reserveData.debtTokenAddress).mint(
      vars.buyer,
      vars.buyer,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // Burn unft from seller
    // Mint unft from buyer
    ILendPoolLoan(vars.lendPoolLoanAddress).reMintUNFT(
      loanData.nftAsset,
      loanData.nftTokenId,
      loanData.borrower,
      vars.buyer
    );

    // Remove the offer listing
    _deleteDebtOfferListing(nftAsset, tokenId);
  }

  function _returnBidFunds(uint256 debtId, address previousBidder, uint256 previousBidPrice) internal {
    DataTypes.DebtMarketListing memory marketListing = _marketListings[debtId];

    IERC20Upgradeable(marketListing.reserveAsset).safeTransferFrom(address(this), previousBidder, previousBidPrice);
  }

  function _priceForLockeyHolders(uint256 marketPrice, address onBehalfOf) internal view returns (uint256) {
    address lockeysCollection = _addressesProvider.getAddress(keccak256("LOCKEY_COLLECTION"));
    address lockeyHolderAddress = _addressesProvider.getAddress(keccak256("LOCKEY_HOLDER"));

    uint price = marketPrice;
    if (IERC721Upgradeable(lockeysCollection).balanceOf(onBehalfOf) > 0) {
      price = marketPrice.percentMul(ILockeyHolder(lockeyHolderAddress).getLockeyDiscountPercentageOnDebtMarket());
    }
    return price;
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function setDeltaBidPercent(uint256 value) external override nonReentrant onlyPoolAdmin {
    _deltaBidPercent = value;
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function getDebtId(address nftAsset, uint256 tokenId) external view override returns (uint256) {
    return _nftToDebtIds[nftAsset][tokenId];
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function getDebt(uint256 debtId) external view override returns (DataTypes.DebtMarketListing memory sellDebt) {
    return _marketListings[debtId];
  }

  /**
   * @inheritdoc IDebtMarket
   */
  function getDebtIdTracker() external view override returns (CountersUpgradeable.Counter memory) {
    return _debtIdTracker;
  }
}
