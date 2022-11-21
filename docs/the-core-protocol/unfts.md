# uNFTs

_Implements the methods for the uNFT protocol_

### _underlyingAsset

```solidity
address _underlyingAsset
```

### _minters

```solidity
mapping(uint256 => address) _minters
```

### initialize

```solidity
function initialize(address underlyingAsset, string uNftName, string uNftSymbol) external
```

_Initializes the uNFT_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| underlyingAsset | address | The address of the underlying asset of this uNFT (E.g. PUNK for bPUNK) |
| uNftName | string |  |
| uNftSymbol | string |  |

### mint

```solidity
function mint(address to, uint256 tokenId) external
```

_Mints uNFT token to the user address

Requirements:
 - The caller must be contract address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The owner address receive the uNFT token |
| tokenId | uint256 | token id of the underlying asset of NFT |

### burn

```solidity
function burn(uint256 tokenId) external
```

_Burns user uNFT token

Requirements:
 - The caller must be contract address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | token id of the underlying asset of NFT |

### flashLoan

```solidity
function flashLoan(address receiverAddress, uint256[] nftTokenIds, bytes params) external
```

_See {IUNFT-flashLoan}._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```

_See {ERC721EnumerableUpgradeable}._

### minterOf

```solidity
function minterOf(uint256 tokenId) external view returns (address)
```

_See {IUNFT-minterOf}._

### approve

```solidity
function approve(address to, uint256 tokenId) public virtual
```

_Being non transferrable, the uNFT token does not implement any of the
standard ERC721 functions for transfer and allowance._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public virtual
```

_See {ERC721EnumerableUpgradeable}._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {ERC721EnumerableUpgradeable}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {ERC721EnumerableUpgradeable}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```

_See {ERC721EnumerableUpgradeable}._

### _transfer

```solidity
function _transfer(address from, address to, uint256 tokenId) internal virtual
```

_See {ERC721EnumerableUpgradeable}._

