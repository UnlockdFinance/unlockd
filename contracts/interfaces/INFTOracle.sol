// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/************
@title INFTOracle interface
@notice Interface for NFT price oracle.*/
interface INFTOracle {
  /* CAUTION: Price uint is ETH based (WEI, 18 decimals) */
  // get asset price
  function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256);

  function getMultipleNFTPrices(address[] calldata _collections, uint256[] calldata _tokenIds)
    external
    view
    returns (uint256[] memory);

  function setNFTPrice(
    address _collection,
    uint256 _tokenId,
    uint256 _price
  ) external;

  function setMultipleNFTPrices(
    address[] calldata _collections,
    uint256[] calldata _tokenIds,
    uint256[] calldata _prices
  ) external;

  function setPause(address _nftContract, bool val) external;

  /* CAUTION: Price uint is ETH based (WEI, 18 decimals) */
  // get asset price from NFTX
  function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view returns (uint256);
}
