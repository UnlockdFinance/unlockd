// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILockeyManager} from "../interfaces/ILockeyManager.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Errors} from "../libraries/helpers/Errors.sol";

/**
 * @title LockeyManager
 * @author Unlockd
 * @notice Defines the error messages emitted by the different contracts of the Unlockd protocol
 */
contract LockeyManager is Initializable, ILockeyManager {
  using SafeERC20 for IERC20;
  uint256 internal _lockeyDiscount;
  ILendPoolAddressesProvider internal _addressesProvider;

  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;
  uint256 internal _status;
  address internal _rescuer;

  modifier onlyPoolAdmin() {
    require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
    _;
  }

  /**
   * @notice Revert if called by any account other than the rescuer.
   */
  modifier onlyRescuer() {
    require(msg.sender == _rescuer, "Rescuable: caller is not the rescuer");
    _;
  }

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

  /// @custom:oz -upgrades -unsafe -allow constructor
  constructor() initializer {}

  /**
   * @dev Initializes the LockeyManager contract replacing the constructor
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider provider) public initializer {
    require(address(provider) != address(0), Errors.INVALID_ZERO_ADDRESS);
    _addressesProvider = provider;
    _lockeyDiscount = 10000;
  }

  /**
   * @dev Sets the discountPercentage an allowed percentage for lockey holders
   * @param discountPercentage percentage allowed to deduct
   **/
  function setLockeyDiscountPercentage(uint256 discountPercentage) external override onlyPoolAdmin {
    require(discountPercentage <= 10000 && discountPercentage >= 7500, Errors.INVALID_DISCOUNT_PERCENTAGE);
    _lockeyDiscount = discountPercentage;
    emit LockeyDiscountPercentageSet(discountPercentage);
  }

  /**
   * @notice Rescue tokens and ETH locked up in this contract.
   * @param tokenContract ERC20 token contract address
   * @param to        Recipient address
   * @param amount    Amount to withdraw
   */
  function rescue(
    IERC20 tokenContract,
    address to,
    uint256 amount,
    bool rescueETH
  ) external override nonReentrant onlyRescuer {
    if (rescueETH) {
      (bool sent, ) = to.call{value: amount}("");
      require(sent, "Failed to send Ether");
    } else {
      tokenContract.safeTransfer(to, amount);
    }
  }

  /**
   * @notice Assign the rescuer role to a given address.
   * @param newRescuer New rescuer's address
   */
  function updateRescuer(address newRescuer) external override onlyPoolAdmin {
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

  /**
   * @dev Returns the lockey discount percentage
   **/
  function getLockeyDiscountPercentage() external view override returns (uint256) {
    return _lockeyDiscount;
  }
}
