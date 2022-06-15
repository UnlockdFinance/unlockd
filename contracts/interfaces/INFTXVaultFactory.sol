// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @dev https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/interface/INFTXVaultFactory.sol
 */
interface INFTXVaultFactory {
  // Read functions.
  function vaultsForAsset(address asset) external view returns (address[] memory);
}
