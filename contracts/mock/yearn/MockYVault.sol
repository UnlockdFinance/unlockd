// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import {Errors} from "../../libraries/helpers/Errors.sol";
import {DataTypes} from "../../libraries/types/DataTypes.sol";

import {ILendPool} from "../../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";

contract MockYVault is Initializable, ERC20Upgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  modifier onlyAdminOrUToken() {
    DataTypes.ReserveData memory reserveData = ILendPool(addressProvider.getLendPool()).getReserveData(
      address(underlyingAsset)
    );
    require(
      msg.sender == reserveData.uTokenAddress || msg.sender == addressProvider.getPoolAdmin(),
      "Caller not UToken nor Pool Admin"
    );
    _;
  }

  ILendPoolAddressesProvider public addressProvider;
  IERC20Upgradeable public underlyingAsset;

  uint256 internal _lock = 1;

  /**
   * @dev Emitted when the MockYVault is initialized
   * @param addressProvider The address of the Unlockd address provider
   * @param underlyingAsset The address of the underlying asset
   * @param name The token name
   * @param symbol The token symbol
   **/
  event Initialized(address indexed addressProvider, address indexed underlyingAsset, string name, string symbol);

  /**
   * @dev Initializes the Mock YVault
   * @param _addressProvider The address of the Unlockd address provider
   * @param _underlyingAsset The address of the underlying asset
   * @param _name The token name
   * @param _symbol The token symbol
   */
  function initialize(
    address _addressProvider,
    address _underlyingAsset,
    string calldata _name,
    string calldata _symbol
  ) external initializer {
    __ERC20_init(_name, _symbol);

    require(_addressProvider != address(0), Errors.INVALID_ZERO_ADDRESS);
    addressProvider = ILendPoolAddressesProvider(_addressProvider);

    require(_underlyingAsset != address(0), Errors.INVALID_ZERO_ADDRESS);
    underlyingAsset = IERC20Upgradeable(_underlyingAsset);

    emit Initialized(address(_addressProvider), _underlyingAsset, _name, _symbol);
  }

  function deposit(uint256 amount) external onlyAdminOrUToken {
    underlyingAsset.safeTransferFrom(msg.sender, address(this), amount);
    _mint(msg.sender, amount);
  }

  function withdraw(uint256 amount) external onlyAdminOrUToken returns (uint256) {
    _burn(msg.sender, amount);
    underlyingAsset.safeTransfer(msg.sender, amount);
    return amount;
  }

  /**
   * @dev Returns the price per share in the vault
   * @return value representing the price per share
   */
  function pricePerShare() external pure returns (uint256) {
    return 1 ether;
  }

  function token() external view returns (address) {
    return address(underlyingAsset);
  }

  function totalAssets() external view returns (uint256) {
    return balanceOf(address(this));
  }
}
