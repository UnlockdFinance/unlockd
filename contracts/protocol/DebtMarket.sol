// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {GenericLogic} from "../libraries/logic/GenericLogic.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IDebtSeller} from "../interfaces/IDebtMarket.sol";
import {IUNFT} from "../interfaces/IUNFT.sol";
import {IDebtToken} from "../interfaces/IDebtToken.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";

import "hardhat/console.sol";

contract DebtMarket is Initializable, ContextUpgradeable, IDebtSeller {
  using CountersUpgradeable for CountersUpgradeable.Counter;

  ILendPoolAddressesProvider internal _addressesProvider;

  CountersUpgradeable.Counter private _debtIdTracker;
  mapping(uint256 => DataTypes.DebtMarketListing) private _marketDebts;
  mapping(address => mapping(uint256 => uint256)) private _nftToDebtIds;
  mapping(address => mapping(address => uint256)) private _userTotalDebtByCollection;
  mapping(address => uint256) private _totalDebtsByCollection;

  modifier onlyPoolAdmin() {
    require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }
  modifier onlyOwnerOfBorrowedNft(address nftAsset, uint256 tokenId) {
    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = ILendPoolLoan(lendPoolLoanAddress).getLoan(loanId);

    require(loanData.borrower == msg.sender, "Caller not owner fo the nft");
    _;
  }

  modifier debtShouldExistGuard(address nftAsset, uint256 tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    require(debtId != 0, "DEBT SHOULD EXIST");
    DataTypes.DebtMarketListing memory selldebt = _marketDebts[debtId];
    require(_userTotalDebtByCollection[selldebt.debtor][nftAsset] >= 1, "DEBT SHOULD EXIST");
    require(_totalDebtsByCollection[nftAsset] >= 1, "DEBT SHOULD EXIST");
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

  function buy(address nftAsset, uint256 tokenId) external payable debtShouldExistGuard(nftAsset, tokenId) {
    BuyLocalVars memory vars;

    vars.lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    vars.lendPoolAddress = _addressesProvider.getLendPool();
    vars.loanId = ILendPoolLoan(vars.lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    (, vars.borrowAmount) = ILendPoolLoan(vars.lendPoolLoanAddress).getLoanReserveBorrowAmount(vars.loanId);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.lendPoolLoanAddress).getLoan(vars.loanId);
    DataTypes.ReserveData memory reserveData = ILendPool(vars.lendPoolAddress).getReserveData(loanData.reserveAsset);
    DataTypes.NftData memory nftData = ILendPool(vars.lendPoolAddress).getNftData(loanData.nftAsset);
    vars.buyer = _msgSender();

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
      nftData.uNftAddress,
      loanData.nftTokenId,
      loanData.borrower,
      vars.buyer
    );
    // Remove the offer listting
    DataTypes.DebtMarketListing storage marketOrder = _marketDebts[vars.debtId];
    marketOrder.state = DataTypes.DebtMarketState.Sold;
    _deleteDebtOfferListting(nftAsset, tokenId);

    // Pay to the seller with ERC20
    console.log(marketOrder.sellPrice, msg.value);

    require(msg.value == marketOrder.sellPrice, "Insufficient amount");

    (bool sent, ) = loanData.borrower.call{value: marketOrder.sellPrice}("");
    require(sent, "Failed to send Ether");

    // Create a event
    emit DebtSold(loanData.borrower, vars.buyer, vars.debtId);
  }

  function _deleteDebtOfferListting(address nftAsset, uint256 tokenId) internal {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage selldebt = _marketDebts[debtId];

    _userTotalDebtByCollection[selldebt.debtor][nftAsset] -= 1;
    _totalDebtsByCollection[nftAsset] -= 1;
  }

  function cancelDebtListing(address nftAsset, uint256 tokenId) external debtShouldExistGuard(nftAsset, tokenId) {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];

    _nftToDebtIds[nftAsset][tokenId] = 0;
    DataTypes.DebtMarketListing storage selldebt = _marketDebts[debtId];
    require(selldebt.state != DataTypes.DebtMarketState.Sold, "DEBT SHOULD NOT BE SOLD");
    selldebt.state = DataTypes.DebtMarketState.Canceled;
    _deleteDebtOfferListting(nftAsset, tokenId);

    emit DebtListtingCanceled(
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
  ) public onlyOwnerOfBorrowedNft(nftAsset, tokenId) {
    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage sellDebt = _marketDebts[debtId];
  }

  function _createDebt(address nftAsset, uint256 tokenId, uint256 sellPrice, address onBehalfOf) internal {
    require(onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);
    require(sellPrice > 0, "MORE THAN 0");
    require(_nftToDebtIds[nftAsset][tokenId] == 0, "DEBT ALREADY EXIST");

    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    require(loanId != 0, "LOAN SHOULD EXIST");

    uint256 debtId = _debtIdTracker.current();
    _debtIdTracker.increment();
    _nftToDebtIds[nftAsset][tokenId] = debtId;
    DataTypes.DebtMarketListing storage marketListing = _marketDebts[debtId];

    marketListing.debtId = debtId;
    marketListing.nftAsset = nftAsset;
    marketListing.tokenId = tokenId;
    marketListing.sellPrice = sellPrice;
    marketListing.debtor = onBehalfOf;
    marketListing.sellType = DataTypes.DebtMarketType.FixedPrice;
    (, , address reserveAsset, uint256 scaleAmount) = ILendPoolLoan(lendPoolLoanAddress).getLoanCollateralAndReserve(
      loanId
    );
    marketListing.reserveAsset = reserveAsset;
    marketListing.scaleAmount = scaleAmount;
    marketListing.state = DataTypes.DebtMarketState.New;

    _userTotalDebtByCollection[onBehalfOf][nftAsset] += 1;
    _totalDebtsByCollection[nftAsset] += 1;

    emit DebtListtingCreated(
      marketListing,
      _totalDebtsByCollection[nftAsset],
      _userTotalDebtByCollection[marketListing.debtor][nftAsset]
    );
  }

  function createDebtListingWithAuction(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    uint256 auctionEndTimestamp
  ) external onlyOwnerOfBorrowedNft(nftAsset, tokenId) {
    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage marketListing = _marketDebts[debtId];
    marketListing.sellType = DataTypes.DebtMarketType.Auction;

    require(auctionEndTimestamp > block.timestamp, "AUCTION ALREADY ENDED");
    //Create auction
  }

  function getDebtId(address nftAsset, uint256 tokenId) external view returns (uint256) {
    return _nftToDebtIds[nftAsset][tokenId];
  }

  function getDebt(uint256 debtId) external view returns (DataTypes.DebtMarketListing memory sellDebt) {
    return _marketDebts[debtId];
  }

  function getDebtIdTracker() external view returns (CountersUpgradeable.Counter memory) {
    return _debtIdTracker;
  }
}
