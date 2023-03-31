// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {BaseLender, IERC20, ILendPoolAddressesProvider, IStrategy} from "./BaseLender.sol";
import {IYVault} from "../../interfaces/yearn/IYVault.sol";
import {IGenericYVaultLender} from "../../interfaces/strategies/lenders/IGenericYVaultLender.sol";

contract GenericYVaultLender is BaseLender, IGenericYVaultLender {
  using SafeERC20 for IERC20;

  /*//////////////////////////////////////////////////////////////
                          CONSTANTS
  //////////////////////////////////////////////////////////////*/
  uint256 internal constant DEGRADATION_COEFFICIENT = 10 ** 18;

  /*//////////////////////////////////////////////////////////////
                          STORAGE
  //////////////////////////////////////////////////////////////*/
  IYVault yVault;

  /*//////////////////////////////////////////////////////////////
                          PROXY INIT LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider _provider, IStrategy _strategy, IYVault _yVault) public initializer {
    if (address(_yVault) == address(0)) _revert(InvalidZeroAddress.selector);
    __BaseLender_init(_provider, _strategy);
    yVault = _yVault;
    underlyingAsset.safeApprove(address(_yVault), type(uint256).max);
  }

  /**
   * @notice Deposits current lender balance to lender's managed protocol
   **/
  function deposit() external override onlyStrategy {
    // Save SLOADs
    IERC20 underlying = underlyingAsset;
    IYVault vault = yVault;
    uint256 amountToDeposit = underlying.balanceOf(address(this));

    if (underlying.allowance(address(this), vault) < amountToDeposit) {
      underlying.safeApprove(address(vault), 0);
      underlying.safeApprove(address(vault), type(uint256).max);
    }

    vault.deposit(amountToDeposit);

    emit Deposited(msg.sender, amountToDeposit);
  }

  /**
   * @notice Withdraws amount `amount` from **lender**
   * @dev Notice that it is intented to take advantage of the already sitting funds in this contract,
   * so the amount withdrawn comes from the current contract + the withdrawn
   * amount from the actual Yearn Vault (in case it is needed).
   * Note that withdrawing from Yearn could potentially cause loss (set to 0.01% as default in
   * the Vault implementation), so the withdrawn amount might actually be different from
   * the requested `amount`
   * @return the total amount withdrawn
   **/
  function withdraw(uint256 amount) external override onlyStrategy returns (uint256) {
    // We consider the amount already sitting in terms of underlying for withdrawal
    uint256 looseBalance = underlying.balanceOf(address(this));
    // If the loose balance is enough, withdraw without withdrawing from
    // the Vault
    if (looseBalance >= amount) {
      underlying.safeTransfer(msg.sender, amount);
      emit Withdrawn(msg.sender, amount);
      return amount;
    }

    uint256 shareBalance = vault.balanceOf(address(this));
    uint256 investedBalance = _shareValue(shareBalance);

    // Compute the total available balance
    uint256 availableBalance = investedBalance + looseBalance;

    if (availableBalance < amount) _revert(NotEnoughLiquidity.selector);

    // Consider already available funds to avoid withdrawing an excess of funds
    // from the vault
    uint256 amountToWithdraw = amount - looseBalance;

    // No need to store the returned redeemed amount (we track loss of funds in strategy)
    uint256 sharesToWithdraw = _sharesForAmount(amountToWithdraw);
    vault.withdraw(sharesToWithdraw);

    looseBalance = underlying.balanceOf(address(this));
    underlying.safeTransfer(msg.sender, looseBalance);

    emit Withdrawn(msg.sender, looseBalance);
    return looseBalance;
  }

  /**
   * @notice Determines how many shares `amount` of underlying would receive.
   * @return returns the estimated amount of shares computed for underlying `amount`
   */
  function _sharesForAmount(uint256 amount) internal view returns (uint256) {
    uint256 vaultTotalAssets = vault.totalAssets();
    uint256 freeFunds = vaultTotalAssets - _calculateLockedProfit();
    if (freeFunds != 0) return (amount * vault.totalSupply()) / freeFunds;

    return 0;
  }

  /**
   * @notice Determines the current value of `shares`.
   * @dev if sqrt(vault.totalAssets()) >>> 1e39, this could potentially revert
   * @return returns the estimated amount of underlying computed from shares `shares`
   */
  function _shareValue(uint256 shares) internal view returns (uint256) {
    uint256 vaultTotalAssets = vault.totalAssets();
    uint256 freeFunds = vaultTotalAssets - _calculateLockedProfit();
    if (freeFunds != 0) return (amount * vault.totalSupply()) / freeFunds;

    return 0;
  }

  /**
   * @notice Calculates the vault locked profit i.e. how much profit is locked and cant be withdrawn
   * @return returns the computed locked profit value
   */
  function _calculateLockedProfit() internal view returns (uint256) {
    uint256 lockedFundsRatio = (block.timestamp - vault.lastReport()) * vault.lockedProfitDegradation();
    if (lockedFundsRatio < DEGRADATION_COEFFICIENT) {
      uint256 lockedProfit = vault.lockedProfit();
      return lockedProfit - ((lockedFundsRatio * lockedProfit) / DEGRADATION_COEFFICIENT);
    }
    return 0;
  }
}
