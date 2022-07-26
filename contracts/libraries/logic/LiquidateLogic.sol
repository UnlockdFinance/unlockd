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
import {MathUtils} from "../math/MathUtils.sol";
import {WadRayMath} from "../math/WadRayMath.sol";
import {PercentageMath} from "../math/PercentageMath.sol";
import {Errors} from "../helpers/Errors.sol";
import {DataTypes} from "../types/DataTypes.sol";
import {SushiSwapHelper} from "../sushiswap/SushiSwapHelper.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC721MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";
import "hardhat/console.sol";

/**
 * @title LiquidateLogic library
 * @author Unlockd
 * @notice Implements the logic to liquidate feature
 */
library LiquidateLogic {
  using WadRayMath for uint256;
  using PercentageMath for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;
  using ReserveLogic for DataTypes.ReserveData;
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
  using NftConfiguration for DataTypes.NftConfigurationMap;

  /**
   * @dev Emitted when a borrower's loan is auctioned.
   * @param reserve The address of the underlying asset of the reserve
   * @param bidPrice The start bid price of the underlying reserve
   * @param auctionDuration Auction duration of the underlying reserve
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token id of the underlying NFT used as collateral
   * @param loanId The loan ID of the NFT loans
   **/
  event Auction(
    address indexed reserve,
    uint256 bidPrice,
    uint256 auctionDuration,
    address indexed nftAsset,
    uint256 nftTokenId,
    address indexed borrower,
    uint256 loanId
  );

  /**
   * @dev Emitted on redeem()
   * @param user The address of the user initiating the redeem(), providing the funds
   * @param reserve The address of the underlying asset of the reserve
   * @param borrowAmount The borrow amount repaid
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token id of the underlying NFT used as collateral
   * @param loanId The loan ID of the NFT loans
   **/
  event Redeem(
    address user,
    address indexed reserve,
    uint256 borrowAmount,
    uint256 fineAmount,
    address indexed nftAsset,
    uint256 nftTokenId,
    address indexed borrower,
    uint256 loanId
  );

  /**
   * @dev Emitted when a borrower's loan is liquidated.
   * @param user The address of the user initiating the auction
   * @param reserve The address of the underlying asset of the reserve
   * @param repayAmount The amount of reserve repaid by the liquidator
   * @param remainAmount The amount of reserve received by the borrower
   * @param loanId The loan ID of the NFT loans
   **/
  event Liquidate(
    address user,
    address indexed reserve,
    uint256 repayAmount,
    uint256 remainAmount,
    address indexed nftAsset,
    uint256 nftTokenId,
    address indexed borrower,
    uint256 loanId
  );

  /**
   * @dev Emitted when a borrower's loan is liquidated on LooksRare.
   * @param reserve The address of the underlying asset of the reserve
   * @param repayAmount The amount of reserve repaid by the liquidator
   * @param remainAmount The amount of reserve received by the borrower
   * @param loanId The loan ID of the NFT loans
   **/
  event LiquidateLooksRare(
    address indexed reserve,
    uint256 repayAmount,
    uint256 remainAmount,
    address indexed nftAsset,
    uint256 nftTokenId,
    address indexed borrower,
    uint256 loanId
  );

  /**
   * @dev Emitted when a borrower's loan is liquidated on Opensea.
   * @param reserve The address of the underlying asset of the reserve
   * @param repayAmount The amount of reserve repaid by the liquidator
   * @param remainAmount The amount of reserve received by the borrower
   * @param loanId The loan ID of the NFT loans
   **/
  event LiquidateOpensea(
    address indexed reserve,
    uint256 repayAmount,
    uint256 remainAmount,
    address indexed nftAsset,
    uint256 nftTokenId,
    address indexed borrower,
    uint256 loanId
  );

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

  struct AuctionLocalVars {
    address loanAddress;
    address reserveOracle;
    address nftOracle;
    address liquidator;
    uint256 loanId;
    uint256 thresholdPrice;
    uint256 liquidatePrice;
    uint256 borrowAmount;
    uint256 auctionEndTimestamp;
    uint256 minBidDelta;
  }

  /**
   * @notice Implements the auction feature. Through `auction()`, users auction assets in the protocol.
   * @dev Emits the `Auction()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param params The additional parameters needed to execute the auction function
   */
  function executeAuction(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    DataTypes.ExecuteAuctionParams memory params
  ) external {
    AuctionLocalVars memory vars;

    vars.loanAddress = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();
    vars.liquidator = addressesProvider.getLendPoolLiquidator();

    vars.loanId = ILendPoolLoan(vars.loanAddress).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.loanAddress).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];

    ValidationLogic.validateAuction(reserveData, nftData, loanData);

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, vars.thresholdPrice, vars.liquidatePrice) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftData,
      vars.loanAddress,
      vars.reserveOracle,
      vars.nftOracle
    );

    // first time bid need to burn debt tokens and transfer reserve to uTokens
    if (loanData.state == DataTypes.LoanState.Active) {
      // loan's accumulated debt must exceed threshold (heath factor below 1.0)
      require(vars.borrowAmount > vars.thresholdPrice, Errors.LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD);
    }

    uint256 minBidPrice = vars.borrowAmount;

    if (vars.liquidatePrice > vars.borrowAmount) {
      minBidPrice = vars.liquidatePrice;
    }

    ILendPoolLoan(vars.loanAddress).auctionLoan(
      vars.loanId,
      nftData.uNftAddress,
      minBidPrice,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, 0, 0);

    // transfer erc721 to liquidator
    IERC721Upgradeable(loanData.nftAsset).safeTransferFrom(address(this), vars.liquidator, params.nftTokenId);

    uint256 auctionDuration = nftData.configuration.getAuctionDuration() * 1 days;

    emit Auction(
      loanData.reserveAsset,
      minBidPrice,
      auctionDuration,
      params.nftAsset,
      params.nftTokenId,
      loanData.borrower,
      vars.loanId
    );
  }

  struct RedeemLocalVars {
    address initiator;
    address liquidator;
    address poolLoan;
    address reserveOracle;
    address nftOracle;
    uint256 loanId;
    uint256 borrowAmount;
    uint256 repayAmount;
    uint256 minRepayAmount;
    uint256 maxRepayAmount;
    uint256 bidFine;
    uint256 auctionEndTimestamp;
    uint256 minBidFinePct;
    uint256 minBidFine;
  }

  /**
   * @notice Implements the redeem feature. Through `redeem()`, users redeem assets in the protocol.
   * @dev Emits the `Redeem()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param params The additional parameters needed to execute the redeem function
   */
  function executeRedeem(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    DataTypes.ExecuteRedeemParams memory params
  ) external returns (uint256) {
    RedeemLocalVars memory vars;
    vars.initiator = params.initiator;

    vars.poolLoan = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();
    vars.liquidator = addressesProvider.getLendPoolLiquidator();

    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];

    ValidationLogic.validateRedeem(reserveData, nftData, loanData, params.amount);

    vars.auctionEndTimestamp = (loanData.auctionStartTimestamp + nftData.configuration.getAuctionDuration() * 1 days);
    require(block.timestamp <= vars.auctionEndTimestamp, Errors.LPL_BID_AUCTION_DURATION_HAS_END);

    // transfer erc721 from the liquidator
    IERC721Upgradeable(params.nftAsset).safeTransferFrom(vars.liquidator, address(this), params.nftTokenId);

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, , ) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftData,
      vars.poolLoan,
      vars.reserveOracle,
      vars.nftOracle
    );

    // check the minimum debt repay amount, use redeem threshold in config
    vars.repayAmount = params.amount;
    vars.minRepayAmount = vars.borrowAmount.percentMul(nftData.configuration.getRedeemThreshold());
    require(vars.repayAmount >= vars.minRepayAmount, Errors.LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD);

    // check the maxinmum debt repay amount, 90%?
    vars.maxRepayAmount = vars.borrowAmount.percentMul(PercentageMath.PERCENTAGE_FACTOR - PercentageMath.TEN_PERCENT);
    require(vars.repayAmount <= vars.maxRepayAmount, Errors.LP_AMOUNT_GREATER_THAN_MAX_REPAY);

    ILendPoolLoan(vars.poolLoan).redeemLoan(
      vars.initiator,
      vars.loanId,
      nftData.uNftAddress,
      vars.repayAmount,
      reserveData.variableBorrowIndex
    );

    IDebtToken(reserveData.debtTokenAddress).burn(loanData.borrower, vars.repayAmount, reserveData.variableBorrowIndex);

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, vars.repayAmount, 0);

    // transfer repay amount from borrower to uToken
    IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(
      vars.initiator,
      reserveData.uTokenAddress,
      vars.repayAmount
    );

    emit Redeem(
      vars.initiator,
      loanData.reserveAsset,
      vars.repayAmount,
      vars.bidFine,
      loanData.nftAsset,
      loanData.nftTokenId,
      loanData.borrower,
      vars.loanId
    );

    return (vars.repayAmount + vars.bidFine);
  }

  struct LiquidateLooksRareLocalVars {
    address poolLoan;
    address reserveOracle;
    address nftOracle;
    uint256 loanId;
    uint256 borrowAmount;
    uint256 extraDebtAmount;
    uint256 remainAmount;
    uint256 auctionEndTimestamp;
  }

  /**
   * @notice Implements the liquidate feature on LooksRare. Through `liquidateLooksRare()`, users liquidate assets in the protocol.
   * @dev Emits the `LiquidateLooksRare()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param params The additional parameters needed to execute the liquidate function
   */
  function executeLiquidateLooksRare(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    DataTypes.ExecuteLiquidateLooksRareParams memory params
  ) external returns (uint256) {
    LiquidateLooksRareLocalVars memory vars;

    vars.poolLoan = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();

    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];

    ValidationLogic.validateLiquidate(reserveData, nftData, loanData);

    vars.auctionEndTimestamp = loanData.auctionStartTimestamp + (nftData.configuration.getAuctionDuration() * 1 days);
    require(block.timestamp > vars.auctionEndTimestamp, Errors.LPL_BID_AUCTION_DURATION_NOT_END);

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, , ) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftData,
      vars.poolLoan,
      vars.reserveOracle,
      vars.nftOracle
    );

    uint256 sellPrice = ILendPoolLoan(vars.poolLoan).liquidateLoanLooksRare(
      vars.loanId,
      nftData.uNftAddress,
      vars.borrowAmount,
      reserveData.variableBorrowIndex,
      params
    );

    vars.remainAmount = sellPrice - vars.borrowAmount;

    IDebtToken(reserveData.debtTokenAddress).burn(
      loanData.borrower,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, vars.borrowAmount, 0);

    // transfer borrow amount from lend pool to uToken, repay debt
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(reserveData.uTokenAddress, vars.borrowAmount);

    // transfer remain amount to borrower
    if (vars.remainAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.borrower, vars.remainAmount);
    }

    emit LiquidateLooksRare(
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

  struct LiquidateOpenseaLocalVars {
    address poolLoan;
    address reserveOracle;
    address nftOracle;
    address liquidator;
    uint256 loanId;
    uint256 borrowAmount;
    uint256 feeAmount;
    uint256 extraDebtAmount;
    uint256 remainAmount;
    uint256 auctionEndTimestamp;
  }

  /**
   * @notice Implements the liquidate feature on Opensea. Through `liquidateOpensea()`, users liquidate assets in the protocol.
   * @dev Emits the `LiquidateOpensea()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param params The additional parameters needed to execute the liquidate function
   */
  function executeLiquidateOpensea(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    DataTypes.ExecuteLiquidateOpenseaParams memory params
  ) external returns (uint256) {
    LiquidateOpenseaLocalVars memory vars;

    vars.poolLoan = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();
    vars.liquidator = addressesProvider.getLendPoolLiquidator();

    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];

    ValidationLogic.validateLiquidate(reserveData, nftData, loanData);

    vars.auctionEndTimestamp = loanData.auctionStartTimestamp + (nftData.configuration.getAuctionDuration() * 1 days);
    require(block.timestamp > vars.auctionEndTimestamp, Errors.LPL_BID_AUCTION_DURATION_NOT_END);

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, , ) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftData,
      vars.poolLoan,
      vars.reserveOracle,
      vars.nftOracle
    );

    ILendPoolLoan(vars.poolLoan).liquidateLoanOpensea(vars.loanId, vars.borrowAmount, reserveData.variableBorrowIndex);

    // Swap ETH to Reserve Asset
    uint256 priceInReserve = SushiSwapHelper.swapExactETHForTokens(
      addressesProvider,
      params.priceInEth,
      loanData.reserveAsset
    );

    // Liquidation Fee
    vars.feeAmount = priceInReserve.percentMul(params.liquidateFeePercentage);
    priceInReserve = priceInReserve - vars.feeAmount;

    // Remaining Amount
    if (priceInReserve > vars.borrowAmount) {
      vars.remainAmount = priceInReserve - vars.borrowAmount;
    }

    // Extra Debt Amount
    if (priceInReserve < vars.borrowAmount) {
      vars.extraDebtAmount = vars.borrowAmount - priceInReserve;
    }

    IDebtToken(reserveData.debtTokenAddress).burn(
      loanData.borrower,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    if (priceInReserve < vars.borrowAmount) {
      vars.borrowAmount = priceInReserve;
    }

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, vars.borrowAmount, 0);

    // transfer borrow amount from lend pool to bToken, repay debt
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(reserveData.uTokenAddress, vars.borrowAmount);

    // transfer fee amount from lend pool to liquidator
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(vars.liquidator, vars.feeAmount);

    // transfer remain amount to borrower
    if (vars.remainAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.borrower, vars.remainAmount);
    }

    // TODO: transfer extra debt from protocol treasury

    emit LiquidateOpensea(
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

    ValidationLogic.validateLiquidate(reserveData, nftData, loanData);

    vars.auctionEndTimestamp = loanData.auctionStartTimestamp + (nftData.configuration.getAuctionDuration() * 1 days);
    require(block.timestamp > vars.auctionEndTimestamp, Errors.LPL_BID_AUCTION_DURATION_NOT_END);

    // Transfer NFT from liquidator to the pool
    IERC721Upgradeable(params.nftAsset).safeTransferFrom(vars.liquidator, address(this), params.nftTokenId);

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, , ) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftData,
      vars.poolLoan,
      vars.reserveOracle,
      vars.nftOracle
    );

    uint256 priceInReserve = ILendPoolLoan(vars.poolLoan).liquidateLoanNFTX(
      vars.loanId,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // Liquidation Fee
    vars.feeAmount = priceInReserve.percentMul(params.liquidateFeePercentage);
    priceInReserve = priceInReserve - vars.feeAmount;

    // Remaining Amount
    if (priceInReserve > vars.borrowAmount) {
      vars.remainAmount = priceInReserve - vars.borrowAmount;
    }

    // Extra Debt Amount
    if (priceInReserve < vars.borrowAmount) {
      vars.extraDebtAmount = vars.borrowAmount - priceInReserve;
    }

    IDebtToken(reserveData.debtTokenAddress).burn(
      loanData.borrower,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    if (priceInReserve < vars.borrowAmount) {
      vars.borrowAmount = priceInReserve;
    }

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, vars.borrowAmount, 0);

    // transfer borrow amount from lend pool to uToken, repay debt
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(reserveData.uTokenAddress, vars.borrowAmount);

    // transfer fee amount from lend pool to liquidator
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(vars.liquidator, vars.feeAmount);

    // transfer remain amount to borrower
    if (vars.remainAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.borrower, vars.remainAmount);
    }

    // TODO: transfer extra debt from protocol treasury

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
