// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ILendPoolAddressesProvider} from "../../../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPool} from "../../../interfaces/ILendPool.sol";
import {ILendPoolLoan} from "../../../interfaces/ILendPoolLoan.sol";

import {DataTypes} from "../../../libraries/types/DataTypes.sol";
import {NftConfiguration} from "../../../libraries/configuration/NftConfiguration.sol";

abstract contract BaseAdapter is Initializable {
  using NftConfiguration for DataTypes.NftConfigurationMap;

  /*//////////////////////////////////////////////////////////////
                          ERRORS
  //////////////////////////////////////////////////////////////*/
  error InvalidZeroAddress();
  error ReentrantCall();
  error NftNotUsedAsCollateral();
  error InvalidLoanState();
  error InvalidUNftAddress();
  error InactiveNft();
  error InvalidUTokenAddress();
  error InactiveReserve();
  error InactiveUToken();
  error LoanIsHealthy();

  /*//////////////////////////////////////////////////////////////
                          EVENTS
  //////////////////////////////////////////////////////////////*/

  /*//////////////////////////////////////////////////////////////
                          CONSTANTS
  //////////////////////////////////////////////////////////////*/
  uint256 internal constant HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1e18;
  uint256 internal constant ACTIVE_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFF;
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;

  /*//////////////////////////////////////////////////////////////
                          GENERAL VARS
  //////////////////////////////////////////////////////////////*/
  ILendPoolAddressesProvider internal _addressesProvider;

  ILendPool internal _lendPool;

  ILendPoolLoan internal _lendPoolLoan;

  uint256 private _status;

  /*//////////////////////////////////////////////////////////////
                          MODIFIERS
  //////////////////////////////////////////////////////////////*/

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and making it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    if (status == _ENTERED) _revert(ReentrantCall.selector);
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
  }

  /*//////////////////////////////////////////////////////////////
                          INITIALIZATION
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Initialize a new Adapter.
   * @param provider The address of the LendPoolAddressesProvider.
   */
  function __BaseAdapter_init(ILendPoolAddressesProvider provider) internal onlyInitializing {
    if (address(provider) == address(0)) revert InvalidZeroAddress();
    _addressesProvider = provider;
    _lendPool = ILendPool(provider.getLendPool());
    _lendPoolLoan = ILendPoolLoan(provider.getLendPoolLoan());
    _status = _NOT_ENTERED;
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNALS
  //////////////////////////////////////////////////////////////*/
  function _performInitialChecks(address nftAsset, uint256 tokenId) internal {
    ILendPool cachedPool = _lendPool;
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;

    // Ensure loan exists
    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, tokenId);
    if (loanId == 0) _revert(NftNotUsedAsCollateral.selector);

    // Loan checks
    DataTypes.LoanData memory loanData = cachedPoolLoan.getLoan(loanId);
    if (loanData.state != DataTypes.LoanState.Active) _revert(InvalidLoanState.selector);

    // NFT general data checks
    DataTypes.NftData memory nftData = cachedPool.getNftData(nftAsset);
    if (nftData.uNftAddress == address(0)) _revert(InvalidUNftAddress.selector);

    // Additional check for individual asset
    DataTypes.NftConfigurationMap memory nftConfigByTokenId = cachedPool.getNftConfigByTokenId(nftAsset, tokenId);
    if ((nftConfigByTokenId.data & ~ACTIVE_MASK) == 0) _revert(InactiveNft.selector);

    // Reserve data checks
    DataTypes.ReserveData memory reserveData = cachedPool.getReserveData(loanData.reserveAsset);

    if (reserveData.uTokenAddress == address(0)) _revert(InvalidUTokenAddress.selector);

    if ((reserveData.configuration.data & ~ACTIVE_MASK) == 0) _revert(InactiveReserve.selector);
  }

  function _updateReserveState(address nftAsset, uint256 tokenId) internal {
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;
    ILendPool cachedPool = _lendPool;

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = cachedPoolLoan.getLoan(loanId);

    cachedPool.updateReserveState(loanData.reserveAsset);
  }

  function _updateReserveInterestRates(address nftAsset, uint256 tokenId) internal {
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;
    ILendPool cachedPool = _lendPool;

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = cachedPoolLoan.getLoan(loanId);

    cachedPool.updateReserveInterestRates(loanData.reserveAsset);
  }

  function _validateLoanHealthFactor(address nftAsset, uint256 tokenId) internal {
    ILendPool cachedPool = _lendPool;

    (uint256 loanId, , , , , uint256 healthFactor) = cachedPool.getNftDebtData(nftAsset, tokenId);

    // Loan must be unhealthy
    if (healthFactor > HEALTH_FACTOR_LIQUIDATION_THRESHOLD) _revert(LoanIsHealthy.selector);
  }

  /**
   * @dev Perform more efficient reverts
   */
  function _revert(bytes4 errorSelector) internal pure {
    //solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(0x00, errorSelector)
      revert(0x00, 0x04)
    }
  }
}
