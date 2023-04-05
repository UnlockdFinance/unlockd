// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {BaseStrategy, IERC20, ILendPoolAddressesProvider, IStrategy, IUToken} from "./BaseStrategy.sol";
import {IYVault} from "../../interfaces/yearn/IYVault.sol";

/** @title GenericYVaultStrategy
 * @author https://github.com/Grandthrax/yearn-steth-acc/blob/master/contracts/Strategy.sol
 * @notice `GenericYVaultStrategy` enables investing/divesting funds to any Yearn Vault
 **/
contract GenericYVaultStrategy is BaseStrategy {
  using SafeERC20 for IERC20;

  /*//////////////////////////////////////////////////////////////
                        ERRRORS
  //////////////////////////////////////////////////////////////*/
  error NotEnoughFundsToInvest();

  /*//////////////////////////////////////////////////////////////
                          EVENTS
  //////////////////////////////////////////////////////////////*/
  event Invested(address indexed strategy, uint256 indexed amountInvested);
  event Divested(address indexed strategy, uint256 indexed requestedShares, uint256 indexed amountDivested);

  /*//////////////////////////////////////////////////////////////
                          CONSTANTS
  //////////////////////////////////////////////////////////////*/
  uint256 internal constant DEGRADATION_COEFFICIENT = 10 ** 18;

  /*//////////////////////////////////////////////////////////////
                          STORAGE
  //////////////////////////////////////////////////////////////*/
  IYVault public yVault;
  uint256 public maxSingleTrade;

  /*//////////////////////////////////////////////////////////////
                          PROXY INIT LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param _provider The address of the LendPoolAddressesProvider
   * @param _uToken The uToken governing this strategy
   * @param _keepers The addresses of the keepers to be added as valid keepers to the strategy.
   * @param _yVault The yVault this strategy will interact with
   **/
  function initialize(
    ILendPoolAddressesProvider _provider,
    IUToken _uToken,
    address[] calldata _keepers,
    IYVault _yVault
  ) public initializer {
    if (address(_yVault) == address(0)) _revert(InvalidZeroAddress.selector);
    __BaseStrategy_init(_provider, _uToken, _keepers);
    yVault = _yVault;
    underlyingAsset.safeApprove(address(_yVault), type(uint256).max);
    maxSingleTrade = 1_000 * 1e18;
  }

  /*//////////////////////////////////////////////////////////////
                      INVEST LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Invests current Strategy balance to the yearn vault
   * @dev Performs a direct investment rather than the usual `harvest`
   **/
  function invest(uint256 amount) external onlyPoolAdmin {
    _invest(amount);
  }

  /*//////////////////////////////////////////////////////////////
                         SETTERS
  //////////////////////////////////////////////////////////////*/
  function setMaxSingleTrade(uint256 _maxSingleTrade) external onlyPoolAdmin {
    if (_maxSingleTrade == 0) _revert(InvalidZeroAmount.selector);
    maxSingleTrade = _maxSingleTrade;
  }

  /*//////////////////////////////////////////////////////////////
                        VIEW
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Provide an accurate estimate for the total amount of assets
   *  (principle + return) that this Strategy is currently managing,
   *  denominated in terms of `underlyingAsset` tokens.
   *
   *  This total should be "realizable" e.g. the total value that could
   *  *actually* be obtained from this Strategy if it were to divest its
   *  entire position based on current on-chain conditions.
   * @dev Care must be taken in using this function, since it relies on external
   *  systems, which could be manipulated by the attacker to give an inflated
   *  (or reduced) value produced by this function, based on current on-chain
   *  conditions (e.g. this function is possible to influence through
   *  flashloan attacks, oracle manipulations, or other DeFi attack
   *  mechanisms).
   * @return The estimated total assets in this Strategy.
   */
  function estimatedTotalAssets() public view override returns (uint256) {
    return _underlyingBalance() + _shareValue(_shareBalance());
  }

  /*//////////////////////////////////////////////////////////////
                        INTERNAL
  //////////////////////////////////////////////////////////////*/
  /**
   * @notice Invests `amount` of underlying, depositing it in the Yearn Vault
   * @param amount The amount of underlying to be deposited in the vault
   * @return The amount of shares received, in terms of underlying
   */
  function _invest(uint256 amount) internal returns (uint256) {
    // Don't do anything if amount to invest is 0
    if (amount == 0) return 0;

    uint256 underlyingBalance = _underlyingBalance();
    if (amount > underlyingBalance) _revert(NotEnoughFundsToInvest.selector);

    // Invested amount will be a maximum of `maxSingleTrade`
    amount = Math.min(maxSingleTrade, amount);

    IYVault vault = yVault;

    if (underlyingAsset.allowance(address(this), address(vault)) < amount) {
      underlyingAsset.safeApprove(address(vault), 0);
      underlyingAsset.safeApprove(address(vault), type(uint256).max);
    }

    uint256 shares = vault.deposit(amount);

    emit Invested(msg.sender, amount);
    return _shareValue(shares);
  }

  /**
   * @notice Divests amount `shares` from Yearn Vault
   * Note that divesting from Yearn could potentially cause loss (set to 0.01% as default in
   * the Vault implementation), so the divested amount might actually be different from
   * the requested `shares` to divest
   * @dev care should be taken, as the `shares` parameter is *not* in terms of underlying,
   * but of yvault shares
   * @return the total amount divested, in terms of underlying
   **/
  function _divest(uint256 shares) internal returns (uint256) {
    uint256 withdrawn = yVault.withdraw(shares);
    emit Divested(msg.sender, shares, withdrawn);
    return withdrawn;
  }

  /*
   * @notice Performs any adjustments to the core position(s) of this Strategy given
   * what change the UToken made in the "investable capital" available to the
   * Strategy.
   * @dev Note that all "free capital" (capital not invested) in the Strategy after the report
   * was made is available for reinvestment. This number could be 0, and this scenario should be handled accordingly.
   * Also note that other implementations might use the debtOutstanding param, but not this one.
   */
  function _adjustPosition(uint256) internal override {
    uint256 toInvest = _underlyingBalance();
    if (toInvest > 0) {
      toInvest = Math.min(maxSingleTrade, toInvest);
      _invest(toInvest);
    }
  }

  /**
   * @notice Liquidate up to `amountNeeded` of UToken's `underlyingAsset` of this strategy's positions,
   * irregardless of slippage. Any excess will be re-invested with `_adjustPosition()`.
   * @dev This function should return the amount of UToken's `underlyingAsset` tokens made available by the
   * liquidation. If there is a difference between `amountNeeded` and `liquidatedAmount`, `loss` indicates whether the
   * difference is due to a realized loss, or if there is some other sitution at play
   * (e.g. locked funds) where the amount made available is less than what is needed.
   *
   * NOTE: The invariant `liquidatedAmount + loss <= amountNeeded` should always be maintained
   * @param amountNeeded amount of UToken's `underlyingAsset` needed to be liquidated
   * @return liquidatedAmount the actual liquidated amount
   * @return loss difference between the expected amount needed to reach `amountNeeded` and the actual liquidated amount
   */
  function _liquidatePosition(uint256 amountNeeded) internal override returns (uint256 liquidatedAmount, uint256 loss) {
    uint256 underlyingBalance = _underlyingBalance();
    // If underlying balance currently holded by strategy is not enough to cover
    // the requested amount, we divest from the Yearn Vault
    if (underlyingBalance < amountNeeded) {
      uint256 amountToWithdraw = amountNeeded - underlyingBalance;
      uint256 shares = _sharesForAmount(amountToWithdraw);
      uint256 withdrawn = _divest(shares);
      if (withdrawn < amountToWithdraw) {
        loss = amountToWithdraw - withdrawn;
      }
    }
    liquidatedAmount = amountNeeded - loss;
  }

  /**
   * @notice Liquidates everything and returns the amount that got freed.
   * @dev This function is used during emergency exit instead of `_prepareReturn()` to
   * liquidate all of the Strategy's positions back to the UToken.
   */
  function _liquidateAllPositions() internal override returns (uint256 amountFreed) {
    uint256 shares = _shareBalance();
    _divest(shares);
    amountFreed = _underlyingBalance();
  }

  /**
   * Perform any Strategy unwinding or other calls necessary to capture the
   * "free return" this Strategy has generated since the last time its core
   * position(s) were adjusted. Examples include unwrapping extra rewards.
   * This call is only used during "normal operation" of a Strategy, and
   * should be optimized to minimize losses as much as possible.
   *
   * This method returns any realized profits and/or realized losses
   * incurred, and should return the total amounts of profits/losses/debt
   * payments (in UToken's `underlyingAsset` tokens) for the UToken's accounting (e.g.
   * `_underlyingBalance() >= debtPayment + profit`).
   *
   * `debtOutstanding` will be 0 if the Strategy is not past the configured
   * debt limit, otherwise its value will be how far past the debt limit
   * the Strategy is. The Strategy's debt limit is configured in the UToken.
   *
   * NOTE: `debtPayment` should be less than or equal to `debtOutstanding`.
   *       It is okay for it to be less than `debtOutstanding`, as that
   *       should only be used as a guide for how much is left to pay back.
   *       Payments should be made to minimize loss from slippage, debt,
   *       withdrawal fees, etc.
   *
   * See `UToken.debtOutstanding()`.
   */
  function _prepareReturn(
    uint256 debtOutstanding
  ) internal override returns (uint256 profit, uint256 loss, uint256 debtPayment) {
    uint256 underlyingBalance = _underlyingBalance();
    uint256 shares = _shareBalance();
    uint256 totalAssets = underlyingBalance + _shareValue(shares);

    uint256 debt = uToken.getStrategy(address(this)).totalDebt;

    if (totalAssets >= debt) {
      // Strategy has obtained profit
      profit = totalAssets - debt;
      uint256 amountToWithdraw = profit + debtOutstanding;

      // Check if underlying funds held in the strategy are enough to cover withdrawal.
      // If not, divest from yearn
      if (amountToWithdraw > underlyingBalance) {
        uint256 expectedAmountToWithdraw = Math.min(maxSingleTrade, amountToWithdraw - underlyingBalance);
        uint256 sharesToWithdraw = _sharesForAmount(expectedAmountToWithdraw);
        uint256 withdrawn = _divest(sharesToWithdraw);

        // Account for loss occured on withdrawal from yearn
        if (withdrawn < expectedAmountToWithdraw) {
          unchecked {
            loss = expectedAmountToWithdraw - withdrawn;
          }
        }
        // Overwrite underlyingBalance with the proper amount after withdrawing
        underlyingBalance = _underlyingBalance();
      }

      // Net off profit and loss
      if (profit >= loss) {
        unchecked {
          profit -= loss;
          loss = 0;
        }
      } else {
        unchecked {
          loss -= profit;
          profit = 0;
        }
      }
      // `profit` + `debtOutstanding` must be <= `underlyingBalance`. Prioritise profit first
      if (profit > underlyingBalance) {
        // Profit is prioritised. In this case, no `debtPayment` will be reported
        profit = underlyingBalance;
      } else if (amountToWithdraw > underlyingBalance) {
        // same as `profit` + `debtOutstanding` > `underlyingBalance`
        // Keep profit amount and reduce the expected debtPayment from `debtOutstanding` to the following substraction
        debtPayment = underlyingBalance - profit;
      } else {
        debtPayment = debtOutstanding;
      }
    } else {
      // Strategy has incurred loss
      unchecked {
        loss = debt - totalAssets;
      }
    }
  }

  /**
   * @notice Transfer current yvault shares to new strategy
   * @param newStrategy the new strategy to migrate to
   */
  function _prepareMigration(address newStrategy) internal override {
    uint256 shares = _shareBalance();
    if (shares != 0) IERC20(address(yVault)).safeTransfer(newStrategy, shares);
  }

  /*//////////////////////////////////////////////////////////////
                      INTERNAL VIEW
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Determines the current value of `shares`.
   * @dev if sqrt(vault.totalAssets()) >>> 1e39, this could potentially revert
   * @return returns the estimated amount of underlying computed from shares `shares`
   */
  function _shareValue(uint256 shares) internal view returns (uint256) {
    IYVault vault = yVault;
    uint256 vaultTotalSupply = vault.totalSupply();
    if (vaultTotalSupply == 0) return shares;
    return (shares * _freeFunds()) / vaultTotalSupply;
  }

  /**
   * @notice Determines how many shares depositor of `amount` of underlying would receive.
   * @return returns the estimated amount of shares computed in exchange for underlying `amount`
   */
  function _sharesForAmount(uint256 amount) internal view returns (uint256) {
    uint256 freeFunds = _freeFunds();
    if (freeFunds != 0) return (amount * yVault.totalSupply()) / freeFunds;

    return 0;
  }

  /**
   * @notice Calculates the vault locked profit i.e. how much profit is locked and cant be withdrawn
   * @return returns the computed locked profit value
   */
  function _calculateLockedProfit() internal view returns (uint256) {
    IYVault vault = yVault;
    uint256 lockedFundsRatio = (block.timestamp - vault.lastReport()) * vault.lockedProfitDegradation();
    if (lockedFundsRatio < DEGRADATION_COEFFICIENT) {
      uint256 lockedProfit = vault.lockedProfit();
      return lockedProfit - ((lockedFundsRatio * lockedProfit) / DEGRADATION_COEFFICIENT);
    }
    return 0;
  }

  /**
   * @notice Calculates the vault free funds considering the locked profit
   * @return returns the computed vault free funds
   */
  function _freeFunds() internal view returns (uint256) {
    return yVault.totalAssets() - _calculateLockedProfit();
  }

  /**
   * @notice Returns the current strategy's amount of yearn vault shares
   * @return the strategy's balance of yearn vault shares
   */
  function _shareBalance() internal view returns (uint256) {
    return IERC20(address(yVault)).balanceOf(address(this));
  }
}
