# uNFT Registry

### uNftProxys

```solidity
mapping(address => address) uNftProxys
```

### uNftImpls

```solidity
mapping(address => address) uNftImpls
```

### uNftAssetLists

```solidity
address[] uNftAssetLists
```

### namePrefix

```solidity
string namePrefix
```

### symbolPrefix

```solidity
string symbolPrefix
```

### uNftGenericImpl

```solidity
address uNftGenericImpl
```

### customSymbols

```solidity
mapping(address => string) customSymbols
```

### getUNFTAddresses

```solidity
function getUNFTAddresses(address nftAsset) external view returns (address uNftProxy, address uNftImpl)
```

_gets the uNFT address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT asset |

### getUNFTAddressesByIndex

```solidity
function getUNFTAddressesByIndex(uint16 index) external view returns (address uNftProxy, address uNftImpl)
```

_gets the uNFT address by index_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint16 | the uNFT index |

### getUNFTAssetList

```solidity
function getUNFTAssetList() external view returns (address[])
```

_gets the list of uNFTs_

### allUNFTAssetLength

```solidity
function allUNFTAssetLength() external view returns (uint256)
```

_gets the length of the list of uNFTs_

### initialize

```solidity
function initialize(address genericImpl, string namePrefix_, string symbolPrefix_) external
```

_initializes the contract_

### createUNFT

```solidity
function createUNFT(address nftAsset) external returns (address uNftProxy)
```

_Create uNFT proxy and implement, then initialize it_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying asset of the UNFT |

### setUNFTGenericImpl

```solidity
function setUNFTGenericImpl(address genericImpl) external
```

_sets the uNFT generic implementation
genericImpl the implementation contract_

### createUNFTWithImpl

```solidity
function createUNFTWithImpl(address nftAsset, address uNftImpl) external returns (address uNftProxy)
```

_Create uNFT proxy with already deployed implement, then initialize it_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying asset of the UNFT |
| uNftImpl | address | The address of the deployed implement of the UNFT |

### upgradeUNFTWithImpl

```solidity
function upgradeUNFTWithImpl(address nftAsset, address uNftImpl, bytes encodedCallData) external
```

_Update uNFT proxy to an new deployed implement, then initialize it_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying asset of the UNFT |
| uNftImpl | address | The address of the deployed implement of the UNFT |
| encodedCallData | bytes | The encoded function call. |

### addCustomeSymbols

```solidity
function addCustomeSymbols(address[] nftAssets_, string[] symbols_) external
```

_Adding custom symbol for some special NFTs like CryptoPunks_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAssets_ | address[] | The addresses of the NFTs |
| symbols_ | string[] | The custom symbols of the NFTs |

### _createProxyAndInitWithImpl

```solidity
function _createProxyAndInitWithImpl(address nftAsset, address uNftImpl) internal returns (address uNftProxy)
```

_creates the proxy and inits it with an implementation contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | the underlying NFT asset |
| uNftImpl | address | the uNFT implementation contract address |

### _buildInitParams

```solidity
function _buildInitParams(address nftAsset) internal view returns (bytes initParams)
```

_builds the initial params for the uNFT contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | the underlying NFT asset to build the params to |

### _requireAddressIsERC721

```solidity
function _requireAddressIsERC721(address nftAsset) internal view
```

_checks if the address is an ERC721 token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | the asset to be checked |

