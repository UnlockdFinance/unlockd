# NFTOracle

### CollectionAdded

```solidity
event CollectionAdded(address collection)
```

_Emitted when a collection is added to the oracle_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| collection | address | The added collection |

### CollectionRemoved

```solidity
event CollectionRemoved(address collection)
```

_Emitted when a collection is removed from the oracle_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| collection | address | The removed collection |

### NFTPriceAdded

```solidity
event NFTPriceAdded(address _collection, uint256 _tokenId, uint256 _price)
```

_Emitted when a price is added for an NFT asset_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _collection | address | The NFT collection |
| _tokenId | uint256 | The NFT token Id |
| _price | uint256 |  |

### FeedAdminUpdated

```solidity
event FeedAdminUpdated(address admin)
```

_Emitted when the admin has been updated_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| admin | address | The new admin |

### CollectionPaused

```solidity
event CollectionPaused(bool paused)
```

_Emitted when the pause status is set to a collection_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| paused | bool | the new pause status |

### NotAdmin

```solidity
error NotAdmin()
```

### NonExistingCollection

```solidity
error NonExistingCollection(address collection)
```

### AlreadyExistingCollection

```solidity
error AlreadyExistingCollection()
```

### NFTPaused

```solidity
error NFTPaused()
```

### ArraysLengthInconsistent

```solidity
error ArraysLengthInconsistent()
```

### PriceIsZero

```solidity
error PriceIsZero()
```

### nftPrices

```solidity
mapping(address => mapping(uint256 => uint256)) nftPrices
```

### collections

```solidity
mapping(address => bool) collections
```

### collectionPaused

```solidity
mapping(address => bool) collectionPaused
```

### nftxVaultFactory

```solidity
address nftxVaultFactory
```

### sushiswapRouter

```solidity
address sushiswapRouter
```

### isPriceManager

```solidity
mapping(address => bool) isPriceManager
```

### onlyPriceManager

```solidity
modifier onlyPriceManager()
```

### onlyExistingCollection

```solidity
modifier onlyExistingCollection(address _collection)
```

### onlyNonExistingCollection

```solidity
modifier onlyNonExistingCollection(address _collection)
```

### whenNotPaused

```solidity
modifier whenNotPaused(address _nftContract)
```

### initialize

```solidity
function initialize(address _admin, address _nftxVaultFactory, address _sushiswapRouter, address _lendPoolConfigurator) public
```

_Function is invoked by the proxy contract when the NFTOracle contract is added to the
LendPoolAddressesProvider of the market._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _admin | address | The admin address |
| _nftxVaultFactory | address |  |
| _sushiswapRouter | address |  |
| _lendPoolConfigurator | address |  |

### _whenNotPaused

```solidity
function _whenNotPaused(address _contract) internal view
```

_checks whether the NFT oracle is paused_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _contract | address | The NFTOracle address |

### setCollections

```solidity
function setCollections(address[] _collections) external
```

_adds multiple collections to the oracle
  @param _collections the array NFT collections to add_

### addCollection

```solidity
function addCollection(address _collection) external
```

_adds a collection to the oracle
  @param _collection the NFT collection to add_

### _addCollection

```solidity
function _addCollection(address _collection) internal
```

_adds a collection to the oracle
  @param _collection the NFT collection to add_

### removeCollection

```solidity
function removeCollection(address _collection) external
```

_removes a collection from the oracle
  @param _collection the NFT collection to remove_

### _removeCollection

```solidity
function _removeCollection(address _collection) internal
```

_removes a collection from the oracle
  @param _collection the NFT collection to remove_

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

_sets the price for a given NFT 
  @param _collection the NFT collection
  @param _tokenId the NFT token Id
  @param _price the price to set to the token_

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

_sets the price for a given NFT 
  @param _collections the array of NFT collections
  @param _tokenIds the array of  NFT token Ids
  @param _prices the array of prices to set to the given tokens_

### _setNFTPrice

```solidity
function _setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) internal
```

_sets the price for a given NFT 
  @param _collection the NFT collection
  @param _tokenId the NFT token Id
  @param _price the price to set to the token_

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT
  @param _collection the NFT collection
  @param _tokenId the NFT token Id_

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

_returns the NFT price for a given array of NFTs
  @param _collections the array of NFT collections
  @param _tokenIds the array NFT token Id_

### setPause

```solidity
function setPause(address _collection, bool paused) external
```

_sets the pause status of the NFT oracle
  @param _nftContract the of NFT collection
  @param val the value to set the pausing status (true for paused, false for unpaused)_

### setPriceManagerStatus

```solidity
function setPriceManagerStatus(address newPriceManager, bool val) external
```

### getNFTPriceNFTX

```solidity
function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT valued by NFTX
  @param _collection the NFT collection
  @param _tokenId the NFT token Id_

