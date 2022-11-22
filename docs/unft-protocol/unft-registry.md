# uNFT Registry


## Methods
### getUNFTAddresses

`
function getUNFTAddresses(address nftAsset) external view returns (address uNftProxy, address uNftImpl)
`

_gets the uNFT address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT asset |

### getUNFTAddressesByIndex

`
function getUNFTAddressesByIndex(uint16 index) external view returns (address uNftProxy, address uNftImpl)
`

_gets the uNFT address by index_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint16 | the uNFT index |

### getUNFTAssetList

`
function getUNFTAssetList() external view returns (address[])
`

_gets the list of uNFTs_

### allUNFTAssetLength

`
function allUNFTAssetLength() external view returns (uint256)
`

_gets the length of the list of uNFTs_


### createUNFT

`
function createUNFT(address nftAsset) external returns (address uNftProxy)
`

_Create uNFT proxy and implement, then initialize it_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying asset of the UNFT |


