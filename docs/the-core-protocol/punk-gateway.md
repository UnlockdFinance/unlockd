# Punk Gateway

### _addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### _wethGateway

```solidity
contract IWETHGateway _wethGateway
```

### punks

```solidity
contract IPunks punks
```

### wrappedPunks

```solidity
contract IWrappedPunks wrappedPunks
```

### proxy

```solidity
address proxy
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
function initialize(address addressProvider, address wethGateway, address _punks, address _wrappedPunks) public
```

_Function is invoked by the proxy contract when the PunkGateway contract is added to the
LendPoolAddressesProvider of the market._

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

Returns the LendPool address

### _getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

Returns the LendPoolLoan address

### authorizeLendPoolERC20

```solidity
function authorizeLendPoolERC20(address[] tokens) external
```

Approves the lendpool for given tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens | address[] | the array of tokens |

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

Authorizes/unauthorizes an array of callers to the whitelist

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| callers | address[] | the array of callers |
| flag | bool |  |

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

Checks if caller is whitelisted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| caller | address | caller address |

### _checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

Checks the onBehalfOf address is valid for a given callet

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| onBehalfOf | address | the allowed address |

### _depositPunk

```solidity
function _depositPunk(uint256 punkIndex) internal
```

Deposits a punk given its index
- E.g. User repays 100 USDC, burning loan and receives collateral asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to deposit |

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveAsset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### _withdrawPunk

```solidity
function _withdrawPunk(uint256 punkIndex, address onBehalfOf) internal
```

### repay

```solidity
function repay(uint256 punkIndex, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned
- E.g. User repays 100 USDC, burning loan and receives collateral asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount | uint256 | The amount to repay |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### _repay

```solidity
function _repay(uint256 punkIndex, uint256 amount) internal returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned
- E.g. User repays 100 USDC, burning loan and receives collateral asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount | uint256 | The amount to repay |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### auction

```solidity
function auction(uint256 punkIndex, uint256 bidPrice, address onBehalfOf) external
```

auction a unhealth punk loan with ERC20 reserve

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| bidPrice | uint256 | The bid price |
| onBehalfOf | address |  |

### redeem

```solidity
function redeem(uint256 punkIndex, uint256 amount, uint256 bidFine) external returns (uint256)
```

redeem a unhealth punk loan with ERC20 reserve

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidate

```solidity
function liquidate(uint256 punkIndex, uint256 amount) external returns (uint256)
```

liquidate a unhealth punk loan with ERC20 reserve

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 |  |

### liquidateNFTX

```solidity
function liquidateNFTX(uint256 punkIndex) external returns (uint256)
```

Liquidate punk in NFTX

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to liquidate |

### borrowETH

```solidity
function borrowETH(uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
  and lock collateral asset in contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount to be borrowed |
| punkIndex | uint256 | The index of the CryptoPunk to deposit |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### repayETH

```solidity
function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH
- E.g. User repays 100 ETH, burning loan and receives collateral asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount | uint256 | The amount to repay |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### _repayETH

```solidity
function _repayETH(uint256 punkIndex, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH
- E.g. User repays 100 ETH, burning loan and receives collateral asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount | uint256 | The amount to repay |
| accAmount | uint256 | The accumulated amount |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### auctionETH

```solidity
function auctionETH(uint256 punkIndex, address onBehalfOf) external payable
```

auction a unhealth punk loan with native ETH

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| onBehalfOf | address | Address of the user who will receive the CryptoPunk. Should be the address of the user itself calling the function if he wants to get collateral |

### redeemETH

```solidity
function redeemETH(uint256 punkIndex, uint256 amount, uint256 bidFine) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidateETH

```solidity
function liquidateETH(uint256 punkIndex) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |

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

### receive

```solidity
receive() external payable
```

@dev

### fallback

```solidity
fallback() external payable
```

_Revert fallback calls_

