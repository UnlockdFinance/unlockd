// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

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

  uint256 public bidDelta;

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

  modifier onlyPoolAdmin() {
    require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }
  modifier onlyOwnerOfBorrowedNft(address nftAsset, uint256 tokenId) {
    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = ILendPoolLoan(lendPoolLoanAddress).getLoan(loanId);

    require(loanData.borrower == msg.sender, Errors.DM_CALLER_NOT_THE_OWNER);
    _;
  }

  modifier debtShouldExistGuard(address nftAsset, uint256 tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    require(debtId != 0, Errors.DM_DEBT_SHOULD_EXIST);
    DataTypes.DebtMarketListing memory selldebt = _marketListings[debtId];
    require(_userTotalDebtByCollection[selldebt.debtor][nftAsset] >= 1, Errors.DM_DEBT_SHOULD_EXIST);
    require(_totalDebtsByCollection[nftAsset] >= 1, Errors.DM_DEBT_SHOULD_EXIST);
    _;
  }

  struct BuyLocalVars {
    address lendPoolLoanAddress;
    address lendPoolAddress;
    uint256 loanId;
    address buyer;
    uint256 debtId;
    uint256 borrowAmount;
  }

  function initialize(ILendPoolAddressesProvider addressesProvider) external initializer {
    _addressesProvider = addressesProvider;
  }

  function _transferDebt(address nftAsset, uint256 tokenId, address onBehalfOf) internal {
    BuyLocalVars memory vars;

    vars.lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    vars.lendPoolAddress = _addressesProvider.getLendPool();
    vars.loanId = ILendPoolLoan(vars.lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.lendPoolLoanAddress).getLoan(vars.loanId);
    DataTypes.ReserveData memory reserveData = ILendPool(vars.lendPoolAddress).getReserveData(loanData.reserveAsset);
    // reserveData.updateState();

    (, vars.borrowAmount) = ILendPoolLoan(vars.lendPoolLoanAddress).getLoanReserveBorrowAmount(vars.loanId);

    vars.buyer = onBehalfOf;

    vars.debtId = _nftToDebtIds[nftAsset][tokenId];
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
    DataTypes.DebtMarketListing storage marketOrder = _marketListings[vars.debtId];
    marketOrder.state = DataTypes.DebtMarketState.Sold;
    _deleteDebtOfferListing(nftAsset, tokenId);
  }

  function buy(
    address nftAsset,
    uint256 tokenId,
    address onBehalfOf
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    require(loanId != 0, Errors.DM_LOAN_SHOULD_EXIST);

    DataTypes.LoanData memory loanData = ILendPoolLoan(lendPoolLoanAddress).getLoan(loanId);
    DataTypes.DebtMarketListing memory marketOrder = _marketListings[debtId];

    _transferDebt(nftAsset, tokenId, onBehalfOf);
    // Pay to the seller with ERC20
    IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(_msgSender(), loanData.borrower, marketOrder.sellPrice);

    // Create a event
    emit DebtSold(loanData.borrower, onBehalfOf, debtId);
  }

  struct BidLocalVars {
    uint256 loanId;
    address previousBidder;
    uint256 previousBidPrice;
    uint256 borrowAmount;
    uint256 debtId;
  }

  function claim(
    address nftAsset,
    uint256 tokenId,
    address onBehalfOf
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    BidLocalVars memory vars;
    vars.debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage marketListing = _marketListings[vars.debtId];

    require(onBehalfOf == marketListing.bidderAddress, Errors.DM_INVALID_CLAIM_RECEIVER);
    require(marketListing.sellType == DataTypes.DebtMarketType.Auction, Errors.DM_INVALID_SELL_TYPE);
    require(block.timestamp > marketListing.auctionEndTimestamp, Errors.DM_AUCTION_NOT_ALREADY_ENDED);

    marketListing.state = DataTypes.DebtMarketState.Sold;

    _transferDebt(nftAsset, tokenId, onBehalfOf);

    IERC20Upgradeable(marketListing.reserveAsset).safeTransfer(marketListing.debtor, marketListing.bidPrice);

    // Create a event
    emit DebtSold(marketListing.debtor, onBehalfOf, vars.debtId);
  }

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

    require(bidPrice >= marketListing.sellPrice, Errors.DM_BID_PRICE_LESS_THAN_SELL_PRICE);
    require(
      bidPrice > (marketListing.bidPrice + marketListing.bidPrice.percentMul(bidDelta)),
      Errors.DM_BID_PRICE_LESS_THAN_PREVIOUS_BID
    );
    require(marketListing.sellType == DataTypes.DebtMarketType.Auction, Errors.DM_INVALID_SELL_TYPE);
    require(block.timestamp <= marketListing.auctionEndTimestamp, Errors.DM_AUCTION_ALREADY_ENDED);

    marketListing.state = DataTypes.DebtMarketState.Active;
    marketListing.bidderAddress = onBehalfOf;
    marketListing.bidPrice = bidPrice;

    IERC20Upgradeable(marketListing.reserveAsset).safeTransferFrom(_msgSender(), address(this), bidPrice);

    if (vars.previousBidder != address(0)) {
      IERC20Upgradeable(marketListing.reserveAsset).safeTransferFrom(
        address(this),
        vars.previousBidder,
        vars.previousBidPrice
      );
    }
  }

  function cancelDebtListing(
    address nftAsset,
    uint256 tokenId
  ) external nonReentrant debtShouldExistGuard(nftAsset, tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];

    DataTypes.DebtMarketListing storage selldebt = _marketListings[debtId];
    require(selldebt.state != DataTypes.DebtMarketState.Sold, Errors.DM_DEBT_SHOULD_NOT_BE_SOLD);
    selldebt.state = DataTypes.DebtMarketState.Canceled;
    _deleteDebtOfferListing(nftAsset, tokenId);

    _nftToDebtIds[nftAsset][tokenId] = 0;

    if (selldebt.bidderAddress != address(0)) {
      IERC20Upgradeable(selldebt.reserveAsset).safeTransferFrom(
        address(this),
        selldebt.bidderAddress,
        selldebt.bidPrice
      );
    }

    emit DebtListingCanceled(
      selldebt.debtor,
      selldebt.debtId,
      selldebt,
      _totalDebtsByCollection[nftAsset],
      _userTotalDebtByCollection[selldebt.debtor][nftAsset]
    );
  }

  function createDebtListing(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf
  ) external nonReentrant onlyOwnerOfBorrowedNft(nftAsset, tokenId) {
    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);

    uint256 debtId = _debtIdTracker.current();
    DataTypes.DebtMarketListing memory marketListing = _marketListings[debtId];

    emit DebtListingCreated(
      marketListing.debtId,
      marketListing.debtor,
      marketListing.nftAsset,
      marketListing.tokenId,
      marketListing.sellType,
      marketListing.state,
      marketListing.sellPrice,
      marketListing.reserveAsset,
      marketListing.scaledAmount
    );
  }

  function createDebtListingWithAuction(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    uint256 auctionEndTimestamp
  ) external nonReentrant onlyOwnerOfBorrowedNft(nftAsset, tokenId) {
    // solhint-disable-next-line
    require(auctionEndTimestamp >= block.timestamp, Errors.DM_AUCTION_ALREADY_ENDED);

    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);

    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage marketListing = _marketListings[debtId];
    marketListing.sellType = DataTypes.DebtMarketType.Auction;
    marketListing.auctionEndTimestamp = auctionEndTimestamp;

    emit DebtListingCreated(
      marketListing.debtId,
      marketListing.debtor,
      marketListing.nftAsset,
      marketListing.tokenId,
      marketListing.sellType, // Auction
      marketListing.state,
      marketListing.sellPrice,
      marketListing.reserveAsset,
      marketListing.scaledAmount
    );
  }

  function _createDebt(address nftAsset, uint256 tokenId, uint256 sellPrice, address onBehalfOf) internal {
    require(onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);
    require(sellPrice > 0, Errors.DM_INVALID_AMOUNT);
    require(_nftToDebtIds[nftAsset][tokenId] == 0, Errors.DM_DEBT_ALREADY_EXIST);

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
    marketListing.sellPrice = sellPrice;
    marketListing.debtor = onBehalfOf;

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

  function getDebtId(address nftAsset, uint256 tokenId) external view returns (uint256) {
    return _nftToDebtIds[nftAsset][tokenId];
  }

  function getDebt(uint256 debtId) external view returns (DataTypes.DebtMarketListing memory sellDebt) {
    return _marketListings[debtId];
  }

  function getDebtIdTracker() external view returns (CountersUpgradeable.Counter memory) {
    return _debtIdTracker;
  }
}
