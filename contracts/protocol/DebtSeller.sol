pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";

contract DebtSeller is Initializable, ContextUpgradeable {
  using CountersUpgradeable for CountersUpgradeable.Counter;

  ILendPoolAddressesProvider internal _addressesProvider;

  CountersUpgradeable.Counter private _debtIdTracker;
  mapping(uint256 => DataTypes.SellDebt) private _debts;
  mapping(address => mapping(uint256 => uint256)) private _nftToDebtIds;

  modifier onlyPoolAdmin() {
    require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }

  function initialize(ILendPoolAddressesProvider addressesProvider) external initializer {
    _addressesProvider = addressesProvider;
  }

  function sellNow() external onlyPoolAdmin {}

  function createDebtListing(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    bool auction,
    uint256 auctionEndTimestamp
  ) external onlyPoolAdmin {
    require(onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);
    require(sellPrice > 0, "MORE THAN 0");
    require(_nftToDebtIds[nftAsset][tokenId] == 0, "DEBT ALREADY EXIST");

    address lendPoolLoanAddress = _addressesProvider.getLendPoolLoan();
    uint256 loanId = ILendPoolLoan(lendPoolLoanAddress).getCollateralLoanId(nftAsset, tokenId);
    require(loanId != 0, "LOAN SHOULD EXIST");

    uint256 debtId = _debtIdTracker.current();
    _debtIdTracker.increment();
    _nftToDebtIds[nftAsset][tokenId] = debtId;
    DataTypes.SellDebt storage sellDebt = _debts[debtId];

    sellDebt.debtId = debtId;
    sellDebt.nftAsset = nftAsset;
    sellDebt.tokenId = tokenId;
    sellDebt.sellPrice = sellPrice;
    sellDebt.debtor = onBehalfOf;
    sellDebt.auction = auction;

    (, , address reserveAsset, uint256 scaleAmount) = ILendPoolLoan(lendPoolLoanAddress).getLoanCollateralAndReserve(
      loanId
    );
    sellDebt.reserveAsset = reserveAsset;
    sellDebt.scaleAmount = scaleAmount;

    if (auction) {
      require(auctionEndTimestamp > block.timestamp, "AUCTION ALREADY ENDED");
    }
  }

  function getDebtId(address nftAsset, uint256 tokenId) external view returns (uint256) {
    return _nftToDebtIds[nftAsset][tokenId];
  }

  function getDebt(uint256 debtId) external view returns (DataTypes.SellDebt memory sellDebt) {
    return _debts[debtId];
  }

  function getDebtIdTracker() external view returns (CountersUpgradeable.Counter memory) {
    return _debtIdTracker;
  }
}
