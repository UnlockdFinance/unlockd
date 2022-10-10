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
   * @param user The address of the user initiating the auction
   * @param reserve The address of the underlying asset of the reserve
   * @param bidPrice The price of the underlying reserve given by the bidder
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token id of the underlying NFT used as collateral
   * @param onBehalfOf The address that will be getting the NFT
   * @param loanId The loan ID of the NFT loans
   **/
  event Auction(
    address user,
    address indexed reserve,
    uint256 bidPrice,
    address indexed nftAsset,
    uint256 nftTokenId,
    address onBehalfOf,
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
    address initiator;
    uint256 loanId;
    uint256 thresholdPrice;
    uint256 liquidatePrice;
    uint256 borrowAmount;
    uint256 auctionEndTimestamp;
    uint256 minBidDelta;
    uint256 extraAuctionDuration;
  }

  /**
   * @notice Implements the auction feature. Through `auction()`, users auction assets in the protocol.
   * @dev Emits the `Auction()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param poolStates The state of the lend pool
   * @param params The additional parameters needed to execute the auction function
   */
  function executeAuction(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap)) storage nftsConfig,
    DataTypes.ExecuteLendPoolStates memory poolStates,
    DataTypes.ExecuteAuctionParams memory params
  ) external {
    require(params.onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);

    AuctionLocalVars memory vars;
    vars.initiator = params.initiator;

    vars.loanAddress = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();

    vars.loanId = ILendPoolLoan(vars.loanAddress).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.loanAddress).getLoan(vars.loanId);

    //Initiator can not bid for same onBehalfOf address, as the new auction would be the same as the currently existing auction
    //created by them previously. Nevertheless, it is possible for the initiator to bid for a different `onBehalfOf` address,
    //as the new bidderAddress will be different.
    require(params.onBehalfOf != loanData.bidderAddress, Errors.LP_CONSECUTIVE_BIDS_NOT_ALLOWED);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftConfigurationMap storage nftConfig = nftsConfig[loanData.nftAsset][loanData.nftTokenId];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];

    ValidationLogic.validateAuction(reserveData, nftData, nftConfig, loanData, params.bidPrice);

    // update state MUST BEFORE get borrow amount which is depent on latest borrow index
    reserveData.updateState();

    (vars.borrowAmount, vars.thresholdPrice, vars.liquidatePrice) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftConfig,
      vars.loanAddress,
      vars.reserveOracle,
      vars.nftOracle
    );

    // first time bid need to burn debt tokens and transfer reserve to uTokens
    if (loanData.state == DataTypes.LoanState.Active) {
      // loan's accumulated debt must exceed threshold (heath factor below 1.0)
      require(vars.borrowAmount > vars.thresholdPrice, Errors.LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD);

      // bid price must greater than liquidate price
      require(params.bidPrice >= vars.liquidatePrice, Errors.LPL_BID_PRICE_LESS_THAN_LIQUIDATION_PRICE);

      // bid price must greater than borrow debt
      require(params.bidPrice >= vars.borrowAmount, Errors.LPL_BID_PRICE_LESS_THAN_BORROW);
    } else {
      // bid price must greater than borrow debt
      require(params.bidPrice >= vars.borrowAmount, Errors.LPL_BID_PRICE_LESS_THAN_BORROW);

      if ((poolStates.pauseDurationTime > 0) && (loanData.bidStartTimestamp <= poolStates.pauseStartTime)) {
        vars.extraAuctionDuration = poolStates.pauseDurationTime;
      }
      vars.auctionEndTimestamp =
        loanData.bidStartTimestamp +
        vars.extraAuctionDuration +
        (nftConfig.getAuctionDuration() * 1 hours);
      require(block.timestamp <= vars.auctionEndTimestamp, Errors.LPL_BID_AUCTION_DURATION_HAS_END);

      // bid price must greater than highest bid + delta
      vars.minBidDelta = vars.borrowAmount.percentMul(PercentageMath.ONE_PERCENT);
      require(params.bidPrice >= (loanData.bidPrice + vars.minBidDelta), Errors.LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE);
    }

    ILendPoolLoan(vars.loanAddress).auctionLoan(
      vars.initiator,
      vars.loanId,
      params.onBehalfOf,
      params.bidPrice,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // lock highest bidder bid price amount to lend pool
    IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(vars.initiator, address(this), params.bidPrice);

    // transfer (return back) last bid price amount to previous bidder from lend pool
    if (loanData.bidderAddress != address(0)) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.bidderAddress, loanData.bidPrice);
    }

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, 0, 0);

    emit Auction(
      vars.initiator,
      loanData.reserveAsset,
      params.bidPrice,
      params.nftAsset,
      params.nftTokenId,
      params.onBehalfOf,
      loanData.borrower,
      vars.loanId
    );
  }

  struct RedeemLocalVars {
    address initiator;
    address poolLoan;
    address reserveOracle;
    address nftOracle;
    uint256 loanId;
    uint256 borrowAmount;
    uint256 repayAmount;
    uint256 minRepayAmount;
    uint256 maxRepayAmount;
    uint256 bidFine;
    uint256 redeemEndTimestamp;
    uint256 minBidFinePct;
    uint256 minBidFine;
    uint256 extraRedeemDuration;
  }

  /**
   * @notice Implements the redeem feature. Through `redeem()`, users redeem assets in the protocol.
   * @dev Emits the `Redeem()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param poolStates The state of the lend pool
   * @param params The additional parameters needed to execute the redeem function
   */
  function executeRedeem(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap)) storage nftsConfig,
    DataTypes.ExecuteLendPoolStates memory poolStates,
    DataTypes.ExecuteRedeemParams memory params
  ) external returns (uint256) {
    RedeemLocalVars memory vars;
    vars.initiator = params.initiator;

    vars.poolLoan = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();

    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];
    DataTypes.NftConfigurationMap storage nftConfig = nftsConfig[loanData.nftAsset][loanData.nftTokenId];

    ValidationLogic.validateRedeem(reserveData, nftData, nftConfig, loanData, params.amount);

    if ((poolStates.pauseDurationTime > 0) && (loanData.bidStartTimestamp <= poolStates.pauseStartTime)) {
      vars.extraRedeemDuration = poolStates.pauseDurationTime;
    }
    vars.redeemEndTimestamp = (loanData.bidStartTimestamp +
      vars.extraRedeemDuration +
      nftConfig.getRedeemDuration() *
      1 hours);
    require(block.timestamp <= vars.redeemEndTimestamp, Errors.LPL_BID_REDEEM_DURATION_HAS_END);

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

    // check bid fine in min & max range
    (, vars.bidFine) = GenericLogic.calculateLoanBidFine(
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      nftConfig,
      loanData,
      vars.poolLoan,
      vars.reserveOracle
    );

    // check bid fine is enough
    require(vars.bidFine <= params.bidFine, Errors.LPL_INVALID_BID_FINE);

    // check the minimum debt repay amount, use redeem threshold in config
    vars.repayAmount = params.amount;
    vars.minRepayAmount = vars.borrowAmount.percentMul(nftConfig.getRedeemThreshold());
    require(vars.repayAmount >= vars.minRepayAmount, Errors.LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD);

    // check the maxinmum debt repay amount, 90%?
    vars.maxRepayAmount = vars.borrowAmount.percentMul(PercentageMath.PERCENTAGE_FACTOR - PercentageMath.TEN_PERCENT);
    require(vars.repayAmount <= vars.maxRepayAmount, Errors.LP_AMOUNT_GREATER_THAN_MAX_REPAY);

    ILendPoolLoan(vars.poolLoan).redeemLoan(
      vars.initiator,
      vars.loanId,
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

    if (loanData.bidderAddress != address(0)) {
      // transfer (return back) last bid price amount from lend pool to bidder
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.bidderAddress, loanData.bidPrice);

      // transfer bid penalty fine amount from borrower to the first bidder
      IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(
        vars.initiator,
        loanData.firstBidderAddress,
        vars.bidFine
      );
    }

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

  struct LiquidateLocalVars {
    address initiator;
    address poolLoan;
    address reserveOracle;
    address nftOracle;
    uint256 loanId;
    uint256 borrowAmount;
    uint256 extraDebtAmount;
    uint256 remainAmount;
    uint256 auctionEndTimestamp;
    uint256 extraAuctionDuration;
  }

  /**
   * @notice Implements the liquidate feature. Through `liquidate()`, users liquidate assets in the protocol.
   * @dev Emits the `Liquidate()` event.
   * @param reservesData The state of all the reserves
   * @param nftsData The state of all the nfts
   * @param nftsConfig The state of the nft by tokenId
   * @param poolStates The state of the lend pool
   * @param params The additional parameters needed to execute the liquidate function
   */
  function executeLiquidate(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap)) storage nftsConfig,
    DataTypes.ExecuteLendPoolStates memory poolStates,
    DataTypes.ExecuteLiquidateParams memory params
  ) external returns (uint256) {
    LiquidateLocalVars memory vars;
    vars.initiator = params.initiator;

    vars.poolLoan = addressesProvider.getLendPoolLoan();
    vars.reserveOracle = addressesProvider.getReserveOracle();
    vars.nftOracle = addressesProvider.getNFTOracle();

    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(params.nftAsset, params.nftTokenId);
    require(vars.loanId != 0, Errors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = reservesData[loanData.reserveAsset];
    DataTypes.NftData storage nftData = nftsData[loanData.nftAsset];
    DataTypes.NftConfigurationMap storage nftConfig = nftsConfig[loanData.nftAsset][loanData.nftTokenId];

    ValidationLogic.validateLiquidate(reserveData, nftData, nftConfig, loanData);

    if ((poolStates.pauseDurationTime > 0) && (loanData.bidStartTimestamp <= poolStates.pauseStartTime)) {
      vars.extraAuctionDuration = poolStates.pauseDurationTime;
    }
    vars.auctionEndTimestamp =
      loanData.bidStartTimestamp +
      vars.extraAuctionDuration +
      (nftConfig.getAuctionDuration() * 1 hours); // Per  Collection or NFT ??
    require(block.timestamp > vars.auctionEndTimestamp, Errors.LPL_BID_AUCTION_DURATION_NOT_END);

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

    // Last bid price can not cover borrow amount
    if (loanData.bidPrice < vars.borrowAmount) {
      vars.extraDebtAmount = vars.borrowAmount - loanData.bidPrice;
      require(params.amount >= vars.extraDebtAmount, Errors.LP_AMOUNT_LESS_THAN_EXTRA_DEBT);
    }

    if (loanData.bidPrice > vars.borrowAmount) {
      vars.remainAmount = loanData.bidPrice - vars.borrowAmount;
    }

    ILendPoolLoan(vars.poolLoan).liquidateLoan(
      loanData.bidderAddress,
      vars.loanId,
      nftData.uNftAddress,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    IDebtToken(reserveData.debtTokenAddress).burn(
      loanData.borrower,
      vars.borrowAmount,
      reserveData.variableBorrowIndex
    );

    // update interest rate according latest borrow amount (utilizaton)
    reserveData.updateInterestRates(loanData.reserveAsset, reserveData.uTokenAddress, vars.borrowAmount, 0);

    // transfer extra borrow amount from liquidator to lend pool
    if (vars.extraDebtAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(vars.initiator, address(this), vars.extraDebtAmount);
    }

    // transfer borrow amount from lend pool to uToken, repay debt
    IERC20Upgradeable(loanData.reserveAsset).safeTransfer(reserveData.uTokenAddress, vars.borrowAmount);

    // transfer remain amount to borrower
    if (vars.remainAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransfer(loanData.borrower, vars.remainAmount);
    }

    // transfer erc721 to bidder
    IERC721Upgradeable(loanData.nftAsset).safeTransferFrom(address(this), loanData.bidderAddress, params.nftTokenId);

    emit Liquidate(
      vars.initiator,
      loanData.reserveAsset,
      vars.borrowAmount,
      vars.remainAmount,
      loanData.nftAsset,
      loanData.nftTokenId,
      loanData.borrower,
      vars.loanId
    );

    return (vars.extraDebtAmount);
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
   * @param nftsConfig The state of the nft by TokenId
   * @param params The additional parameters needed to execute the liquidate function
   */
  function executeLiquidateOpensea(
    ILendPoolAddressesProvider addressesProvider,
    mapping(address => DataTypes.ReserveData) storage reservesData,
    mapping(address => DataTypes.NftData) storage nftsData,
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap)) storage nftsConfig,
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
    DataTypes.NftConfigurationMap storage nftConfig = nftsConfig[loanData.nftAsset][loanData.nftTokenId];

    ValidationLogic.validateLiquidate(reserveData, nftData, nftConfig, loanData);

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

    // transfer borrow amount from lend pool to uToken, repay debt
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
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap)) storage nftsConfig,
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

    uint256 priceInReserve = ILendPoolLoan(vars.poolLoan).liquidateLoanNFTX(
      vars.loanId,
      nftData.uNftAddress,
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

    // NFTX selling price was lower than borrow amount. Treasury must cover the loss
    if (vars.extraDebtAmount > 0) {
      IERC20Upgradeable(loanData.reserveAsset).safeTransferFrom(
        IUToken(reserveData.uTokenAddress).RESERVE_TREASURY_ADDRESS(),
        address(this),
        vars.extraDebtAmount
      );
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
