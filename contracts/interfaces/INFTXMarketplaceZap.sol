// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {IIncentivesController} from "./IIncentivesController.sol";
import {IScaledBalanceToken} from "./IScaledBalanceToken.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC20MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

/**
 * @title INFTXMarketplaceZap
 * @author Unlockd
 * @notice Defines the basic interface for the NFTX Marketplace Zap.
 **/
interface INFTXMarketplaceZap {
  function mintAndSell721WETH(
    uint256 vaultId,
    uint256[] calldata ids,
    uint256 minWethOut,
    address[] calldata path,
    address to
  ) external;
}
