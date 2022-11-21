# WETH Gateway

### _addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### WETH

```solidity
contract IWETH WETH
```

### _callerWhitelists

```solidity
mapping(address => bool) _callerWhitelists
```

### _NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### _ENTERED

```solidity
uint256 _ENTERED
```

### _status

```solidity
uint256 _status
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### initialize

```solidity
function initialize(address addressProvider, address weth) public
```

_Sets the WETH address and the LendPoolAddressesProvider address. Infinite approves lend pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressProvider | address |  |
| weth | address | Address of the Wrapped Ether contract |

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

returns the LendPool address

### _getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

returns the LendPoolLoan address

### authorizeLendPoolNFT

```solidity
function authorizeLendPoolNFT(address[] nftAssets) external
```

_approves the lendpool for the given NFT assets_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAssets | address[] | the array of nft assets |

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

_authorizes/unauthorizes a list of callers for the whitelist_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| callers | address[] | the array of callers to be authorized |
| flag | bool | the flag to authorize/unauthorize |

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

_checks if caller is whitelisted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| caller | address | the caller to check |

### _checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

_checks if caller's approved address is valid_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| onBehalfOf | address | the address to check approval of the caller |

### depositETH

```solidity
function depositETH(address onBehalfOf, uint16 referralCode) external payable
```

_deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (uTokens)
is minted._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| onBehalfOf | address | address of the user who will receive the uTokens representing the deposit |
| referralCode | uint16 | integrators are assigned a referral code and can potentially receive rewards. |

### withdrawETH

```solidity
function withdrawETH(uint256 amount, address to) external
```

_withdraws the WETH _reserves of msg.sender._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | amount of uWETH to withdraw and receive native ETH |
| to | address | address of the user who will receive native ETH |

### borrowETH

```solidity
function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount of ETH to borrow |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | integrators are assigned a referral code and can potentially receive rewards |

### repayETH

```solidity
function repayETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |

### _repayETH

```solidity
function _repayETH(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |
| accAmount | uint256 | the accumulated amount |

### auctionETH

```solidity
function auctionETH(address nftAsset, uint256 nftTokenId, address onBehalfOf) external payable
```

_auction a borrow on the WETH reserve_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| onBehalfOf | address | Address of the user who will receive the underlying NFT used as collateral. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral. |

### redeemETH

```solidity
function redeemETH(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 bidFine) external payable returns (uint256)
```

_redeems a borrow on the WETH reserve_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidateETH

```solidity
function liquidateETH(address nftAsset, uint256 nftTokenId) external payable returns (uint256)
```

_liquidates a borrow on the WETH reserve_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### liquidateNFTX

```solidity
function liquidateNFTX(address nftAsset, uint256 nftTokenId) external returns (uint256)
```

_liquidates a borrow on the WETH reserve on NFTX_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### _safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | recipient of the transfer |
| value | uint256 | the amount to send |

### getWETHAddress

```solidity
function getWETHAddress() external view returns (address)
```

_Get WETH address used by WETHGateway_

### receive

```solidity
receive() external payable
```

_Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract._

### fallback

```solidity
fallback() external payable
```

_Revert fallback calls_

