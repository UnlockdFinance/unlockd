// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GenericYVaultLender is BaseLender {
  using SafeERC20 for IERC20;

  /*//////////////////////////////////////////////////////////////
                          STORAGE
  //////////////////////////////////////////////////////////////*/
  address yVault;

  /*//////////////////////////////////////////////////////////////
                          PROXY INIT LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider _provider, IStrategy _strategy, address _yVault) public initializer {
    if (yVault == address(0)) _revert(InvalidZeroAddress.selector);
    __BaseLender_init(_provider, _strategy);
    yVault = _yVault;
  }
}
