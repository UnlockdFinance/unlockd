# Unlockd protocol 1.0.0 specification

## Table of contents

1.  [Architecture](#architecture)
1.  [Contracts](#contracts)
    1.  [NFT Oracle](#nftoracle)
1.  [Contract Interactions](#contract-interactions)  
TO DO: Add important use cases
1.  [Events](#events)  
1.  [Miscellaneous](#miscellaneous)  
# Architecture
TO DO: document protocol architecture

# Contracts
## NFT Oracle
The NFTOracle contract’s purpose is to hold the prices of all the NFT assets in the Unlockd protocol. It acts as a database and allows other components from the protocol to interact with it and  fetch price information for single or multiple assets. Contracts in the protocol such as [UiPoolDataProvider](#uipooldataprovider) or [GenericLogic](#genericlogic) reference the prices in this oracle. The NFT Oracle contract is responsible for: 

1.  Storing price data of all the NFTs supported by the Unlockd protocol (for both single and multiple NFTs)
2.  Allowing other contracts in the protocol to fetch prices for NFTs
2.  Updating price data of the NFTs supported by the Unlockd protocol

### Main NFT Oracle functions
- Set Collections: adds multiple collections to the protocol
```
function setCollections(address[] calldata _collections) external onlyOwner
```
- Add Collection: Adds a single collection to the protocol
```
function addCollection(address _collection) external onlyOwner
```
- Set NFT Price: Sets the price for a single NFT
```
function setNFTPrice(
    address _collection,
    uint256 _tokenId,
    uint256 _price
  ) external override onlyOwner
```
- Set multiple prices: Sets the price for multiple NFTs
```
function setMultipleNFTPrices(
    address[] calldata _collections,
    uint256[] calldata _tokenIds,
    uint256[] calldata _prices
  ) external override onlyOwner
```
- Get NFT price: Fetches the price for a single NFT
```
function getNFTPrice(
    address _collection, 
    uint256 _tokenId
    ) external view override onlyExistingCollection(_collection)
    returns (uint256)
```
- Get multiple prices: Fetches prices for multiple NFTs
```
function getMultipleNFTPrices(
    address[] calldata _collections, 
    uint256[] calldata _tokenIds
    ) external view override onlyExistingCollections(_collections)
    returns (uint256[] memory)
```
# Contract interactions
The diagrams provided below demonstrate interactions between various Unlockd smart contracts that make up the protocol. 
TO DO: Create protocol diagrams

...


