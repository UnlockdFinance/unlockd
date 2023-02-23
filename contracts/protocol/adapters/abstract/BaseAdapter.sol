// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";

import {Errors} from "../../../libraries/helpers/Errors.sol";
import {GenericLogic} from "../../../libraries/logic/GenericLogic.sol";

abstract contract BaseMarketAdapter is Initializable {
  ILendPoolAddressesProvider internal _addressesProvider;
  ILendPool internal _lendPool;
  ILendPoolLoan internal _lendPoolLoan;

  /**
   * @notice Initialize a new Adapter.
   * @param provider The address of the LendPoolAddressesProvider.
   */
  function __BaseAdapter_init(ILendPoolAddressesProvider provider) internal onlyInitializing {
    require(address(_addressesProvider) != address(0), Errors.INVALID_ZERO_ADDRESS);
    _addressesProvider = provider;
    _lendPool = provider.getLendPool();
    _lendPoolLoan = provider.getLendPoolLoan();
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNALS
    //////////////////////////////////////////////////////////////*/
  function _performInitialChecks(address nftAsset, uint256 tokenId) internal {
    ILendPool cachedPool = _lendPool;
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;

    // Ensure loan exists
    uint256 loanId = ILendPoolLoan(cachedPoolLoan).getCollateralLoanId(nftAsset, nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    // Loan checks
    DataTypes.LoanData memory loanData = ILendPoolLoan(cachedPoolLoan).getLoan(loanId);
    require(loanData.state == DataTypes.LoanState.Active, Errors.LPL_INVALID_LOAN_STATE);

    // NFT data checks
    DataTypes.NftData memory nftData = ILendPool(cachedPool).getNftData(nftAsset);
    require(nftData.uNftAddress != address(0), Errors.LPC_INVALID_UNFT_ADDRESS);
    require(nftData.configuration.getActive(), Errors.VL_NO_ACTIVE_NFT);

    // Additional check for individual asset
    DataTypes.NftConfigurationMap memory nftConfig = ILendPool(cachedPool).getNftAssetConfig(nftAsset, nftTokenId);
    require(nftConfig.getActive(), Errors.VL_NO_ACTIVE_NFT);

    // Reserve data checks
    DataTypes.ReserveData memory reserveData = ILendPool(cachedPool).getReserveData(loanData.reserveAsset);
    require(reserveData.uTokenAddress != address(0), Errors.VL_INVALID_RESERVE_ADDRESS);
    require(reserveData.configuration.getActive(), Errors.VL_NO_ACTIVE_RESERVE);
  }

  function _updateReserveState(address nftAsset, uint256 tokenId) internal {
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = cachedPoolLoan.getLoan(loanId);

    lendPool.updateReserveState(loanData.reserveAsset);
  }

  function _updateReserveInterestRates(address nftAsset, uint256 tokenId) internal {
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = cachedPoolLoan.getLoan(loanId);

    lendPool.updateReserveInterestRates(loanData.reserveAsset);
  }

  function _validateLoanHealthFactor(address nftAsset, uint256 tokenId) internal {
    ILendPool cachedPool = _lendPool;
    ILendPoolLoan cachedPoolLoan = _lendPoolLoan;
    ILendPoolAddressesProvider cachedAddressesProvider = _lendPoolAddressesProvider;

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, tokenId);
    DataTypes.LoanData memory loanData = cachedPoolLoan.getLoan(loanId);

    DataTypes.ReserveData memory reserveData = cachedPool.getReserveData(loanData.reserveAsset);

    DataTypes.NftConfigurationMap memory nftConfig = cachedPool.getNftAssetConfig(nftAsset, nftTokenId);

    (, , uint256 healthFactor) = GenericLogic.calculateLoanData(
      loanData.reserveAsset,
      reserveData,
      nftAsset,
      tokenId,
      nftConfig,
      cachedPoolLoan,
      loanId,
      cachedAddressesProvider.getReserveOracle(),
      cachedAddressesProvider.getNFTOracle()
    );

    // Loan must be unhealthy
    require(
      healthFactor <= GenericLogic.HEALTH_FACTOR_LIQUIDATION_THRESHOLD,
      Errors.VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  }
}
