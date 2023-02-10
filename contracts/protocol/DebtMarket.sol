// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IDebtSeller} from "../interfaces/IDebtMarket.sol";

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

  function initialize(ILendPoolAddressesProvider addressesProvider) external initializer {
    _addressesProvider = addressesProvider;
  }

  function sellNow() external onlyPoolAdmin {}

  function cancelDebtListing(address nftAsset, uint256 tokenId) external {
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    require(debtId != 0, "DEBT SHOULD EXIST");

    _nftToDebtIds[nftAsset][tokenId] = 0;
    DataTypes.DebtMarketListing storage selldebt = _marketDebts[debtId];
    require(selldebt.state != DataTypes.DebtMarketState.Sold, "DEBT SHOULD NOT BE SOLD");

    selldebt.state = DataTypes.DebtMarketState.Canceled;
    require(_userTotalDebtByCollection[selldebt.debtor][nftAsset] >= 1, "DEBT SHOULD EXIST");
    _userTotalDebtByCollection[selldebt.debtor][nftAsset] -= 1;

    require(_totalDebtsByCollection[nftAsset] >= 1, "DEBT SHOULD EXIST");
    _totalDebtsByCollection[nftAsset] -= 1;

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
  ) public onlyPoolAdmin {
    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage sellDebt = _marketDebts[debtId];
    emit DebtListtingCreated(
      sellDebt.debtor,
      sellDebt.debtId,
      sellDebt,
      _totalDebtsByCollection[nftAsset],
      _userTotalDebtByCollection[sellDebt.debtor][nftAsset]
    );
  }

  function _createDebt(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf
  ) internal onlyPoolAdmin {
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
  }

  function createDebtListingWithAuction(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    uint256 auctionEndTimestamp
  ) external onlyPoolAdmin {
    _createDebt(nftAsset, tokenId, sellPrice, onBehalfOf);
    uint256 debtId = _nftToDebtIds[nftAsset][tokenId];
    DataTypes.DebtMarketListing storage marketListing = _marketDebts[debtId];
    marketListing.sellType = DataTypes.DebtMarketType.Auction;
    // Create event
    emit DebtListtingCreated(
      marketListing.debtor,
      marketListing.debtId,
      marketListing,
      _totalDebtsByCollection[nftAsset],
      _userTotalDebtByCollection[marketListing.debtor][nftAsset]
    );

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
