// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IReservoirAdapter} from "../../interfaces/reservoir/IReservoirAdapter.sol";

import {DataTypes} from "../../libraries/types/DataTypes.sol";

import {BaseAdapter} from "./abstracts/BaseAdapter.sol";

contract ReservoirAdapter is BaseAdapter, IReservoirAdapter {
  /*//////////////////////////////////////////////////////////////
                        CONSTANTS
  //////////////////////////////////////////////////////////////*/
  //@dev `bytes4(keccak256(bytes("Unauthorized()")))`.
  bytes4 private constant SAFETRANSFERFROM_FUNCTION_SELECTOR = 0xb88d4fde;
  //@dev `bytes4(keccak256(bytes("execute((address,bytes,uint256)[])")))`.
  bytes4 private constant EXECUTE_FUNCTION_SELECTOR = 0x760f2a0b;

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
  /**
   * @dev Liquidates an unhealthy loan on Reservoir.
   * @param nftAsset The address of the NFT expected to be liquidated
   * @param data The data to execute. Reservoir's API is leveraged in order to generate this `data` param.
   * . The expected encoded data is a combination of the following:
   * 1. A `safeTransferFrom` function, which the following calldata encoded:
   * - `from`: expected to be the current contract
   * - `to`: expected to be the reservoir module managing the NFT selling
   * - `tokenId`: the token Id of the NFT to be liquidated:
   * - `data`: encoded data to be triggered in the `onERC721Received` after safeTransferring the NFT to the module. The
   *    hook will trigger the `execute` function from the reservoir router.
   * 2. An `execute` function, that will be triggered in the `onERC721Received` hook of the module, and with the following calldata:
   * - `module`: the reservoir module address that carries out the liquidation on an external marketplace
   * - `data`: the data that the module will execute to interact with external marketplaces
   * - `value`: the transaction value, considering fees
   **/
  function liquidateReservoir(
    address nftAsset,
    bytes calldata data
  ) external override nonReentrant onlyReservoirLiquidator {
    (bytes4 safeTransferFromSelector, address from, address to, uint256 tokenId) = _decodeSafeTransferFromData(data);

    _validateSafeTransferFromData(safeTransferFromSelector, from, to);

    // `_decodeReservoirRouterExecuteData` extracts `execute` params using `abi.decode` by slicing the first 4 bytes of the `_data`
    // param to remove the `execute` selector. Because slicing memory arrays is not supported for now in solidity, we can't extract the
    // `routerLevelTxData` in `_decodeSafeTransferFromData`, as `routerLevelTxData` would be held in memory, not calldata.
    // Instead, we pass `data[164:]` as parameter. The 164 offset is derived in the following way:
    // bytes 0 - 3: `safeTransferFrom` selector
    // bytes 4 - 35: `from` parameter in `safeTransferFrom`
    // bytes 36 - 67: `to` parameter in `safeTransferFrom`
    // bytes 67 - 99: `tokenId` parameter in `safeTransferFrom`
    // bytes 100 - 131: offset (hexadecimal representation of the offset where the `execute` encoded data can be found)
    // bytes 132 - 163: length of the `execute` encoded data
    // 164 - onwards: the Reservoir router's `execute` encoded data (selector + calldata)
    (bytes4 executeSelector, address module) = _decodeReservoirRouterExecuteData(data[164:]);

    _validateExecuteData(executeSelector, to, module);

    (
      uint256 loanId,
      DataTypes.LoanData memory loanData,
      address uNftAddress,
      ,
      DataTypes.ReserveData memory reserveData
    ) = _performInitialChecks(nftAsset, tokenId);

    // Update reserve state before actually checking for the health factor
    _updateReserveState(loanData);

    _updateReserveInterestRates(loanData);

    _validateLoanHealthFactor(nftAsset, tokenId);

    // Clean loan state in LendPoolLoan and receive underlying NFT
    _updateLoanStateAndTransferUnderlying(loanId, uNftAddress, reserveData.variableBorrowIndex);

    uint256 balanceBeforeLiquidation = IERC20(loanData.reserveAsset).balanceOf(address(this));

    // safeTransfer NFT to Reservoir Module. Trigger `onERC721Received` hook initiating the sell
    (bool success, ) = nftAsset.call(data);
    if (!success) _revert(LowLevelSafeTransferFromFailed.selector);

    // todo safeTransfer liquidated amount to reserves
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
   * @dev Decodes the given calldata for Reservoir's sell tokens data encoding.
   * Given that the on-received ERC721/ERC1155 hooks are used by Reservoir modules for approval-less bid filling,
   * the `safeTransferFrom` function encoded data is expected at this step.
   * @param _data the encoded data provided from Reservoir
   */
  function _decodeSafeTransferFromData(
    bytes calldata _data
  ) internal pure returns (bytes4 selector, address from, address to, uint256 tokenId) {
    //solhint-disable-next-line no-inline-assembly
    assembly {
      selector := calldataload(_data.offset)
    }

    (from, to, tokenId) = abi.decode(_data[4:], (address, address, uint256));
  }

  /**
   * @dev Decodes the given calldata for Reservoir's router expected `execute` data encoding
   * @param _data the Reservoir router's `execute` encoded data
   */
  function _decodeReservoirRouterExecuteData(
    bytes calldata _data
  ) internal pure returns (bytes4 selector, address module) {
    //solhint-disable-next-line no-inline-assembly
    assembly {
      selector := calldataload(_data.offset)
    }
    ExecutionInfo[] memory executions = abi.decode(_data[4:], (ExecutionInfo[]));
    // always keep first execution
    module = executions[0].module;
  }

  function _validateSafeTransferFromData(bytes4 selector, address from, address to) internal view {
    if (selector != SAFETRANSFERFROM_FUNCTION_SELECTOR) _revert(InvalidSafeTransferFromExpectedSelector.selector);
    if (from != address(this)) _revert(InvalidReservoirFromAddress.selector);
    // check if receiver is a valid reservoir module
    if (!_reservoirModules[to]) _revert(InvalidReservoirModule.selector);
  }

  function _validateExecuteData(bytes4 selector, address to, address module) internal pure {
    if (selector != EXECUTE_FUNCTION_SELECTOR) _revert(InvalidExecuteExpectedSelector.selector);
    if (to != module) _revert(InvalidReservoirModuleOnExecute.selector);
  }
}
