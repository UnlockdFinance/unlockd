// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "./ILendPoolAddressesProvider.sol";
import {IIncentivesController} from "./IIncentivesController.sol";
import {IScaledBalanceToken} from "./IScaledBalanceToken.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC20MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

interface IUToken is IScaledBalanceToken, IERC20Upgradeable, IERC20MetadataUpgradeable {
  /**
   * @dev Reverts when the loss reported by the strategy is higher than the actual debt loaned from the UToken to the strategy
   **/
  error LossHigherThanStrategyTotalDebt();
  /**
   * @dev Reverts when the strategy's balance is less than the actual gains + debt payment reported
   **/
  error InvalidGainAndDebtPayment();
  /**
   * @dev Reverts when the actual withdrawn amount from the strategy is different from the balance increase in the uToken
   **/
  error BalanceMismatch();
  /**
   * @dev Reverts when there is not enough balance of underlying in order to withdraw
   **/
  error NotEnoughLiquidity();
  /**
   * @dev Reverts when the maxmimum tolerated loss is exceeded in the strategy fund withdrawal process
   **/
  error MaxLossExceeded();

  error MaxStrategiesReached();

  error InvalidZeroAddress();

  error InvalidStrategyUToken();

  error InvalidHarvestAmounts();

  error AlreadyZero();

  error InvalidStrategy();

  error InvalidDebtRatio();

  /**
   * @dev Emitted when an uToken is initialized
   * @param underlyingAsset The address of the underlying asset
   * @param pool The address of the associated lending pool
   * @param treasury The address of the treasury
   * @param incentivesController The address of the incentives controller for this uToken
   **/
  event Initialized(
    address indexed underlyingAsset,
    address indexed pool,
    address treasury,
    address incentivesController
  );

  /**
   * @dev Emitted after the mint action
   * @param from The address performing the mint
   * @param value The amount being
   * @param index The new liquidity index of the reserve
   **/
  event Mint(address indexed from, uint256 value, uint256 index);
  /**
   * @dev Emitted after setting of addresses as managers
   * @param managers the managers to be updated
   * @param flag `true` to set addresses as managers, `false` otherwise
   **/
  event UTokenManagersUpdated(address[] indexed managers, bool flag);

  event StrategyAdded(
    address indexed strategy,
    uint256 strategyDebtRatio,
    uint256 strategyMinDebtPerHarvest,
    uint256 strategyMaxDebtPerHarvest
  );

  event StrategyRevoked(address indexed strategy);

  event DepositLimitUpdated(uint256 newDepositLimit);

  event StrategyParamsUpdated(
    address indexed strategy,
    uint256 strategyDebtRatio,
    uint256 strategyMinDebtPerHarvest,
    uint256 strategyMaxDebtPerHarvest
  );

  struct StrategyParams {
    uint256 debtRatio; // Relation between the amount of assets deployed to the strategy and the total amount of assets belonging to the UToken
    uint256 lastReport; // block.timestamp of the last time a report occured
    uint256 totalDebt; // Total outstanding debt that Strategy has
    uint256 totalGain; // Total returns that Strategy has realized for the UToken
    uint256 totalLoss; // Total losses that Strategy has realized for the UToken
    uint256 minDebtPerHarvest; // Lower limit on the increase of debt since last harvest
    uint256 maxDebtPerHarvest; // Upper limit on the increase of debt since last harvest
    bool active; // Whether the strategy is active or not
  }

  /**
   * @dev Initializes the uToken
   * @param addressProvider The address of the address provider where this bToken will be used
   * @param treasury The address of the Unlockd treasury, receiving the fees on this bToken
   * @param underlyingAsset The address of the underlying asset of this bToken
   * @param uTokenDecimals The amount of token decimals
   * @param uTokenName The name of the token
   * @param uTokenSymbol The token symbol
   */
  function initialize(
    ILendPoolAddressesProvider addressProvider,
    address treasury,
    address underlyingAsset,
    uint8 uTokenDecimals,
    string calldata uTokenName,
    string calldata uTokenSymbol
  ) external;

  /**
   * @dev Mints `amount` uTokens to `user`
   * @param user The address receiving the minted tokens
   * @param amount The amount of tokens getting minted
   * @param index The new liquidity index of the reserve
   * @return `true` if the the previous balance of the user was 0
   */
  function mint(address user, uint256 amount, uint256 index) external returns (bool);

  /**
   * @dev Emitted after uTokens are burned
   * @param from The owner of the uTokens, getting them burned
   * @param target The address that will receive the underlying
   * @param value The amount being burned
   * @param index The new liquidity index of the reserve
   **/
  event Burn(address indexed from, address indexed target, uint256 value, uint256 index);

  /**
   * @dev Emitted during the transfer action
   * @param from The user whose tokens are being transferred
   * @param to The recipient
   * @param value The amount being transferred
   * @param index The new liquidity index of the reserve
   **/
  event BalanceTransfer(address indexed from, address indexed to, uint256 value, uint256 index);

  /**
   * @dev Emitted when treasury address is updated in utoken
   * @param _newTreasuryAddress The new treasury address
   **/
  event TreasuryAddressUpdated(address indexed _newTreasuryAddress);

  /**
    @dev Emitted after sweeping liquidity from the uToken to deposit it to external lending protocol
  * @param uToken The uToken swept
  * @param underlyingAsset The underlying asset from the uToken
  * @param amount The amount deposited to the lending protocol
  */
  event UTokenSwept(address indexed uToken, address indexed underlyingAsset, uint256 indexed amount);

  /**
    @dev Emitted after reporting to the UToken from a strategy
  * @param strategy The caller strategy
  * @param gain The gains reported from the strategy
  * @param loss The loss reported from the strategy
  * @param debtPayment The amount to consider as a debt payment
  * @param strategyGain The gains added to the strategy
  * @param strategyLoss The loss added to the strategy
  * @param strategyTotalDebt The strategy's new total debt
  * @param credit The loaned amount to the strategy in this report
  * @param strategyDebtRatio The debt ratio for that strategy
  */
  event StrategyReported(
    address indexed strategy,
    uint256 gain,
    uint256 loss,
    uint256 debtPayment,
    uint256 strategyGain,
    uint256 strategyLoss,
    uint256 strategyTotalDebt,
    uint256 credit,
    uint256 strategyDebtRatio
  );
  /**
   * @dev Emitted after withdrawing funds from a strategy
   * @param strategy The strategy withdrawn from
   * @param amountWithdrawn The amount withdrawn from the strategy
   * @param loss The loss reported from the strategy
   */
  event WithdrawnFromStrategy(address indexed strategy, uint256 indexed amountWithdrawn, uint256 indexed loss);
  /**
   * @dev Emitted after withdrawing funds from the UToken
   * @param amountWithdrawn The amount withdrawn from the UToken in terms of underlying
   */
  event ReservesWithdrawn(uint256 indexed amountWithdrawn);

  /**
   * @dev Burns uTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`
   * @param user The owner of the uTokens, getting them burned
   * @param receiverOfUnderlying The address that will receive the underlying
   * @param amount The amount being burned
   * @param index The new liquidity index of the reserve
   **/
  function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external;

  /**
   * @dev Mints uTokens to the reserve treasury
   * @param amount The amount of tokens getting minted
   * @param index The new liquidity index of the reserve
   */
  function mintToTreasury(uint256 amount, uint256 index) external;

  /**
   * @dev Transfers the underlying asset to `target`. Used by the LendPool to transfer
   * assets in borrow() and withdraw()
   * @param user The recipient of the underlying
   * @param amount The amount getting transferred
   * @return The amount transferred
   **/
  function transferUnderlyingTo(address user, uint256 amount) external returns (uint256);

  function updateStrategyParams(
    address strategy,
    uint256 strategyDebtRatio,
    uint256 strategyMinDebtPerHarvest,
    uint256 strategyMaxDebtPerHarvest
  ) external;

  function setDepositLimit(uint256 newDepositLimit) external;

  function addStrategy(
    address strategy,
    uint256 strategyDebtRatio,
    uint256 strategyMinDebtPerHarvest,
    uint256 strategyMaxDebtPerHarvest
  ) external;

  function revokeStrategy(address strategy) external;

  /**
   * @dev Returns the scaled balance of the user and the scaled total supply.
   * @return The available liquidity in reserve
   **/
  function getAvailableLiquidity() external view returns (uint256);

  /**
   * @dev Returns the address of the incentives controller contract
   **/
  function getIncentivesController() external view returns (IIncentivesController);

  /**
   * @dev Returns the address of the underlying asset of this uToken
   **/
  function UNDERLYING_ASSET_ADDRESS() external view returns (address);

  /**
   * @dev Returns the address of the treasury set to this uToken
   **/
  function RESERVE_TREASURY_ADDRESS() external view returns (address);

  /**
   * @dev Sets the address of the treasury to this uToken
   **/
  function setTreasuryAddress(address treasury) external;

  /**
   * @dev Updates the uToken manager addresses
   **/
  function updateUTokenManagers(address[] calldata managers, bool flag) external;

  function debtOutstanding(address strategy) external returns (uint256);

  function report(uint256 gain, uint256 loss, uint256 _debtPayment) external returns (uint256);

  function getStrategy(address strategy) external view returns (StrategyParams memory);
}
