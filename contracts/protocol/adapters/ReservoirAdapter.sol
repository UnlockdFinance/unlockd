// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IReservoirAdapter} from "../../interfaces/reservoir/IReservoirAdapter.sol";

import {DataTypes} from "../../libraries/types/DataTypes.sol";

import {BaseAdapter} from "./abstracts/BaseAdapter.sol";

contract ReservoirAdapter is BaseAdapter, IReservoirAdapter {
  /*//////////////////////////////////////////////////////////////
                          GENERAL VARS
  //////////////////////////////////////////////////////////////*/
  mapping(address => bool) private _liquidators;
  mapping(address => bool) private _reservoirModules;

  /*//////////////////////////////////////////////////////////////
                          MODIFIERS
  //////////////////////////////////////////////////////////////*/
  modifier onlyReservoirLiquidator() {
    if (!_liquidators[msg.sender]) _revert(NotReservoirLiquidator.selector);
    _;
  }

  modifier isValidModule(address module) {
    if (!_reservoirModules[module]) _revert(InvalidReservoirModule.selector);
    _;
  }

  /*//////////////////////////////////////////////////////////////
                          PROXY INIT LOGIC
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Function is invoked by the proxy contract on deployment.
   * @param provider The address of the LendPoolAddressesProvider
   **/
  function initialize(ILendPoolAddressesProvider provider) public initializer {
    if (address(provider) == address(0)) _revert(InvalidZeroAddress.selector);
    __BaseAdapter_init(provider);
  }

  /*//////////////////////////////////////////////////////////////
                          MAIN LOGIC
  //////////////////////////////////////////////////////////////*/
  function liquidateReservoir(
    address nftAsset,
    uint256 tokenId,
    ExecutionInfo calldata executionInfo
  ) external override nonReentrant onlyReservoirLiquidator isValidModule(executionInfo.module) {
    (
      uint256 loanId,
      DataTypes.LoanData memory loanData,
      DataTypes.NftData memory nftData,
      ,
      DataTypes.ReserveData memory reserveData
    ) = _performInitialChecks(nftAsset, tokenId);

    _updateReserveState(loanData);

    _updateReserveInterestRates(loanData);

    _validateLoanHealthFactor(nftAsset, tokenId);

    // Clean loan state in LendPoolLoan and receive underlying NFT
    _updateLoanStateAndTransferUnderlying(loanId, nftData.uNftAddress, reserveData.variableBorrowIndex);

    // Check if module is a valid ERC721 receiver
    _checkIsValidERC721Receiver(address(this), executionInfo.module, tokenId, executionInfo.data);

    // Safetransfer NFT to Reservoir Module. Trigger `onerc721received` hook initiating the sell
    IERC721(nftAsset).safeTransferFrom(address(this), executionInfo.module, tokenId, executionInfo.data);
  }

  /*//////////////////////////////////////////////////////////////
                          SETTERS / GETTERS
  //////////////////////////////////////////////////////////////*/
  function updateModules(address[] calldata modules, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = modules.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (modules[i] == address(0)) _revert(InvalidZeroAddress.selector);
      _reservoirModules[modules[i]] = flag;
      unchecked {
        ++i;
      }
    }
  }

  function updateLiquidators(address[] calldata liquidators, bool flag) external override onlyPoolAdmin {
    uint256 cachedLength = liquidators.length;
    for (uint256 i = 0; i < cachedLength; ) {
      if (liquidators[i] == address(0)) _revert(InvalidZeroAddress.selector);
      _liquidators[liquidators[i]] = flag;
      unchecked {
        ++i;
      }
    }
  }

  /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
  //////////////////////////////////////////////////////////////*/
  /**
   * @dev Check if receiver module actually implements onERC721Received. Adapted from OZ
   * @param from The NFT holder
   * @param to Target contract address receiving the NFT
   * @param tokenId NFT token Id
   * @param data Data to send along with the call.
   * Returns whether the call correctly returned the expected magic value.
   */
  function _checkIsValidERC721Receiver(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) internal returns (bool) {
    if (to.code.length != 0) {
      try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
        return retval == IERC721Receiver.onERC721Received.selector;
      } catch (bytes memory reason) {
        if (reason.length == 0) {
          _revert(TransferToNonERC721Receiver.selector);
        }
        // solhint-disable-next-line no-inline-assembly
        assembly {
          revert(add(32, reason), mload(reason))
        }
      }
    } else {
      return true;
    }
  }
}
