// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IUToken} from "../../interfaces/IUToken.sol";
import {IDebtToken} from "../../interfaces/IDebtToken.sol";
import {IInterestRate} from "../../interfaces/IInterestRate.sol";
import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IReserveOracleGetter} from "../../interfaces/IReserveOracleGetter.sol";
import {INFTOracleGetter} from "../../interfaces/INFTOracleGetter.sol";
import {ILendPoolLoan} from "../../interfaces/ILendPoolLoan.sol";

import {ReserveLogic} from "./ReserveLogic.sol";
import {GenericLogic} from "./GenericLogic.sol";
import {ValidationLogic} from "./ValidationLogic.sol";

import {ReserveConfiguration} from "../configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../configuration/NftConfiguration.sol";
import {WadRayMath} from "../math/WadRayMath.sol";
import {PercentageMath} from "../math/PercentageMath.sol";
import {Errors} from "../helpers/Errors.sol";
import {DataTypes} from "../types/DataTypes.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/**
 * @title LiquidateLogic library
 * @author Unlockd
 * @notice Implements the logic to liquidate feature
 */
library LiquidateMarketsLogic {
  using WadRayMath for uint256;
  using PercentageMath for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;
  using ReserveLogic for DataTypes.ReserveData;
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
  using NftConfiguration for DataTypes.NftConfigurationMap;

  /**
   * @dev Emitted when a borrower's loan is liquidated on NFTX.
   * @param reserve The address of the underlying asset of the reserve
   * @param repayAmount The amount of reserve repaid by the liquidator
   * @param remainAmount The amount of reserve received by the borrower
   * @param loanId The loan ID of the NFT loans
   **/
  event LiquidateNFTX(
    address indexed reserve,
    uint256 repayAmount,
    uint256 remainAmount,
    address indexed nftAsset,
    uint256 nftTokenId,
    address indexed borrower,
    uint256 loanId
  );

  struct LiquidateNFTXLocalVars {
    address poolLoan;
    address reserveOracle;
    address nftOracle;
    address liquidator;
    uint256 loanId;
    uint256 borrowAmount;
    uint256 extraDebtAmount;
    uint256 remainAmount;
    uint256 feeAmount;
    uint256 auctionEndTimestamp;
  }

  /**
   * @notice Implements the liquidate feature on NFTX. Through `liquidateNFTX()`, users liquidate assets in the protocol.
   * @dev Emits the `LiquidateNFTX()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param params The additional parameters needed to execute the liquidate function
   */
  function executeLiquidateNFTX(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap)) storage nftsConfig,
    mapping(address => mapping(uint8 => bool)) storage isMarketSupported,
    DataTypes.ExecuteLiquidateNFTXParams memory params
  ) external returns (uint256) {
    LiquidateNFTXLocalVars memory vars;

    vars.poolLoan = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();
    vars.liquidator = addressesProvider.getLendPoolLiquidator();

    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];
    DataTypes.NftConfigurationMap storage nftConfig = nftsConfig[loanData.nftAsset][loanData.nftTokenId];

    require(isMarketSupported[loanData.nftAsset][0], Errors.LP_NFT_NOT_ALLOWED_TO_SELL);

    ValidationLogic.validateLiquidateNFTX(reserveData, nftData, nftConfig, loanData);

    // Check for health factor
    (, , uint256 healthFactor) = GenericLogic.calculateLoanData(
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftConfig,
      vars.poolLoan,
      vars.loanId,
      vars.reserveOracle,
      vars.nftOracle
    );

    //Loan must be unhealthy in order to get liquidated
    require(
      healthFactor <= GenericLogic.HEALTH_FACTOR_LIQUIDATION_THRESHOLD,
      Errors.VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, , ) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftConfig,
      vars.poolLoan,
      vars.reserveOracle,
      vars.nftOracle
    );

    uint256 priceNFTX = ILendPoolLoan(vars.poolLoan).liquidateLoanNFTX(
      vars.loanId,
      nftData.uNftAddress,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // Liquidation Fee
    vars.feeAmount = priceNFTX.percentMul(params.liquidateFeePercentage);
    priceNFTX = priceNFTX - vars.feeAmount;

    // Remaining Amount
    if (priceNFTX > vars.borrowAmount) {
      vars.remainAmount = priceNFTX - vars.borrowAmount;
    }

    // Extra Debt Amount
    if (priceNFTX < vars.borrowAmount) {
      vars.extraDebtAmount = vars.borrowAmount - priceNFTX;
    }

    IDebtToken(reserveData.debtTokenAddress).burn(
      loanData.borrower,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, vars.borrowAmount, 0);

    // NFTX selling price was lower than borrow amount. Treasury must cover the loss
    if (vars.extraDebtAmount > 0) {
      address treasury = IUToken(reserveData.uTokenAddress).RESERVE_TREASURY_ADDRESS();
      require(
        IERC20Upgradeable(loanData.reserveAsset).balanceOf(treasury) > vars.extraDebtAmount,
        Errors.VL_VALUE_EXCEED_TREASURY_BALANCE
      );
      IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(treasury, address(this), vars.extraDebtAmount);
    }

    // transfer borrow amount from lend pool to uToken, repay debt
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(reserveData.uTokenAddress, vars.borrowAmount);

    // transfer fee amount from lend pool to liquidator
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(vars.liquidator, vars.feeAmount);

    // transfer remain amount to borrower
    if (vars.remainAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.borrower, vars.remainAmount);
    }

    emit LiquidateNFTX(
      loanData.reserveAsset,
      vars.borrowAmount,
      vars.remainAmount,
      loanData.nftAsset,
      loanData.nftTokenId,
      loanData.borrower,
      vars.loanId
    );

    return (vars.remainAmount);
  }
}
