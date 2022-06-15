// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @dev https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/interface/INFTXVault.sol
 */
interface INFTXVault {
  function mintFee() external view returns (uint256);

  function finalizeVault() external;

  function mint(
    uint256[] calldata tokenIds,
    uint256[] calldata amounts /* ignored for ERC721 vaults */
  ) external returns (uint256);

  function allValidNFTs(uint256[] calldata tokenIds) external view returns (bool);
}
