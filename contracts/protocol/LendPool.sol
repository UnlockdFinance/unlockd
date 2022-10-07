// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {GenericLogic} from "../libraries/logic/GenericLogic.sol";
import {PercentageMath} from "../libraries/math/PercentageMath.sol";
import {ReserveLogic} from "../libraries/logic/ReserveLogic.sol";
import {NftLogic} from "../libraries/logic/NftLogic.sol";
import {ValidationLogic} from "../libraries/logic/ValidationLogic.sol";
import {SupplyLogic} from "../libraries/logic/SupplyLogic.sol";
import {BorrowLogic} from "../libraries/logic/BorrowLogic.sol";
import {LiquidateLogic} from "../libraries/logic/LiquidateLogic.sol";

import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../libraries/configuration/NftConfiguration.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {LendPoolStorage} from "./LendPoolStorage.sol";
import {LendPoolStorageExt} from "./LendPoolStorageExt.sol";

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC721ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title LendPool contract
 * @dev Main point of interaction with an Unlockd protocol's market
 * - Users can:
 *   # Deposit
 *   # Withdraw
 *   # Borrow
 *   # Repay
 *   # Auction
 *   # Liquidate
 * - To be covered by a proxy contract, owned by the LendPoolAddressesProvider of the specific market
 * - All admin functions are callable by the LendPoolConfigurator contract defined also in the
 *   LendPoolAddressesProvider
 * @author Unlockd
 **/
// !!! For Upgradable: DO NOT ADJUST Inheritance Order !!!
contract LendPool is
  Initializable,
  ILendPool,
  LendPoolStorage,
  ContextUpgradeable,
  IERC721ReceiverUpgradeable,
  LendPoolStorageExt
{
  using WadRayMath for uint256;
  using PercentageMath for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;
  using SafeERC20 for IERC20;
  using ReserveLogic for DataTypes.ReserveData;
  using NftLogic for DataTypes.NftData;
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
  using NftConfiguration for DataTypes.NftConfigurationMap;

  bytes32 public constant ADDRESS_ID_WETH_GATEWAY = 0xADDE000000000000000000000000000000000000000000000000000000000001;
  bytes32 public constant ADDRESS_ID_PUNK_GATEWAY = 0xADDE000000000000000000000000000000000000000000000000000000000002;

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

  modifier whenNotPaused() {
    _whenNotPaused();
    _;
  }

  modifier onlyLendPoolConfigurator() {
    _onlyLendPoolConfigurator();
    _;
  }

  modifier onlyLendPoolLiquidatorOrGateway() {
    _onlyLendPoolLiquidatorOrGateway();
    _;
  }

  /**
   * @notice Revert if called by any account other than the rescuer.
   */
  modifier onlyRescuer() {
    require(msg.sender == _rescuer, "Rescuable: caller is not the rescuer");
    _;
  }

  function _whenNotPaused() internal view {
    require(!_paused, Errors.LP_IS_PAUSED);
  }

  function _onlyLendPoolConfigurator() internal view {
    require(_addressesProvider.getLendPoolConfigurator() == _msgSender(), Errors.LP_CALLER_NOT_LEND_POOL_CONFIGURATOR);
  }

  function _onlyLendPoolLiquidatorOrGateway() internal view {
    require(
      _addressesProvider.getLendPoolLiquidator() == _msgSender() ||
        _addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY) == _msgSender() ||
        _addressesProvider.getAddress(ADDRESS_ID_PUNK_GATEWAY) == _msgSender(),
      Errors.LP_CALLER_NOT_LEND_POOL_LIQUIDATOR_NOR_GATEWAY
    );
  }

  /**
   * @dev Address allowed to recover accidentally sent ERC20 tokens to the LendPool
   **/
  address private _rescuer;

  /**
   * @dev Function is invoked by the proxy contract when the LendPool contract is added to the
   * LendPoolAddressesProvider of the market.
   * - Caching the address of the LendPoolAddressesProvider in order to reduce gas consumption
   *   on subsequent operations
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider provider) public initializer {
    require(address(provider) != address(0), Errors.INVALID_ZERO_ADDRESS);

    _maxNumberOfReserves = 32;
    _maxNumberOfNfts = 255;
    _liquidateFeePercentage = 250;
    _addressesProvider = provider;
  }

  /**
   * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying uTokens.
   * - E.g. User deposits 100 USDC and gets in return 100 uusdc
   * @param asset The address of the underlying asset to deposit
   * @param amount The amount to be deposited
   * @param onBehalfOf The address that will receive the uTokens, same as msg.sender if the user
   *   wants to receive them on his own wallet, or a different address if the beneficiary of uTokens
   *   is a different wallet
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   *   0 if the action is executed directly by the user, without any middle-man
   **/
  function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external override nonReentrant whenNotPaused {
    SupplyLogic.executeDeposit(
      _reserves,
      DataTypes.ExecuteDepositParams({
        initiator: _msgSender(),
        asset: asset,
        amount: amount,
        onBehalfOf: onBehalfOf,
        referralCode: referralCode
      })
    );
  }

  /**
   * @dev Withdraws an `amount` of underlying asset from the reserve, burning the equivalent uTokens owned
   * E.g. User has 100 uusdc, calls withdraw() and receives 100 USDC, burning the 100 uusdc
   * @param asset The address of the underlying asset to withdraw
   * @param amount The underlying amount to be withdrawn
   *   - Send the value type(uint256).max in order to withdraw the whole uToken balance
   * @param to Address that will receive the underlying, same as msg.sender if the user
   *   wants to receive it on his own wallet, or a different address if the beneficiary is a
   *   different wallet
   * @return The final amount withdrawn
   **/
  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external override nonReentrant whenNotPaused returns (uint256) {
    return
      SupplyLogic.executeWithdraw(
        _reserves,
        DataTypes.ExecuteWithdrawParams({initiator: _msgSender(), asset: asset, amount: amount, to: to})
      );
  }

  /**
   * @dev Allows users to borrow a specific `amount` of the reserve underlying asset
   * - E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
   *   and lock collateral asset in contract
   * @param asset The address of the underlying asset to borrow
   * @param amount The amount to be borrowed
   * @param nftAsset The address of the underlying nft used as collateral
   * @param nftTokenId The token ID of the underlying nft used as collateral
   * @param onBehalfOf Address of the user who will receive the loan. Should be the address of the borrower itself
   * calling the function if he wants to borrow against his own collateral
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   * 0 if the action is executed directly by the user, without any middle-man
   * @param nftConfigFee the estimate gas cost of configuring each NFT.
   **/
  function borrow(
    address asset,
    uint256 amount,
    address nftAsset,
    uint256 nftTokenId,
    address onBehalfOf,
    uint16 referralCode,
    uint256 nftConfigFee
  ) external override nonReentrant whenNotPaused {
    BorrowLogic.executeBorrow(
      _addressesProvider,
      _reserves,
      _nfts,
      _nftConfig,
      DataTypes.ExecuteBorrowParams({
        initiator: _msgSender(),
        asset: asset,
        amount: amount,
        nftAsset: nftAsset,
        nftTokenId: nftTokenId,
        onBehalfOf: onBehalfOf,
        referralCode: referralCode
      }),
      nftConfigFee
    );
  }

  /**
   * @notice Repays a borrowed `amount` on a specific reserve, burning the equivalent loan owned
   * - E.g. User repays 100 USDC, burning loan and receives collateral asset
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param amount The amount to repay
   **/
  function repay(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external override nonReentrant whenNotPaused returns (uint256, bool) {
    return
      BorrowLogic.executeRepay(
        _addressesProvider,
        _reserves,
        _nfts,
        _nftConfig,
        DataTypes.ExecuteRepayParams({
          initiator: _msgSender(),
          nftAsset: nftAsset,
          nftTokenId: nftTokenId,
          amount: amount
        })
      );
  }

  /**
   * @dev Function to auction a non-healthy position collateral-wise
   * - The bidder want to buy collateral asset of the user getting liquidated
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param bidPrice The bid price of the bidder want to buy underlying NFT
   * @param onBehalfOf Address of the user who will get the underlying NFT, same as msg.sender if the user
   *   wants to receive them on his own wallet, or a different address if the beneficiary of NFT
   *   is a different wallet
   **/
  function auction(
    address nftAsset,
    uint256 nftTokenId,
    uint256 bidPrice,
    address onBehalfOf
  ) external override nonReentrant whenNotPaused {
    LiquidateLogic.executeAuction(
      _addressesProvider,
      _reserves,
      _nfts,
      _nftConfig,
      _buildLendPoolVars(),
      DataTypes.ExecuteAuctionParams({
        initiator: _msgSender(),
        nftAsset: nftAsset,
        nftTokenId: nftTokenId,
        bidPrice: bidPrice,
        onBehalfOf: onBehalfOf
      })
    );
  }

  /**
   * @notice Redeem a NFT loan which state is in Auction
   * - E.g. User repays 100 USDC, burning loan and receives collateral asset
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param amount The amount to repay the debt
   * @param bidFine The amount of bid fine
   **/
  function redeem(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount,
    uint256 bidFine
  ) external override nonReentrant whenNotPaused returns (uint256) {
    return
      LiquidateLogic.executeRedeem(
        _addressesProvider,
        _reserves,
        _nfts,
        _nftConfig,
        _buildLendPoolVars(),
        DataTypes.ExecuteRedeemParams({
          initiator: _msgSender(),
          nftAsset: nftAsset,
          nftTokenId: nftTokenId,
          amount: amount,
          bidFine: bidFine
        })
      );
  }

  /**
   * @dev Function to liquidate a non-healthy position collateral-wise
   * - The caller (liquidator) buy collateral asset of the user getting liquidated, and receives
   *   the collateral asset
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   **/
  function liquidate(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external override nonReentrant whenNotPaused returns (uint256) {
    return
      LiquidateLogic.executeLiquidate(
        _addressesProvider,
        _reserves,
        _nfts,
        _nftConfig,
        _buildLendPoolVars(),
        DataTypes.ExecuteLiquidateParams({
          initiator: _msgSender(),
          nftAsset: nftAsset,
          nftTokenId: nftTokenId,
          amount: amount
        })
      );
  }

  /**
   * @dev Function to liquidate a non-healthy position collateral-wise
   * - The collateral asset is sold on NFTX
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   **/
  function liquidateNFTX(address nftAsset, uint256 nftTokenId)
    external
    override
    nonReentrant
    onlyLendPoolLiquidatorOrGateway
    whenNotPaused
    returns (uint256)
  {
    return
      LiquidateLogic.executeLiquidateNFTX(
        _addressesProvider,
        _reserves,
        _nfts,
        _nftConfig,
        DataTypes.ExecuteLiquidateNFTXParams({
          nftAsset: nftAsset,
          nftTokenId: nftTokenId,
          liquidateFeePercentage: _liquidateFeePercentage
        })
      );
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external pure override returns (bytes4) {
    operator;
    from;
    tokenId;
    data;
    return IERC721ReceiverUpgradeable.onERC721Received.selector;
  }

  /**
   * @dev Returns the configuration of the reserve
   * @param asset The address of the underlying asset of the reserve
   * @return The configuration of the reserve
   **/
  function getReserveConfiguration(address asset)
    external
    view
    override
    returns (DataTypes.ReserveConfigurationMap memory)
  {
    return _reserves[asset].configuration;
  }

  /**
   * @dev Returns the configuration of the NFT
   * @param asset The address of the asset of the NFT
   * @return The configuration of the NFT
   **/
  function getNftConfiguration(address asset) external view override returns (DataTypes.NftConfigurationMap memory) {
    return _nfts[asset].configuration;
  }

  function getNftConfigByTokenId(address asset, uint256 nftTokenId)
    external
    view
    override
    returns (DataTypes.NftConfigurationMap memory)
  {
    return _nftConfig[asset][nftTokenId];
  }

  /**
   * @dev Returns the normalized income of the reserve
   * @param asset The address of the underlying asset of the reserve
   * @return The reserve's normalized income
   */
  function getReserveNormalizedIncome(address asset) external view override returns (uint256) {
    return _reserves[asset].getNormalizedIncome();
  }

  /**
   * @dev Returns the normalized variable debt per unit of asset
   * @param asset The address of the underlying asset of the reserve
   * @return The reserve normalized variable debt
   */
  function getReserveNormalizedVariableDebt(address asset) external view override returns (uint256) {
    return _reserves[asset].getNormalizedDebt();
  }

  /**
   * @dev Returns the state and configuration of the reserve
   * @param asset The address of the underlying asset of the reserve
   * @return The state of the reserve
   **/
  function getReserveData(address asset) external view override returns (DataTypes.ReserveData memory) {
    return _reserves[asset];
  }

  /**
   * @dev Returns the state and configuration of the nft
   * @param asset The address of the underlying asset of the nft
   * @return The state of the nft
   **/
  function getNftData(address asset) external view override returns (DataTypes.NftData memory) {
    return _nfts[asset];
  }

  /**
   * @dev Returns the configuration of the nft asset
   * @param asset The address of the underlying asset of the nft
   * @param tokenId NFT asset ID
   * @return The configuration of the nft asset
   **/
  function getNftAssetConfig(address asset, uint256 tokenId)
    external
    view
    override
    returns (DataTypes.NftConfigurationMap memory)
  {
    return _nftConfig[asset][tokenId];
  }

  /**
   * @dev Returns the loan data of the NFT
   * @param nftAsset The address of the NFT
   * @param reserveAsset The address of the Reserve
   * @return totalCollateralInETH the total collateral in ETH of the NFT
   * @return totalCollateralInReserve the total collateral in Reserve of the NFT
   * @return availableBorrowsInETH the borrowing power in ETH of the NFT
   * @return availableBorrowsInReserve the borrowing power in Reserve of the NFT
   * @return ltv the loan to value of the user
   * @return liquidationThreshold the liquidation threshold of the NFT
   * @return liquidationBonus the liquidation bonus of the NFT
   **/
  function getNftCollateralData(
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset
  )
    external
    view
    override
    returns (
      uint256 totalCollateralInETH,
      uint256 totalCollateralInReserve,
      uint256 availableBorrowsInETH,
      uint256 availableBorrowsInReserve,
      uint256 ltv,
      uint256 liquidationThreshold,
      uint256 liquidationBonus
    )
  {
    DataTypes.NftConfigurationMap storage nftConfig = _nftConfig[nftAsset][nftTokenId];

    DataTypes.ReserveData storage reserveData = _reserves[reserveAsset];

    (ltv, liquidationThreshold, liquidationBonus) = nftConfig.getCollateralParams();

    (totalCollateralInETH, totalCollateralInReserve) = GenericLogic.calculateNftCollateralData(
      reserveAsset,
      reserveData,
      nftAsset,
      nftTokenId,
      _addressesProvider.getReserveOracle(),
      _addressesProvider.getNFTOracle()
    );

    availableBorrowsInETH = GenericLogic.calculateAvailableBorrows(totalCollateralInETH, 0, ltv);
    availableBorrowsInReserve = GenericLogic.calculateAvailableBorrows(totalCollateralInReserve, 0, ltv);
  }

  /**
   * @dev Returns the debt data of the NFT
   * @param nftAsset The address of the NFT
   * @param nftTokenId The token id of the NFT
   * @return loanId the loan id of the NFT
   * @return reserveAsset the address of the Reserve
   * @return totalCollateral the total power of the NFT
   * @return totalDebt the total debt of the NFT
   * @return availableBorrows the borrowing power left of the NFT
   * @return healthFactor the current health factor of the NFT
   **/
  function getNftDebtData(address nftAsset, uint256 nftTokenId)
    external
    view
    override
    returns (
      uint256 loanId,
      address reserveAsset,
      uint256 totalCollateral,
      uint256 totalDebt,
      uint256 availableBorrows,
      uint256 healthFactor
    )
  {
    DataTypes.NftConfigurationMap storage nftConfig = _nftConfig[nftAsset][nftTokenId];

    (uint256 ltv, uint256 liquidationThreshold, ) = nftConfig.getCollateralParams();

    loanId = ILendPoolLoan(_addressesProvider.getLendPoolLoan()).getCollateralLoanId(nftAsset, nftTokenId);
    if (loanId == 0) {
      return (0, address(0), 0, 0, 0, 0);
    }

    DataTypes.LoanData memory loan = ILendPoolLoan(_addressesProvider.getLendPoolLoan()).getLoan(loanId);

    reserveAsset = loan.reserveAsset;
    DataTypes.ReserveData storage reserveData = _reserves[reserveAsset];

    (, totalCollateral) = GenericLogic.calculateNftCollateralData(
      reserveAsset,
      reserveData,
      nftAsset,
      nftTokenId,
      _addressesProvider.getReserveOracle(),
      _addressesProvider.getNFTOracle()
    );

    (, totalDebt) = GenericLogic.calculateNftDebtData(
      reserveAsset,
      reserveData,
      _addressesProvider.getLendPoolLoan(),
      loanId,
      _addressesProvider.getReserveOracle()
    );

    availableBorrows = GenericLogic.calculateAvailableBorrows(totalCollateral, totalDebt, ltv);

    if (loan.state == DataTypes.LoanState.Active) {
      healthFactor = GenericLogic.calculateHealthFactorFromBalances(totalCollateral, totalDebt, liquidationThreshold);
    }
  }

  /**
   * @dev Returns the auction data of the NFT
   * @param nftAsset The address of the NFT
   * @param nftTokenId The token id of the NFT
   * @return loanId the loan id of the NFT
   * @return bidderAddress the highest bidder address of the loan
   * @return bidPrice the highest bid price in Reserve of the loan
   * @return bidBorrowAmount the borrow amount in Reserve of the loan
   * @return bidFine the penalty fine of the loan
   **/
  function getNftAuctionData(address nftAsset, uint256 nftTokenId)
    external
    view
    override
    returns (
      uint256 loanId,
      address bidderAddress,
      uint256 bidPrice,
      uint256 bidBorrowAmount,
      uint256 bidFine
    )
  {
    DataTypes.NftConfigurationMap storage nftConfig = _nftConfig[nftAsset][nftTokenId];
    ILendPoolLoan poolLoan = ILendPoolLoan(_addressesProvider.getLendPoolLoan());

    loanId = poolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    if (loanId != 0) {
      DataTypes.LoanData memory loan = ILendPoolLoan(_addressesProvider.getLendPoolLoan()).getLoan(loanId);
      DataTypes.ReserveData storage reserveData = _reserves[loan.reserveAsset];

      bidderAddress = loan.bidderAddress;
      bidPrice = loan.bidPrice;
      bidBorrowAmount = loan.bidBorrowAmount;

      (, bidFine) = GenericLogic.calculateLoanBidFine(
        loan.reserveAsset,
        reserveData,
        nftAsset,
        nftConfig,
        loan,
        address(poolLoan),
        _addressesProvider.getReserveOracle()
      );
    }
  }

  struct GetLiquidationPriceLocalVars {
    address poolLoan;
    uint256 loanId;
    uint256 thresholdPrice;
    uint256 liquidatePrice;
    uint256 paybackAmount;
    uint256 remainAmount;
  }

  /**
   * @dev Returns the state and configuration of the nft
   * @param nftAsset The address of the underlying asset of the nft
   * @param nftTokenId The token ID of the asset
   **/
  function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId)
    external
    view
    override
    returns (uint256 liquidatePrice, uint256 paybackAmount)
  {
    GetLiquidationPriceLocalVars memory vars;

    vars.poolLoan = _addressesProvider.getLendPoolLoan();
    vars.loanId = ILendPoolLoan(vars.poolLoan).getCollateralLoanId(nftAsset, nftTokenId);
    if (vars.loanId == 0) {
      return (0, 0);
    }

    DataTypes.LoanData memory loanData = ILendPoolLoan(vars.poolLoan).getLoan(vars.loanId);

    DataTypes.ReserveData storage reserveData = _reserves[loanData.reserveAsset];
    DataTypes.NftConfigurationMap storage nftConfig = _nftConfig[nftAsset][nftTokenId];

    (vars.paybackAmount, vars.thresholdPrice, vars.liquidatePrice) = GenericLogic.calculateLoanLiquidatePrice(
      vars.loanId,
      loanData.reserveAsset,
      reserveData,
      loanData.nftAsset,
      loanData.nftTokenId,
      nftConfig,
      vars.poolLoan,
      _addressesProvider.getReserveOracle(),
      _addressesProvider.getNFTOracle()
    );

    if (vars.liquidatePrice < vars.paybackAmount) {
      vars.liquidatePrice = vars.paybackAmount;
    }

    return (vars.liquidatePrice, vars.paybackAmount);
  }

  /**
   * @dev Validates and finalizes an uToken transfer
   * - Only callable by the overlying uToken of the `asset`
   * @param asset The address of the underlying asset of the uToken
   * @param from The user from which the uToken are transferred
   * @param to The user receiving the uTokens
   * @param amount The amount being transferred/withdrawn
   * @param balanceFromBefore The uToken balance of the `from` user before the transfer
   * @param balanceToBefore The uToken balance of the `to` user before the transfer
   */
  function finalizeTransfer(
    address asset,
    address from,
    address to,
    uint256 amount,
    uint256 balanceFromBefore,
    uint256 balanceToBefore
  ) external view override whenNotPaused {
    asset;
    from;
    to;
    amount;
    balanceFromBefore;
    balanceToBefore;

    DataTypes.ReserveData storage reserve = _reserves[asset];
    require(_msgSender() == reserve.uTokenAddress, Errors.LP_CALLER_MUST_BE_AN_UTOKEN);

    ValidationLogic.validateTransfer(from, reserve);
  }

  /**
   * @dev Returns the list of the initialized reserves
   **/
  function getReservesList() external view override returns (address[] memory) {
    address[] memory _activeReserves = new address[](_reservesCount);

    for (uint256 i = 0; i < _reservesCount; ) {
      _activeReserves[i] = _reservesList[i];
      unchecked {
        ++i;
      }
    }
    return _activeReserves;
  }

  /**
   * @dev Returns the list of the initialized nfts
   **/
  function getNftsList() external view override returns (address[] memory) {
    address[] memory _activeNfts = new address[](_nftsCount);

    for (uint256 i = 0; i < _nftsCount; ) {
      _activeNfts[i] = _nftsList[i];
      ++i;
    }
    return _activeNfts;
  }

  /**
   * @dev Set the _pause state of the pool
   * - Only callable by the LendPoolConfigurator contract
   * @param val `true` to pause the pool, `false` to un-pause it
   */
  function setPause(bool val) external override onlyLendPoolConfigurator {
    if (_paused != val) {
      _paused = val;
      if (_paused) {
        _pauseStartTime = block.timestamp;
        emit Paused();
      } else {
        _pauseDurationTime = block.timestamp - _pauseStartTime;
        emit Unpaused();
      }
    }
  }

  /**
   * @dev Returns if the LendPool is paused
   */
  function paused() external view override returns (bool) {
    return _paused;
  }

  function setPausedTime(uint256 startTime, uint256 durationTime) external override onlyLendPoolConfigurator {
    _pauseStartTime = startTime;
    _pauseDurationTime = durationTime;
    emit PausedTimeUpdated(startTime, durationTime);
  }

  function getPausedTime() external view override returns (uint256, uint256) {
    return (_pauseStartTime, _pauseDurationTime);
  }

  /**
   * @dev Returns the cached LendPoolAddressesProvider connected to this contract
   **/
  function getAddressesProvider() external view override returns (ILendPoolAddressesProvider) {
    return _addressesProvider;
  }

  /**
   * @dev Sets the max number of reserves in the protocol
   * @param val the value to set the max number of reserves
   **/
  function setMaxNumberOfReserves(uint256 val) external override onlyLendPoolConfigurator {
    require(val <= 255, Errors.LP_INVALID_OVERFLOW_VALUE); //Sanity check to avoid overflows in `_addReserveToList`
    _maxNumberOfReserves = val;
  }

  /**
   * @dev Returns the maximum number of reserves supported to be listed in this LendPool
   */
  function getMaxNumberOfReserves() external view override returns (uint256) {
    return _maxNumberOfReserves;
  }

  /**
   * @dev Sets the max number of NFTs in the protocol
   * @param val the value to set the max number of NFTs
   **/
  function setMaxNumberOfNfts(uint256 val) external override onlyLendPoolConfigurator {
    require(val <= 255, Errors.LP_INVALID_OVERFLOW_VALUE); //Sanity check to avoid overflows in `_addNftToList`
    _maxNumberOfNfts = val;
  }

  /**
   * @dev Returns the maximum number of nfts supported to be listed in this LendPool
   */
  function getMaxNumberOfNfts() external view override returns (uint256) {
    return _maxNumberOfNfts;
  }

  function setLiquidateFeePercentage(uint256 percentage) external override onlyLendPoolConfigurator {
    _liquidateFeePercentage = percentage;
  }

  /**
   * @dev Returns the liquidate fee percentage
   */
  function getLiquidateFeePercentage() external view override returns (uint256) {
    return _liquidateFeePercentage;
  }

  /**
   * @dev Initializes a reserve, activating it, assigning an uToken and nft loan and an
   * interest rate strategy
   * - Only callable by the LendPoolConfigurator contract
   * @param asset The address of the underlying asset of the reserve
   * @param uTokenAddress The address of the uToken that will be assigned to the reserve
   * @param debtTokenAddress The address of the debtToken that will be assigned to the reserve
   * @param interestRateAddress The address of the interest rate strategy contract
   **/
  function initReserve(
    address asset,
    address uTokenAddress,
    address debtTokenAddress,
    address interestRateAddress
  ) external override onlyLendPoolConfigurator {
    require(AddressUpgradeable.isContract(asset), Errors.LP_NOT_CONTRACT);
    require(
      uTokenAddress != address(0) && debtTokenAddress != address(0) && interestRateAddress != address(0),
      Errors.INVALID_ZERO_ADDRESS
    );
    _reserves[asset].init(uTokenAddress, debtTokenAddress, interestRateAddress);
    _addReserveToList(asset);
  }

  /**
   * @dev Initializes a nft, activating it, assigning nft loan and an
   * interest rate strategy
   * - Only callable by the LendPoolConfigurator contract
   * @param asset The address of the underlying asset of the nft
   * @param uNftAddress the address of the UNFT regarding the chosen asset
   **/
  function initNft(address asset, address uNftAddress) external override onlyLendPoolConfigurator {
    require(AddressUpgradeable.isContract(asset), Errors.LP_NOT_CONTRACT);
    require(uNftAddress != address(0), Errors.INVALID_ZERO_ADDRESS);
    _nfts[asset].init(uNftAddress);
    _addNftToList(asset);

    require(_addressesProvider.getLendPoolLoan() != address(0), Errors.LPC_INVALIED_LOAN_ADDRESS);
    IERC721Upgradeable(asset).setApprovalForAll(_addressesProvider.getLendPoolLoan(), true);

    ILendPoolLoan(_addressesProvider.getLendPoolLoan()).initNft(asset, uNftAddress);
  }

  /**
   * @dev Updates the address of the interest rate strategy contract
   * - Only callable by the LendPoolConfigurator contract
   * @param asset The address of the underlying asset of the reserve
   * @param rateAddress The address of the interest rate strategy contract
   **/
  function setReserveInterestRateAddress(address asset, address rateAddress)
    external
    override
    onlyLendPoolConfigurator
  {
    require(asset != address(0) && rateAddress != address(0), Errors.INVALID_ZERO_ADDRESS);
    _reserves[asset].interestRateAddress = rateAddress;
    emit ReserveInterestRateAddressChanged(asset, rateAddress);
  }

  /**
   * @dev Sets the configuration bitmap of the reserve as a whole
   * - Only callable by the LendPoolConfigurator contract
   * @param asset The address of the underlying asset of the reserve
   * @param configuration The new configuration bitmap
   **/
  function setReserveConfiguration(address asset, uint256 configuration) external override onlyLendPoolConfigurator {
    _reserves[asset].configuration.data = configuration;
    emit ReserveConfigurationChanged(asset, configuration);
  }

  /**
   * @dev Sets the configuration bitmap of the NFT as a whole
   * - Only callable by the LendPoolConfigurator contract
   * @param asset The address of the asset of the NFT
   * @param configuration The new configuration bitmap
   **/
  function setNftConfiguration(address asset, uint256 configuration) external override onlyLendPoolConfigurator {
    _nfts[asset].configuration.data = configuration;
    emit NftConfigurationChanged(asset, configuration);
  }

  /**
   * @dev Sets the configuration bitmap of the NFT as a whole
   * - Only callable by the LendPoolConfigurator contract
   * @param asset The address of the asset of the NFT
   * @param nftTokenId the tokenId of the asset
   * @param configuration The new configuration bitmap
   **/
  function setNftConfigByTokenId(
    address asset,
    uint256 nftTokenId,
    uint256 configuration
  ) external override onlyLendPoolConfigurator {
    _nftConfig[asset][nftTokenId].data = configuration;
    emit NftConfigurationByIdChanged(asset, nftTokenId, configuration);
  }

  /**
   * @dev Sets the max supply and token ID for a given asset
   * @param asset The address to set the data
   * @param maxSupply The max supply value
   * @param maxTokenId The max token ID value
   **/
  function setNftMaxSupplyAndTokenId(
    address asset,
    uint256 maxSupply,
    uint256 maxTokenId
  ) external override onlyLendPoolConfigurator {
    _nfts[asset].maxSupply = maxSupply;
    _nfts[asset].maxTokenId = maxTokenId;
  }

  /**
   * @notice Rescue ERC20 tokens locked up in this contract.
   * @param tokenContract ERC20 token contract address
   * @param to        Recipient address
   * @param amount    Amount to withdraw
   */
  function rescueERC20(
    IERC20 tokenContract,
    address to,
    uint256 amount
  ) external override onlyRescuer {
    tokenContract.safeTransfer(to, amount);
  }

  /**
   * @notice Assign the rescuer role to a given address.
   * @param newRescuer New rescuer's address
   */
  function updateRescuer(address newRescuer) external override onlyLendPoolConfigurator {
    require(newRescuer != address(0), "Rescuable: new rescuer is the zero address");
    _rescuer = newRescuer;
    emit RescuerChanged(newRescuer);
  }

  /**
   * @notice Returns current rescuer
   * @return Rescuer's address
   */
  function rescuer() external view override returns (address) {
    return _rescuer;
  }

  function _addReserveToList(address asset) internal {
    uint256 reservesCount = _reservesCount;

    require(reservesCount < _maxNumberOfReserves, Errors.LP_NO_MORE_RESERVES_ALLOWED);

    bool reserveAlreadyAdded = _reserves[asset].id != 0 || _reservesList[0] == asset;

    if (!reserveAlreadyAdded) {
      _reserves[asset].id = uint8(reservesCount);
      _reservesList[reservesCount] = asset;

      _reservesCount = reservesCount + 1;
    }
  }

  function _addNftToList(address asset) internal {
    uint256 nftsCount = _nftsCount;

    require(nftsCount < _maxNumberOfNfts, Errors.LP_NO_MORE_NFTS_ALLOWED);

    bool nftAlreadyAdded = _nfts[asset].id != 0 || _nftsList[0] == asset;

    if (!nftAlreadyAdded) {
      _nfts[asset].id = uint8(nftsCount);
      _nftsList[nftsCount] = asset;

      _nftsCount = nftsCount + 1;
    }
  }

  function _buildLendPoolVars() internal view returns (DataTypes.ExecuteLendPoolStates memory) {
    return DataTypes.ExecuteLendPoolStates({pauseStartTime: _pauseStartTime, pauseDurationTime: _pauseDurationTime});
  }
}
