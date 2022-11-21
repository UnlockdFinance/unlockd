# LendPoolLoan

### _addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### _loanIdTracker

```solidity
struct CountersUpgradeable.Counter _loanIdTracker
```

### _loans

```solidity
mapping(uint256 => struct DataTypes.LoanData) _loans
```

### _nftToLoanIds

```solidity
mapping(address => mapping(uint256 => uint256)) _nftToLoanIds
```

### _nftTotalCollateral

```solidity
mapping(address => uint256) _nftTotalCollateral
```

### _userNftCollateral

```solidity
mapping(address => mapping(address => uint256)) _userNftCollateral
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

_Only lending pool can call functions marked by this modifier_

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) external
```

### initNft

```solidity
function initNft(address nftAsset, address uNftAddress) external
```

### createLoan

```solidity
function createLoan(address initiator, address onBehalfOf, address nftAsset, uint256 nftTokenId, address uNftAddress, address reserveAsset, uint256 amount, uint256 borrowIndex) external returns (uint256)
```

_Create store a loan object with some params_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| onBehalfOf | address | The address receiving the loan |
| nftAsset | address | The address of the underlying NFT asset |
| nftTokenId | uint256 | The token Id of the underlying NFT asset |
| uNftAddress | address | The address of the uNFT token |
| reserveAsset | address | The address of the underlying reserve asset |
| amount | uint256 | The loan amount |
| borrowIndex | uint256 | The index to get the scaled loan amount |

### updateLoan

```solidity
function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external
```

_Update the given loan with some params

Requirements:
 - The caller must be a holder of the loan
 - The loan must be in state Active_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user updating the loan |
| loanId | uint256 | The loan ID |
| amountAdded | uint256 | The amount added to the loan |
| amountTaken | uint256 | The amount taken from the loan |
| borrowIndex | uint256 | The index to get the scaled loan amount |

### repayLoan

```solidity
function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external
```

_Repay the given loan

Requirements:
 - The caller must be a holder of the loan
 - The caller must send in principal + interest
 - The loan must be in state Active_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the repay |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address | The address of uNFT |
| amount | uint256 | The amount repaid |
| borrowIndex | uint256 | The index to get the scaled loan amount |

### auctionLoan

```solidity
function auctionLoan(address initiator, uint256 loanId, address onBehalfOf, uint256 bidPrice, uint256 borrowAmount, uint256 borrowIndex) external
```

_Auction the given loan

Requirements:
 - The price must be greater than current highest price
 - The loan must be in state Active or Auction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the auction |
| loanId | uint256 | The loan getting auctioned |
| onBehalfOf | address |  |
| bidPrice | uint256 | The bid price of this auction |
| borrowAmount | uint256 |  |
| borrowIndex | uint256 |  |

### redeemLoan

```solidity
function redeemLoan(address initiator, uint256 loanId, uint256 amountTaken, uint256 borrowIndex) external
```

_Redeem the given loan with some params

Requirements:
 - The caller must be a holder of the loan
 - The loan must be in state Auction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| loanId | uint256 | The loan getting redeemed |
| amountTaken | uint256 | The taken amount |
| borrowIndex | uint256 | The index to get the scaled loan amount |

### liquidateLoan

```solidity
function liquidateLoan(address initiator, uint256 loanId, address uNftAddress, uint256 borrowAmount, uint256 borrowIndex) external
```

_Liquidate the given loan

Requirements:
 - The caller must send in principal + interest
 - The loan must be in state Active_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the auction |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address | The address of uNFT |
| borrowAmount | uint256 | The borrow amount |
| borrowIndex | uint256 | The index to get the scaled loan amount |

### liquidateLoanNFTX

```solidity
function liquidateLoanNFTX(uint256 loanId, address uNftAddress, uint256 borrowAmount, uint256 borrowIndex) external returns (uint256 sellPrice)
```

_Liquidate the given loan on NFTX

Requirements:
 - The caller must send in principal + interest
 - The loan must be in state Auction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address |  |
| borrowAmount | uint256 |  |
| borrowIndex | uint256 |  |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```

_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`._

### borrowerOf

```solidity
function borrowerOf(uint256 loanId) external view returns (address)
```

@dev returns the borrower of a specific loan
param loanId the loan to get the borrower from

### getCollateralLoanId

```solidity
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)
```

@dev returns the loan corresponding to a specific NFT
param nftAsset the underlying NFT asset
param tokenId the underlying token ID for the NFT

### getLoan

```solidity
function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)
```

@dev returns the loan corresponding to a specific loan Id
param loanId the loan Id

### getLoanCollateralAndReserve

```solidity
function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)
```

@dev returns the collateral and reserve corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowAmount

```solidity
function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow  amount corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowScaledAmount

```solidity
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow __scaled__ amount corresponding to a specific loan
param loanId the loan Id

### getLoanHighestBid

```solidity
function getLoanHighestBid(uint256 loanId) external view returns (address, uint256)
```

### getNftCollateralAmount

```solidity
function getNftCollateralAmount(address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT
param nftAsset the underlying NFT asset

### getUserNftCollateralAmount

```solidity
function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT and a specific user
param user the user
param nftAsset the underlying NFT asset

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

_returns the LendPool address_

### getLoanIdTracker

```solidity
function getLoanIdTracker() external view returns (struct CountersUpgradeable.Counter)
```

@dev returns the counter tracker for all the loan ID's in the protocol

