// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPoolConfigurator} from "../interfaces/ILendPoolConfigurator.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {IUToken} from "../interfaces/IUToken.sol";
import {IYVault} from "../interfaces/yearn/IYVault.sol";
import {IIncentivesController} from "../interfaces/IIncentivesController.sol";
import {IncentivizedERC20} from "./IncentivizedERC20.sol";

import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {LendingLogic} from "../libraries/logic/LendingLogic.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title ERC20 UToken
 * @dev Implementation of the interest bearing token for the Unlockd protocol
 * @author Unlockd
 */
contract UToken is Initializable, IUToken, IncentivizedERC20 {
  using WadRayMath for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /*//////////////////////////////////////////////////////////////
                    STATE VARIABLES
  //////////////////////////////////////////////////////////////*/
  ILendPoolAddressesProvider internal _addressProvider;
  address internal _treasury;
  address internal _underlyingAsset;
  mapping(address => bool) internal _uTokenManagers;

  uint256 public constant MAXIMUM_STRATEGIES = 20;
  uint256 public constant MAX_BPS = 10_000;
  // Strategies
  mapping(address => StrategyParams) public strategies;
  address[MAXIMUM_STRATEGIES] public withdrawalQueue;

  // Limit for totalAssets the UToken can hold
  uint256 public depositLimit;
  // Debt ratio for the UToken across all strategies (in BPS, <= 10k)
  uint256 public debtRatio;
  // Amount of `_underlyingAsset` that all strategies have borrowed
  uint256 public totalDebt;
  // block.timestamp of last report
  uint256 public lastReport;
  // How much profit is locked and cant be withdrawn
  uint256 public lockedProfit;
  // Rate per block of degradation. DEGRADATION_COEFFICIENT is 100% per block
  uint256 public lockedProfitDegradation;

  bool public emergencyShutdown;

  /*//////////////////////////////////////////////////////////////
                      MODIFIERS
  //////////////////////////////////////////////////////////////*/
  modifier onlyLendPool() {
    require(_msgSender() == address(_getLendPool()), Errors.CT_CALLER_MUST_BE_LEND_POOL);
    _;
  }

  modifier onlyPoolAdmin() {
    require(_msgSender() == _addressProvider.getPoolAdmin(), Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }

  modifier onlyUTokenManager() {
    require(_uTokenManagers[_msgSender()], Errors.CALLER_NOT_UTOKEN_MANAGER);
    _;
  }

  modifier onlyStrategy() {
    require(_uTokenManagers[_msgSender()], Errors.CALLER_NOT_UTOKEN_MANAGER);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                        INITIALIZATION
  //////////////////////////////////////////////////////////////*/
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  /**
   * @dev Initializes the uToken
   * @param addressProvider The address of the address provider where this uToken will be used
   * @param treasury The address of the Unlockd treasury, receiving the fees on this uToken
   * @param underlyingAsset The address of the underlying asset of this uToken
   */
  function initialize(
    ILendPoolAddressesProvider addressProvider,
    address treasury,
    address underlyingAsset,
    uint8 uTokenDecimals,
    string calldata uTokenName,
    string calldata uTokenSymbol
  ) external override initializer {
    __IncentivizedERC20_init(uTokenName, uTokenSymbol, uTokenDecimals);

    _treasury = treasury;
    _underlyingAsset = underlyingAsset;

    _addressProvider = addressProvider;

    emit Initialized(
      underlyingAsset,
      _addressProvider.getLendPool(),
      treasury,
      _addressProvider.getIncentivesController()
    );
  }

  /*//////////////////////////////////////////////////////////////
                    MINT/BURN LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Burns uTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`
   * - Only callable by the LendPool, as extra state updates there need to be managed
   * @param user The owner of the uTokens, getting them burned
   * @param receiverOfUnderlying The address that will receive the underlying
   * @param amount The amount being burned
   * @param index The new liquidity index of the reserve
   **/
  function burn(
    address user,
    address receiverOfUnderlying,
    uint256 amount,
    uint256 index
  ) external override onlyLendPool {
    uint256 amountScaled = amount.rayDiv(index);

    require(amountScaled != 0, Errors.CT_INVALID_BURN_AMOUNT);
    _burn(user, amountScaled);

    IERC20Upgradeable(_underlyingAsset).safeTransfer(receiverOfUnderlying, amount);

    emit Burn(user, receiverOfUnderlying, amount, index);
  }

  /**
   * @dev Mints `amount` uTokens to `user`
   * - Only callable by the LendPool, as extra state updates there need to be managed
   * @param user The address receiving the minted tokens
   * @param amount The amount of tokens getting minted
   * @param index The new liquidity index of the reserve
   * @return `true` if the the previous balance of the user was 0
   */
  function mint(address user, uint256 amount, uint256 index) external override onlyLendPool returns (bool) {
    uint256 previousBalance = super.balanceOf(user);

    // index is expressed in Ray, so:
    // amount.wadToRay().rayDiv(index).rayToWad() => amount.rayDiv(index)
    uint256 amountScaled = amount.rayDiv(index);
    require(amountScaled != 0, Errors.CT_INVALID_MINT_AMOUNT);
    _mint(user, amountScaled);

    emit Mint(user, amount, index);

    return previousBalance == 0;
  }

  /**
   * @dev Mints uTokens to the reserve treasury
   * - Only callable by the LendPool
   * @param amount The amount of tokens getting minted
   * @param index The new liquidity index of the reserve
   */
  function mintToTreasury(uint256 amount, uint256 index) external override onlyLendPool {
    if (amount == 0) {
      return;
    }

    address treasury = _treasury;

    // Compared to the normal mint, we don't check for rounding errors.
    // The amount to mint can easily be very small since it is a fraction of the interest ccrued.
    // In that case, the treasury will experience a (very small) loss, but it
    // wont cause potentially valid transactions to fail.
    _mint(treasury, amount.rayDiv(index));

    emit Transfer(address(0), treasury, amount);
    emit Mint(treasury, amount, index);
  }

  /*//////////////////////////////////////////////////////////////
                    STRATEGIES LOGIC
  //////////////////////////////////////////////////////////////*/

  /**
   *  @notice Reports the amount of assets the calling Strategy has free (usually in
   *  terms of ROI).
   *  This may only be called by a Strategy managed by this UToken.
   *  @dev For approved strategies, this is the most efficient behavior.
   *  The Strategy reports back what it has free, then UToken "decides"
   *  whether to take some back or give it more. Note that the most it can
   *  take is `gain + _debtPayment`, and the most it can give is all of the
   *  remaining reserves. It is important to stress that anything outside of those
   *  bounds is abnormal behavior.
   *  All approved strategies must have increased diligence around
   *  calling this function, as abnormal behavior could become catastrophic.
   *  @param gain Amount Strategy has realized as a gain on its investment since its
   *   last report, and is free to be given back to UToken as earnings
   *  @param loss Amount Strategy has realized as a loss on its investment since its
   *  last report, and should be accounted for on the UToken's balance sheet.
   *  The loss will reduce the debtRatio. The next time the strategy will harvest,
   *  it will pay back the debt in an attempt to adjust to the new debt limit.
   *  @param _debtPayment Amount Strategy has made available to cover outstanding debt
   *  @return Amount of debt outstanding (if totalDebt > debtLimit or emergency shutdown).
   */
  function report(uint256 gain, uint256 loss, uint256 _debtPayment) external override onlyStrategy returns (uint256) {
    // Validate that strategy's balance is actually bigger than the gains reported + the amount to cover outstanding debt
    if (IERC20Upgradeable(_underlyingAsset).balanceOf(msg.sender) < gain + _debtPayment)
      revert InvalidGainAndDebtPayment();

    if (loss != 0) _reportLoss(msg.sender, loss);

    // Compute the available credit for the current Strategy (if any)
    uint256 availableCredit = _computeAvailableCredit(msg.sender);

    // Increase strategy's total gain by the current report realized gains
    stragegies[strategy].totalGain += gain;

    // Report takes up to the outstanding debt if the current debt payment exceeds it
    uint256 strategyDebt = _debtOutstanding(msg.sender);
    uint256 debtPayment = Math.min(strategyDebt, _debtPayment);

    // Adjust debts debt considering the current report's debt payment
    if (debtPayment != 0) {
      strategies[msg.sender].totalDebt -= debtPayment;
      totalDebt -= debtPayment;
      strategyDebt -= debtPayment;
    }
  }

  /**
   * @notice Determines if `strategy` is past its debt limit and if any amount of tokens
   *  should be withdrawn to the UToken.
   * @param strategy The Strategy to check.
   * @return The quantity of tokens to withdraw.
   */

  function debtOutstanding(address strategy) external view override returns (uint256) {
    return _debtOutstanding(strategy);
  }

  /*//////////////////////////////////////////////////////////////
                  INTERNAL FUNCTIONS 
  //////////////////////////////////////////////////////////////*/
  // todo optimize this function
  function _reportLoss(address strategy, uint256 loss) internal {
    // It is not possible for the strategy to lose more than the amount lent. Verify this assumption
    uint256 _totalDebt = strategies[strategy].totalDebt;
    if (loss > _totalDebt) revert LossHigherThanStrategyTotalDebt();
    // If UToken actually has deployed capital to **any** strategy, adjust the debt ratios for both the UToken
    // and the reporting strategy
    if (debtRatio != 0) {
      uint256 ratioAdjustment = Math.min(
        // todo check for loss of precision
        (loss * debtRatio) / totalDebt,
        strategies[strategy].debtRatio
      );
      strategies[strategy].debtRatio -= ratioAdjustment;
      debtRatio -= ratioAdjustment;
    }

    // Adjust loss parameters
    strategies[strategy].totalLoss += loss;
    strategies[strategy].totalDebt = totalDebt - loss;
    totalDebt -= loss;
  }

  /**
   * @notice Determines if `strategy` is past its debt limit and if any amount of tokens
   *  should be withdrawn to the UToken.
   * @dev see `debtOutstanding()`
   */
  function _debtOutstanding(address strategy) internal returns (uint256) {
    uint256 strategyTotalDebt = strategies[strategy].totalDebt;
    // No amount of tokens are deployed to the Strategy. Return
    // the known Strategy's debt
    if (debtRatio == 0) return strategyTotalDebt;

    uint256 strategyDebtLimit = _computeDebtLimit(strategies[strategy].debtRatio, _totalAssets());

    if (emergencyShutdown) {
      // Strategy's debt is returned when in emergency shutdown
      return strategyTotalDebt;
    } else if (strategyTotalDebt <= strategyDebtLimit) {
      // No debt outstanding in case the current strategy debt has not reached its debt limit
      return 0;
    }
    // Return outstanding debt in case the debt limit is reached
    return strategyTotalDebt - strategyDebtLimit;
  }

  /**
   * @notice Amount of underlying tokens from UToken a Strategy has access to as a credit line.
   * This will check the Strategy's debt limit, as well as the underlying tokens
   * available in the UToken, and determine the maximum amount of underlying
   * (if any) the Strategy may draw on.
   * @dev In the rare case the Vault is in emergency shutdown this will return 0.
   * @param strategy The Strategy to check. Defaults to caller.
   * @return The quantity of underlying tokens available for the Strategy to draw on.
   */
  // todo optimize function
  function _computeAvailableCredit(address strategy) internal returns (uint256) {
    if (emergencyShutdown) return 0;
    uint256 totalAssets = _totalAssets();
    uint256 uTokenDebtLimit = _computeDebtLimit(debtRatio, totalAssets);
    uint256 strategyDebtLimit = _computeDebtLimit(strategies[strategy].debtRatio, totalAssets);
    // Check if strategy or UToken debt have exceeded their own maximum debt limit
    if (strategies[strategy].totalDebt > strategyDebtLimit || totalDebt > uTokenDebtLimit) return 0;

    uint256 availableCredit = strategyDebtLimit - strategies[strategy].totalDebt;
    // Adjust by global debt limit
    availableCredit = Math.min(availableCredit, uTokenDebtLimit - totalDebt);

    // Can only borrow up to what the contract has in reserve. It is discouraged
    // to loan up to 100% of current deposited funds
    availableCredit = Math.min(availableCredit, _underlyingAsset.balanceOf(address(this)));

    // Adjust by min and max borrow limits per harvest

    // Min increase can be used to ensure that if a strategy has a minimum
    // amount of capital needed to purchase a position, it's not given capital
    // it can't make use of yet.
    if (availableCredit < strategies[strategy].minDebtPerHarvest) return 0;

    // Max increase is used to make sure each harvest isn't bigger than what
    // it is authorized.
    return Math.min(availableCredit, strategies[strategy].maxDebtPerHarvest);
  }

  // todo comment
  function _computeDebtLimit(uint256 _debtRatio, uint256 _totalAssets) internal returns (uint256) {
    return (_totalAssets * _debtRatio) / MAX_BPS;
  }

  /**
  @notice Returns the total quantity of all assets under control of this
   * UToken, whether they're loaned out to a Strategy, or currently held in
   * the UToken.
   *  @return The total assets under control of this UToken.
   */
  function _totalAssets() internal view returns (uint256) {
    return _underlyingAsset.balanceOf(address(this)) + totalDebt;
  }

  /**
   * @dev Calculates the balance of the user: principal balance + interest generated by the principal
   * @param user The user whose balance is calculated
   * @return The balance of the user
   **/
  function balanceOf(address user) public view override returns (uint256) {
    ILendPool pool = _getLendPool();
    return super.balanceOf(user).rayMul(pool.getReserveNormalizedIncome(_underlyingAsset));
  }

  /**
   * @dev Returns the scaled balance of the user. The scaled balance is the sum of all the
   * updated stored balance divided by the reserve's liquidity index at the moment of the update
   * @param user The user whose balance is calculated
   * @return The scaled balance of the user
   **/
  function scaledBalanceOf(address user) external view override returns (uint256) {
    return super.balanceOf(user);
  }

  /**
   * @dev Returns the scaled balance of the user and the scaled total supply.
   * @param user The address of the user
   * @return The scaled balance of the user
   * @return The scaled balance and the scaled total supply
   **/
  function getScaledUserBalanceAndSupply(address user) external view override returns (uint256, uint256) {
    return (super.balanceOf(user), super.totalSupply());
  }

  /**
   * @dev Returns the available liquidity for the UToken's reserve
   * @return The available liquidity in reserve
   **/
  function getAvailableLiquidity() public view override returns (uint256) {
    return LendingLogic.calculateYearnAvailableLiquidityInReserve(_addressProvider);
  }

  /**
   * @dev calculates the total supply of the specific uToken
   * since the balance of every single user increases over time, the total supply
   * does that too.
   * @return the current total supply
   **/
  function totalSupply() public view override returns (uint256) {
    uint256 currentSupplyScaled = super.totalSupply();

    if (currentSupplyScaled == 0) {
      return 0;
    }

    ILendPool pool = _getLendPool();
    return currentSupplyScaled.rayMul(pool.getReserveNormalizedIncome(_underlyingAsset));
  }

  /**
   * @dev Returns the scaled total supply of the variable debt token. Represents sum(debt/index)
   * @return the scaled total supply
   **/
  function scaledTotalSupply() public view virtual override returns (uint256) {
    return super.totalSupply();
  }

  /**
   * @dev Sets new treasury to the specified UToken
   * @param treasury the new treasury address
   **/
  function setTreasuryAddress(address treasury) external override onlyPoolAdmin {
    require(treasury != address(0), Errors.INVALID_ZERO_ADDRESS);
    _treasury = treasury;
    emit TreasuryAddressUpdated(treasury);
  }

  /**
   * @dev Returns the address of the Unlockd treasury, receiving the fees on this uToken
   **/
  function RESERVE_TREASURY_ADDRESS() public view override returns (address) {
    return _treasury;
  }

  /**
   * @dev Returns the address of the underlying asset of this uToken
   **/
  function UNDERLYING_ASSET_ADDRESS() public view override returns (address) {
    return _underlyingAsset;
  }

  /**
   * @dev Returns the address of the lending pool where this uToken is used
   **/
  function POOL() public view returns (ILendPool) {
    return _getLendPool();
  }

  /**
   * @dev For internal usage in the logic of the parent contract IncentivizedERC20
   **/
  function _getIncentivesController() internal view override returns (IIncentivesController) {
    return IIncentivesController(_addressProvider.getIncentivesController());
  }

  function _getUnderlyingAssetAddress() internal view override returns (address) {
    return _underlyingAsset;
  }

  /**
   * @dev Returns the address of the incentives controller contract
   **/
  function getIncentivesController() external view override returns (IIncentivesController) {
    return _getIncentivesController();
  }

  /**
   * @dev Transfers the underlying asset to `target`. Used by the LendPool to transfer
   * assets in borrow() and withdraw()
   * @param target The recipient of the uTokens
   * @param amount The amount getting transferred
   * @return The amount transferred
   **/
  function transferUnderlyingTo(address target, uint256 amount) external override onlyLendPool returns (uint256) {
    IERC20Upgradeable(_underlyingAsset).safeTransfer(target, amount);
    return amount;
  }

  function updateUTokenManagers(address[] calldata managers, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = managers.length;
    for (uint256 i = 0; i < cachedLength; ) {
      require(managers[i] != address(0), Errors.INVALID_ZERO_ADDRESS);
      _uTokenManagers[managers[i]] = flag;
      unchecked {
        ++i;
      }
    }
    emit UTokenManagersUpdated(managers, flag);
  }

  /**
   * @dev Transfers the uTokens between two users. Validates the transfer
   * (ie checks for valid HF after the transfer) if required
   * @param from The source address
   * @param to The destination address
   * @param amount The amount getting transferred
   * @param validate `true` if the transfer needs to be validated
   **/
  function _transfer(address from, address to, uint256 amount, bool validate) internal {
    address underlyingAsset = _underlyingAsset;
    ILendPool pool = _getLendPool();

    uint256 index = pool.getReserveNormalizedIncome(underlyingAsset);

    uint256 fromBalanceBefore = super.balanceOf(from).rayMul(index);
    uint256 toBalanceBefore = super.balanceOf(to).rayMul(index);

    super._transfer(from, to, amount.rayDiv(index));

    if (validate) {
      pool.finalizeTransfer(underlyingAsset, from, to, amount, fromBalanceBefore, toBalanceBefore);
    }

    emit BalanceTransfer(from, to, amount, index);
  }

  function _getLendPool() internal view returns (ILendPool) {
    return ILendPool(_addressProvider.getLendPool());
  }

  function _getLendPoolConfigurator() internal view returns (ILendPoolConfigurator) {
    return ILendPoolConfigurator(_addressProvider.getLendPoolConfigurator());
  }

  /**
   * @dev Overrides the parent _transfer to force validated transfer() and transferFrom()
   * @param from The source address
   * @param to The destination address
   * @param amount The amount getting transferred
   **/
  function _transfer(address from, address to, uint256 amount) internal override {
    _transfer(from, to, amount, true);
  }
}
