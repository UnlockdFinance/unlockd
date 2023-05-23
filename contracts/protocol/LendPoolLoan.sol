// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IUNFT} from "../interfaces/IUNFT.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {IUNFTRegistry} from "../interfaces/IUNFTRegistry.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC721ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract LendPoolLoan is Initializable, ILendPoolLoan, ContextUpgradeable, IERC721ReceiverUpgradeable {
  using WadRayMath for uint256;
  using CountersUpgradeable for CountersUpgradeable.Counter;

  ILendPoolAddressesProvider private _addressesProvider;

  CountersUpgradeable.Counter private _loanIdTracker;
  mapping(uint256 => DataTypes.LoanData) private _loans;

  // nftAsset + nftTokenId => loanId
  mapping(address => mapping(uint256 => uint256)) private _nftToLoanIds;
  mapping(address => uint256) private _nftTotalCollateral;
  mapping(address => mapping(address => uint256)) private _userNftCollateral;
  mapping(address => bool) private _marketAdapters;

  bytes32 public constant DEBT_MARKET = keccak256("DEBT_MARKET");

  /**
   * @dev Only lending pool can call functions marked by this modifier
   **/
  modifier onlyLendPool() {
    require(_msgSender() == address(_getLendPool()), Errors.CT_CALLER_MUST_BE_LEND_POOL);
    _;
  }
  modifier onlyDebtMarket() {
    require(_msgSender() == _addressesProvider.getAddress(DEBT_MARKET), Errors.CT_CALLER_MUST_BE_DEBT_MARKET);
    _;
  }

  /**
   * @dev Only adapter of external markets can call functions marked by this modifier
   **/
  modifier onlyMarketAdapter() {
    require(_marketAdapters[_msgSender()], Errors.LPL_CALLER_MUST_BE_MARKET_ADAPTER);
    _;
  }
  /**
   * @dev Only pool admin can call functions marked by this modifier
   **/
  modifier onlyPoolAdmin() {
    require(_msgSender() == _addressesProvider.getPoolAdmin(), Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }

  // called once by the factory at time of deployment
  function initialize(ILendPoolAddressesProvider provider) external initializer {
    require(address(provider) != address(0), Errors.INVALID_ZERO_ADDRESS);

    __Context_init();
    require(address(provider) != address(0), Errors.INVALID_ZERO_ADDRESS);
    _addressesProvider = provider;

    // Avoid having loanId = 0
    _loanIdTracker.increment();

    emit Initialized(address(_getLendPool()));
  }

  function initNft(address nftAsset, address uNftAddress) external override onlyLendPool {
    IERC721Upgradeable(nftAsset).setApprovalForAll(uNftAddress, true);
  }

  /**
   * @inheritdoc ILendPoolLoan
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
  ) external override onlyLendPool returns (uint256) {
    require(_nftToLoanIds[nftAsset][nftTokenId] == 0, Errors.LP_NFT_HAS_USED_AS_COLLATERAL);

    // index is expressed in Ray, so:
    // amount.wadToRay().rayDiv(index).rayToWad() => amount.rayDiv(index)
    uint256 amountScaled = amount.rayDiv(borrowIndex);

    uint256 loanId = _loanIdTracker.current();
    _loanIdTracker.increment();

    _nftToLoanIds[nftAsset][nftTokenId] = loanId;

    // transfer underlying NFT asset to pool and mint uNFT to onBehalfOf
    IERC721Upgradeable(nftAsset).safeTransferFrom(_msgSender(), address(this), nftTokenId);

    IUNFT(uNftAddress).mint(onBehalfOf, nftTokenId);

    // Save Info
    DataTypes.LoanData storage loanData = _loans[loanId];
    loanData.loanId = loanId;
    loanData.state = DataTypes.LoanState.Active;
    loanData.borrower = onBehalfOf;
    loanData.nftAsset = nftAsset;
    loanData.nftTokenId = nftTokenId;
    loanData.reserveAsset = reserveAsset;
    loanData.scaledAmount = amountScaled;

    _userNftCollateral[onBehalfOf][nftAsset] += 1;
    _nftTotalCollateral[nftAsset] += 1;

    emit LoanCreated(initiator, onBehalfOf, loanId, nftAsset, nftTokenId, reserveAsset, amount, borrowIndex);

    return (loanId);
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function updateLoan(
    address initiator,
    uint256 loanId,
    uint256 amountAdded,
    uint256 amountTaken,
    uint256 borrowIndex
  ) external override onlyLendPool {
    // Must use storage to change state
    DataTypes.LoanData storage loan = _loans[loanId];

    // Ensure valid loan state
    require(loan.state == DataTypes.LoanState.Active, Errors.LPL_INVALID_LOAN_STATE);

    uint256 amountScaled = 0;

    if (amountAdded > 0) {
      amountScaled = amountAdded.rayDiv(borrowIndex);
      require(amountScaled != 0, Errors.LPL_INVALID_LOAN_AMOUNT);

      loan.scaledAmount += amountScaled;
    }

    if (amountTaken > 0) {
      amountScaled = amountTaken.rayDiv(borrowIndex);
      require(amountScaled != 0, Errors.LPL_INVALID_TAKEN_AMOUNT);

      require(loan.scaledAmount >= amountScaled, Errors.LPL_AMOUNT_OVERFLOW);
      loan.scaledAmount -= amountScaled;
    }

    emit LoanUpdated(
      initiator,
      loanId,
      loan.nftAsset,
      loan.nftTokenId,
      loan.reserveAsset,
      amountAdded,
      amountTaken,
      borrowIndex
    );
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function repayLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 amount,
    uint256 borrowIndex
  ) external override onlyLendPool {
    // Must use storage to change state
    DataTypes.LoanData storage loan = _loans[loanId];

    // Ensure valid loan state
    require(loan.state == DataTypes.LoanState.Active, Errors.LPL_INVALID_LOAN_STATE);

    // state changes and cleanup
    // NOTE: these must be performed before assets are released to prevent reentrance
    _loans[loanId].state = DataTypes.LoanState.Repaid;

    _nftToLoanIds[loan.nftAsset][loan.nftTokenId] = 0;

    require(_userNftCollateral[loan.borrower][loan.nftAsset] >= 1, Errors.LP_INVALID_USER_NFT_AMOUNT);
    _userNftCollateral[loan.borrower][loan.nftAsset] -= 1;

    require(_nftTotalCollateral[loan.nftAsset] >= 1, Errors.LP_INVALID_NFT_AMOUNT);
    _nftTotalCollateral[loan.nftAsset] -= 1;

    // burn uNFT and transfer underlying NFT asset to user
    IUNFT(uNftAddress).burn(loan.nftTokenId);

    IERC721Upgradeable(loan.nftAsset).safeTransferFrom(address(this), _msgSender(), loan.nftTokenId);

    emit LoanRepaid(initiator, loanId, loan.nftAsset, loan.nftTokenId, loan.reserveAsset, amount, borrowIndex);
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function auctionLoan(
    address initiator,
    uint256 loanId,
    address onBehalfOf,
    uint256 bidPrice,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external override onlyLendPool {
    // Must use storage to change state
    DataTypes.LoanData storage loan = _loans[loanId];
    address previousBidder = loan.bidderAddress;
    uint256 previousPrice = loan.bidPrice;

    // Ensure valid loan state
    if (loan.bidStartTimestamp == 0) {
      require(loan.state == DataTypes.LoanState.Active, Errors.LPL_INVALID_LOAN_STATE);

      loan.state = DataTypes.LoanState.Auction;
      loan.bidStartTimestamp = block.timestamp;
      loan.firstBidderAddress = onBehalfOf;
    } else {
      require(loan.state == DataTypes.LoanState.Auction, Errors.LPL_INVALID_LOAN_STATE);

      require(bidPrice > loan.bidPrice, Errors.LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE);
    }

    loan.bidBorrowAmount = borrowAmount;
    loan.bidderAddress = onBehalfOf;
    loan.bidPrice = bidPrice;

    emit LoanAuctioned(
      initiator,
      loanId,
      loan.nftAsset,
      loan.nftTokenId,
      loan.bidBorrowAmount,
      borrowIndex,
      onBehalfOf,
      bidPrice,
      previousBidder,
      previousPrice
    );
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function buyoutLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 borrowAmount,
    uint256 borrowIndex,
    uint256 buyoutAmount
  ) external override onlyLendPool {
    // Must use storage to change state
    DataTypes.LoanData storage loan = _loans[loanId];

    // state changes and cleanup
    // NOTE: these must be performed before assets are released to prevent reentrance
    _loans[loanId].state = DataTypes.LoanState.Defaulted;
    _loans[loanId].bidBorrowAmount = borrowAmount;

    _nftToLoanIds[loan.nftAsset][loan.nftTokenId] = 0;

    require(_userNftCollateral[loan.borrower][loan.nftAsset] >= 1, Errors.LP_INVALID_USER_NFT_AMOUNT);
    _userNftCollateral[loan.borrower][loan.nftAsset] -= 1;

    require(_nftTotalCollateral[loan.nftAsset] >= 1, Errors.LP_INVALID_NFT_AMOUNT);
    _nftTotalCollateral[loan.nftAsset] -= 1;

    // burn uNFT and transfer underlying NFT asset to user
    IUNFT(uNftAddress).burn(loan.nftTokenId);

    IERC721Upgradeable(loan.nftAsset).safeTransferFrom(address(this), _msgSender(), loan.nftTokenId);

    emit LoanBoughtOut(
      initiator,
      loanId,
      loan.nftAsset,
      loan.nftTokenId,
      loan.bidBorrowAmount,
      borrowIndex,
      buyoutAmount
    );
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function redeemLoan(
    address initiator,
    uint256 loanId,
    uint256 amountTaken,
    uint256 borrowIndex
  ) external override onlyLendPool {
    // Must use storage to change state
    DataTypes.LoanData storage loan = _loans[loanId];

    // Ensure valid loan state
    require(loan.state == DataTypes.LoanState.Auction, Errors.LPL_INVALID_LOAN_STATE);

    uint256 amountScaled = amountTaken.rayDiv(borrowIndex);
    require(amountScaled != 0, Errors.LPL_INVALID_TAKEN_AMOUNT);

    require(loan.scaledAmount >= amountScaled, Errors.LPL_AMOUNT_OVERFLOW);
    loan.scaledAmount -= amountScaled;

    loan.state = DataTypes.LoanState.Active;
    loan.bidStartTimestamp = 0;
    loan.bidBorrowAmount = 0;
    loan.bidderAddress = address(0);
    loan.bidPrice = 0;
    loan.firstBidderAddress = address(0);

    emit LoanRedeemed(initiator, loanId, loan.nftAsset, loan.nftTokenId, loan.reserveAsset, amountTaken, borrowIndex);
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function liquidateLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external override onlyLendPool {
    // Must use storage to change state
    DataTypes.LoanData storage loan = _loans[loanId];

    // Ensure valid loan state
    require(loan.state == DataTypes.LoanState.Auction, Errors.LPL_INVALID_LOAN_STATE);

    // state changes and cleanup
    // NOTE: these must be performed before assets are released to prevent reentrance
    _loans[loanId].state = DataTypes.LoanState.Defaulted;
    _loans[loanId].bidBorrowAmount = borrowAmount;

    _nftToLoanIds[loan.nftAsset][loan.nftTokenId] = 0;

    require(_userNftCollateral[loan.borrower][loan.nftAsset] >= 1, Errors.LP_INVALID_USER_NFT_AMOUNT);
    _userNftCollateral[loan.borrower][loan.nftAsset] -= 1;

    require(_nftTotalCollateral[loan.nftAsset] >= 1, Errors.LP_INVALID_NFT_AMOUNT);
    _nftTotalCollateral[loan.nftAsset] -= 1;

    // burn uNFT and transfer underlying NFT asset to user
    IUNFT(uNftAddress).burn(loan.nftTokenId);

    IERC721Upgradeable(loan.nftAsset).safeTransferFrom(address(this), _msgSender(), loan.nftTokenId);

    emit LoanLiquidated(
      initiator,
      loanId,
      loan.nftAsset,
      loan.nftTokenId,
      loan.reserveAsset,
      borrowAmount,
      borrowIndex
    );
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function liquidateLoanMarket(
    uint256 loanId,
    address uNftAddress,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external override onlyMarketAdapter {
    DataTypes.LoanData storage loan = _loans[loanId];

    // Ensure valid loan state for market liquidation
    require(
      loan.state == DataTypes.LoanState.Active || loan.state == DataTypes.LoanState.Auction,
      Errors.LPL_INVALID_LOAN_STATE
    );
    require(_userNftCollateral[loan.borrower][loan.nftAsset] >= 1, Errors.LP_INVALID_USER_NFT_AMOUNT);

    require(_nftTotalCollateral[loan.nftAsset] >= 1, Errors.LP_INVALID_NFT_AMOUNT);

    loan.state = DataTypes.LoanState.Defaulted;

    _nftToLoanIds[loan.nftAsset][loan.nftTokenId] = 0;

    _userNftCollateral[loan.borrower][loan.nftAsset] -= 1;

    _nftTotalCollateral[loan.nftAsset] -= 1;

    // burn uNFT
    IUNFT(uNftAddress).burn(loan.nftTokenId);

    //transfer to sender
    IERC721Upgradeable(loan.nftAsset).safeTransferFrom(address(this), _msgSender(), loan.nftTokenId);

    emit LoanLiquidatedMarket(loanId, loan.nftAsset, loan.nftTokenId, loan.reserveAsset, borrowAmount, borrowIndex);
  }

  function updateMarketAdapters(address[] calldata adapters, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = adapters.length;
    for (uint256 i = 0; i < cachedLength; ) {
      require(adapters[i] != address(0), Errors.INVALID_ZERO_ADDRESS);
      _marketAdapters[adapters[i]] = flag;
      unchecked {
        ++i;
      }
    }
  }

  function onERC721Received(address, address, uint256, bytes memory) external pure override returns (bytes4) {
    return IERC721ReceiverUpgradeable.onERC721Received.selector;
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function borrowerOf(uint256 loanId) external view override returns (address) {
    return _loans[loanId].borrower;
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view override returns (uint256) {
    return _nftToLoanIds[nftAsset][nftTokenId];
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getLoan(uint256 loanId) external view override returns (DataTypes.LoanData memory loanData) {
    return _loans[loanId];
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getLoanCollateralAndReserve(
    uint256 loanId
  ) external view override returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount) {
    return (
      _loans[loanId].nftAsset,
      _loans[loanId].nftTokenId,
      _loans[loanId].reserveAsset,
      _loans[loanId].scaledAmount
    );
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getLoanReserveBorrowAmount(uint256 loanId) external view override returns (address, uint256) {
    uint256 scaledAmount = _loans[loanId].scaledAmount;
    if (scaledAmount == 0) {
      return (_loans[loanId].reserveAsset, 0);
    }
    uint256 amount = scaledAmount.rayMul(_getLendPool().getReserveNormalizedVariableDebt(_loans[loanId].reserveAsset));

    return (_loans[loanId].reserveAsset, amount);
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getLoanReserveBorrowScaledAmount(uint256 loanId) external view override returns (address, uint256) {
    return (_loans[loanId].reserveAsset, _loans[loanId].scaledAmount);
  }

  function getLoanHighestBid(uint256 loanId) external view override returns (address, uint256) {
    return (_loans[loanId].bidderAddress, _loans[loanId].bidPrice);
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getNftCollateralAmount(address nftAsset) external view override returns (uint256) {
    return _nftTotalCollateral[nftAsset];
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getUserNftCollateralAmount(address user, address nftAsset) external view override returns (uint256) {
    return _userNftCollateral[user][nftAsset];
  }

  /**
   * @dev returns the LendPool address
   */
  function _getLendPool() internal view returns (ILendPool) {
    return ILendPool(_addressesProvider.getLendPool());
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function getLoanIdTracker() external view override returns (CountersUpgradeable.Counter memory) {
    return _loanIdTracker;
  }

  /**
   * @inheritdoc ILendPoolLoan
   */
  function reMintUNFT(
    address nftAsset,
    uint256 tokenId,
    address oldOnBehalfOf,
    address newOnBehalfOf
  ) external override onlyDebtMarket {
    DataTypes.NftData memory nftData = ILendPool(_addressesProvider.getLendPool()).getNftData(nftAsset);

    require(_userNftCollateral[oldOnBehalfOf][nftAsset] >= 1, Errors.LP_INVALID_USER_NFT_AMOUNT);

    _userNftCollateral[oldOnBehalfOf][nftAsset] -= 1;
    _userNftCollateral[newOnBehalfOf][nftAsset] += 1;

    uint256 loanId = _nftToLoanIds[nftAsset][tokenId];

    DataTypes.LoanData storage loan = _loans[loanId];
    loan.borrower = newOnBehalfOf;

    IUNFT(nftData.uNftAddress).burn(tokenId);
    IUNFT(nftData.uNftAddress).mint(newOnBehalfOf, tokenId);
  }
}
