# uNFTs

Implements the methods for the uNFT protocol_

## Methods

### mint

```
function mint(address to, uint256 tokenId) external
```

_Mints uNFT token to the user address

Requirements:
 - The caller must be contract address_

#### Call Params

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The owner address receive the uNFT token |
| tokenId | uint256 | token id of the underlying asset of NFT |

### burn

```
function burn(uint256 tokenId) external
```

_Burns user uNFT token

Requirements:
 - The caller must be contract address_

#### Call Params

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | token id of the underlying asset of NFT |


### tokenURI

```
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

#### Call Params

| Name         | Type    | Description|
| ------------ | ------- |------------------------------- |
| tokenId       |uint256  | Nft Id|

#### Return Values
 Type    | Description|
 ------- |------------------------------- |
string  | Uri of the NFT|

### onERC721Received

```
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```
Whenever an IERC721 tokenId token is transferred to this contract via IERC721.safeTransferFrom by operator from from, this function is called.

It must return its Solidity selector to confirm the token transfer. If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.


### minterOf

```
function minterOf(uint256 tokenId) external view returns (address)
```
{% hint style="danger" %}
This method is disabled ,it will revert the transaction
{% endhint %}

### approve

```
function approve(address to, uint256 tokenId) public virtual
```

{% hint style="danger" %}
This method is disabled ,it will revert the transaction
{% endhint %}

### setApprovalForAll

```
function setApprovalForAll(address operator, bool approved) public virtual
```
{% hint style="danger" %}
This method is disabled ,it will revert the transaction
{% endhint %}


### safeTransferFrom

```
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```
{% hint style="danger" %}
This method is disabled ,it will revert the transaction
{% endhint %}

### safeTransferFrom

```
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```
{% hint style="danger" %}
This method is disabled ,it will revert the transaction
{% endhint %}
### flashLoan

```
function flashLoan(address receiverAddress, uint256[] nftTokenIds, bytes params) external
```
