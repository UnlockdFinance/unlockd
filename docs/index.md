# Solidity API

## IBToken

### Initialized

```solidity
event Initialized(address underlyingAsset, address pool, address treasury, address incentivesController)
```

_Emitted when an bToken is initialized_

| Name | Type | Description |
| ---- | ---- | ----------- |xf
| underlyingAsset | address | The address of the underlying asset |
| pool | address | The address of the associated lending pool |
| treasury | address | The address of the treasury |
| incentivesController | address | The address of the incentives controller for this bToken |

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address treasury, address underlyingAsset, uint8 bTokenDecimals, string bTokenName, string bTokenSymbol) external
```

_Initializes the bToken_

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the address provider where this bToken will be used |
| treasury | address | The address of the Unlockd treasury, receiving the fees on this bToken |
| underlyingAsset | address | The address of the underlying asset of this bToken |
| bTokenDecimals | uint8 |  |
| bTokenName | string |  |
| bTokenSymbol | string |  |

### Mint

```solidity
event Mint(address from, uint256 value, uint256 index)
```

_Emitted after the mint action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address performing the mint |
| value | uint256 | The amount being |
| index | uint256 | The new liquidity index of the reserve |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

_Mints `amount` bTokens to `user`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user was 0 |

### Burn

```solidity
event Burn(address from, address target, uint256 value, uint256 index)
```

_Emitted after bTokens are burned_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The owner of the bTokens, getting them burned |
| target | address | The address that will receive the underlying |
| value | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### BalanceTransfer

```solidity
event BalanceTransfer(address from, address to, uint256 value, uint256 index)
```

_Emitted during the transfer action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The user whose tokens are being transferred |
| to | address | The recipient |
| value | uint256 | The amount being transferred |
| index | uint256 | The new liquidity index of the reserve |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

_Burns bTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The owner of the bTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying |
| amount | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

_Mints bTokens to the reserve treasury_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address user, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendPool to transfer
assets in borrow(), withdraw() and flashLoan()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The recipient of the underlying |
| amount | uint256 | The amount getting transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount transferred |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() external view returns (address)
```

_Returns the address of the underlying asset of this bToken_

## IDebtToken

Defines the basic interface for a debt token.

### Initialized

```solidity
event Initialized(address underlyingAsset, address pool, address incentivesController, uint8 debtTokenDecimals, string debtTokenName, string debtTokenSymbol)
```

_Emitted when a debt token is initialized_

| Name | Type | Description |
| ---- | ---- | ----------- |
| underlyingAsset | address | The address of the underlying asset |
| pool | address | The address of the associated lend pool |
| incentivesController | address | The address of the incentives controller |
| debtTokenDecimals | uint8 | the decimals of the debt token |
| debtTokenName | string | the name of the debt token |
| debtTokenSymbol | string | the symbol of the debt token |

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address underlyingAsset, uint8 debtTokenDecimals, string debtTokenName, string debtTokenSymbol) external
```

_Initializes the debt token._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the lend pool |
| underlyingAsset | address | The address of the underlying asset |
| debtTokenDecimals | uint8 | The decimals of the debtToken, same as the underlying asset's |
| debtTokenName | string | The name of the token |
| debtTokenSymbol | string | The symbol of the token |

### Mint

```solidity
event Mint(address from, uint256 value, uint256 index)
```

_Emitted after the mint action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address performing the mint |
| value | uint256 | The amount to be minted |
| index | uint256 | The last index of the reserve |

### mint

```solidity
function mint(address user, address onBehalfOf, uint256 amount, uint256 index) external returns (bool)
```

_Mints debt token to the `user` address_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address receiving the borrowed underlying |
| onBehalfOf | address |  |
| amount | uint256 | The amount of debt being minted |
| index | uint256 | The variable debt index of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user is 0 |

### Burn

```solidity
event Burn(address user, uint256 amount, uint256 index)
```

_Emitted when variable debt is burnt_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user which debt has been burned |
| amount | uint256 | The amount of debt being burned |
| index | uint256 | The index of the user |

### burn

```solidity
function burn(address user, uint256 amount, uint256 index) external
```

_Burns user variable debt_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user which debt is burnt |
| amount | uint256 |  |
| index | uint256 | The variable debt index of the reserve |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### approveDelegation

```solidity
function approveDelegation(address delegatee, uint256 amount) external
```

_delegates borrowing power to a user on the specific debt token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address receiving the delegated borrowing power |
| amount | uint256 | the maximum amount being delegated. Delegation will still respect the liquidation constraints (even if delegated, a delegatee cannot force a delegator HF to go below 1) |

### borrowAllowance

```solidity
function borrowAllowance(address fromUser, address toUser) external view returns (uint256)
```

_returns the borrow allowance of the user_

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromUser | address | The user to giving allowance |
| toUser | address | The user to give allowance to |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the current allowance of toUser |

## IERC20Detailed

_Interface for the optional metadata functions from the ERC20 standard._

## IERC721Detailed

_Interface for the optional metadata functions from the ERC721 standard._

## IFlashLoanReceiver

Interface for the IFlashLoanReceiver.

_implement this interface to develop a flashloan-compatible flashLoanReceiver contract_

### executeOperation

```solidity
function executeOperation(address asset, uint256[] tokenIds, address initiator, address operator, bytes params) external returns (bool)
```

## IIncentivesController

### handleAction

```solidity
function handleAction(address asset, uint256 totalSupply, uint256 userBalance) external
```

_Called by the corresponding asset on any update that affects the rewards distribution_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the user |
| totalSupply | uint256 | The total supply of the asset in the lending pool |
| userBalance | uint256 | The balance of the user of the asset in the lending pool |

## IInterestRate

_Interface for the calculation of the interest rates_

### baseVariableBorrowRate

```solidity
function baseVariableBorrowRate() external view returns (uint256)
```

### getMaxVariableBorrowRate

```solidity
function getMaxVariableBorrowRate() external view returns (uint256)
```

### calculateInterestRates

```solidity
function calculateInterestRates(address reserve, uint256 availableLiquidity, uint256 totalVariableDebt, uint256 reserveFactor) external view returns (uint256, uint256)
```

### calculateInterestRates

```solidity
function calculateInterestRates(address reserve, address bToken, uint256 liquidityAdded, uint256 liquidityTaken, uint256 totalVariableDebt, uint256 reserveFactor) external view returns (uint256 liquidityRate, uint256 variableBorrowRate)
```

## ILendPool

### Deposit

```solidity
event Deposit(address user, address reserve, uint256 amount, address onBehalfOf, uint16 referral)
```

_Emitted on deposit()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the deposit |
| reserve | address | The address of the underlying asset of the reserve |
| amount | uint256 | The amount deposited |
| onBehalfOf | address | The beneficiary of the deposit, receiving the bTokens |
| referral | uint16 | The referral code used |

### Withdraw

```solidity
event Withdraw(address user, address reserve, uint256 amount, address to)
```

_Emitted on withdraw()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the withdrawal, owner of bTokens |
| reserve | address | The address of the underlyng asset being withdrawn |
| amount | uint256 | The amount to be withdrawn |
| to | address | Address that will receive the underlying |

### Borrow

```solidity
event Borrow(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint256 borrowRate, uint256 loanId, uint16 referral)
```

_Emitted on borrow() when loan needs to be opened_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the borrow(), receiving the funds |
| reserve | address | The address of the underlying asset being borrowed |
| amount | uint256 | The amount borrowed out |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| onBehalfOf | address | The address that will be getting the loan |
| borrowRate | uint256 |  |
| loanId | uint256 |  |
| referral | uint16 | The referral code used |

### Repay

```solidity
event Repay(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on repay()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the repay(), providing the funds |
| reserve | address | The address of the underlying asset of the reserve |
| amount | uint256 | The amount repaid |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| borrower | address | The beneficiary of the repayment, getting his debt reduced |
| loanId | uint256 | The loan ID of the NFT loans |

### Auction

```solidity
event Auction(address user, address reserve, uint256 bidPrice, address nftAsset, uint256 nftTokenId, address onBehalfOf, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is auctioned._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the auction |
| reserve | address | The address of the underlying asset of the reserve |
| bidPrice | uint256 | The price of the underlying reserve given by the bidder |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| onBehalfOf | address | The address that will be getting the NFT |
| borrower | address |  |
| loanId | uint256 | The loan ID of the NFT loans |

### Redeem

```solidity
event Redeem(address user, address reserve, uint256 borrowAmount, uint256 fineAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on redeem()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the redeem(), providing the funds |
| reserve | address | The address of the underlying asset of the reserve |
| borrowAmount | uint256 | The borrow amount repaid |
| fineAmount | uint256 |  |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| borrower | address |  |
| loanId | uint256 | The loan ID of the NFT loans |

### Liquidate

```solidity
event Liquidate(address user, address reserve, uint256 repayAmount, uint256 remainAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is liquidated._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the auction |
| reserve | address | The address of the underlying asset of the reserve |
| repayAmount | uint256 | The amount of reserve repaid by the liquidator |
| remainAmount | uint256 | The amount of reserve received by the borrower |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| borrower | address |  |
| loanId | uint256 | The loan ID of the NFT loans |

### Paused

```solidity
event Paused()
```

_Emitted when the pause is triggered._

### Unpaused

```solidity
event Unpaused()
```

_Emitted when the pause is lifted._

### ReserveDataUpdated

```solidity
event ReserveDataUpdated(address reserve, uint256 liquidityRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)
```

_Emitted when the state of a reserve is updated. NOTE: This event is actually declared
in the ReserveLogic library and emitted in the updateInterestRates() function. Since the function is internal,
the event will actually be fired by the LendPool contract. The event is therefore replicated here so it
gets added to the LendPool ABI_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| liquidityRate | uint256 | The new liquidity rate |
| variableBorrowRate | uint256 | The new variable borrow rate |
| liquidityIndex | uint256 | The new liquidity index |
| variableBorrowIndex | uint256 | The new variable borrow index |

### deposit

```solidity
function deposit(address reserve, uint256 amount, address onBehalfOf, uint16 referralCode) external
```

_Deposits an `amount` of underlying asset into the reserve, receiving in return overlying bTokens.
- E.g. User deposits 100 USDC and gets in return 100 bUSDC_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset to deposit |
| amount | uint256 | The amount to be deposited |
| onBehalfOf | address | The address that will receive the bTokens, same as msg.sender if the user   wants to receive them on his own wallet, or a different address if the beneficiary of bTokens   is a different wallet |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### withdraw

```solidity
function withdraw(address reserve, uint256 amount, address to) external returns (uint256)
```

_Withdraws an `amount` of underlying asset from the reserve, burning the equivalent bTokens owned
E.g. User has 100 bUSDC, calls withdraw() and receives 100 USDC, burning the 100 bUSDC_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset to withdraw |
| amount | uint256 | The underlying amount to be withdrawn   - Send the value type(uint256).max in order to withdraw the whole bToken balance |
| to | address | Address that will receive the underlying, same as msg.sender if the user   wants to receive it on his own wallet, or a different address if the beneficiary is a   different wallet |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount withdrawn |

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveAsset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### batchBorrow

```solidity
function batchBorrow(address[] assets, uint256[] amounts, address[] nftAssets, uint256[] nftTokenIds, address onBehalfOf, uint16 referralCode) external
```

### repay

```solidity
function repay(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific reserve, burning the equivalent loan owned
- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### batchRepay

```solidity
function batchRepay(address[] nftAssets, uint256[] nftTokenIds, uint256[] amounts) external returns (uint256[], bool[])
```

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId, uint256 bidPrice, address onBehalfOf) external
```

_Function to auction a non-healthy position collateral-wise
- The caller (liquidator) want to buy collateral asset of the user getting liquidated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| bidPrice | uint256 | The bid price of the liquidator want to buy the underlying NFT |
| onBehalfOf | address | Address of the user who will get the underlying NFT, same as msg.sender if the user   wants to receive them on his own wallet, or a different address if the beneficiary of NFT   is a different wallet |

### redeem

```solidity
function redeem(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 bidFine) external returns (uint256)
```

Redeem a NFT loan which state is in Auction
- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidate

```solidity
function liquidate(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256)
```

_Function to liquidate a non-healthy position collateral-wise
- The caller (liquidator) buy collateral asset of the user getting liquidated, and receives
  the collateral asset_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 |  |

### finalizeTransfer

```solidity
function finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromBefore, uint256 balanceToBefore) external view
```

_Validates and finalizes an bToken transfer
- Only callable by the overlying bToken of the `asset`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the bToken |
| from | address | The user from which the bTokens are transferred |
| to | address | The user receiving the bTokens |
| amount | uint256 | The amount being transferred/withdrawn |
| balanceFromBefore | uint256 | The bToken balance of the `from` user before the transfer |
| balanceToBefore | uint256 | The bToken balance of the `to` user before the transfer |

### getReserveConfiguration

```solidity
function getReserveConfiguration(address asset) external view returns (struct DataTypes.ReserveConfigurationMap)
```

### getNftConfiguration

```solidity
function getNftConfiguration(address asset) external view returns (struct DataTypes.NftConfigurationMap)
```

### getReserveNormalizedIncome

```solidity
function getReserveNormalizedIncome(address asset) external view returns (uint256)
```

_Returns the normalized income normalized income of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve's normalized income |

### getReserveNormalizedVariableDebt

```solidity
function getReserveNormalizedVariableDebt(address asset) external view returns (uint256)
```

_Returns the normalized variable debt per unit of asset_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve normalized variable debt |

### getReserveData

```solidity
function getReserveData(address asset) external view returns (struct DataTypes.ReserveData)
```

_Returns the state and configuration of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.ReserveData | The state of the reserve |

### getReservesList

```solidity
function getReservesList() external view returns (address[])
```

### getNftData

```solidity
function getNftData(address asset) external view returns (struct DataTypes.NftData)
```

### getNftCollateralData

```solidity
function getNftCollateralData(address nftAsset, uint256 nftTokenId, address reserveAsset) external view returns (uint256 totalCollateralInETH, uint256 totalCollateralInReserve, uint256 availableBorrowsInETH, uint256 availableBorrowsInReserve, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)
```

_Returns the loan data of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the NFT |
| nftTokenId | uint256 |  |
| reserveAsset | address | The address of the Reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalCollateralInETH | uint256 | the total collateral in ETH of the NFT |
| totalCollateralInReserve | uint256 | the total collateral in Reserve of the NFT |
| availableBorrowsInETH | uint256 | the borrowing power in ETH of the NFT |
| availableBorrowsInReserve | uint256 | the borrowing power in Reserve of the NFT |
| ltv | uint256 | the loan to value of the user |
| liquidationThreshold | uint256 | the liquidation threshold of the NFT |
| liquidationBonus | uint256 | the liquidation bonus of the NFT |

### getNftDebtData

```solidity
function getNftDebtData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, address reserveAsset, uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 healthFactor)
```

_Returns the debt data of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the NFT |
| nftTokenId | uint256 | The token id of the NFT |

| Name | Type | Description |
| ---- | ---- | ----------- |
| loanId | uint256 | the loan id of the NFT |
| reserveAsset | address | the address of the Reserve |
| totalCollateral | uint256 | the total power of the NFT |
| totalDebt | uint256 | the total debt of the NFT |
| availableBorrows | uint256 | the borrowing power left of the NFT |
| healthFactor | uint256 | the current health factor of the NFT |

### getNftAuctionData

```solidity
function getNftAuctionData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, address bidderAddress, uint256 bidPrice, uint256 bidBorrowAmount, uint256 bidFine)
```

_Returns the auction data of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the NFT |
| nftTokenId | uint256 | The token id of the NFT |

| Name | Type | Description |
| ---- | ---- | ----------- |
| loanId | uint256 | the loan id of the NFT |
| bidderAddress | address | the highest bidder address of the loan |
| bidPrice | uint256 | the highest bid price in Reserve of the loan |
| bidBorrowAmount | uint256 | the borrow amount in Reserve of the loan |
| bidFine | uint256 | the penalty fine of the loan |

### getNftLiquidatePrice

```solidity
function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId) external view returns (uint256 liquidatePrice, uint256 paybackAmount)
```

### getNftsList

```solidity
function getNftsList() external view returns (address[])
```

### setPause

```solidity
function setPause(bool val) external
```

_Set the _pause state of a reserve
- Only callable by the LendPool contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| val | bool | `true` to pause the reserve, `false` to un-pause it |

### paused

```solidity
function paused() external view returns (bool)
```

_Returns if the LendPool is paused_

### getAddressesProvider

```solidity
function getAddressesProvider() external view returns (contract ILendPoolAddressesProvider)
```

### initReserve

```solidity
function initReserve(address asset, address bTokenAddress, address debtTokenAddress, address interestRateAddress) external
```

### initNft

```solidity
function initNft(address asset, address uNftAddress) external
```

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address asset, address rateAddress) external
```

### setReserveConfiguration

```solidity
function setReserveConfiguration(address asset, uint256 configuration) external
```

### setNftConfiguration

```solidity
function setNftConfiguration(address asset, uint256 configuration) external
```

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address asset, uint256 maxSupply, uint256 maxTokenId) external
```

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 val) external
```

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 val) external
```

### getMaxNumberOfReserves

```solidity
function getMaxNumberOfReserves() external view returns (uint256)
```

### getMaxNumberOfNfts

```solidity
function getMaxNumberOfNfts() external view returns (uint256)
```

## ILendPoolAddressesProvider

_Main registry of addresses part of or connected to the protocol, including permissioned roles
- Acting also as factory of proxies and admin of those, so with right to change its implementations
- Owned by the Unlockd Governance_

### MarketIdSet

```solidity
event MarketIdSet(string newMarketId)
```

### LendPoolUpdated

```solidity
event LendPoolUpdated(address newAddress, bytes encodedCallData)
```

### ConfigurationAdminUpdated

```solidity
event ConfigurationAdminUpdated(address newAddress)
```

### EmergencyAdminUpdated

```solidity
event EmergencyAdminUpdated(address newAddress)
```

### LendPoolConfiguratorUpdated

```solidity
event LendPoolConfiguratorUpdated(address newAddress, bytes encodedCallData)
```

### ReserveOracleUpdated

```solidity
event ReserveOracleUpdated(address newAddress)
```

### NftOracleUpdated

```solidity
event NftOracleUpdated(address newAddress)
```

### LendPoolLoanUpdated

```solidity
event LendPoolLoanUpdated(address newAddress, bytes encodedCallData)
```

### ProxyCreated

```solidity
event ProxyCreated(bytes32 id, address newAddress)
```

### AddressSet

```solidity
event AddressSet(bytes32 id, address newAddress, bool hasProxy, bytes encodedCallData)
```

### UNFTRegistryUpdated

```solidity
event UNFTRegistryUpdated(address newAddress)
```

### IncentivesControllerUpdated

```solidity
event IncentivesControllerUpdated(address newAddress)
```

### UIDataProviderUpdated

```solidity
event UIDataProviderUpdated(address newAddress)
```

### UnlockdDataProviderUpdated

```solidity
event UnlockdDataProviderUpdated(address newAddress)
```

### WalletBalanceProviderUpdated

```solidity
event WalletBalanceProviderUpdated(address newAddress)
```

### getMarketId

```solidity
function getMarketId() external view returns (string)
```

### setMarketId

```solidity
function setMarketId(string marketId) external
```

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external
```

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address impl, bytes encodedCallData) external
```

### getAddress

```solidity
function getAddress(bytes32 id) external view returns (address)
```

### getLendPool

```solidity
function getLendPool() external view returns (address)
```

### setLendPoolImpl

```solidity
function setLendPoolImpl(address pool, bytes encodedCallData) external
```

### getLendPoolConfigurator

```solidity
function getLendPoolConfigurator() external view returns (address)
```

### setLendPoolConfiguratorImpl

```solidity
function setLendPoolConfiguratorImpl(address configurator, bytes encodedCallData) external
```

### getPoolAdmin

```solidity
function getPoolAdmin() external view returns (address)
```

### setPoolAdmin

```solidity
function setPoolAdmin(address admin) external
```

### getEmergencyAdmin

```solidity
function getEmergencyAdmin() external view returns (address)
```

### setEmergencyAdmin

```solidity
function setEmergencyAdmin(address admin) external
```

### getReserveOracle

```solidity
function getReserveOracle() external view returns (address)
```

### setReserveOracle

```solidity
function setReserveOracle(address reserveOracle) external
```

### getNFTOracle

```solidity
function getNFTOracle() external view returns (address)
```

### setNFTOracle

```solidity
function setNFTOracle(address nftOracle) external
```

### getLendPoolLoan

```solidity
function getLendPoolLoan() external view returns (address)
```

### setLendPoolLoanImpl

```solidity
function setLendPoolLoanImpl(address loan, bytes encodedCallData) external
```

### getUNFTRegistry

```solidity
function getUNFTRegistry() external view returns (address)
```

### setUNFTRegistry

```solidity
function setUNFTRegistry(address factory) external
```

### getIncentivesController

```solidity
function getIncentivesController() external view returns (address)
```

### setIncentivesController

```solidity
function setIncentivesController(address controller) external
```

### getUIDataProvider

```solidity
function getUIDataProvider() external view returns (address)
```

### setUIDataProvider

```solidity
function setUIDataProvider(address provider) external
```

### getUnlockdDataProvider

```solidity
function getUnlockdDataProvider() external view returns (address)
```

### setUnlockdDataProvider

```solidity
function setUnlockdDataProvider(address provider) external
```

### getWalletBalanceProvider

```solidity
function getWalletBalanceProvider() external view returns (address)
```

### setWalletBalanceProvider

```solidity
function setWalletBalanceProvider(address provider) external
```

## ILendPoolAddressesProviderRegistry

_Main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets
- Used for indexing purposes of Unlockd protocol's markets
- The id assigned to a LendPoolAddressesProvider refers to the market it is connected with,
  for example with `1` for the Unlockd main market and `2` for the next created_

### AddressesProviderRegistered

```solidity
event AddressesProviderRegistered(address newAddress)
```

### AddressesProviderUnregistered

```solidity
event AddressesProviderUnregistered(address newAddress)
```

### getAddressesProvidersList

```solidity
function getAddressesProvidersList() external view returns (address[])
```

### getAddressesProviderIdByAddress

```solidity
function getAddressesProviderIdByAddress(address addressesProvider) external view returns (uint256)
```

### registerAddressesProvider

```solidity
function registerAddressesProvider(address provider, uint256 id) external
```

### unregisterAddressesProvider

```solidity
function unregisterAddressesProvider(address provider) external
```

## ILendPoolConfigurator

### ConfigReserveInput

```solidity
struct ConfigReserveInput {
  address asset;
  uint256 reserveFactor;
}
```

### ConfigNftInput

```solidity
struct ConfigNftInput {
  address asset;
  uint256 baseLTV;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 redeemDuration;
  uint256 auctionDuration;
  uint256 redeemFine;
  uint256 redeemThreshold;
  uint256 minBidFine;
  uint256 maxSupply;
  uint256 maxTokenId;
}
```

### ReserveInitialized

```solidity
event ReserveInitialized(address asset, address bToken, address debtToken, address interestRateAddress)
```

_Emitted when a reserve is initialized._

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| bToken | address | The address of the associated bToken contract |
| debtToken | address | The address of the associated debtToken contract |
| interestRateAddress | address | The address of the interest rate strategy for the reserve |

### BorrowingEnabledOnReserve

```solidity
event BorrowingEnabledOnReserve(address asset)
```

_Emitted when borrowing is enabled on a reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

### BorrowingDisabledOnReserve

```solidity
event BorrowingDisabledOnReserve(address asset)
```

_Emitted when borrowing is disabled on a reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveActivated

```solidity
event ReserveActivated(address asset)
```

_Emitted when a reserve is activated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveDeactivated

```solidity
event ReserveDeactivated(address asset)
```

_Emitted when a reserve is deactivated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveFrozen

```solidity
event ReserveFrozen(address asset)
```

_Emitted when a reserve is frozen_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveUnfrozen

```solidity
event ReserveUnfrozen(address asset)
```

_Emitted when a reserve is unfrozen_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveFactorChanged

```solidity
event ReserveFactorChanged(address asset, uint256 factor)
```

_Emitted when a reserve factor is updated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| factor | uint256 | The new reserve factor |

### ReserveDecimalsChanged

```solidity
event ReserveDecimalsChanged(address asset, uint256 decimals)
```

_Emitted when the reserve decimals are updated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| decimals | uint256 | The new decimals |

### ReserveInterestRateChanged

```solidity
event ReserveInterestRateChanged(address asset, address strategy)
```

_Emitted when a reserve interest strategy contract is updated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| strategy | address | The new address of the interest strategy contract |

### NftInitialized

```solidity
event NftInitialized(address asset, address uNft)
```

_Emitted when a nft is initialized._

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the nft |
| uNft | address | The address of the associated uNFT contract |

### NftConfigurationChanged

```solidity
event NftConfigurationChanged(address asset, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)
```

_Emitted when the collateralization risk parameters for the specified NFT are updated._

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the NFT |
| ltv | uint256 | The loan to value of the asset when used as NFT |
| liquidationThreshold | uint256 | The threshold at which loans using this asset as NFT will be considered undercollateralized |
| liquidationBonus | uint256 | The bonus liquidators receive to liquidate this asset |

### NftActivated

```solidity
event NftActivated(address asset)
```

_Emitted when a NFT is activated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the NFT |

### NftDeactivated

```solidity
event NftDeactivated(address asset)
```

_Emitted when a NFT is deactivated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the NFT |

### NftFrozen

```solidity
event NftFrozen(address asset)
```

_Emitted when a NFT is frozen_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the NFT |

### NftUnfrozen

```solidity
event NftUnfrozen(address asset)
```

_Emitted when a NFT is unfrozen_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the NFT |

### NftAuctionChanged

```solidity
event NftAuctionChanged(address asset, uint256 redeemDuration, uint256 auctionDuration, uint256 redeemFine)
```

_Emitted when a redeem duration is updated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the NFT |
| redeemDuration | uint256 | The new redeem duration |
| auctionDuration | uint256 | The new redeem duration |
| redeemFine | uint256 | The new redeem fine |

### NftRedeemThresholdChanged

```solidity
event NftRedeemThresholdChanged(address asset, uint256 redeemThreshold)
```

### NftMinBidFineChanged

```solidity
event NftMinBidFineChanged(address asset, uint256 minBidFine)
```

### NftMaxSupplyAndTokenIdChanged

```solidity
event NftMaxSupplyAndTokenIdChanged(address asset, uint256 maxSupply, uint256 maxTokenId)
```

### BTokenUpgraded

```solidity
event BTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when an bToken implementation is upgraded_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| proxy | address | The bToken proxy address |
| implementation | address | The new bToken implementation |

### DebtTokenUpgraded

```solidity
event DebtTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when the implementation of a debt token is upgraded_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| proxy | address | The debt token proxy address |
| implementation | address | The new debtToken implementation |

## ILendPoolLoan

### Initialized

```solidity
event Initialized(address pool)
```

_Emitted on initialization to share location of dependent notes_

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the associated lend pool |

### LoanCreated

```solidity
event LoanCreated(address user, address onBehalfOf, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amount, uint256 borrowIndex)
```

_Emitted when a loan is created_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the action |
| onBehalfOf | address |  |
| loanId | uint256 |  |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| reserveAsset | address |  |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### LoanUpdated

```solidity
event LoanUpdated(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex)
```

_Emitted when a loan is updated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the action |
| loanId | uint256 |  |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| reserveAsset | address |  |
| amountAdded | uint256 |  |
| amountTaken | uint256 |  |
| borrowIndex | uint256 |  |

### LoanRepaid

```solidity
event LoanRepaid(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amount, uint256 borrowIndex)
```

_Emitted when a loan is repaid by the borrower_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the action |
| loanId | uint256 |  |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| reserveAsset | address |  |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### LoanAuctioned

```solidity
event LoanAuctioned(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, uint256 amount, uint256 borrowIndex, address bidder, uint256 price, address previousBidder, uint256 previousPrice)
```

_Emitted when a loan is auction by the liquidator_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the action |
| loanId | uint256 |  |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| amount | uint256 |  |
| borrowIndex | uint256 |  |
| bidder | address |  |
| price | uint256 |  |
| previousBidder | address |  |
| previousPrice | uint256 |  |

### LoanRedeemed

```solidity
event LoanRedeemed(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amountTaken, uint256 borrowIndex)
```

_Emitted when a loan is redeemed_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the action |
| loanId | uint256 |  |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| reserveAsset | address |  |
| amountTaken | uint256 |  |
| borrowIndex | uint256 |  |

### LoanLiquidated

```solidity
event LoanLiquidated(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amount, uint256 borrowIndex)
```

_Emitted when a loan is liquidate by the liquidator_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the action |
| loanId | uint256 |  |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| reserveAsset | address |  |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### initNft

```solidity
function initNft(address nftAsset, address uNftAddress) external
```

### createLoan

```solidity
function createLoan(address initiator, address onBehalfOf, address nftAsset, uint256 nftTokenId, address uNftAddress, address reserveAsset, uint256 amount, uint256 borrowIndex) external returns (uint256)
```

_Create store a loan object with some params_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| onBehalfOf | address | The address receiving the loan |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| uNftAddress | address |  |
| reserveAsset | address |  |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### updateLoan

```solidity
function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external
```

_Update the given loan with some params

Requirements:
 - The caller must be a holder of the loan
 - The loan must be in state Active_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| loanId | uint256 |  |
| amountAdded | uint256 |  |
| amountTaken | uint256 |  |
| borrowIndex | uint256 |  |

### repayLoan

```solidity
function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external
```

_Repay the given loan

Requirements:
 - The caller must be a holder of the loan
 - The caller must send in principal + interest
 - The loan must be in state Active_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the repay |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address | The address of uNFT |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### auctionLoan

```solidity
function auctionLoan(address initiator, uint256 loanId, address onBehalfOf, uint256 bidPrice, uint256 borrowAmount, uint256 borrowIndex) external
```

_Auction the given loan

Requirements:
 - The price must be greater than current highest price
 - The loan must be in state Active or Auction_

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| loanId | uint256 |  |
| amountTaken | uint256 |  |
| borrowIndex | uint256 |  |

### liquidateLoan

```solidity
function liquidateLoan(address initiator, uint256 loanId, address uNftAddress, uint256 borrowAmount, uint256 borrowIndex) external
```

_Liquidate the given loan

Requirements:
 - The caller must send in principal + interest
 - The loan must be in state Active_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the auction |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address | The address of uNFT |
| borrowAmount | uint256 |  |
| borrowIndex | uint256 |  |

### borrowerOf

```solidity
function borrowerOf(uint256 loanId) external view returns (address)
```

### getCollateralLoanId

```solidity
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)
```

### getLoan

```solidity
function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)
```

### getLoanCollateralAndReserve

```solidity
function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)
```

### getLoanReserveBorrowScaledAmount

```solidity
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)
```

### getLoanReserveBorrowAmount

```solidity
function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)
```

### getLoanHighestBid

```solidity
function getLoanHighestBid(uint256 loanId) external view returns (address, uint256)
```

### getNftCollateralAmount

```solidity
function getNftCollateralAmount(address nftAsset) external view returns (uint256)
```

### getUserNftCollateralAmount

```solidity
function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)
```

## INFTOracle

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

### setPause

```solidity
function setPause(address _nftContract, bool val) external
```

## INFTOracleGetter

### getNFTPrice

```solidity
function getNFTPrice(address assetContract, uint256 tokenId) external view returns (uint256)
```

## IPunkGateway

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveAsset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### batchBorrow

```solidity
function batchBorrow(address[] reserveAssets, uint256[] amounts, uint256[] punkIndexs, address onBehalfOf, uint16 referralCode) external
```

### repay

```solidity
function repay(uint256 punkIndex, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned
- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### batchRepay

```solidity
function batchRepay(uint256[] punkIndexs, uint256[] amounts) external returns (uint256[], bool[])
```

### auction

```solidity
function auction(uint256 punkIndex, uint256 bidPrice, address onBehalfOf) external
```

auction a unhealth punk loan with ERC20 reserve

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidate

```solidity
function liquidate(uint256 punkIndex, uint256 amount) external returns (uint256)
```

liquidate a unhealth punk loan with ERC20 reserve

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 |  |

### borrowETH

```solidity
function borrowETH(uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
  and lock collateral asset in contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount to be borrowed |
| punkIndex | uint256 | The index of the CryptoPunk to deposit |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### batchBorrowETH

```solidity
function batchBorrowETH(uint256[] amounts, uint256[] punkIndexs, address onBehalfOf, uint16 referralCode) external
```

### repayETH

```solidity
function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH
- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### batchRepayETH

```solidity
function batchRepayETH(uint256[] punkIndexs, uint256[] amounts) external payable returns (uint256[], bool[])
```

### auctionETH

```solidity
function auctionETH(uint256 punkIndex, address onBehalfOf) external payable
```

auction a unhealth punk loan with native ETH

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| onBehalfOf | address | Address of the user who will receive the CryptoPunk. Should be the address of the user itself calling the function if he wants to get collateral |

### redeemETH

```solidity
function redeemETH(uint256 punkIndex, uint256 amount, uint256 bidFine) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |

## IPunks

_Interface for a permittable ERC721 contract
See https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account's ERC72 allowance (see {IERC721-allowance}) by
presenting a message signed by the account. By not relying on {IERC721-approve}, the token holder account doesn't
need to send a transaction, and thus is not required to hold Ether at all._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

### punkIndexToAddress

```solidity
function punkIndexToAddress(uint256 punkIndex) external view returns (address owner)
```

### buyPunk

```solidity
function buyPunk(uint256 punkIndex) external
```

### transferPunk

```solidity
function transferPunk(address to, uint256 punkIndex) external
```

## IReserveOracleGetter

### getAssetPrice

```solidity
function getAssetPrice(address asset) external view returns (uint256)
```

### getTwapPrice

```solidity
function getTwapPrice(address _priceFeedKey, uint256 _interval) external view returns (uint256)
```

## IScaledBalanceToken

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user whose balance is calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |
| [1] | uint256 | The scaled balance and the scaled total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() external view returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled total supply |

## IUNFT

### Initialized

```solidity
event Initialized(address underlyingAsset)
```

_Emitted when an uNFT is initialized_

| Name | Type | Description |
| ---- | ---- | ----------- |
| underlyingAsset | address | The address of the underlying asset |

### Mint

```solidity
event Mint(address user, address nftAsset, uint256 nftTokenId, address owner)
```

_Emitted on mint_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the burn |
| nftAsset | address | address of the underlying asset of NFT |
| nftTokenId | uint256 | token id of the underlying asset of NFT |
| owner | address | The owner address receive the uNFT token |

### Burn

```solidity
event Burn(address user, address nftAsset, uint256 nftTokenId, address owner)
```

_Emitted on burn_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the burn |
| nftAsset | address | address of the underlying asset of NFT |
| nftTokenId | uint256 | token id of the underlying asset of NFT |
| owner | address | The owner address of the burned uNFT token |

### FlashLoan

```solidity
event FlashLoan(address target, address initiator, address nftAsset, uint256 tokenId)
```

_Emitted on flashLoan_

| Name | Type | Description |
| ---- | ---- | ----------- |
| target | address | The address of the flash loan receiver contract |
| initiator | address | The address initiating the flash loan |
| nftAsset | address | address of the underlying asset of NFT |
| tokenId | uint256 | The token id of the asset being flash borrowed |

### initialize

```solidity
function initialize(address underlyingAsset, string uNftName, string uNftSymbol) external
```

_Initializes the uNFT_

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
 - The caller must be contract address.
 - `nftTokenId` must not exist._

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
 - The caller must be contract address.
 - `tokenId` must exist._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | token id of the underlying asset of NFT |

### flashLoan

```solidity
function flashLoan(address receiverAddress, uint256[] nftTokenIds, bytes params) external
```

_Allows smartcontracts to access the tokens within one transaction, as long as the tokens taken is returned.

Requirements:
 - `nftTokenIds` must exist._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiverAddress | address | The address of the contract receiving the tokens, implementing the IFlashLoanReceiver interface |
| nftTokenIds | uint256[] | token ids of the underlying asset |
| params | bytes | Variadic packed params to pass to the receiver as extra information |

### minterOf

```solidity
function minterOf(uint256 tokenId) external view returns (address)
```

_Returns the owner of the `nftTokenId` token.

Requirements:
 - `tokenId` must exist._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | token id of the underlying asset of NFT |

## IUNFTRegistry

### Initialized

```solidity
event Initialized(address genericImpl, string namePrefix, string symbolPrefix)
```

### GenericImplementationUpdated

```solidity
event GenericImplementationUpdated(address genericImpl)
```

### UNFTCreated

```solidity
event UNFTCreated(address nftAsset, address uNftImpl, address uNftProxy, uint256 totals)
```

### UNFTUpgraded

```solidity
event UNFTUpgraded(address nftAsset, address uNftImpl, address uNftProxy, uint256 totals)
```

### getUNFTAddresses

```solidity
function getUNFTAddresses(address nftAsset) external view returns (address uNftProxy, address uNftImpl)
```

### getUNFTAddressesByIndex

```solidity
function getUNFTAddressesByIndex(uint16 index) external view returns (address uNftProxy, address uNftImpl)
```

### getUNFTAssetList

```solidity
function getUNFTAssetList() external view returns (address[])
```

### allUNFTAssetLength

```solidity
function allUNFTAssetLength() external view returns (uint256)
```

### initialize

```solidity
function initialize(address genericImpl, string namePrefix_, string symbolPrefix_) external
```

### setUNFTGenericImpl

```solidity
function setUNFTGenericImpl(address genericImpl) external
```

### createUNFT

```solidity
function createUNFT(address nftAsset) external returns (address uNftProxy)
```

_Create uNFT proxy and implement, then initialize it_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying asset of the UNFT |

### createUNFTWithImpl

```solidity
function createUNFTWithImpl(address nftAsset, address uNftImpl) external returns (address uNftProxy)
```

_Create uNFT proxy with already deployed implement, then initialize it_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying asset of the UNFT |
| uNftImpl | address | The address of the deployed implement of the UNFT |

### upgradeUNFTWithImpl

```solidity
function upgradeUNFTWithImpl(address nftAsset, address uNftImpl, bytes encodedCallData) external
```

_Update uNFT proxy to an new deployed implement, then initialize it_

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAssets_ | address[] | The addresses of the NFTs |
| symbols_ | string[] | The custom symbols of the NFTs |

## IUiPoolDataProvider

### AggregatedReserveData

```solidity
struct AggregatedReserveData {
  address underlyingAsset;
  string name;
  string symbol;
  uint256 decimals;
  uint256 reserveFactor;
  bool borrowingEnabled;
  bool isActive;
  bool isFrozen;
  uint128 liquidityIndex;
  uint128 variableBorrowIndex;
  uint128 liquidityRate;
  uint128 variableBorrowRate;
  uint40 lastUpdateTimestamp;
  address bTokenAddress;
  address debtTokenAddress;
  address interestRateAddress;
  uint256 availableLiquidity;
  uint256 totalVariableDebt;
  uint256 priceInEth;
  uint256 variableRateSlope1;
  uint256 variableRateSlope2;
}
```

### UserReserveData

```solidity
struct UserReserveData {
  address underlyingAsset;
  uint256 bTokenBalance;
  uint256 variableDebt;
}
```

### AggregatedNftData

```solidity
struct AggregatedNftData {
  address underlyingAsset;
  uint256 assetTokenId;
  string name;
  string symbol;
  uint256 ltv;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 redeemDuration;
  uint256 auctionDuration;
  uint256 redeemFine;
  uint256 redeemThreshold;
  uint256 minBidFine;
  bool isActive;
  bool isFrozen;
  address uNftAddress;
  uint256 priceInEth;
  uint256 totalCollateral;
}
```

### UserNftData

```solidity
struct UserNftData {
  address underlyingAsset;
  address uNftAddress;
  uint256 totalCollateral;
}
```

### AggregatedLoanData

```solidity
struct AggregatedLoanData {
  uint256 loanId;
  uint256 state;
  address reserveAsset;
  uint256 totalCollateralInReserve;
  uint256 totalDebtInReserve;
  uint256 availableBorrowsInReserve;
  uint256 healthFactor;
  uint256 liquidatePrice;
  address bidderAddress;
  uint256 bidPrice;
  uint256 bidBorrowAmount;
  uint256 bidFine;
}
```

### getReservesList

```solidity
function getReservesList(contract ILendPoolAddressesProvider provider) external view returns (address[])
```

### getSimpleReservesData

```solidity
function getSimpleReservesData(contract ILendPoolAddressesProvider provider) external view returns (struct IUiPoolDataProvider.AggregatedReserveData[])
```

### getUserReservesData

```solidity
function getUserReservesData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.UserReserveData[])
```

### getReservesData

```solidity
function getReservesData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.AggregatedReserveData[], struct IUiPoolDataProvider.UserReserveData[])
```

### getNftsList

```solidity
function getNftsList(contract ILendPoolAddressesProvider provider) external view returns (address[])
```

### getSimpleNftsData

```solidity
function getSimpleNftsData(contract ILendPoolAddressesProvider provider) external view returns (struct IUiPoolDataProvider.AggregatedNftData[])
```

### getUserNftsData

```solidity
function getUserNftsData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.UserNftData[])
```

### getNftsData

```solidity
function getNftsData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.AggregatedNftData[], struct IUiPoolDataProvider.UserNftData[])
```

### getSimpleLoansData

```solidity
function getSimpleLoansData(contract ILendPoolAddressesProvider provider, address[] nftAssets, uint256[] nftTokenIds) external view returns (struct IUiPoolDataProvider.AggregatedLoanData[])
```

## IWETH

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256) external
```

### approve

```solidity
function approve(address guy, uint256 wad) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) external returns (bool)
```

## IWETHGateway

### depositETH

```solidity
function depositETH(address onBehalfOf, uint16 referralCode) external payable
```

_deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (bTokens)
is minted._

| Name | Type | Description |
| ---- | ---- | ----------- |
| onBehalfOf | address | address of the user who will receive the bTokens representing the deposit |
| referralCode | uint16 | integrators are assigned a referral code and can potentially receive rewards. |

### withdrawETH

```solidity
function withdrawETH(uint256 amount, address to) external
```

_withdraws the WETH _reserves of msg.sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | amount of bWETH to withdraw and receive native ETH |
| to | address | address of the user who will receive native ETH |

### borrowETH

```solidity
function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount of ETH to borrow |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | integrators are assigned a referral code and can potentially receive rewards |

### batchBorrowETH

```solidity
function batchBorrowETH(uint256[] amounts, address[] nftAssets, uint256[] nftTokenIds, address onBehalfOf, uint16 referralCode) external
```

### repayETH

```solidity
function repayETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |

### batchRepayETH

```solidity
function batchRepayETH(address[] nftAssets, uint256[] nftTokenIds, uint256[] amounts) external payable returns (uint256[], bool[])
```

### auctionETH

```solidity
function auctionETH(address nftAsset, uint256 nftTokenId, address onBehalfOf) external payable
```

_auction a borrow on the WETH reserve_

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

## IWrappedPunks

_Interface for a permittable ERC721 contract
See https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account's ERC72 allowance (see {IERC721-allowance}) by
presenting a message signed by the account. By not relying on {IERC721-approve}, the token holder account doesn't
need to send a transaction, and thus is not required to hold Ether at all._

### punkContract

```solidity
function punkContract() external view returns (address)
```

### mint

```solidity
function mint(uint256 punkIndex) external
```

### burn

```solidity
function burn(uint256 punkIndex) external
```

### registerProxy

```solidity
function registerProxy() external
```

### proxyInfo

```solidity
function proxyInfo(address user) external returns (address proxy)
```

## NftConfiguration

Implements the bitmap logic to handle the NFT configuration

### LTV_MASK

```solidity
uint256 LTV_MASK
```

### LIQUIDATION_THRESHOLD_MASK

```solidity
uint256 LIQUIDATION_THRESHOLD_MASK
```

### LIQUIDATION_BONUS_MASK

```solidity
uint256 LIQUIDATION_BONUS_MASK
```

### ACTIVE_MASK

```solidity
uint256 ACTIVE_MASK
```

### FROZEN_MASK

```solidity
uint256 FROZEN_MASK
```

### REDEEM_DURATION_MASK

```solidity
uint256 REDEEM_DURATION_MASK
```

### AUCTION_DURATION_MASK

```solidity
uint256 AUCTION_DURATION_MASK
```

### REDEEM_FINE_MASK

```solidity
uint256 REDEEM_FINE_MASK
```

### REDEEM_THRESHOLD_MASK

```solidity
uint256 REDEEM_THRESHOLD_MASK
```

### MIN_BIDFINE_MASK

```solidity
uint256 MIN_BIDFINE_MASK
```

### LIQUIDATION_THRESHOLD_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_THRESHOLD_START_BIT_POSITION
```

_For the LTV, the start bit is 0 (up to 15), hence no bitshifting is needed_

### LIQUIDATION_BONUS_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_BONUS_START_BIT_POSITION
```

### IS_ACTIVE_START_BIT_POSITION

```solidity
uint256 IS_ACTIVE_START_BIT_POSITION
```

### IS_FROZEN_START_BIT_POSITION

```solidity
uint256 IS_FROZEN_START_BIT_POSITION
```

### REDEEM_DURATION_START_BIT_POSITION

```solidity
uint256 REDEEM_DURATION_START_BIT_POSITION
```

### AUCTION_DURATION_START_BIT_POSITION

```solidity
uint256 AUCTION_DURATION_START_BIT_POSITION
```

### REDEEM_FINE_START_BIT_POSITION

```solidity
uint256 REDEEM_FINE_START_BIT_POSITION
```

### REDEEM_THRESHOLD_START_BIT_POSITION

```solidity
uint256 REDEEM_THRESHOLD_START_BIT_POSITION
```

### MIN_BIDFINE_START_BIT_POSITION

```solidity
uint256 MIN_BIDFINE_START_BIT_POSITION
```

### MAX_VALID_LTV

```solidity
uint256 MAX_VALID_LTV
```

### MAX_VALID_LIQUIDATION_THRESHOLD

```solidity
uint256 MAX_VALID_LIQUIDATION_THRESHOLD
```

### MAX_VALID_LIQUIDATION_BONUS

```solidity
uint256 MAX_VALID_LIQUIDATION_BONUS
```

### MAX_VALID_REDEEM_DURATION

```solidity
uint256 MAX_VALID_REDEEM_DURATION
```

### MAX_VALID_AUCTION_DURATION

```solidity
uint256 MAX_VALID_AUCTION_DURATION
```

### MAX_VALID_REDEEM_FINE

```solidity
uint256 MAX_VALID_REDEEM_FINE
```

### MAX_VALID_REDEEM_THRESHOLD

```solidity
uint256 MAX_VALID_REDEEM_THRESHOLD
```

### MAX_VALID_MIN_BIDFINE

```solidity
uint256 MAX_VALID_MIN_BIDFINE
```

### setLtv

```solidity
function setLtv(struct DataTypes.NftConfigurationMap self, uint256 ltv) internal pure
```

_Sets the Loan to Value of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| ltv | uint256 | the new ltv |

### getLtv

```solidity
function getLtv(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the Loan to Value of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The loan to value |

### setLiquidationThreshold

```solidity
function setLiquidationThreshold(struct DataTypes.NftConfigurationMap self, uint256 threshold) internal pure
```

_Sets the liquidation threshold of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| threshold | uint256 | The new liquidation threshold |

### getLiquidationThreshold

```solidity
function getLiquidationThreshold(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation threshold of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The liquidation threshold |

### setLiquidationBonus

```solidity
function setLiquidationBonus(struct DataTypes.NftConfigurationMap self, uint256 bonus) internal pure
```

_Sets the liquidation bonus of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| bonus | uint256 | The new liquidation bonus |

### getLiquidationBonus

```solidity
function getLiquidationBonus(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation bonus of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The liquidation bonus |

### setActive

```solidity
function setActive(struct DataTypes.NftConfigurationMap self, bool active) internal pure
```

_Sets the active state of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| active | bool | The active state |

### getActive

```solidity
function getActive(struct DataTypes.NftConfigurationMap self) internal view returns (bool)
```

_Gets the active state of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The active state |

### setFrozen

```solidity
function setFrozen(struct DataTypes.NftConfigurationMap self, bool frozen) internal pure
```

_Sets the frozen state of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| frozen | bool | The frozen state |

### getFrozen

```solidity
function getFrozen(struct DataTypes.NftConfigurationMap self) internal view returns (bool)
```

_Gets the frozen state of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The frozen state |

### setRedeemDuration

```solidity
function setRedeemDuration(struct DataTypes.NftConfigurationMap self, uint256 redeemDuration) internal pure
```

_Sets the redeem duration of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| redeemDuration | uint256 | The redeem duration |

### getRedeemDuration

```solidity
function getRedeemDuration(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the redeem duration of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The redeem duration |

### setAuctionDuration

```solidity
function setAuctionDuration(struct DataTypes.NftConfigurationMap self, uint256 auctionDuration) internal pure
```

_Sets the auction duration of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| auctionDuration | uint256 | The auction duration |

### getAuctionDuration

```solidity
function getAuctionDuration(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the auction duration of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The auction duration |

### setRedeemFine

```solidity
function setRedeemFine(struct DataTypes.NftConfigurationMap self, uint256 redeemFine) internal pure
```

_Sets the redeem fine of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| redeemFine | uint256 | The redeem duration |

### getRedeemFine

```solidity
function getRedeemFine(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the redeem fine of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The redeem fine |

### setRedeemThreshold

```solidity
function setRedeemThreshold(struct DataTypes.NftConfigurationMap self, uint256 redeemThreshold) internal pure
```

_Sets the redeem threshold of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| redeemThreshold | uint256 | The redeem duration |

### getRedeemThreshold

```solidity
function getRedeemThreshold(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the redeem threshold of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The redeem threshold |

### setMinBidFine

```solidity
function setMinBidFine(struct DataTypes.NftConfigurationMap self, uint256 minBidFine) internal pure
```

_Sets the min & max threshold of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| minBidFine | uint256 | The min bid fine |

### getMinBidFine

```solidity
function getMinBidFine(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the min bid fine of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The min bid fine |

### getFlags

```solidity
function getFlags(struct DataTypes.NftConfigurationMap self) internal view returns (bool, bool)
```

_Gets the configuration flags of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The state flags representing active, frozen |
| [1] | bool |  |

### getFlagsMemory

```solidity
function getFlagsMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (bool, bool)
```

_Gets the configuration flags of the NFT from a memory object_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The state flags representing active, frozen |
| [1] | bool |  |

### getCollateralParams

```solidity
function getCollateralParams(struct DataTypes.NftConfigurationMap self) internal view returns (uint256, uint256, uint256)
```

_Gets the collateral configuration paramters of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus |
| [1] | uint256 |  |
| [2] | uint256 |  |

### getAuctionParams

```solidity
function getAuctionParams(struct DataTypes.NftConfigurationMap self) internal view returns (uint256, uint256, uint256, uint256)
```

_Gets the auction configuration paramters of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The state params representing redeem duration, auction duration, redeem fine |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |

### getCollateralParamsMemory

```solidity
function getCollateralParamsMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (uint256, uint256, uint256)
```

_Gets the collateral configuration paramters of the NFT from a memory object_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus |
| [1] | uint256 |  |
| [2] | uint256 |  |

### getAuctionParamsMemory

```solidity
function getAuctionParamsMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (uint256, uint256, uint256, uint256)
```

_Gets the auction configuration paramters of the NFT from a memory object_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The state params representing redeem duration, auction duration, redeem fine |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |

### getMinBidFineMemory

```solidity
function getMinBidFineMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (uint256)
```

_Gets the min & max bid fine of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The min & max bid fine |

## ReserveConfiguration

Implements the bitmap logic to handle the reserve configuration

### LTV_MASK

```solidity
uint256 LTV_MASK
```

### LIQUIDATION_THRESHOLD_MASK

```solidity
uint256 LIQUIDATION_THRESHOLD_MASK
```

### LIQUIDATION_BONUS_MASK

```solidity
uint256 LIQUIDATION_BONUS_MASK
```

### DECIMALS_MASK

```solidity
uint256 DECIMALS_MASK
```

### ACTIVE_MASK

```solidity
uint256 ACTIVE_MASK
```

### FROZEN_MASK

```solidity
uint256 FROZEN_MASK
```

### BORROWING_MASK

```solidity
uint256 BORROWING_MASK
```

### STABLE_BORROWING_MASK

```solidity
uint256 STABLE_BORROWING_MASK
```

### RESERVE_FACTOR_MASK

```solidity
uint256 RESERVE_FACTOR_MASK
```

### LIQUIDATION_THRESHOLD_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_THRESHOLD_START_BIT_POSITION
```

_For the LTV, the start bit is 0 (up to 15), hence no bitshifting is needed_

### LIQUIDATION_BONUS_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_BONUS_START_BIT_POSITION
```

### RESERVE_DECIMALS_START_BIT_POSITION

```solidity
uint256 RESERVE_DECIMALS_START_BIT_POSITION
```

### IS_ACTIVE_START_BIT_POSITION

```solidity
uint256 IS_ACTIVE_START_BIT_POSITION
```

### IS_FROZEN_START_BIT_POSITION

```solidity
uint256 IS_FROZEN_START_BIT_POSITION
```

### BORROWING_ENABLED_START_BIT_POSITION

```solidity
uint256 BORROWING_ENABLED_START_BIT_POSITION
```

### STABLE_BORROWING_ENABLED_START_BIT_POSITION

```solidity
uint256 STABLE_BORROWING_ENABLED_START_BIT_POSITION
```

### RESERVE_FACTOR_START_BIT_POSITION

```solidity
uint256 RESERVE_FACTOR_START_BIT_POSITION
```

### MAX_VALID_LTV

```solidity
uint256 MAX_VALID_LTV
```

### MAX_VALID_LIQUIDATION_THRESHOLD

```solidity
uint256 MAX_VALID_LIQUIDATION_THRESHOLD
```

### MAX_VALID_LIQUIDATION_BONUS

```solidity
uint256 MAX_VALID_LIQUIDATION_BONUS
```

### MAX_VALID_DECIMALS

```solidity
uint256 MAX_VALID_DECIMALS
```

### MAX_VALID_RESERVE_FACTOR

```solidity
uint256 MAX_VALID_RESERVE_FACTOR
```

### setLtv

```solidity
function setLtv(struct DataTypes.ReserveConfigurationMap self, uint256 ltv) internal pure
```

_Sets the Loan to Value of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| ltv | uint256 | the new ltv |

### getLtv

```solidity
function getLtv(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the Loan to Value of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The loan to value |

### setLiquidationThreshold

```solidity
function setLiquidationThreshold(struct DataTypes.ReserveConfigurationMap self, uint256 threshold) internal pure
```

_Sets the liquidation threshold of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| threshold | uint256 | The new liquidation threshold |

### getLiquidationThreshold

```solidity
function getLiquidationThreshold(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation threshold of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The liquidation threshold |

### setLiquidationBonus

```solidity
function setLiquidationBonus(struct DataTypes.ReserveConfigurationMap self, uint256 bonus) internal pure
```

_Sets the liquidation bonus of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| bonus | uint256 | The new liquidation bonus |

### getLiquidationBonus

```solidity
function getLiquidationBonus(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation bonus of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The liquidation bonus |

### setDecimals

```solidity
function setDecimals(struct DataTypes.ReserveConfigurationMap self, uint256 decimals) internal pure
```

_Sets the decimals of the underlying asset of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| decimals | uint256 | The decimals |

### getDecimals

```solidity
function getDecimals(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the decimals of the underlying asset of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The decimals of the asset |

### setActive

```solidity
function setActive(struct DataTypes.ReserveConfigurationMap self, bool active) internal pure
```

_Sets the active state of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| active | bool | The active state |

### getActive

```solidity
function getActive(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the active state of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The active state |

### setFrozen

```solidity
function setFrozen(struct DataTypes.ReserveConfigurationMap self, bool frozen) internal pure
```

_Sets the frozen state of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| frozen | bool | The frozen state |

### getFrozen

```solidity
function getFrozen(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the frozen state of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The frozen state |

### setBorrowingEnabled

```solidity
function setBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self, bool enabled) internal pure
```

_Enables or disables borrowing on the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| enabled | bool | True if the borrowing needs to be enabled, false otherwise |

### getBorrowingEnabled

```solidity
function getBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the borrowing state of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The borrowing state |

### setStableRateBorrowingEnabled

```solidity
function setStableRateBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self, bool enabled) internal pure
```

_Enables or disables stable rate borrowing on the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| enabled | bool | True if the stable rate borrowing needs to be enabled, false otherwise |

### getStableRateBorrowingEnabled

```solidity
function getStableRateBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the stable rate borrowing state of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The stable rate borrowing state |

### setReserveFactor

```solidity
function setReserveFactor(struct DataTypes.ReserveConfigurationMap self, uint256 reserveFactor) internal pure
```

_Sets the reserve factor of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| reserveFactor | uint256 | The reserve factor |

### getReserveFactor

```solidity
function getReserveFactor(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the reserve factor of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve factor |

### getFlags

```solidity
function getFlags(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool, bool, bool, bool)
```

_Gets the configuration flags of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The state flags representing active, frozen, borrowing enabled, stableRateBorrowing enabled |
| [1] | bool |  |
| [2] | bool |  |
| [3] | bool |  |

### getParams

```solidity
function getParams(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256, uint256, uint256, uint256, uint256)
```

_Gets the configuration paramters of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus, the reserve decimals |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |
| [4] | uint256 |  |

### getParamsMemory

```solidity
function getParamsMemory(struct DataTypes.ReserveConfigurationMap self) internal pure returns (uint256, uint256, uint256, uint256, uint256)
```

_Gets the configuration paramters of the reserve from a memory object_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus, the reserve decimals |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |
| [4] | uint256 |  |

### getFlagsMemory

```solidity
function getFlagsMemory(struct DataTypes.ReserveConfigurationMap self) internal pure returns (bool, bool, bool, bool)
```

_Gets the configuration flags of the reserve from a memory object_

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The state flags representing active, frozen, borrowing enabled, stableRateBorrowing enabled |
| [1] | bool |  |
| [2] | bool |  |
| [3] | bool |  |

## Errors

Defines the error messages emitted by the different contracts of the Unlockd protocol

### ReturnCode

```solidity
enum ReturnCode {
  SUCCESS,
  FAILED
}
```

### SUCCESS

```solidity
string SUCCESS
```

### CALLER_NOT_POOL_ADMIN

```solidity
string CALLER_NOT_POOL_ADMIN
```

### CALLER_NOT_ADDRESS_PROVIDER

```solidity
string CALLER_NOT_ADDRESS_PROVIDER
```

### INVALID_FROM_BALANCE_AFTER_TRANSFER

```solidity
string INVALID_FROM_BALANCE_AFTER_TRANSFER
```

### INVALID_TO_BALANCE_AFTER_TRANSFER

```solidity
string INVALID_TO_BALANCE_AFTER_TRANSFER
```

### CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST

```solidity
string CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST
```

### MATH_MULTIPLICATION_OVERFLOW

```solidity
string MATH_MULTIPLICATION_OVERFLOW
```

### MATH_ADDITION_OVERFLOW

```solidity
string MATH_ADDITION_OVERFLOW
```

### MATH_DIVISION_BY_ZERO

```solidity
string MATH_DIVISION_BY_ZERO
```

### VL_INVALID_AMOUNT

```solidity
string VL_INVALID_AMOUNT
```

### VL_NO_ACTIVE_RESERVE

```solidity
string VL_NO_ACTIVE_RESERVE
```

### VL_RESERVE_FROZEN

```solidity
string VL_RESERVE_FROZEN
```

### VL_NOT_ENOUGH_AVAILABLE_USER_BALANCE

```solidity
string VL_NOT_ENOUGH_AVAILABLE_USER_BALANCE
```

### VL_BORROWING_NOT_ENABLED

```solidity
string VL_BORROWING_NOT_ENABLED
```

### VL_COLLATERAL_BALANCE_IS_0

```solidity
string VL_COLLATERAL_BALANCE_IS_0
```

### VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD

```solidity
string VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
```

### VL_COLLATERAL_CANNOT_COVER_NEW_BORROW

```solidity
string VL_COLLATERAL_CANNOT_COVER_NEW_BORROW
```

### VL_NO_DEBT_OF_SELECTED_TYPE

```solidity
string VL_NO_DEBT_OF_SELECTED_TYPE
```

### VL_NO_ACTIVE_NFT

```solidity
string VL_NO_ACTIVE_NFT
```

### VL_NFT_FROZEN

```solidity
string VL_NFT_FROZEN
```

### VL_SPECIFIED_CURRENCY_NOT_BORROWED_BY_USER

```solidity
string VL_SPECIFIED_CURRENCY_NOT_BORROWED_BY_USER
```

### VL_INVALID_HEALTH_FACTOR

```solidity
string VL_INVALID_HEALTH_FACTOR
```

### VL_INVALID_ONBEHALFOF_ADDRESS

```solidity
string VL_INVALID_ONBEHALFOF_ADDRESS
```

### VL_INVALID_TARGET_ADDRESS

```solidity
string VL_INVALID_TARGET_ADDRESS
```

### VL_INVALID_RESERVE_ADDRESS

```solidity
string VL_INVALID_RESERVE_ADDRESS
```

### VL_SPECIFIED_LOAN_NOT_BORROWED_BY_USER

```solidity
string VL_SPECIFIED_LOAN_NOT_BORROWED_BY_USER
```

### VL_SPECIFIED_RESERVE_NOT_BORROWED_BY_USER

```solidity
string VL_SPECIFIED_RESERVE_NOT_BORROWED_BY_USER
```

### VL_HEALTH_FACTOR_HIGHER_THAN_LIQUIDATION_THRESHOLD

```solidity
string VL_HEALTH_FACTOR_HIGHER_THAN_LIQUIDATION_THRESHOLD
```

### LP_CALLER_NOT_LEND_POOL_CONFIGURATOR

```solidity
string LP_CALLER_NOT_LEND_POOL_CONFIGURATOR
```

### LP_IS_PAUSED

```solidity
string LP_IS_PAUSED
```

### LP_NO_MORE_RESERVES_ALLOWED

```solidity
string LP_NO_MORE_RESERVES_ALLOWED
```

### LP_NOT_CONTRACT

```solidity
string LP_NOT_CONTRACT
```

### LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD

```solidity
string LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD
```

### LP_BORROW_IS_EXCEED_LIQUIDATION_PRICE

```solidity
string LP_BORROW_IS_EXCEED_LIQUIDATION_PRICE
```

### LP_NO_MORE_NFTS_ALLOWED

```solidity
string LP_NO_MORE_NFTS_ALLOWED
```

### LP_INVALIED_USER_NFT_AMOUNT

```solidity
string LP_INVALIED_USER_NFT_AMOUNT
```

### LP_INCONSISTENT_PARAMS

```solidity
string LP_INCONSISTENT_PARAMS
```

### LP_NFT_IS_NOT_USED_AS_COLLATERAL

```solidity
string LP_NFT_IS_NOT_USED_AS_COLLATERAL
```

### LP_CALLER_MUST_BE_AN_BTOKEN

```solidity
string LP_CALLER_MUST_BE_AN_BTOKEN
```

### LP_INVALIED_NFT_AMOUNT

```solidity
string LP_INVALIED_NFT_AMOUNT
```

### LP_NFT_HAS_USED_AS_COLLATERAL

```solidity
string LP_NFT_HAS_USED_AS_COLLATERAL
```

### LP_DELEGATE_CALL_FAILED

```solidity
string LP_DELEGATE_CALL_FAILED
```

### LP_AMOUNT_LESS_THAN_EXTRA_DEBT

```solidity
string LP_AMOUNT_LESS_THAN_EXTRA_DEBT
```

### LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD

```solidity
string LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD
```

### LP_AMOUNT_GREATER_THAN_MAX_REPAY

```solidity
string LP_AMOUNT_GREATER_THAN_MAX_REPAY
```

### LP_NFT_TOKEN_ID_EXCEED_MAX_LIMIT

```solidity
string LP_NFT_TOKEN_ID_EXCEED_MAX_LIMIT
```

### LP_NFT_SUPPLY_NUM_EXCEED_MAX_LIMIT

```solidity
string LP_NFT_SUPPLY_NUM_EXCEED_MAX_LIMIT
```

### LPL_INVALID_LOAN_STATE

```solidity
string LPL_INVALID_LOAN_STATE
```

### LPL_INVALID_LOAN_AMOUNT

```solidity
string LPL_INVALID_LOAN_AMOUNT
```

### LPL_INVALID_TAKEN_AMOUNT

```solidity
string LPL_INVALID_TAKEN_AMOUNT
```

### LPL_AMOUNT_OVERFLOW

```solidity
string LPL_AMOUNT_OVERFLOW
```

### LPL_BID_PRICE_LESS_THAN_LIQUIDATION_PRICE

```solidity
string LPL_BID_PRICE_LESS_THAN_LIQUIDATION_PRICE
```

### LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE

```solidity
string LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE
```

### LPL_BID_REDEEM_DURATION_HAS_END

```solidity
string LPL_BID_REDEEM_DURATION_HAS_END
```

### LPL_BID_USER_NOT_SAME

```solidity
string LPL_BID_USER_NOT_SAME
```

### LPL_BID_REPAY_AMOUNT_NOT_ENOUGH

```solidity
string LPL_BID_REPAY_AMOUNT_NOT_ENOUGH
```

### LPL_BID_AUCTION_DURATION_HAS_END

```solidity
string LPL_BID_AUCTION_DURATION_HAS_END
```

### LPL_BID_AUCTION_DURATION_NOT_END

```solidity
string LPL_BID_AUCTION_DURATION_NOT_END
```

### LPL_BID_PRICE_LESS_THAN_BORROW

```solidity
string LPL_BID_PRICE_LESS_THAN_BORROW
```

### LPL_INVALID_BIDDER_ADDRESS

```solidity
string LPL_INVALID_BIDDER_ADDRESS
```

### LPL_AMOUNT_LESS_THAN_BID_FINE

```solidity
string LPL_AMOUNT_LESS_THAN_BID_FINE
```

### LPL_INVALID_BID_FINE

```solidity
string LPL_INVALID_BID_FINE
```

### CT_CALLER_MUST_BE_LEND_POOL

```solidity
string CT_CALLER_MUST_BE_LEND_POOL
```

### CT_INVALID_MINT_AMOUNT

```solidity
string CT_INVALID_MINT_AMOUNT
```

### CT_INVALID_BURN_AMOUNT

```solidity
string CT_INVALID_BURN_AMOUNT
```

### CT_BORROW_ALLOWANCE_NOT_ENOUGH

```solidity
string CT_BORROW_ALLOWANCE_NOT_ENOUGH
```

### RL_RESERVE_ALREADY_INITIALIZED

```solidity
string RL_RESERVE_ALREADY_INITIALIZED
```

### RL_LIQUIDITY_INDEX_OVERFLOW

```solidity
string RL_LIQUIDITY_INDEX_OVERFLOW
```

### RL_VARIABLE_BORROW_INDEX_OVERFLOW

```solidity
string RL_VARIABLE_BORROW_INDEX_OVERFLOW
```

### RL_LIQUIDITY_RATE_OVERFLOW

```solidity
string RL_LIQUIDITY_RATE_OVERFLOW
```

### RL_VARIABLE_BORROW_RATE_OVERFLOW

```solidity
string RL_VARIABLE_BORROW_RATE_OVERFLOW
```

### LPC_RESERVE_LIQUIDITY_NOT_0

```solidity
string LPC_RESERVE_LIQUIDITY_NOT_0
```

### LPC_INVALID_CONFIGURATION

```solidity
string LPC_INVALID_CONFIGURATION
```

### LPC_CALLER_NOT_EMERGENCY_ADMIN

```solidity
string LPC_CALLER_NOT_EMERGENCY_ADMIN
```

### LPC_INVALIED_UNFT_ADDRESS

```solidity
string LPC_INVALIED_UNFT_ADDRESS
```

### LPC_INVALIED_LOAN_ADDRESS

```solidity
string LPC_INVALIED_LOAN_ADDRESS
```

### LPC_NFT_LIQUIDITY_NOT_0

```solidity
string LPC_NFT_LIQUIDITY_NOT_0
```

### RC_INVALID_LTV

```solidity
string RC_INVALID_LTV
```

### RC_INVALID_LIQ_THRESHOLD

```solidity
string RC_INVALID_LIQ_THRESHOLD
```

### RC_INVALID_LIQ_BONUS

```solidity
string RC_INVALID_LIQ_BONUS
```

### RC_INVALID_DECIMALS

```solidity
string RC_INVALID_DECIMALS
```

### RC_INVALID_RESERVE_FACTOR

```solidity
string RC_INVALID_RESERVE_FACTOR
```

### RC_INVALID_REDEEM_DURATION

```solidity
string RC_INVALID_REDEEM_DURATION
```

### RC_INVALID_AUCTION_DURATION

```solidity
string RC_INVALID_AUCTION_DURATION
```

### RC_INVALID_REDEEM_FINE

```solidity
string RC_INVALID_REDEEM_FINE
```

### RC_INVALID_REDEEM_THRESHOLD

```solidity
string RC_INVALID_REDEEM_THRESHOLD
```

### RC_INVALID_MIN_BID_FINE

```solidity
string RC_INVALID_MIN_BID_FINE
```

### RC_INVALID_MAX_BID_FINE

```solidity
string RC_INVALID_MAX_BID_FINE
```

### LPAPR_PROVIDER_NOT_REGISTERED

```solidity
string LPAPR_PROVIDER_NOT_REGISTERED
```

### LPAPR_INVALID_ADDRESSES_PROVIDER_ID

```solidity
string LPAPR_INVALID_ADDRESSES_PROVIDER_ID
```

## BorrowLogic

Implements the logic to borrow feature

### Borrow

```solidity
event Borrow(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint256 borrowRate, uint256 loanId, uint16 referral)
```

_Emitted on borrow() when loan needs to be opened_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the borrow(), receiving the funds |
| reserve | address | The address of the underlying asset being borrowed |
| amount | uint256 | The amount borrowed out |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| onBehalfOf | address | The address that will be getting the loan |
| borrowRate | uint256 |  |
| loanId | uint256 |  |
| referral | uint16 | The referral code used |

### Repay

```solidity
event Repay(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on repay()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the repay(), providing the funds |
| reserve | address | The address of the underlying asset of the reserve |
| amount | uint256 | The amount repaid |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| borrower | address | The beneficiary of the repayment, getting his debt reduced |
| loanId | uint256 | The loan ID of the NFT loans |

### ExecuteBorrowLocalVars

```solidity
struct ExecuteBorrowLocalVars {
  address initiator;
  uint256 ltv;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 loanId;
  address reserveOracle;
  address nftOracle;
  address loanAddress;
  uint256 totalSupply;
}
```

### executeBorrow

```solidity
function executeBorrow(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteBorrowParams params) external
```

Implements the borrow feature. Through `borrow()`, users borrow assets from the protocol.

_Emits the `Borrow()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteBorrowParams | The additional parameters needed to execute the borrow function |

### executeBatchBorrow

```solidity
function executeBatchBorrow(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteBatchBorrowParams params) external
```

Implements the batch borrow feature. Through `batchBorrow()`, users repay borrow to the protocol.

_Emits the `Borrow()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteBatchBorrowParams | The additional parameters needed to execute the batchBorrow function |

### _borrow

```solidity
function _borrow(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteBorrowParams params) internal
```

### RepayLocalVars

```solidity
struct RepayLocalVars {
  address initiator;
  address poolLoan;
  address onBehalfOf;
  uint256 loanId;
  bool isUpdate;
  uint256 borrowAmount;
  uint256 repayAmount;
}
```

### executeRepay

```solidity
function executeRepay(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteRepayParams params) external returns (uint256, bool)
```

Implements the borrow feature. Through `repay()`, users repay assets to the protocol.

_Emits the `Repay()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteRepayParams | The additional parameters needed to execute the repay function |

### executeBatchRepay

```solidity
function executeBatchRepay(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteBatchRepayParams params) external returns (uint256[], bool[])
```

Implements the batch repay feature. Through `batchRepay()`, users repay assets to the protocol.

_Emits the `repay()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteBatchRepayParams | The additional parameters needed to execute the batchRepay function |

### _repay

```solidity
function _repay(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteRepayParams params) internal returns (uint256, bool)
```

## ConfiguratorLogic

Implements the logic to configuration feature

### ReserveInitialized

```solidity
event ReserveInitialized(address asset, address bToken, address debtToken, address interestRateAddress)
```

_Emitted when a reserve is initialized._

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| bToken | address | The address of the associated bToken contract |
| debtToken | address | The address of the associated debtToken contract |
| interestRateAddress | address | The address of the interest rate strategy for the reserve |

### NftInitialized

```solidity
event NftInitialized(address asset, address uNft)
```

_Emitted when a nft is initialized._

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the nft |
| uNft | address | The address of the associated uNFT contract |

### BTokenUpgraded

```solidity
event BTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when an bToken implementation is upgraded_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| proxy | address | The bToken proxy address |
| implementation | address | The new bToken implementation |

### DebtTokenUpgraded

```solidity
event DebtTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when the implementation of a debt token is upgraded_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| proxy | address | The debt token proxy address |
| implementation | address | The new debtToken implementation |

### executeInitReserve

```solidity
function executeInitReserve(contract ILendPoolAddressesProvider addressProvider, contract ILendPool cachePool, struct ConfigTypes.InitReserveInput input) external
```

### executeInitNft

```solidity
function executeInitNft(contract ILendPool pool_, contract IUNFTRegistry registry_, struct ConfigTypes.InitNftInput input) external
```

### executeUpdateBToken

```solidity
function executeUpdateBToken(contract ILendPool cachedPool, struct ConfigTypes.UpdateBTokenInput input) external
```

### executeUpdateDebtToken

```solidity
function executeUpdateDebtToken(contract ILendPool cachedPool, struct ConfigTypes.UpdateDebtTokenInput input) external
```

### getTokenImplementation

```solidity
function getTokenImplementation(address proxyAddress) external view returns (address)
```

### _initTokenWithProxy

```solidity
function _initTokenWithProxy(address implementation, bytes initParams) internal returns (address)
```

### _upgradeTokenImplementation

```solidity
function _upgradeTokenImplementation(address proxyAddress, address implementation, bytes encodedCallData) internal
```

## GenericLogic

Implements protocol-level logic to calculate and validate the state of a user

### HEALTH_FACTOR_LIQUIDATION_THRESHOLD

```solidity
uint256 HEALTH_FACTOR_LIQUIDATION_THRESHOLD
```

### CalculateLoanDataVars

```solidity
struct CalculateLoanDataVars {
  uint256 reserveUnitPrice;
  uint256 reserveUnit;
  uint256 reserveDecimals;
  uint256 healthFactor;
  uint256 totalCollateralInETH;
  uint256 totalCollateralInReserve;
  uint256 totalDebtInETH;
  uint256 totalDebtInReserve;
  uint256 nftLtv;
  uint256 nftLiquidationThreshold;
  address nftAsset;
  uint256 nftTokenId;
  uint256 nftUnitPrice;
}
```

### calculateLoanData

```solidity
function calculateLoanData(address reserveAddress, struct DataTypes.ReserveData reserveData, address nftAddress, uint256 nftTokenId, struct DataTypes.NftData nftData, address loanAddress, uint256 loanId, address reserveOracle, address nftOracle) internal view returns (uint256, uint256, uint256)
```

_Calculates the nft loan data.
this includes the total collateral/borrow balances in Reserve,
the Loan To Value, the Liquidation Ratio, and the Health factor._

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveAddress | address |  |
| reserveData | struct DataTypes.ReserveData | Data of the reserve |
| nftAddress | address |  |
| nftTokenId | uint256 |  |
| nftData | struct DataTypes.NftData | Data of the nft |
| loanAddress | address |  |
| loanId | uint256 |  |
| reserveOracle | address | The price oracle address of reserve |
| nftOracle | address | The price oracle address of nft |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total collateral and total debt of the loan in Reserve, the ltv, liquidation threshold and the HF |
| [1] | uint256 |  |
| [2] | uint256 |  |

### calculateNftDebtData

```solidity
function calculateNftDebtData(address reserveAddress, struct DataTypes.ReserveData reserveData, address loanAddress, uint256 loanId, address reserveOracle) internal view returns (uint256, uint256)
```

### calculateNftCollateralData

```solidity
function calculateNftCollateralData(address reserveAddress, struct DataTypes.ReserveData reserveData, address nftAddress, uint256 nftTokenId, struct DataTypes.NftData nftData, address reserveOracle, address nftOracle) internal view returns (uint256, uint256)
```

### calculateHealthFactorFromBalances

```solidity
function calculateHealthFactorFromBalances(uint256 totalCollateral, uint256 totalDebt, uint256 liquidationThreshold) internal pure returns (uint256)
```

_Calculates the health factor from the corresponding balances_

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalCollateral | uint256 | The total collateral |
| totalDebt | uint256 | The total debt |
| liquidationThreshold | uint256 | The avg liquidation threshold |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The health factor calculated from the balances provided |

### calculateAvailableBorrows

```solidity
function calculateAvailableBorrows(uint256 totalCollateral, uint256 totalDebt, uint256 ltv) internal pure returns (uint256)
```

_Calculates the equivalent amount that an user can borrow, depending on the available collateral and the
average Loan To Value_

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalCollateral | uint256 | The total collateral |
| totalDebt | uint256 | The total borrow balance |
| ltv | uint256 | The average loan to value |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the amount available to borrow for the user |

### CalcLiquidatePriceLocalVars

```solidity
struct CalcLiquidatePriceLocalVars {
  uint256 ltv;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 nftPriceInETH;
  uint256 nftPriceInReserve;
  uint256 reserveDecimals;
  uint256 reservePriceInETH;
  uint256 thresholdPrice;
  uint256 liquidatePrice;
  uint256 borrowAmount;
}
```

### calculateLoanLiquidatePrice

```solidity
function calculateLoanLiquidatePrice(uint256 loanId, address reserveAsset, struct DataTypes.ReserveData reserveData, address nftAsset, uint256 nftTokenId, struct DataTypes.NftData nftData, address poolLoan, address reserveOracle, address nftOracle) internal view returns (uint256, uint256, uint256)
```

### CalcLoanBidFineLocalVars

```solidity
struct CalcLoanBidFineLocalVars {
  uint256 reserveDecimals;
  uint256 reservePriceInETH;
  uint256 baseBidFineInReserve;
  uint256 minBidFinePct;
  uint256 minBidFineInReserve;
  uint256 bidFineInReserve;
  uint256 debtAmount;
}
```

### calculateLoanBidFine

```solidity
function calculateLoanBidFine(address reserveAsset, struct DataTypes.ReserveData reserveData, address nftAsset, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData, address poolLoan, address reserveOracle) internal view returns (uint256, uint256)
```

## LiquidateLogic

Implements the logic to liquidate feature

### Auction

```solidity
event Auction(address user, address reserve, uint256 bidPrice, address nftAsset, uint256 nftTokenId, address onBehalfOf, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is auctioned._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the auction |
| reserve | address | The address of the underlying asset of the reserve |
| bidPrice | uint256 | The price of the underlying reserve given by the bidder |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| onBehalfOf | address | The address that will be getting the NFT |
| borrower | address |  |
| loanId | uint256 | The loan ID of the NFT loans |

### Redeem

```solidity
event Redeem(address user, address reserve, uint256 borrowAmount, uint256 fineAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on redeem()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the redeem(), providing the funds |
| reserve | address | The address of the underlying asset of the reserve |
| borrowAmount | uint256 | The borrow amount repaid |
| fineAmount | uint256 |  |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral |
| borrower | address |  |
| loanId | uint256 | The loan ID of the NFT loans |

### Liquidate

```solidity
event Liquidate(address user, address reserve, uint256 repayAmount, uint256 remainAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is liquidated._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user initiating the auction |
| reserve | address | The address of the underlying asset of the reserve |
| repayAmount | uint256 | The amount of reserve repaid by the liquidator |
| remainAmount | uint256 | The amount of reserve received by the borrower |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| borrower | address |  |
| loanId | uint256 | The loan ID of the NFT loans |

### AuctionLocalVars

```solidity
struct AuctionLocalVars {
  address loanAddress;
  address reserveOracle;
  address nftOracle;
  address initiator;
  uint256 loanId;
  uint256 thresholdPrice;
  uint256 liquidatePrice;
  uint256 borrowAmount;
  uint256 auctionEndTimestamp;
  uint256 minBidDelta;
}
```

### executeAuction

```solidity
function executeAuction(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteAuctionParams params) external
```

Implements the auction feature. Through `auction()`, users auction assets in the protocol.

_Emits the `Auction()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteAuctionParams | The additional parameters needed to execute the auction function |

### RedeemLocalVars

```solidity
struct RedeemLocalVars {
  address initiator;
  address poolLoan;
  address reserveOracle;
  address nftOracle;
  uint256 loanId;
  uint256 borrowAmount;
  uint256 repayAmount;
  uint256 minRepayAmount;
  uint256 maxRepayAmount;
  uint256 bidFine;
  uint256 redeemEndTimestamp;
  uint256 minBidFinePct;
  uint256 minBidFine;
}
```

### executeRedeem

```solidity
function executeRedeem(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteRedeemParams params) external returns (uint256)
```

Implements the redeem feature. Through `redeem()`, users redeem assets in the protocol.

_Emits the `Redeem()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteRedeemParams | The additional parameters needed to execute the redeem function |

### LiquidateLocalVars

```solidity
struct LiquidateLocalVars {
  address initiator;
  address poolLoan;
  address reserveOracle;
  address nftOracle;
  uint256 loanId;
  uint256 borrowAmount;
  uint256 extraDebtAmount;
  uint256 remainAmount;
  uint256 auctionEndTimestamp;
}
```

### executeLiquidate

```solidity
function executeLiquidate(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteLiquidateParams params) external returns (uint256)
```

Implements the liquidate feature. Through `liquidate()`, users liquidate assets in the protocol.

_Emits the `Liquidate()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressesProvider | contract ILendPoolAddressesProvider |  |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| nftsData | mapping(address &#x3D;&gt; struct DataTypes.NftData) | The state of all the nfts |
| params | struct DataTypes.ExecuteLiquidateParams | The additional parameters needed to execute the liquidate function |

## NftLogic

Implements the logic to update the nft state

### init

```solidity
function init(struct DataTypes.NftData nft, address uNftAddress) external
```

_Initializes a nft_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nft | struct DataTypes.NftData | The nft object |
| uNftAddress | address | The address of the uNFT contract |

## ReserveLogic

Implements the logic to update the reserves state

### ReserveDataUpdated

```solidity
event ReserveDataUpdated(address asset, uint256 liquidityRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)
```

_Emitted when the state of a reserve is updated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| liquidityRate | uint256 | The new liquidity rate |
| variableBorrowRate | uint256 | The new variable borrow rate |
| liquidityIndex | uint256 | The new liquidity index |
| variableBorrowIndex | uint256 | The new variable borrow index |

### getNormalizedIncome

```solidity
function getNormalizedIncome(struct DataTypes.ReserveData reserve) internal view returns (uint256)
```

_Returns the ongoing normalized income for the reserve
A value of 1e27 means there is no income. As time passes, the income is accrued
A value of 2*1e27 means for each unit of asset one unit of income has been accrued_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve object |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the normalized income. expressed in ray |

### getNormalizedDebt

```solidity
function getNormalizedDebt(struct DataTypes.ReserveData reserve) internal view returns (uint256)
```

_Returns the ongoing normalized variable debt for the reserve
A value of 1e27 means there is no debt. As time passes, the income is accrued
A value of 2*1e27 means that for each unit of debt, one unit worth of interest has been accumulated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve object |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The normalized variable debt. expressed in ray |

### updateState

```solidity
function updateState(struct DataTypes.ReserveData reserve) internal
```

_Updates the liquidity cumulative index and the variable borrow index._

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | the reserve object |

### cumulateToLiquidityIndex

```solidity
function cumulateToLiquidityIndex(struct DataTypes.ReserveData reserve, uint256 totalLiquidity, uint256 amount) internal
```

_Accumulates a predefined amount of asset to the reserve as a fixed, instantaneous income. Used for example to accumulate
the flashloan fee to the reserve, and spread it between all the depositors_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve object |
| totalLiquidity | uint256 | The total liquidity available in the reserve |
| amount | uint256 | The amount to accomulate |

### init

```solidity
function init(struct DataTypes.ReserveData reserve, address bTokenAddress, address debtTokenAddress, address interestRateAddress) external
```

_Initializes a reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve object |
| bTokenAddress | address | The address of the overlying bToken contract |
| debtTokenAddress | address | The address of the overlying debtToken contract |
| interestRateAddress | address | The address of the interest rate strategy contract |

### UpdateInterestRatesLocalVars

```solidity
struct UpdateInterestRatesLocalVars {
  uint256 availableLiquidity;
  uint256 newLiquidityRate;
  uint256 newVariableRate;
  uint256 totalVariableDebt;
}
```

### updateInterestRates

```solidity
function updateInterestRates(struct DataTypes.ReserveData reserve, address reserveAddress, address bTokenAddress, uint256 liquidityAdded, uint256 liquidityTaken) internal
```

_Updates the reserve current stable borrow rate, the current variable borrow rate and the current liquidity rate_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The address of the reserve to be updated |
| reserveAddress | address |  |
| bTokenAddress | address |  |
| liquidityAdded | uint256 | The amount of liquidity added to the protocol (deposit or repay) in the previous action |
| liquidityTaken | uint256 | The amount of liquidity taken from the protocol (withdraw or borrow) |

### MintToTreasuryLocalVars

```solidity
struct MintToTreasuryLocalVars {
  uint256 currentVariableDebt;
  uint256 previousVariableDebt;
  uint256 totalDebtAccrued;
  uint256 amountToMint;
  uint256 reserveFactor;
}
```

### _mintToTreasury

```solidity
function _mintToTreasury(struct DataTypes.ReserveData reserve, uint256 scaledVariableDebt, uint256 previousVariableBorrowIndex, uint256 newLiquidityIndex, uint256 newVariableBorrowIndex, uint40 timestamp) internal
```

_Mints part of the repaid interest to the reserve treasury as a function of the reserveFactor for the
specific asset._

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve reserve to be updated |
| scaledVariableDebt | uint256 | The current scaled total variable debt |
| previousVariableBorrowIndex | uint256 | The variable borrow index before the last accumulation of the interest |
| newLiquidityIndex | uint256 | The new liquidity index |
| newVariableBorrowIndex | uint256 | The variable borrow index after the last accumulation of the interest |
| timestamp | uint40 |  |

### _updateIndexes

```solidity
function _updateIndexes(struct DataTypes.ReserveData reserve, uint256 scaledVariableDebt, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 timestamp) internal returns (uint256, uint256)
```

_Updates the reserve indexes and the timestamp of the update_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve reserve to be updated |
| scaledVariableDebt | uint256 | The scaled variable debt |
| liquidityIndex | uint256 | The last stored liquidity index |
| variableBorrowIndex | uint256 | The last stored variable borrow index |
| timestamp | uint40 |  |

## SupplyLogic

Implements the logic to supply feature

### Deposit

```solidity
event Deposit(address user, address reserve, uint256 amount, address onBehalfOf, uint16 referral)
```

_Emitted on deposit()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the deposit |
| reserve | address | The address of the underlying asset of the reserve |
| amount | uint256 | The amount deposited |
| onBehalfOf | address | The beneficiary of the deposit, receiving the bTokens |
| referral | uint16 | The referral code used |

### Withdraw

```solidity
event Withdraw(address user, address reserve, uint256 amount, address to)
```

_Emitted on withdraw()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address initiating the withdrawal, owner of bTokens |
| reserve | address | The address of the underlyng asset being withdrawn |
| amount | uint256 | The amount to be withdrawn |
| to | address | Address that will receive the underlying |

### executeDeposit

```solidity
function executeDeposit(mapping(address => struct DataTypes.ReserveData) reservesData, struct DataTypes.ExecuteDepositParams params) external
```

Implements the supply feature. Through `deposit()`, users deposit assets to the protocol.

_Emits the `Deposit()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| params | struct DataTypes.ExecuteDepositParams | The additional parameters needed to execute the deposit function |

### executeWithdraw

```solidity
function executeWithdraw(mapping(address => struct DataTypes.ReserveData) reservesData, struct DataTypes.ExecuteWithdrawParams params) external returns (uint256)
```

Implements the supply feature. Through `withdraw()`, users withdraw assets from the protocol.

_Emits the `Withdraw()` event._

| Name | Type | Description |
| ---- | ---- | ----------- |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves |
| params | struct DataTypes.ExecuteWithdrawParams | The additional parameters needed to execute the withdraw function |

## ValidationLogic

Implements functions to validate the different actions of the protocol

### validateDeposit

```solidity
function validateDeposit(struct DataTypes.ReserveData reserve, uint256 amount) external view
```

_Validates a deposit action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | struct DataTypes.ReserveData | The reserve object on which the user is depositing |
| amount | uint256 | The amount to be deposited |

### validateWithdraw

```solidity
function validateWithdraw(struct DataTypes.ReserveData reserveData, uint256 amount, uint256 userBalance) external view
```

_Validates a withdraw action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveData | struct DataTypes.ReserveData | The reserve state |
| amount | uint256 | The amount to be withdrawn |
| userBalance | uint256 | The balance of the user |

### ValidateBorrowLocalVars

```solidity
struct ValidateBorrowLocalVars {
  uint256 currentLtv;
  uint256 currentLiquidationThreshold;
  uint256 amountOfCollateralNeeded;
  uint256 userCollateralBalance;
  uint256 userBorrowBalance;
  uint256 availableLiquidity;
  uint256 healthFactor;
  bool isActive;
  bool isFrozen;
  bool borrowingEnabled;
  bool stableRateBorrowingEnabled;
  bool nftIsActive;
  bool nftIsFrozen;
  address loanReserveAsset;
  address loanBorrower;
}
```

### validateBorrow

```solidity
function validateBorrow(address user, address reserveAsset, uint256 amount, struct DataTypes.ReserveData reserveData, address nftAsset, uint256 tokenId, struct DataTypes.NftData nftData, address loanAddress, uint256 loanId, address reserveOracle, address nftOracle) external view
```

_Validates a borrow action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address |  |
| reserveAsset | address | The address of the asset to borrow |
| amount | uint256 | The amount to be borrowed |
| reserveData | struct DataTypes.ReserveData | The reserve state from which the user is borrowing |
| nftAsset | address |  |
| tokenId | uint256 |  |
| nftData | struct DataTypes.NftData | The state of the user for the specific nft |
| loanAddress | address |  |
| loanId | uint256 |  |
| reserveOracle | address |  |
| nftOracle | address |  |

### validateRepay

```solidity
function validateRepay(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData, uint256 amountSent, uint256 borrowAmount) external view
```

_Validates a repay action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveData | struct DataTypes.ReserveData | The reserve state from which the user is repaying |
| nftData | struct DataTypes.NftData |  |
| loanData | struct DataTypes.LoanData |  |
| amountSent | uint256 | The amount sent for the repayment. Can be an actual value or uint(-1) |
| borrowAmount | uint256 | The borrow balance of the user |

### validateAuction

```solidity
function validateAuction(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData, uint256 bidPrice) internal view
```

_Validates the auction action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveData | struct DataTypes.ReserveData | The reserve data of the principal |
| nftData | struct DataTypes.NftData | The nft data of the underlying nft |
| loanData | struct DataTypes.LoanData |  |
| bidPrice | uint256 | Total variable debt balance of the user |

### validateRedeem

```solidity
function validateRedeem(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData, uint256 amount) external view
```

_Validates a redeem action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveData | struct DataTypes.ReserveData | The reserve state |
| nftData | struct DataTypes.NftData | The nft state |
| loanData | struct DataTypes.LoanData |  |
| amount | uint256 |  |

### validateLiquidate

```solidity
function validateLiquidate(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData) internal view
```

_Validates the liquidation action_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveData | struct DataTypes.ReserveData | The reserve data of the principal |
| nftData | struct DataTypes.NftData | The data of the underlying NFT |
| loanData | struct DataTypes.LoanData | The loan data of the underlying NFT |

### validateTransfer

```solidity
function validateTransfer(address from, struct DataTypes.ReserveData reserveData) internal pure
```

_Validates an bToken transfer_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The user from which the bTokens are being transferred |
| reserveData | struct DataTypes.ReserveData | The state of the reserve |

## MathUtils

### SECONDS_PER_YEAR

```solidity
uint256 SECONDS_PER_YEAR
```

_Ignoring leap years_

### calculateLinearInterest

```solidity
function calculateLinearInterest(uint256 rate, uint40 lastUpdateTimestamp) internal view returns (uint256)
```

_Function to calculate the interest accumulated using a linear interest rate formula_

| Name | Type | Description |
| ---- | ---- | ----------- |
| rate | uint256 | The interest rate, in ray |
| lastUpdateTimestamp | uint40 | The timestamp of the last update of the interest |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The interest rate linearly accumulated during the timeDelta, in ray |

### calculateCompoundedInterest

```solidity
function calculateCompoundedInterest(uint256 rate, uint40 lastUpdateTimestamp, uint256 currentTimestamp) internal pure returns (uint256)
```

_Function to calculate the interest using a compounded interest rate formula
To avoid expensive exponentiation, the calculation is performed using a binomial approximation:

 (1+x)^n = 1+n*x+[n/2*(n-1)]*x^2+[n/6*(n-1)*(n-2)*x^3...

The approximation slightly underpays liquidity providers and undercharges borrowers, with the advantage of great gas cost reductions
The whitepaper contains reference to the approximation and a table showing the margin of error per different time periods_

| Name | Type | Description |
| ---- | ---- | ----------- |
| rate | uint256 | The interest rate, in ray |
| lastUpdateTimestamp | uint40 | The timestamp of the last update of the interest |
| currentTimestamp | uint256 |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The interest rate compounded during the timeDelta, in ray |

### calculateCompoundedInterest

```solidity
function calculateCompoundedInterest(uint256 rate, uint40 lastUpdateTimestamp) internal view returns (uint256)
```

_Calculates the compounded interest between the timestamp of the last update and the current block timestamp_

| Name | Type | Description |
| ---- | ---- | ----------- |
| rate | uint256 | The interest rate (in ray) |
| lastUpdateTimestamp | uint40 | The timestamp from which the interest accumulation needs to be calculated |

## PercentageMath

Provides functions to perform percentage calculations

_Percentages are defined by default with 2 decimals of precision (100.00). The precision is indicated by PERCENTAGE_FACTOR
Operations are rounded half up_

### PERCENTAGE_FACTOR

```solidity
uint256 PERCENTAGE_FACTOR
```

### HALF_PERCENT

```solidity
uint256 HALF_PERCENT
```

### ONE_PERCENT

```solidity
uint256 ONE_PERCENT
```

### TEN_PERCENT

```solidity
uint256 TEN_PERCENT
```

### ONE_THOUSANDTH_PERCENT

```solidity
uint256 ONE_THOUSANDTH_PERCENT
```

### ONE_TEN_THOUSANDTH_PERCENT

```solidity
uint256 ONE_TEN_THOUSANDTH_PERCENT
```

### percentMul

```solidity
function percentMul(uint256 value, uint256 percentage) internal pure returns (uint256)
```

_Executes a percentage multiplication_

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | The value of which the percentage needs to be calculated |
| percentage | uint256 | The percentage of the value to be calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The percentage of value |

### percentDiv

```solidity
function percentDiv(uint256 value, uint256 percentage) internal pure returns (uint256)
```

_Executes a percentage division_

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | The value of which the percentage needs to be calculated |
| percentage | uint256 | The percentage of the value to be calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The value divided the percentage |

## WadRayMath

_Provides mul and div function for wads (decimal numbers with 18 digits precision) and rays (decimals with 27 digits)_

### WAD

```solidity
uint256 WAD
```

### HALF_WAD

```solidity
uint256 HALF_WAD
```

### RAY

```solidity
uint256 RAY
```

### HALF_RAY

```solidity
uint256 HALF_RAY
```

### WAD_RAY_RATIO

```solidity
uint256 WAD_RAY_RATIO
```

### ray

```solidity
function ray() internal pure returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | One ray, 1e27 |

### wad

```solidity
function wad() internal pure returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | One wad, 1e18 |

### halfRay

```solidity
function halfRay() internal pure returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Half ray, 1e27/2 |

### halfWad

```solidity
function halfWad() internal pure returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Half ray, 1e18/2 |

### wadMul

```solidity
function wadMul(uint256 a, uint256 b) internal pure returns (uint256)
```

_Multiplies two wad, rounding half up to the nearest wad_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint256 | Wad |
| b | uint256 | Wad |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The result of a*b, in wad |

### wadDiv

```solidity
function wadDiv(uint256 a, uint256 b) internal pure returns (uint256)
```

_Divides two wad, rounding half up to the nearest wad_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint256 | Wad |
| b | uint256 | Wad |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The result of a/b, in wad |

### rayMul

```solidity
function rayMul(uint256 a, uint256 b) internal pure returns (uint256)
```

_Multiplies two ray, rounding half up to the nearest ray_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint256 | Ray |
| b | uint256 | Ray |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The result of a*b, in ray |

### rayDiv

```solidity
function rayDiv(uint256 a, uint256 b) internal pure returns (uint256)
```

_Divides two ray, rounding half up to the nearest ray_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint256 | Ray |
| b | uint256 | Ray |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The result of a/b, in ray |

### rayToWad

```solidity
function rayToWad(uint256 a) internal pure returns (uint256)
```

_Casts ray down to wad_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint256 | Ray |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | a casted to wad, rounded half up to the nearest wad |

### wadToRay

```solidity
function wadToRay(uint256 a) internal pure returns (uint256)
```

_Converts wad up to ray_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint256 | Wad |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | a converted in ray |

## UnlockdProxyAdmin

## UnlockdUpgradeableProxy

### constructor

```solidity
constructor(address _logic, address admin_, bytes _data) public payable
```

### OnlyAdmin

```solidity
modifier OnlyAdmin()
```

### getImplementation

```solidity
function getImplementation() external view returns (address)
```

## ConfigTypes

### InitReserveInput

```solidity
struct InitReserveInput {
  address bTokenImpl;
  address debtTokenImpl;
  uint8 underlyingAssetDecimals;
  address interestRateAddress;
  address underlyingAsset;
  address treasury;
  string underlyingAssetName;
  string bTokenName;
  string bTokenSymbol;
  string debtTokenName;
  string debtTokenSymbol;
}
```

### InitNftInput

```solidity
struct InitNftInput {
  address underlyingAsset;
}
```

### UpdateBTokenInput

```solidity
struct UpdateBTokenInput {
  address asset;
  address implementation;
  bytes encodedCallData;
}
```

### UpdateDebtTokenInput

```solidity
struct UpdateDebtTokenInput {
  address asset;
  address implementation;
  bytes encodedCallData;
}
```

## DataTypes

### ReserveData

```solidity
struct ReserveData {
  struct DataTypes.ReserveConfigurationMap configuration;
  uint128 liquidityIndex;
  uint128 variableBorrowIndex;
  uint128 currentLiquidityRate;
  uint128 currentVariableBorrowRate;
  uint40 lastUpdateTimestamp;
  address bTokenAddress;
  address debtTokenAddress;
  address interestRateAddress;
  uint8 id;
}
```

### NftData

```solidity
struct NftData {
  struct DataTypes.NftConfigurationMap configuration;
  address uNftAddress;
  uint8 id;
  uint256 maxSupply;
  uint256 maxTokenId;
}
```

### ReserveConfigurationMap

```solidity
struct ReserveConfigurationMap {
  uint256 data;
}
```

### NftConfigurationMap

```solidity
struct NftConfigurationMap {
  uint256 data;
}
```

### LoanState

```solidity
enum LoanState {
  None,
  Created,
  Active,
  Auction,
  Repaid,
  Defaulted
}
```

### LoanData

```solidity
struct LoanData {
  uint256 loanId;
  enum DataTypes.LoanState state;
  address borrower;
  address nftAsset;
  uint256 nftTokenId;
  address reserveAsset;
  uint256 scaledAmount;
  uint256 bidStartTimestamp;
  address bidderAddress;
  uint256 bidPrice;
  uint256 bidBorrowAmount;
  address firstBidderAddress;
}
```

### ExecuteDepositParams

```solidity
struct ExecuteDepositParams {
  address initiator;
  address asset;
  uint256 amount;
  address onBehalfOf;
  uint16 referralCode;
}
```

### ExecuteWithdrawParams

```solidity
struct ExecuteWithdrawParams {
  address initiator;
  address asset;
  uint256 amount;
  address to;
}
```

### ExecuteBorrowParams

```solidity
struct ExecuteBorrowParams {
  address initiator;
  address asset;
  uint256 amount;
  address nftAsset;
  uint256 nftTokenId;
  address onBehalfOf;
  uint16 referralCode;
}
```

### ExecuteBatchBorrowParams

```solidity
struct ExecuteBatchBorrowParams {
  address initiator;
  address[] assets;
  uint256[] amounts;
  address[] nftAssets;
  uint256[] nftTokenIds;
  address onBehalfOf;
  uint16 referralCode;
}
```

### ExecuteRepayParams

```solidity
struct ExecuteRepayParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 amount;
}
```

### ExecuteBatchRepayParams

```solidity
struct ExecuteBatchRepayParams {
  address initiator;
  address[] nftAssets;
  uint256[] nftTokenIds;
  uint256[] amounts;
}
```

### ExecuteAuctionParams

```solidity
struct ExecuteAuctionParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 bidPrice;
  address onBehalfOf;
}
```

### ExecuteRedeemParams

```solidity
struct ExecuteRedeemParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 amount;
  uint256 bidFine;
}
```

### ExecuteLiquidateParams

```solidity
struct ExecuteLiquidateParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 amount;
}
```

## RepayAndTransferHelper

### ADDRESS_ID_WETH_GATEWAY

```solidity
bytes32 ADDRESS_ID_WETH_GATEWAY
```

### addressProvider

```solidity
contract ILendPoolAddressesProvider addressProvider
```

### constructor

```solidity
constructor(address addressProvider_) public
```

### repayETHAndTransferERC721

```solidity
function repayETHAndTransferERC721(address nftAsset, uint256 nftTokenId, address target) public payable
```

### emergencyEtherTransfer

```solidity
function emergencyEtherTransfer(address to, uint256 amount) external
```

### _safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

### getNftDebtData

```solidity
function getNftDebtData(address nftAsset, uint256 nftTokenId) public view returns (address, uint256)
```

## UiPoolDataProvider

### reserveOracle

```solidity
contract IReserveOracleGetter reserveOracle
```

### nftOracle

```solidity
contract INFTOracleGetter nftOracle
```

### constructor

```solidity
constructor(contract IReserveOracleGetter _reserveOracle, contract INFTOracleGetter _nftOracle) public
```

### getInterestRateStrategySlopes

```solidity
function getInterestRateStrategySlopes(contract InterestRate interestRate) internal view returns (uint256, uint256)
```

### getReservesList

```solidity
function getReservesList(contract ILendPoolAddressesProvider provider) public view returns (address[])
```

### getSimpleReservesData

```solidity
function getSimpleReservesData(contract ILendPoolAddressesProvider provider) public view returns (struct IUiPoolDataProvider.AggregatedReserveData[])
```

### getUserReservesData

```solidity
function getUserReservesData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.UserReserveData[])
```

### getReservesData

```solidity
function getReservesData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.AggregatedReserveData[], struct IUiPoolDataProvider.UserReserveData[])
```

### _fillReserveData

```solidity
function _fillReserveData(struct IUiPoolDataProvider.AggregatedReserveData reserveData, address reserveAsset, struct DataTypes.ReserveData baseData) internal view
```

### _fillUserReserveData

```solidity
function _fillUserReserveData(struct IUiPoolDataProvider.UserReserveData userReserveData, address user, address reserveAsset, struct DataTypes.ReserveData baseData) internal view
```

### getNftsList

```solidity
function getNftsList(contract ILendPoolAddressesProvider provider) external view returns (address[])
```

### getSimpleNftsData

```solidity
function getSimpleNftsData(contract ILendPoolAddressesProvider provider) external view returns (struct IUiPoolDataProvider.AggregatedNftData[])
```

### getUserNftsData

```solidity
function getUserNftsData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.UserNftData[])
```

### getNftsData

```solidity
function getNftsData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.AggregatedNftData[], struct IUiPoolDataProvider.UserNftData[])
```

### _fillNftData

```solidity
function _fillNftData(struct IUiPoolDataProvider.AggregatedNftData nftData, address nftAsset, struct DataTypes.NftData baseData, contract ILendPoolLoan lendPoolLoan) internal view
```

### _fillUserNftData

```solidity
function _fillUserNftData(struct IUiPoolDataProvider.UserNftData userNftData, address user, address nftAsset, struct DataTypes.NftData baseData, contract ILendPoolLoan lendPoolLoan) internal view
```

### getSimpleLoansData

```solidity
function getSimpleLoansData(contract ILendPoolAddressesProvider provider, address[] nftAssets, uint256[] nftTokenIds) external view returns (struct IUiPoolDataProvider.AggregatedLoanData[])
```

## UnlockdCollector

Stores all the UNLOCKD kept for incentives, just giving approval to the different
systems that will pull UNLOCKD funds for their specific use case

### initialize

```solidity
function initialize() external
```

_initializes the contract upon assignment to the UnlockdUpgradeableProxy_

### approve

```solidity
function approve(contract IERC20Upgradeable token, address recipient, uint256 amount) external
```

### transfer

```solidity
function transfer(contract IERC20Upgradeable token, address recipient, uint256 amount) external
```

## UnlockdProtocolDataProvider

### ETH

```solidity
address ETH
```

### ReserveTokenData

```solidity
struct ReserveTokenData {
  string tokenSymbol;
  address tokenAddress;
  string bTokenSymbol;
  address bTokenAddress;
  string debtTokenSymbol;
  address debtTokenAddress;
}
```

### NftTokenData

```solidity
struct NftTokenData {
  string nftSymbol;
  address nftAddress;
  string uNftSymbol;
  address uNftAddress;
}
```

### ADDRESSES_PROVIDER

```solidity
contract ILendPoolAddressesProvider ADDRESSES_PROVIDER
```

### constructor

```solidity
constructor(contract ILendPoolAddressesProvider addressesProvider) public
```

### getAllReservesTokenDatas

```solidity
function getAllReservesTokenDatas() external view returns (struct UnlockdProtocolDataProvider.ReserveTokenData[])
```

### getReserveTokenData

```solidity
function getReserveTokenData(address asset) external view returns (struct UnlockdProtocolDataProvider.ReserveTokenData)
```

### getAllNftsTokenDatas

```solidity
function getAllNftsTokenDatas() external view returns (struct UnlockdProtocolDataProvider.NftTokenData[])
```

### getNftTokenData

```solidity
function getNftTokenData(address nftAsset) external view returns (struct UnlockdProtocolDataProvider.NftTokenData)
```

### getReserveConfigurationData

```solidity
function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 reserveFactor, bool borrowingEnabled, bool isActive, bool isFrozen)
```

### NftConfigurationData

```solidity
struct NftConfigurationData {
  uint256 ltv;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 redeemDuration;
  uint256 auctionDuration;
  uint256 redeemFine;
  uint256 redeemThreshold;
  uint256 minBidFine;
  bool isActive;
  bool isFrozen;
}
```

### getNftConfigurationData

```solidity
function getNftConfigurationData(address asset) external view returns (struct UnlockdProtocolDataProvider.NftConfigurationData configData)
```

### getReserveData

```solidity
function getReserveData(address asset) external view returns (uint256 availableLiquidity, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)
```

### getUserReserveData

```solidity
function getUserReserveData(address asset, address user) external view returns (uint256 currentBTokenBalance, uint256 currentVariableDebt, uint256 scaledVariableDebt, uint256 liquidityRate)
```

### LoanData

```solidity
struct LoanData {
  uint256 loanId;
  uint8 state;
  address borrower;
  address nftAsset;
  uint256 nftTokenId;
  address reserveAsset;
  uint256 scaledAmount;
  uint256 currentAmount;
  uint256 bidStartTimestamp;
  address bidderAddress;
  uint256 bidPrice;
  uint256 bidBorrowAmount;
}
```

### getLoanDataByCollateral

```solidity
function getLoanDataByCollateral(address nftAsset, uint256 nftTokenId) external view returns (struct UnlockdProtocolDataProvider.LoanData loanData)
```

### getLoanDataByLoanId

```solidity
function getLoanDataByLoanId(uint256 loanId) external view returns (struct UnlockdProtocolDataProvider.LoanData loanData)
```

### _fillLoanData

```solidity
function _fillLoanData(struct UnlockdProtocolDataProvider.LoanData loanData, struct DataTypes.LoanData loan) internal view
```

## WalletBalanceProvider

Implements a logic of getting multiple tokens balance for one user address

_NOTE: THIS CONTRACT IS NOT USED WITHIN THE UNLOCKD PROTOCOL. It's an accessory contract used to reduce the number of calls
towards the blockchain from the Unlockd backend._

### MOCK_ETH_ADDRESS

```solidity
address MOCK_ETH_ADDRESS
```

### balanceOfReserve

```solidity
function balanceOfReserve(address user, address token) public view returns (uint256)
```

_Check the reserve balance of a wallet in a reserve contract

    Returns the balance of the reserve for user. Avoids possible errors:
      - return 0 on non-contract address_

### batchBalanceOfReserve

```solidity
function batchBalanceOfReserve(address[] users, address[] tokens) external view returns (uint256[])
```

Fetches, for a list of _users and _tokens (ETH included with mock address), the balances

| Name | Type | Description |
| ---- | ---- | ----------- |
| users | address[] | The list of users |
| tokens | address[] | The list of tokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | And array with the concatenation of, for each user, his/her balances |

### getUserReservesBalances

```solidity
function getUserReservesBalances(address provider, address user) external view returns (address[], uint256[])
```

_provides balances of user wallet for all reserves available on the pool_

### balanceOfNft

```solidity
function balanceOfNft(address user, address token) public view returns (uint256)
```

_Check the nft balance of a wallet in a nft contract

    Returns the balance of the nft for user. Avoids possible errors:
      - return 0 on non-contract address_

### batchBalanceOfNft

```solidity
function batchBalanceOfNft(address[] users, address[] tokens) external view returns (uint256[])
```

Fetches, for a list of _users and _tokens (ETH included with mock address), the balances

| Name | Type | Description |
| ---- | ---- | ----------- |
| users | address[] | The list of users |
| tokens | address[] | The list of tokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | And array with the concatenation of, for each user, his/her balances |

### getUserNftsBalances

```solidity
function getUserNftsBalances(address provider, address user) external view returns (address[], uint256[])
```

_provides balances of user wallet for all nfts available on the pool_

### batchTokenOfOwnerByIndex

```solidity
function batchTokenOfOwnerByIndex(address owner, address token) external view returns (uint256[])
```

_Returns a token ID list owned by `owner`.
Requirements:
 - The `token` must be IERC721Enumerable contract address_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of user |
| token | address | The address of ERC721 contract |

### batchTokenOfOwner

```solidity
function batchTokenOfOwner(address owner, address token, uint256 start, uint256 count) external view returns (uint256[])
```

_Returns a token ID list owned by `owner`.
Requirements:
 - The `token` must be IERC721 contract address
 - The `start` plus `count` must be not greater than total supply
 - The transaction must not ran out of gas, `count` <= 2000_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of user |
| token | address | The address of ERC721 contract |
| start | uint256 | The starting token ID |
| count | uint256 | The scaning number |

### batchPunkOfOwner

```solidity
function batchPunkOfOwner(address owner, address punkContract, uint256 start, uint256 count) external view returns (uint256[])
```

_Returns a punk index list owned by `owner`.
Requirements:
 - The `punkContract` must be CryptoPunksMarket address
 - The `start` plus `count` must be not greater than total supply
 - The transaction must not ran out of gas, `count` <= 2000_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of user |
| punkContract | address | The address of punk contract |
| start | uint256 | The starting punk index |
| count | uint256 | The scaning number |

## CryptoPunksMarket

### imageHash

```solidity
string imageHash
```

### standard

```solidity
string standard
```

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### totalSupply

```solidity
uint256 totalSupply
```

### nextPunkIndexToAssign

```solidity
uint256 nextPunkIndexToAssign
```

### allPunksAssigned

```solidity
bool allPunksAssigned
```

### punksRemainingToAssign

```solidity
uint256 punksRemainingToAssign
```

### punkIndexToAddress

```solidity
mapping(uint256 => address) punkIndexToAddress
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### Offer

```solidity
struct Offer {
  bool isForSale;
  uint256 punkIndex;
  address seller;
  uint256 minValue;
  address onlySellTo;
}
```

### Bid

```solidity
struct Bid {
  bool hasBid;
  uint256 punkIndex;
  address bidder;
  uint256 value;
}
```

### punksOfferedForSale

```solidity
mapping(uint256 => struct CryptoPunksMarket.Offer) punksOfferedForSale
```

### punkBids

```solidity
mapping(uint256 => struct CryptoPunksMarket.Bid) punkBids
```

### pendingWithdrawals

```solidity
mapping(address => uint256) pendingWithdrawals
```

### Assign

```solidity
event Assign(address to, uint256 punkIndex)
```

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

### PunkTransfer

```solidity
event PunkTransfer(address from, address to, uint256 punkIndex)
```

### PunkOffered

```solidity
event PunkOffered(uint256 punkIndex, uint256 minValue, address toAddress)
```

### PunkBidEntered

```solidity
event PunkBidEntered(uint256 punkIndex, uint256 value, address fromAddress)
```

### PunkBidWithdrawn

```solidity
event PunkBidWithdrawn(uint256 punkIndex, uint256 value, address fromAddress)
```

### PunkBought

```solidity
event PunkBought(uint256 punkIndex, uint256 value, address fromAddress, address toAddress)
```

### PunkNoLongerForSale

```solidity
event PunkNoLongerForSale(uint256 punkIndex)
```

### constructor

```solidity
constructor() public
```

### setInitialOwner

```solidity
function setInitialOwner(address to, uint256 punkIndex) public
```

### setInitialOwners

```solidity
function setInitialOwners(address[] addresses, uint256[] indices) public
```

### allInitialOwnersAssigned

```solidity
function allInitialOwnersAssigned() public
```

### getPunk

```solidity
function getPunk(uint256 punkIndex) public
```

### transferPunk

```solidity
function transferPunk(address to, uint256 punkIndex) public
```

### punkNoLongerForSale

```solidity
function punkNoLongerForSale(uint256 punkIndex) public
```

### offerPunkForSale

```solidity
function offerPunkForSale(uint256 punkIndex, uint256 minSalePriceInWei) public
```

### offerPunkForSaleToAddress

```solidity
function offerPunkForSaleToAddress(uint256 punkIndex, uint256 minSalePriceInWei, address toAddress) public
```

### buyPunk

```solidity
function buyPunk(uint256 punkIndex) public payable
```

### withdraw

```solidity
function withdraw() public
```

### enterBidForPunk

```solidity
function enterBidForPunk(uint256 punkIndex) public payable
```

### acceptBidForPunk

```solidity
function acceptBidForPunk(uint256 punkIndex, uint256 minPrice) public
```

### withdrawBidForPunk

```solidity
function withdrawBidForPunk(uint256 punkIndex) public
```

### _safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | recipient of the transfer |
| value | uint256 | the amount to send |

## DependencyStub

_Dependency Stub_

### constructor

```solidity
constructor(uint256 val) public
```

## MaliciousHackerERC721

_Malicious Hacker Logic_

### _pool

```solidity
contract ILendPool _pool
```

### _simulateAction

```solidity
uint256 _simulateAction
```

### ACTION_DEPOSIT

```solidity
uint256 ACTION_DEPOSIT
```

### ACTION_WITHDRAW

```solidity
uint256 ACTION_WITHDRAW
```

### ACTION_BORROW

```solidity
uint256 ACTION_BORROW
```

### ACTION_REPAY

```solidity
uint256 ACTION_REPAY
```

### ACTION_AUCTION

```solidity
uint256 ACTION_AUCTION
```

### ACTION_REDEEM

```solidity
uint256 ACTION_REDEEM
```

### ACTION_LIQUIDATE

```solidity
uint256 ACTION_LIQUIDATE
```

### constructor

```solidity
constructor(address pool_) public
```

### approveDelegate

```solidity
function approveDelegate(address reserve, address delegatee) public
```

### simulateAction

```solidity
function simulateAction(uint256 simulateAction_) public
```

### OnERC721ReceivedLocalVars

```solidity
struct OnERC721ReceivedLocalVars {
  address[] reserves;
  address[] nfts;
  address onBehalfOf;
  address to;
  uint16 referralCode;
  uint256 amount;
  uint256 bidPrice;
  uint256 bidFine;
}
```

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external returns (bytes4)
```

_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`._

## MintableERC20

_ERC20 minting logic_

### _decimals

```solidity
uint8 _decimals
```

### mintValues

```solidity
mapping(address => uint256) mintValues
```

### constructor

```solidity
constructor(string name, string symbol, uint8 decimals_) public
```

### _setupDecimals

```solidity
function _setupDecimals(uint8 decimals_) internal
```

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### mint

```solidity
function mint(uint256 value) public returns (bool)
```

_Function to mint tokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | The amount of tokens to mint. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | A boolean that indicates if the operation was successful. |

## MintableERC721

_ERC721 minting logic_

### baseURI

```solidity
string baseURI
```

### mintCounts

```solidity
mapping(address => uint256) mintCounts
```

### constructor

```solidity
constructor(string name, string symbol) public
```

### mint

```solidity
function mint(uint256 tokenId) public returns (bool)
```

_Function to mint tokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The id of tokens to mint. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | A boolean that indicates if the operation was successful. |

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overriden in child contracts._

### setBaseURI

```solidity
function setBaseURI(string baseURI_) public
```

## MockBTokenVersionN

### dummy1

```solidity
uint256 dummy1
```

### dummy2

```solidity
uint256 dummy2
```

### initializeVersionN

```solidity
function initializeVersionN(uint256 dummy1_, uint256 dummy2_) external
```

## MockChainlinkOracle

### roundIdArray

```solidity
uint80[] roundIdArray
```

### answerArray

```solidity
int256[] answerArray
```

### decimalsArray

```solidity
uint256[] decimalsArray
```

### timestampArray

```solidity
uint256[] timestampArray
```

### versionArray

```solidity
uint80[] versionArray
```

### _decimals

```solidity
uint8 _decimals
```

### constructor

```solidity
constructor(uint8 decimals_) public
```

### aggregator

```solidity
function aggregator() public view returns (address)
```

### latestAnswer

```solidity
function latestAnswer() external view returns (int256)
```

### latestTimestamp

```solidity
function latestTimestamp() external view returns (uint256)
```

### latestRound

```solidity
function latestRound() external view returns (uint256)
```

### getAnswer

```solidity
function getAnswer(uint256 roundId) external view returns (int256)
```

### getTimestamp

```solidity
function getTimestamp(uint256 roundId) external view returns (uint256)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

### description

```solidity
function description() external pure returns (string)
```

### version

```solidity
function version() external pure returns (uint256)
```

### getRoundData

```solidity
function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### mockAddAnswer

```solidity
function mockAddAnswer(uint80 _roundId, int256 _answer, uint256 _startedAt, uint256 _updatedAt, uint80 _answeredInRound) external
```

## MockDebtTokenVersionN

### dummy1

```solidity
uint256 dummy1
```

### dummy2

```solidity
uint256 dummy2
```

### initializeVersionN

```solidity
function initializeVersionN(uint256 dummy1_, uint256 dummy2_) external
```

## MockIncentivesController

### _handleActionIsCalled

```solidity
bool _handleActionIsCalled
```

### _asset

```solidity
address _asset
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _userBalance

```solidity
uint256 _userBalance
```

### handleAction

```solidity
function handleAction(address asset, uint256 totalSupply, uint256 userBalance) external
```

_Called by the corresponding asset on any update that affects the rewards distribution_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the user |
| totalSupply | uint256 | The total supply of the asset in the lending pool |
| userBalance | uint256 | The balance of the user of the asset in the lending pool |

### checkHandleActionIsCorrect

```solidity
function checkHandleActionIsCorrect(address asset, uint256 totalSupply, uint256 userBalance) public view returns (bool)
```

### checkHandleActionIsCalled

```solidity
function checkHandleActionIsCalled() public view returns (bool)
```

### resetHandleActionIsCalled

```solidity
function resetHandleActionIsCalled() public
```

## MockLendPoolVersionN

### dummy1

```solidity
uint256 dummy1
```

### dummy2

```solidity
uint256 dummy2
```

### initializeVersionN

```solidity
function initializeVersionN(uint256 dummy1_, uint256 dummy2_) external
```

## MockNFTOracle

### timestamp

```solidity
uint256 timestamp
```

### number

```solidity
uint256 number
```

### mock_setBlockTimestamp

```solidity
function mock_setBlockTimestamp(uint256 _timestamp) public
```

### mock_setBlockNumber

```solidity
function mock_setBlockNumber(uint256 _number) public
```

### mock_getCurrentTimestamp

```solidity
function mock_getCurrentTimestamp() public view returns (uint256)
```

### _blockTimestamp

```solidity
function _blockTimestamp() internal view returns (uint256)
```

Override gives an error

### _blockNumber

```solidity
function _blockNumber() internal view returns (uint256)
```

## MockReserveOracle

### timestamp

```solidity
uint256 timestamp
```

### number

```solidity
uint256 number
```

### mock_setBlockTimestamp

```solidity
function mock_setBlockTimestamp(uint256 _timestamp) public
```

### mock_setBlockNumber

```solidity
function mock_setBlockNumber(uint256 _number) public
```

### mock_getCurrentTimestamp

```solidity
function mock_getCurrentTimestamp() public view returns (uint256)
```

### _blockTimestamp

```solidity
function _blockTimestamp() internal view returns (uint256)
```

### _blockNumber

```solidity
function _blockNumber() internal view returns (uint256)
```

## UNFT

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

_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`._

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

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) public virtual
```

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```

### _transfer

```solidity
function _transfer(address from, address to, uint256 tokenId) internal virtual
```

_Transfers `tokenId` from `from` to `to`.
 As opposed to {transferFrom}, this imposes no restrictions on msg.sender.

Requirements:

- `to` cannot be the zero address.
- `tokenId` token must be owned by `from`.

Emits a {Transfer} event._

## UNFTRegistry

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

### getUNFTAddressesByIndex

```solidity
function getUNFTAddressesByIndex(uint16 index) external view returns (address uNftProxy, address uNftImpl)
```

### getUNFTAssetList

```solidity
function getUNFTAssetList() external view returns (address[])
```

### allUNFTAssetLength

```solidity
function allUNFTAssetLength() external view returns (uint256)
```

### initialize

```solidity
function initialize(address genericImpl, string namePrefix_, string symbolPrefix_) external
```

### createUNFT

```solidity
function createUNFT(address nftAsset) external returns (address uNftProxy)
```

_See {IUNFTRegistry-createUNFT}._

### setUNFTGenericImpl

```solidity
function setUNFTGenericImpl(address genericImpl) external
```

_See {IUNFTRegistry-setUNFTGenericImpl}._

### createUNFTWithImpl

```solidity
function createUNFTWithImpl(address nftAsset, address uNftImpl) external returns (address uNftProxy)
```

_See {IUNFTRegistry-createUNFTWithImpl}._

### upgradeUNFTWithImpl

```solidity
function upgradeUNFTWithImpl(address nftAsset, address uNftImpl, bytes encodedCallData) external
```

_See {IUNFTRegistry-upgradeUNFTWithImpl}._

### addCustomeSymbols

```solidity
function addCustomeSymbols(address[] nftAssets_, string[] symbols_) external
```

_See {IUNFTRegistry-addCustomeSymbols}._

### _createProxyAndInitWithImpl

```solidity
function _createProxyAndInitWithImpl(address nftAsset, address uNftImpl) internal returns (address uNftProxy)
```

### _buildInitParams

```solidity
function _buildInitParams(address nftAsset) internal view returns (bytes initParams)
```

### _requireAddressIsERC721

```solidity
function _requireAddressIsERC721(address nftAsset) internal view
```

## ICryptoPunk

### punkIndexToAddress

```solidity
function punkIndexToAddress(uint256 punkIndex) external returns (address)
```

### punksOfferedForSale

```solidity
function punksOfferedForSale(uint256 punkIndex) external returns (bool, uint256, address, uint256, address)
```

### buyPunk

```solidity
function buyPunk(uint256 punkIndex) external payable
```

### transferPunk

```solidity
function transferPunk(address to, uint256 punkIndex) external
```

## UserProxy

### _owner

```solidity
address _owner
```

### constructor

```solidity
constructor() public
```

_Initializes the contract settings_

### transfer

```solidity
function transfer(address punkContract, uint256 punkIndex) external returns (bool)
```

_Transfers punk to the smart contract owner_

## WrappedPunk

### ProxyRegistered

```solidity
event ProxyRegistered(address user, address proxy)
```

### _punkContract

```solidity
contract ICryptoPunk _punkContract
```

### _proxies

```solidity
mapping(address => address) _proxies
```

### constructor

```solidity
constructor(address punkContract_) public
```

_Initializes the contract settings_

### punkContract

```solidity
function punkContract() public view returns (address)
```

_Gets address of cryptopunk smart contract_

### registerProxy

```solidity
function registerProxy() public
```

_Registers proxy_

### proxyInfo

```solidity
function proxyInfo(address user) public view returns (address)
```

_Gets proxy address_

### mint

```solidity
function mint(uint256 punkIndex) public
```

_Mints a wrapped punk_

### burn

```solidity
function burn(uint256 punkIndex) public
```

_Burns a specific wrapped punk_

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overriden in child contracts._

## BToken

_Implementation of the interest bearing token for the Unlockd protocol_

### _addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### _treasury

```solidity
address _treasury
```

### _underlyingAsset

```solidity
address _underlyingAsset
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

### onlyLendPoolConfigurator

```solidity
modifier onlyLendPoolConfigurator()
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address treasury, address underlyingAsset, uint8 bTokenDecimals, string bTokenName, string bTokenSymbol) external
```

_Initializes the bToken_

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the address provider where this bToken will be used |
| treasury | address | The address of the Unlockd treasury, receiving the fees on this bToken |
| underlyingAsset | address | The address of the underlying asset of this bToken |
| bTokenDecimals | uint8 |  |
| bTokenName | string |  |
| bTokenSymbol | string |  |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

_Burns bTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`
- Only callable by the LendPool, as extra state updates there need to be managed_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The owner of the bTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying |
| amount | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

_Mints `amount` bTokens to `user`
- Only callable by the LendPool, as extra state updates there need to be managed_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user was 0 |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

_Mints bTokens to the reserve treasury
- Only callable by the LendPool_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

### balanceOf

```solidity
function balanceOf(address user) public view returns (uint256)
```

_Calculates the balance of the user: principal balance + interest generated by the principal_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user whose balance is calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The balance of the user |

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user whose balance is calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |
| [1] | uint256 | The scaled balance and the scaled total supply |

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

_calculates the total supply of the specific bToken
since the balance of every single user increases over time, the total supply
does that too._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the current total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() public view virtual returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the scaled total supply |

### RESERVE_TREASURY_ADDRESS

```solidity
function RESERVE_TREASURY_ADDRESS() public view returns (address)
```

_Returns the address of the Unlockd treasury, receiving the fees on this bToken_

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() public view returns (address)
```

_Returns the address of the underlying asset of this bToken_

### POOL

```solidity
function POOL() public view returns (contract ILendPool)
```

_Returns the address of the lending pool where this bToken is used_

### _getIncentivesController

```solidity
function _getIncentivesController() internal view returns (contract IIncentivesController)
```

_For internal usage in the logic of the parent contract IncentivizedERC20_

### _getUnderlyingAssetAddress

```solidity
function _getUnderlyingAssetAddress() internal view returns (address)
```

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address target, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendPool to transfer
assets in borrow(), withdraw() and flashLoan()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| target | address | The recipient of the bTokens |
| amount | uint256 | The amount getting transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount transferred |

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### _getLendPoolConfigurator

```solidity
function _getLendPoolConfigurator() internal view returns (contract ILendPoolConfigurator)
```

### _transfer

```solidity
function _transfer(address from, address to, uint256 amount, bool validate) internal
```

_Transfers the bTokens between two users. Validates the transfer
(ie checks for valid HF after the transfer) if required_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The source address |
| to | address | The destination address |
| amount | uint256 | The amount getting transferred |
| validate | bool | `true` if the transfer needs to be validated |

### _transfer

```solidity
function _transfer(address from, address to, uint256 amount) internal
```

_Overrides the parent _transfer to force validated transfer() and transferFrom()_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The source address |
| to | address | The destination address |
| amount | uint256 | The amount getting transferred |

## DebtToken

Implements a debt token to track the borrowing positions of users

### _addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### _underlyingAsset

```solidity
address _underlyingAsset
```

### _borrowAllowances

```solidity
mapping(address => mapping(address => uint256)) _borrowAllowances
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

### onlyLendPoolConfigurator

```solidity
modifier onlyLendPoolConfigurator()
```

### BorrowAllowanceDelegated

```solidity
event BorrowAllowanceDelegated(address fromUser, address toUser, address asset, uint256 amount)
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address underlyingAsset, uint8 debtTokenDecimals, string debtTokenName, string debtTokenSymbol) public
```

_Initializes the debt token._

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the lend pool |
| underlyingAsset | address | The address of the underlying asset |
| debtTokenDecimals | uint8 | The decimals of the debtToken, same as the underlying asset's |
| debtTokenName | string | The name of the token |
| debtTokenSymbol | string | The symbol of the token |

### mint

```solidity
function mint(address initiator, address onBehalfOf, uint256 amount, uint256 index) external returns (bool)
```

_Mints debt token to the `user` address
-  Only callable by the LendPool_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address calling borrow |
| onBehalfOf | address |  |
| amount | uint256 | The amount of debt being minted |
| index | uint256 | The variable debt index of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user is 0 |

### burn

```solidity
function burn(address user, uint256 amount, uint256 index) external
```

_Burns user variable debt
- Only callable by the LendPool_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user whose debt is getting burned |
| amount | uint256 | The amount getting burned |
| index | uint256 | The variable debt index of the reserve |

### balanceOf

```solidity
function balanceOf(address user) public view virtual returns (uint256)
```

_Calculates the accumulated debt balance of the user_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The debt balance of the user |

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) public view virtual returns (uint256)
```

_Returns the principal debt balance of the user from_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The debt balance of the user since the last burn/mint action |

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_Returns the total supply of the variable debt token. Represents the total debt accrued by the users_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() public view virtual returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the scaled total supply |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the principal balance of the user and principal total supply._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The principal balance of the user |
| [1] | uint256 | The principal total supply |

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() public view returns (address)
```

_Returns the address of the underlying asset of this bToken_

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### POOL

```solidity
function POOL() public view returns (contract ILendPool)
```

_Returns the address of the lend pool where this token is used_

### _getIncentivesController

```solidity
function _getIncentivesController() internal view returns (contract IIncentivesController)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IIncentivesController | Abstract function implemented by the child bToken/debtToken. Done this way in order to not break compatibility with previous versions of bTokens/debtTokens |

### _getUnderlyingAssetAddress

```solidity
function _getUnderlyingAssetAddress() internal view returns (address)
```

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### _getLendPoolConfigurator

```solidity
function _getLendPoolConfigurator() internal view returns (contract ILendPoolConfigurator)
```

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_Being non transferrable, the debt token does not implement any of the
standard ERC20 functions for transfer and allowance._

### allowance

```solidity
function allowance(address owner, address spender) public view virtual returns (uint256)
```

_Returns the remaining number of tokens that `spender` will be
allowed to spend on behalf of `owner` through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

_Sets `amount` as the allowance of `spender` over the caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender's allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)
```

_Moves `amount` tokens from `sender` to `recipient` using the
allowance mechanism. `amount` is then deducted from the caller's
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`._

### approveDelegation

```solidity
function approveDelegation(address delegatee, uint256 amount) external
```

_delegates borrowing power to a user on the specific debt token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address receiving the delegated borrowing power |
| amount | uint256 | the maximum amount being delegated. Delegation will still respect the liquidation constraints (even if delegated, a delegatee cannot force a delegator HF to go below 1) |

### borrowAllowance

```solidity
function borrowAllowance(address fromUser, address toUser) external view returns (uint256)
```

_returns the borrow allowance of the user_

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromUser | address | The user to giving allowance |
| toUser | address | The user to give allowance to |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the current allowance of toUser |

### _decreaseBorrowAllowance

```solidity
function _decreaseBorrowAllowance(address delegator, address delegatee, uint256 amount) internal
```

## EmergencyTokenRecoveryUpgradeable

Add Emergency Recovery Logic to contract implementation

### EmergencyEtherTransfer

```solidity
event EmergencyEtherTransfer(address to, uint256 amount)
```

### __EmergencyTokenRecovery_init

```solidity
function __EmergencyTokenRecovery_init() internal
```

### emergencyERC20Transfer

```solidity
function emergencyERC20Transfer(address token, address to, uint256 amount) external
```

_transfer ERC20 from the utility contract, for ERC20 recovery in case of stuck tokens due
direct transfers to the contract address._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | token to transfer |
| to | address | recipient of the transfer |
| amount | uint256 | amount to send |

### emergencyERC721Transfer

```solidity
function emergencyERC721Transfer(address token, address to, uint256 id) external
```

_transfer ERC721 from the utility contract, for ERC721 recovery in case of stuck tokens due
direct transfers to the contract address._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | token to transfer |
| to | address | recipient of the transfer |
| id | uint256 | token id to send |

### emergencyPunksTransfer

```solidity
function emergencyPunksTransfer(address punks, address to, uint256 index) external
```

_transfer CryptoPunks from the utility contract, for punks recovery in case of stuck punks
due direct transfers to the contract address._

| Name | Type | Description |
| ---- | ---- | ----------- |
| punks | address |  |
| to | address | recipient of the transfer |
| index | uint256 | punk index to send |

### emergencyEtherTransfer

```solidity
function emergencyEtherTransfer(address to, uint256 amount) external
```

_transfer native Ether from the utility contract, for native Ether recovery in case of stuck Ether
due selfdestructs or transfer ether to pre-computated contract address before deployment._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | recipient of the transfer |
| amount | uint256 | amount to send |

### __gap

```solidity
uint256[50] __gap
```

## IncentivizedERC20

Add Incentivized Logic to ERC20 implementation

### _customDecimals

```solidity
uint8 _customDecimals
```

### __IncentivizedERC20_init

```solidity
function __IncentivizedERC20_init(string name_, string symbol_, uint8 decimals_) internal
```

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the decimals of the token._

### _getIncentivesController

```solidity
function _getIncentivesController() internal view virtual returns (contract IIncentivesController)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IIncentivesController | Abstract function implemented by the child bToken/debtToken. Done this way in order to not break compatibility with previous versions of bTokens/debtTokens |

### _getUnderlyingAssetAddress

```solidity
function _getUnderlyingAssetAddress() internal view virtual returns (address)
```

### _transfer

```solidity
function _transfer(address sender, address recipient, uint256 amount) internal virtual
```

_Moves `amount` of tokens from `sender` to `recipient`.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens._

### __gap

```solidity
uint256[45] __gap
```

## InterestRate

Implements the calculation of the interest rates depending on the reserve state

_The model of interest rate is based on 2 slopes, one before the `OPTIMAL_UTILIZATION_RATE`
point of utilization and another from that one to 100%_

### addressesProvider

```solidity
contract ILendPoolAddressesProvider addressesProvider
```

### OPTIMAL_UTILIZATION_RATE

```solidity
uint256 OPTIMAL_UTILIZATION_RATE
```

_this constant represents the utilization rate at which the pool aims to obtain most competitive borrow rates.
Expressed in ray_

### EXCESS_UTILIZATION_RATE

```solidity
uint256 EXCESS_UTILIZATION_RATE
```

_This constant represents the excess utilization rate above the optimal. It's always equal to
1-optimal utilization rate. Added as a constant here for gas optimizations.
Expressed in ray_

### _baseVariableBorrowRate

```solidity
uint256 _baseVariableBorrowRate
```

### _variableRateSlope1

```solidity
uint256 _variableRateSlope1
```

### _variableRateSlope2

```solidity
uint256 _variableRateSlope2
```

### constructor

```solidity
constructor(contract ILendPoolAddressesProvider provider, uint256 optimalUtilizationRate_, uint256 baseVariableBorrowRate_, uint256 variableRateSlope1_, uint256 variableRateSlope2_) public
```

### variableRateSlope1

```solidity
function variableRateSlope1() external view returns (uint256)
```

### variableRateSlope2

```solidity
function variableRateSlope2() external view returns (uint256)
```

### baseVariableBorrowRate

```solidity
function baseVariableBorrowRate() external view returns (uint256)
```

### getMaxVariableBorrowRate

```solidity
function getMaxVariableBorrowRate() external view returns (uint256)
```

### calculateInterestRates

```solidity
function calculateInterestRates(address reserve, address bToken, uint256 liquidityAdded, uint256 liquidityTaken, uint256 totalVariableDebt, uint256 reserveFactor) external view returns (uint256, uint256)
```

_Calculates the interest rates depending on the reserve's state and configurations_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the reserve |
| bToken | address |  |
| liquidityAdded | uint256 | The liquidity added during the operation |
| liquidityTaken | uint256 | The liquidity taken during the operation |
| totalVariableDebt | uint256 | The total borrowed from the reserve at a variable rate |
| reserveFactor | uint256 | The reserve portion of the interest that goes to the treasury of the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The liquidity rate, the stable borrow rate and the variable borrow rate |
| [1] | uint256 |  |

### CalcInterestRatesLocalVars

```solidity
struct CalcInterestRatesLocalVars {
  uint256 totalDebt;
  uint256 currentVariableBorrowRate;
  uint256 currentLiquidityRate;
  uint256 utilizationRate;
}
```

### calculateInterestRates

```solidity
function calculateInterestRates(address reserve, uint256 availableLiquidity, uint256 totalVariableDebt, uint256 reserveFactor) public view returns (uint256, uint256)
```

_Calculates the interest rates depending on the reserve's state and configurations.
NOTE This function is kept for compatibility with the previous DefaultInterestRateStrategy interface.
New protocol implementation uses the new calculateInterestRates() interface_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the reserve |
| availableLiquidity | uint256 | The liquidity available in the corresponding bToken |
| totalVariableDebt | uint256 | The total borrowed from the reserve at a variable rate |
| reserveFactor | uint256 | The reserve portion of the interest that goes to the treasury of the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The liquidity rate and the variable borrow rate |
| [1] | uint256 |  |

### _getOverallBorrowRate

```solidity
function _getOverallBorrowRate(uint256 totalVariableDebt, uint256 currentVariableBorrowRate) internal pure returns (uint256)
```

_Calculates the overall borrow rate as the weighted average between the total variable debt and total stable debt_

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalVariableDebt | uint256 | The total borrowed from the reserve at a variable rate |
| currentVariableBorrowRate | uint256 | The current variable borrow rate of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The weighted averaged borrow rate |

## LendPool

_Main point of interaction with an Unlockd protocol's market
- Users can:
  # Deposit
  # Withdraw
  # Borrow
  # Repay
  # Auction
  # Liquidate
- To be covered by a proxy contract, owned by the LendPoolAddressesProvider of the specific market
- All admin functions are callable by the LendPoolConfigurator contract defined also in the
  LendPoolAddressesProvider_

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### whenNotPaused

```solidity
modifier whenNotPaused()
```

### onlyLendPoolConfigurator

```solidity
modifier onlyLendPoolConfigurator()
```

### _whenNotPaused

```solidity
function _whenNotPaused() internal view
```

### _onlyLendPoolConfigurator

```solidity
function _onlyLendPoolConfigurator() internal view
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) public
```

_Function is invoked by the proxy contract when the LendPool contract is added to the
LendPoolAddressesProvider of the market.
- Caching the address of the LendPoolAddressesProvider in order to reduce gas consumption
  on subsequent operations_

| Name | Type | Description |
| ---- | ---- | ----------- |
| provider | contract ILendPoolAddressesProvider | The address of the LendPoolAddressesProvider |

### deposit

```solidity
function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external
```

_Deposits an `amount` of underlying asset into the reserve, receiving in return overlying uTokens.
- E.g. User deposits 100 USDC and gets in return 100 bUSDC_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset to deposit |
| amount | uint256 | The amount to be deposited |
| onBehalfOf | address | The address that will receive the uTokens, same as msg.sender if the user   wants to receive them on his own wallet, or a different address if the beneficiary of uTokens   is a different wallet |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### withdraw

```solidity
function withdraw(address asset, uint256 amount, address to) external returns (uint256)
```

_Withdraws an `amount` of underlying asset from the reserve, burning the equivalent uTokens owned
E.g. User has 100 bUSDC, calls withdraw() and receives 100 USDC, burning the 100 bUSDC_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset to withdraw |
| amount | uint256 | The underlying amount to be withdrawn   - Send the value type(uint256).max in order to withdraw the whole uToken balance |
| to | address | Address that will receive the underlying, same as msg.sender if the user   wants to receive it on his own wallet, or a different address if the beneficiary is a   different wallet |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount withdrawn |

### borrow

```solidity
function borrow(address asset, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset
- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| nftAsset | address | The address of the underlying nft used as collateral |
| nftTokenId | uint256 | The token ID of the underlying nft used as collateral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### batchBorrow

```solidity
function batchBorrow(address[] assets, uint256[] amounts, address[] nftAssets, uint256[] nftTokenIds, address onBehalfOf, uint16 referralCode) external
```

### repay

```solidity
function repay(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific reserve, burning the equivalent loan owned
- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | The amount to repay |

### batchRepay

```solidity
function batchRepay(address[] nftAssets, uint256[] nftTokenIds, uint256[] amounts) external returns (uint256[], bool[])
```

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId, uint256 bidPrice, address onBehalfOf) external
```

_Function to auction a non-healthy position collateral-wise
- The bidder want to buy collateral asset of the user getting liquidated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| bidPrice | uint256 | The bid price of the bidder want to buy underlying NFT |
| onBehalfOf | address | Address of the user who will get the underlying NFT, same as msg.sender if the user   wants to receive them on his own wallet, or a different address if the beneficiary of NFT   is a different wallet |

### redeem

```solidity
function redeem(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 bidFine) external returns (uint256)
```

Redeem a NFT loan which state is in Auction
- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidate

```solidity
function liquidate(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256)
```

_Function to liquidate a non-healthy position collateral-wise
- The caller (liquidator) buy collateral asset of the user getting liquidated, and receives
  the collateral asset_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 |  |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```

_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`._

### getReserveConfiguration

```solidity
function getReserveConfiguration(address asset) external view returns (struct DataTypes.ReserveConfigurationMap)
```

_Returns the configuration of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.ReserveConfigurationMap | The configuration of the reserve |

### getNftConfiguration

```solidity
function getNftConfiguration(address asset) external view returns (struct DataTypes.NftConfigurationMap)
```

_Returns the configuration of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the asset of the NFT |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.NftConfigurationMap | The configuration of the NFT |

### getReserveNormalizedIncome

```solidity
function getReserveNormalizedIncome(address asset) external view returns (uint256)
```

_Returns the normalized income normalized income of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve's normalized income |

### getReserveNormalizedVariableDebt

```solidity
function getReserveNormalizedVariableDebt(address asset) external view returns (uint256)
```

_Returns the normalized variable debt per unit of asset_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve normalized variable debt |

### getReserveData

```solidity
function getReserveData(address asset) external view returns (struct DataTypes.ReserveData)
```

_Returns the state and configuration of the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.ReserveData | The state of the reserve |

### getNftData

```solidity
function getNftData(address asset) external view returns (struct DataTypes.NftData)
```

_Returns the state and configuration of the nft_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the nft |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.NftData | The state of the nft |

### getNftCollateralData

```solidity
function getNftCollateralData(address nftAsset, uint256 nftTokenId, address reserveAsset) external view returns (uint256 totalCollateralInETH, uint256 totalCollateralInReserve, uint256 availableBorrowsInETH, uint256 availableBorrowsInReserve, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)
```

_Returns the loan data of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the NFT |
| nftTokenId | uint256 |  |
| reserveAsset | address | The address of the Reserve |

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalCollateralInETH | uint256 | the total collateral in ETH of the NFT |
| totalCollateralInReserve | uint256 | the total collateral in Reserve of the NFT |
| availableBorrowsInETH | uint256 | the borrowing power in ETH of the NFT |
| availableBorrowsInReserve | uint256 | the borrowing power in Reserve of the NFT |
| ltv | uint256 | the loan to value of the user |
| liquidationThreshold | uint256 | the liquidation threshold of the NFT |
| liquidationBonus | uint256 | the liquidation bonus of the NFT |

### getNftDebtData

```solidity
function getNftDebtData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, address reserveAsset, uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 healthFactor)
```

_Returns the debt data of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the NFT |
| nftTokenId | uint256 | The token id of the NFT |

| Name | Type | Description |
| ---- | ---- | ----------- |
| loanId | uint256 | the loan id of the NFT |
| reserveAsset | address | the address of the Reserve |
| totalCollateral | uint256 | the total power of the NFT |
| totalDebt | uint256 | the total debt of the NFT |
| availableBorrows | uint256 | the borrowing power left of the NFT |
| healthFactor | uint256 | the current health factor of the NFT |

### getNftAuctionData

```solidity
function getNftAuctionData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, address bidderAddress, uint256 bidPrice, uint256 bidBorrowAmount, uint256 bidFine)
```

_Returns the auction data of the NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the NFT |
| nftTokenId | uint256 | The token id of the NFT |

| Name | Type | Description |
| ---- | ---- | ----------- |
| loanId | uint256 | the loan id of the NFT |
| bidderAddress | address | the highest bidder address of the loan |
| bidPrice | uint256 | the highest bid price in Reserve of the loan |
| bidBorrowAmount | uint256 | the borrow amount in Reserve of the loan |
| bidFine | uint256 | the penalty fine of the loan |

### GetLiquidationPriceLocalVars

```solidity
struct GetLiquidationPriceLocalVars {
  address poolLoan;
  uint256 loanId;
  uint256 thresholdPrice;
  uint256 liquidatePrice;
  uint256 paybackAmount;
  uint256 remainAmount;
}
```

### getNftLiquidatePrice

```solidity
function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId) external view returns (uint256 liquidatePrice, uint256 paybackAmount)
```

### finalizeTransfer

```solidity
function finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromBefore, uint256 balanceToBefore) external view
```

_Validates and finalizes an uToken transfer
- Only callable by the overlying uToken of the `asset`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the uToken |
| from | address | The user from which the uToken are transferred |
| to | address | The user receiving the uTokens |
| amount | uint256 | The amount being transferred/withdrawn |
| balanceFromBefore | uint256 | The uToken balance of the `from` user before the transfer |
| balanceToBefore | uint256 | The uToken balance of the `to` user before the transfer |

### getReservesList

```solidity
function getReservesList() external view returns (address[])
```

_Returns the list of the initialized reserves_

### getNftsList

```solidity
function getNftsList() external view returns (address[])
```

_Returns the list of the initialized nfts_

### setPause

```solidity
function setPause(bool val) external
```

_Set the _pause state of the pool
- Only callable by the LendPoolConfigurator contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| val | bool | `true` to pause the pool, `false` to un-pause it |

### paused

```solidity
function paused() external view returns (bool)
```

_Returns if the LendPool is paused_

### getAddressesProvider

```solidity
function getAddressesProvider() external view returns (contract ILendPoolAddressesProvider)
```

_Returns the cached LendPoolAddressesProvider connected to this contract_

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 val) external
```

### getMaxNumberOfReserves

```solidity
function getMaxNumberOfReserves() public view returns (uint256)
```

_Returns the maximum number of reserves supported to be listed in this LendPool_

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 val) external
```

### getMaxNumberOfNfts

```solidity
function getMaxNumberOfNfts() public view returns (uint256)
```

_Returns the maximum number of nfts supported to be listed in this LendPool_

### initReserve

```solidity
function initReserve(address asset, address uTokenAddress, address debtTokenAddress, address interestRateAddress) external
```

_Initializes a reserve, activating it, assigning an uToken and nft loan and an
interest rate strategy
- Only callable by the LendPoolConfigurator contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| uTokenAddress | address | The address of the uToken that will be assigned to the reserve |
| debtTokenAddress | address | The address of the debtToken that will be assigned to the reserve |
| interestRateAddress | address | The address of the interest rate strategy contract |

### initNft

```solidity
function initNft(address asset, address uNftAddress) external
```

_Initializes a nft, activating it, assigning nft loan and an
interest rate strategy
- Only callable by the LendPoolConfigurator contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the nft |
| uNftAddress | address |  |

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address asset, address rateAddress) external
```

_Updates the address of the interest rate strategy contract
- Only callable by the LendPoolConfigurator contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| rateAddress | address | The address of the interest rate strategy contract |

### setReserveConfiguration

```solidity
function setReserveConfiguration(address asset, uint256 configuration) external
```

_Sets the configuration bitmap of the reserve as a whole
- Only callable by the LendPoolConfigurator contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |
| configuration | uint256 | The new configuration bitmap |

### setNftConfiguration

```solidity
function setNftConfiguration(address asset, uint256 configuration) external
```

_Sets the configuration bitmap of the NFT as a whole
- Only callable by the LendPoolConfigurator contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the asset of the NFT |
| configuration | uint256 | The new configuration bitmap |

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address asset, uint256 maxSupply, uint256 maxTokenId) external
```

### _addReserveToList

```solidity
function _addReserveToList(address asset) internal
```

### _addNftToList

```solidity
function _addNftToList(address asset) internal
```

### _verifyCallResult

```solidity
function _verifyCallResult(bool success, bytes returndata, string errorMessage) internal pure returns (bytes)
```

## LendPoolAddressesProvider

_Main registry of addresses part of or connected to the protocol, including permissioned roles
- Acting also as factory of proxies and admin of those, so with right to change its implementations
- Owned by the Unlockd Governance_

### _marketId

```solidity
string _marketId
```

### _addresses

```solidity
mapping(bytes32 => address) _addresses
```

### LEND_POOL

```solidity
bytes32 LEND_POOL
```

### LEND_POOL_CONFIGURATOR

```solidity
bytes32 LEND_POOL_CONFIGURATOR
```

### POOL_ADMIN

```solidity
bytes32 POOL_ADMIN
```

### EMERGENCY_ADMIN

```solidity
bytes32 EMERGENCY_ADMIN
```

### RESERVE_ORACLE

```solidity
bytes32 RESERVE_ORACLE
```

### NFT_ORACLE

```solidity
bytes32 NFT_ORACLE
```

### UNLOCKD_ORACLE

```solidity
bytes32 UNLOCKD_ORACLE
```

### LEND_POOL_LOAN

```solidity
bytes32 LEND_POOL_LOAN
```

### UNFT_REGISTRY

```solidity
bytes32 UNFT_REGISTRY
```

### LEND_POOL_LIQUIDATOR

```solidity
bytes32 LEND_POOL_LIQUIDATOR
```

### INCENTIVES_CONTROLLER

```solidity
bytes32 INCENTIVES_CONTROLLER
```

### UNLOCKD_DATA_PROVIDER

```solidity
bytes32 UNLOCKD_DATA_PROVIDER
```

### UI_DATA_PROVIDER

```solidity
bytes32 UI_DATA_PROVIDER
```

### WALLET_BALANCE_PROVIDER

```solidity
bytes32 WALLET_BALANCE_PROVIDER
```

### constructor

```solidity
constructor(string marketId) public
```

### getMarketId

```solidity
function getMarketId() external view returns (string)
```

_Returns the id of the Unlockd market to which this contracts points to_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The market id |

### setMarketId

```solidity
function setMarketId(string marketId) external
```

_Allows to set the market which this LendPoolAddressesProvider represents_

| Name | Type | Description |
| ---- | ---- | ----------- |
| marketId | string | The market id |

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address implementationAddress, bytes encodedCallData) external
```

_General function to update the implementation of a proxy registered with
certain `id`. If there is no proxy registered, it will instantiate one and
set as implementation the `implementationAddress`
IMPORTANT Use this function carefully, only for ids that don't have an explicit
setter function, in order to avoid unexpected consequences_

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | The id |
| implementationAddress | address | The address of the new implementation |
| encodedCallData | bytes |  |

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external
```

_Sets an address for an id replacing the address saved in the addresses map
IMPORTANT Use this function carefully, as it will do a hard replacement_

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | The id |
| newAddress | address | The address to set |

### getAddress

```solidity
function getAddress(bytes32 id) public view returns (address)
```

_Returns an address by id_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address |

### getLendPool

```solidity
function getLendPool() external view returns (address)
```

_Returns the address of the LendPool proxy_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The LendPool proxy address |

### setLendPoolImpl

```solidity
function setLendPoolImpl(address pool, bytes encodedCallData) external
```

_Updates the implementation of the LendPool, or creates the proxy
setting the new `pool` implementation on the first time calling it_

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The new LendPool implementation |
| encodedCallData | bytes |  |

### getLendPoolConfigurator

```solidity
function getLendPoolConfigurator() external view returns (address)
```

_Returns the address of the LendPoolConfigurator proxy_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The LendPoolConfigurator proxy address |

### setLendPoolConfiguratorImpl

```solidity
function setLendPoolConfiguratorImpl(address configurator, bytes encodedCallData) external
```

_Updates the implementation of the LendPoolConfigurator, or creates the proxy
setting the new `configurator` implementation on the first time calling it_

| Name | Type | Description |
| ---- | ---- | ----------- |
| configurator | address | The new LendPoolConfigurator implementation |
| encodedCallData | bytes |  |

### getPoolAdmin

```solidity
function getPoolAdmin() external view returns (address)
```

_The functions below are getters/setters of addresses that are outside the context
of the protocol hence the upgradable proxy pattern is not used_

### setPoolAdmin

```solidity
function setPoolAdmin(address admin) external
```

### getEmergencyAdmin

```solidity
function getEmergencyAdmin() external view returns (address)
```

### setEmergencyAdmin

```solidity
function setEmergencyAdmin(address emergencyAdmin) external
```

### getReserveOracle

```solidity
function getReserveOracle() external view returns (address)
```

### setReserveOracle

```solidity
function setReserveOracle(address reserveOracle) external
```

### getNFTOracle

```solidity
function getNFTOracle() external view returns (address)
```

### setNFTOracle

```solidity
function setNFTOracle(address nftOracle) external
```

### getLendPoolLoan

```solidity
function getLendPoolLoan() external view returns (address)
```

### setLendPoolLoanImpl

```solidity
function setLendPoolLoanImpl(address loanAddress, bytes encodedCallData) external
```

### getUNFTRegistry

```solidity
function getUNFTRegistry() external view returns (address)
```

### setUNFTRegistry

```solidity
function setUNFTRegistry(address factory) external
```

### getIncentivesController

```solidity
function getIncentivesController() external view returns (address)
```

### setIncentivesController

```solidity
function setIncentivesController(address controller) external
```

### getUIDataProvider

```solidity
function getUIDataProvider() external view returns (address)
```

### setUIDataProvider

```solidity
function setUIDataProvider(address provider) external
```

### getUnlockdDataProvider

```solidity
function getUnlockdDataProvider() external view returns (address)
```

### setUnlockdDataProvider

```solidity
function setUnlockdDataProvider(address provider) external
```

### getWalletBalanceProvider

```solidity
function getWalletBalanceProvider() external view returns (address)
```

### setWalletBalanceProvider

```solidity
function setWalletBalanceProvider(address provider) external
```

### getImplementation

```solidity
function getImplementation(address proxyAddress) external view returns (address)
```

### _updateImpl

```solidity
function _updateImpl(bytes32 id, address newAddress) internal
```

_Internal function to update the implementation of a specific proxied component of the protocol
- If there is no proxy registered in the given `id`, it creates the proxy setting `newAdress`
  as implementation and calls the initialize() function on the proxy
- If there is already a proxy registered, it just updates the implementation to `newAddress` and
  calls the encoded method function via upgradeToAndCall() in the proxy_

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | The id of the proxy to be updated |
| newAddress | address | The address of the new implementation |

### _setMarketId

```solidity
function _setMarketId(string marketId) internal
```

## LendPoolAddressesProviderRegistry

_Main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets
- Used for indexing purposes of Unlockd protocol's markets
- The id assigned to a LendPoolAddressesProvider refers to the market it is connected with,
  for example with `1` for the Unlockd main market and `2` for the next created_

### _addressesProviders

```solidity
mapping(address => uint256) _addressesProviders
```

### _addressesProvidersList

```solidity
address[] _addressesProvidersList
```

### getAddressesProvidersList

```solidity
function getAddressesProvidersList() external view returns (address[])
```

_Returns the list of registered addresses provider_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | The list of addresses provider, potentially containing address(0) elements |

### registerAddressesProvider

```solidity
function registerAddressesProvider(address provider, uint256 id) external
```

_Registers an addresses provider_

| Name | Type | Description |
| ---- | ---- | ----------- |
| provider | address | The address of the new LendPoolAddressesProvider |
| id | uint256 | The id for the new LendPoolAddressesProvider, referring to the market it belongs to |

### unregisterAddressesProvider

```solidity
function unregisterAddressesProvider(address provider) external
```

_Removes a LendPoolAddressesProvider from the list of registered addresses provider_

| Name | Type | Description |
| ---- | ---- | ----------- |
| provider | address | The LendPoolAddressesProvider address |

### getAddressesProviderIdByAddress

```solidity
function getAddressesProviderIdByAddress(address addressesProvider) external view returns (uint256)
```

_Returns the id on a registered LendPoolAddressesProvider_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The id or 0 if the LendPoolAddressesProvider is not registered |

### _addToAddressesProvidersList

```solidity
function _addToAddressesProvidersList(address provider) internal
```

## LendPoolConfigurator

_Implements the configuration methods for the Unlockd protocol_

### _addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### onlyPoolAdmin

```solidity
modifier onlyPoolAdmin()
```

### onlyEmergencyAdmin

```solidity
modifier onlyEmergencyAdmin()
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) public
```

### batchInitReserve

```solidity
function batchInitReserve(struct ConfigTypes.InitReserveInput[] input) external
```

_Initializes reserves in batch_

| Name | Type | Description |
| ---- | ---- | ----------- |
| input | struct ConfigTypes.InitReserveInput[] | the input array with data to initialize each reserve |

### batchInitNft

```solidity
function batchInitNft(struct ConfigTypes.InitNftInput[] input) external
```

_Initializes NFTs in batch_

| Name | Type | Description |
| ---- | ---- | ----------- |
| input | struct ConfigTypes.InitNftInput[] | the input array with data to initialize each NFT |

### updateBToken

```solidity
function updateBToken(struct ConfigTypes.UpdateBTokenInput[] inputs) external
```

_Updates the uToken implementation for the reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| inputs | struct ConfigTypes.UpdateBTokenInput[] | the inputs array with data to update each UToken |

### updateDebtToken

```solidity
function updateDebtToken(struct ConfigTypes.UpdateDebtTokenInput[] inputs) external
```

_Updates the debt token implementation for the asset_

### setBorrowingFlagOnReserve

```solidity
function setBorrowingFlagOnReserve(address[] assets, bool flag) external
```

_Enables or disables borrowing on each reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | the assets to update the flag to |
| flag | bool | the flag to set to the each reserve |

### setActiveFlagOnReserve

```solidity
function setActiveFlagOnReserve(address[] assets, bool flag) external
```

_Activates or deactivates each reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | the assets to update the flag to |
| flag | bool | the flag to set to the each reserve |

### setFreezeFlagOnReserve

```solidity
function setFreezeFlagOnReserve(address[] assets, bool flag) external
```

_Freezes or unfreezes each reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | the assets to update the flag to |
| flag | bool | the flag to set to the each reserve |

### setReserveFactor

```solidity
function setReserveFactor(address[] assets, uint256 reserveFactor) external
```

_Updates the reserve factor of a reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The address of the underlying asset of the reserve |
| reserveFactor | uint256 | The new reserve factor of the reserve |

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address[] assets, address rateAddress) external
```

_Sets the interest rate strategy of a reserve_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The addresses of the underlying asset of the reserve |
| rateAddress | address | The new address of the interest strategy contract |

### batchConfigReserve

```solidity
function batchConfigReserve(struct ILendPoolConfigurator.ConfigReserveInput[] inputs) external
```

_Configures reserves in batch_

| Name | Type | Description |
| ---- | ---- | ----------- |
| inputs | struct ILendPoolConfigurator.ConfigReserveInput[] | the input array with data to configure each reserve |

### setActiveFlagOnNft

```solidity
function setActiveFlagOnNft(address[] assets, bool flag) external
```

_Activates or deactivates each NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | the NFTs to update the flag to |
| flag | bool | the flag to set to the each NFT |

### setFreezeFlagOnNft

```solidity
function setFreezeFlagOnNft(address[] assets, bool flag) external
```

_Freezes or unfreezes each NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | the assets to update the flag to |
| flag | bool | the flag to set to the each NFT |

### configureNftAsCollateral

```solidity
function configureNftAsCollateral(address[] assets, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus) external
```

_Configures the NFT collateralization parameters
all the values are expressed in percentages with two decimals of precision. A valid value is 10000, which means 100.00%_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The address of the underlying asset of the reserve |
| ltv | uint256 | The loan to value of the asset when used as NFT |
| liquidationThreshold | uint256 | The threshold at which loans using this asset as collateral will be considered undercollateralized |
| liquidationBonus | uint256 | The bonus liquidators receive to liquidate this asset. The values is always below 100%. A value of 5% means the liquidator will receive a 5% bonus |

### configureNftAsAuction

```solidity
function configureNftAsAuction(address[] assets, uint256 redeemDuration, uint256 auctionDuration, uint256 redeemFine) external
```

_Configures the NFT auction parameters_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The address of the underlying NFT asset |
| redeemDuration | uint256 | The max duration for the redeem |
| auctionDuration | uint256 | The auction duration |
| redeemFine | uint256 | The fine for the redeem |

### setNftRedeemThreshold

```solidity
function setNftRedeemThreshold(address[] assets, uint256 redeemThreshold) external
```

_Configures the redeem threshold_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The address of the underlying NFT asset |
| redeemThreshold | uint256 | The threshold for the redeem |

### setNftMinBidFine

```solidity
function setNftMinBidFine(address[] assets, uint256 minBidFine) external
```

_Configures the minimum fine for the underlying assets_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The address of the underlying NFT asset |
| minBidFine | uint256 | The minimum bid fine value |

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address[] assets, uint256 maxSupply, uint256 maxTokenId) external
```

_Configures the maximum supply and token Id for the underlying NFT assets_

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The address of the underlying NFT assets |
| maxSupply | uint256 | The max supply value |
| maxTokenId | uint256 | The max token Id value |

### batchConfigNft

```solidity
function batchConfigNft(struct ILendPoolConfigurator.ConfigNftInput[] inputs) external
```

_Configures NFTs in batch_

| Name | Type | Description |
| ---- | ---- | ----------- |
| inputs | struct ILendPoolConfigurator.ConfigNftInput[] | the input array with data to configure each NFT asset |

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 newVal) external
```

_sets the max amount of reserves_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newVal | uint256 | the new value to set as the max reserves |

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 newVal) external
```

_sets the max amount of NFTs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newVal | uint256 | the new value to set as the max NFTs |

### setPoolPause

```solidity
function setPoolPause(bool val) external
```

_pauses or unpauses all the actions of the protocol, including bToken transfers_

| Name | Type | Description |
| ---- | ---- | ----------- |
| val | bool | true if protocol needs to be paused, false otherwise |

### getTokenImplementation

```solidity
function getTokenImplementation(address proxyAddress) external view returns (address)
```

_Returns the token implementation contract address_

| Name | Type | Description |
| ---- | ---- | ----------- |
| proxyAddress | address | The address of the proxy contract |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the token implementation contract |

### _checkReserveNoLiquidity

```solidity
function _checkReserveNoLiquidity(address asset) internal view
```

### _checkNftNoLiquidity

```solidity
function _checkNftNoLiquidity(address asset) internal view
```

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### _getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

### _getUNFTRegistry

```solidity
function _getUNFTRegistry() internal view returns (contract IUNFTRegistry)
```

## LendPoolLoan

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| onBehalfOf | address | The address receiving the loan |
| nftAsset | address |  |
| nftTokenId | uint256 |  |
| uNftAddress | address |  |
| reserveAsset | address |  |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### updateLoan

```solidity
function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external
```

_Update the given loan with some params

Requirements:
 - The caller must be a holder of the loan
 - The loan must be in state Active_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| loanId | uint256 |  |
| amountAdded | uint256 |  |
| amountTaken | uint256 |  |
| borrowIndex | uint256 |  |

### repayLoan

```solidity
function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external
```

_Repay the given loan

Requirements:
 - The caller must be a holder of the loan
 - The caller must send in principal + interest
 - The loan must be in state Active_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the repay |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address | The address of uNFT |
| amount | uint256 |  |
| borrowIndex | uint256 |  |

### auctionLoan

```solidity
function auctionLoan(address initiator, uint256 loanId, address onBehalfOf, uint256 bidPrice, uint256 borrowAmount, uint256 borrowIndex) external
```

_Auction the given loan

Requirements:
 - The price must be greater than current highest price
 - The loan must be in state Active or Auction_

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the borrow |
| loanId | uint256 |  |
| amountTaken | uint256 |  |
| borrowIndex | uint256 |  |

### liquidateLoan

```solidity
function liquidateLoan(address initiator, uint256 loanId, address uNftAddress, uint256 borrowAmount, uint256 borrowIndex) external
```

_Liquidate the given loan

Requirements:
 - The caller must send in principal + interest
 - The loan must be in state Active_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address of the user initiating the auction |
| loanId | uint256 | The loan getting burned |
| uNftAddress | address | The address of uNFT |
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

### getCollateralLoanId

```solidity
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)
```

### getLoan

```solidity
function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)
```

### getLoanCollateralAndReserve

```solidity
function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)
```

### getLoanReserveBorrowAmount

```solidity
function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)
```

### getLoanReserveBorrowScaledAmount

```solidity
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)
```

### getLoanHighestBid

```solidity
function getLoanHighestBid(uint256 loanId) external view returns (address, uint256)
```

### getNftCollateralAmount

```solidity
function getNftCollateralAmount(address nftAsset) external view returns (uint256)
```

### getUserNftCollateralAmount

```solidity
function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)
```

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

## LendPoolStorage

### _addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### _reserves

```solidity
mapping(address => struct DataTypes.ReserveData) _reserves
```

### _nfts

```solidity
mapping(address => struct DataTypes.NftData) _nfts
```

### _reservesList

```solidity
mapping(uint256 => address) _reservesList
```

### _reservesCount

```solidity
uint256 _reservesCount
```

### _nftsList

```solidity
mapping(uint256 => address) _nftsList
```

### _nftsCount

```solidity
uint256 _nftsCount
```

### _paused

```solidity
bool _paused
```

### _maxNumberOfReserves

```solidity
uint256 _maxNumberOfReserves
```

### _maxNumberOfNfts

```solidity
uint256 _maxNumberOfNfts
```

## LendPoolStorageExt

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

### __gap

```solidity
uint256[49] __gap
```

## NFTOracle

### CollectionAdded

```solidity
event CollectionAdded(address collection)
```

The whenNotPaused modifier is not being used!
INFTOracle.sol is not being used, it is redundant and it hasn't an implementation

_When calling getPrice() of a non-minted tokenId it returns '0', shouldn't this revert with an error?_

### CollectionRemoved

```solidity
event CollectionRemoved(address collection)
```

### NFTPriceAdded

```solidity
event NFTPriceAdded(address _collection, uint256 _tokenId, uint256 _price)
```

### FeedAdminUpdated

```solidity
event FeedAdminUpdated(address admin)
```

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

### collectionTokenIds

```solidity
mapping(address => uint256[]) collectionTokenIds
```

### priceFeedAdmin

```solidity
address priceFeedAdmin
```

### collectionPaused

```solidity
mapping(address => bool) collectionPaused
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyExistingCollection

```solidity
modifier onlyExistingCollection(address _collection)
```

### onlyExistingCollections

```solidity
modifier onlyExistingCollections(address[] _collections)
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
function initialize(address _admin) public
```

### _whenNotPaused

```solidity
function _whenNotPaused(address _contract) internal view
```

### setPriceFeedAdmin

```solidity
function setPriceFeedAdmin(address _admin) external
```

### setCollections

```solidity
function setCollections(address[] _collections) external
```

### addCollection

```solidity
function addCollection(address _collection) external
```

### _addCollection

```solidity
function _addCollection(address _collection) internal
```

### removeCollection

```solidity
function removeCollection(address _collection) external
```

### _removeCollection

```solidity
function _removeCollection(address _collection) internal
```

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

### _setNFTPrice

```solidity
function _setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) internal
```

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

### setPause

```solidity
function setPause(address _collection, bool paused) external
```

## PunkGateway

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

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### _getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

### authorizeLendPoolERC20

```solidity
function authorizeLendPoolERC20(address[] tokens) external
```

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

### _checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

### _depositPunk

```solidity
function _depositPunk(uint256 punkIndex) internal
```

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserveAsset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### batchBorrow

```solidity
function batchBorrow(address[] reserveAssets, uint256[] amounts, uint256[] punkIndexs, address onBehalfOf, uint16 referralCode) external
```

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### batchRepay

```solidity
function batchRepay(uint256[] punkIndexs, uint256[] amounts) external returns (uint256[], bool[])
```

### _repay

```solidity
function _repay(uint256 punkIndex, uint256 amount) internal returns (uint256, bool)
```

### auction

```solidity
function auction(uint256 punkIndex, uint256 bidPrice, address onBehalfOf) external
```

auction a unhealth punk loan with ERC20 reserve

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 | The amount to repay the debt |
| bidFine | uint256 | The amount of bid fine |

### liquidate

```solidity
function liquidate(uint256 punkIndex, uint256 amount) external returns (uint256)
```

liquidate a unhealth punk loan with ERC20 reserve

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collteral |
| amount | uint256 |  |

### borrowETH

```solidity
function borrowETH(uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral
- E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
  and lock collateral asset in contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount to be borrowed |
| punkIndex | uint256 | The index of the CryptoPunk to deposit |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### batchBorrowETH

```solidity
function batchBorrowETH(uint256[] amounts, uint256[] punkIndexs, address onBehalfOf, uint16 referralCode) external
```

### repayETH

```solidity
function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH
- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid, loan is burned or not |
| [1] | bool |  |

### batchRepayETH

```solidity
function batchRepayETH(uint256[] punkIndexs, uint256[] amounts) external payable returns (uint256[], bool[])
```

### _repayETH

```solidity
function _repayETH(uint256 punkIndex, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

### auctionETH

```solidity
function auctionETH(uint256 punkIndex, address onBehalfOf) external payable
```

auction a unhealth punk loan with native ETH

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| onBehalfOf | address | Address of the user who will receive the CryptoPunk. Should be the address of the user itself calling the function if he wants to get collateral |

### redeemETH

```solidity
function redeemETH(uint256 punkIndex, uint256 amount, uint256 bidFine) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| punkIndex | uint256 | The index of the CryptoPunk to repay |

### _safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

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

## ReserveOracle

### TOKEN_DIGIT

```solidity
uint256 TOKEN_DIGIT
```

### AggregatorAdded

```solidity
event AggregatorAdded(address currencyKey, address aggregator)
```

### AggregatorRemoved

```solidity
event AggregatorRemoved(address currencyKey, address aggregator)
```

### priceFeedMap

```solidity
mapping(address => contract AggregatorV3Interface) priceFeedMap
```

### priceFeedKeys

```solidity
address[] priceFeedKeys
```

### weth

```solidity
address weth
```

### initialize

```solidity
function initialize(address _weth) public
```

### setAggregators

```solidity
function setAggregators(address[] _priceFeedKeys, address[] _aggregators) external
```

### addAggregator

```solidity
function addAggregator(address _priceFeedKey, address _aggregator) external
```

### _addAggregator

```solidity
function _addAggregator(address _priceFeedKey, address _aggregator) internal
```

### removeAggregator

```solidity
function removeAggregator(address _priceFeedKey) external
```

### getAggregator

```solidity
function getAggregator(address _priceFeedKey) public view returns (contract AggregatorV3Interface)
```

### getAssetPrice

```solidity
function getAssetPrice(address _priceFeedKey) external view returns (uint256)
```

### getLatestTimestamp

```solidity
function getLatestTimestamp(address _priceFeedKey) public view returns (uint256)
```

### getTwapPrice

```solidity
function getTwapPrice(address _priceFeedKey, uint256 _interval) external view returns (uint256)
```

### isExistedKey

```solidity
function isExistedKey(address _priceFeedKey) private view returns (bool)
```

### requireNonEmptyAddress

```solidity
function requireNonEmptyAddress(address _addr) internal pure
```

### formatDecimals

```solidity
function formatDecimals(uint256 _price, uint8 _decimals) internal pure returns (uint256)
```

### getPriceFeedLength

```solidity
function getPriceFeedLength() public view returns (uint256 length)
```

## WETHGateway

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| addressProvider | address |  |
| weth | address | Address of the Wrapped Ether contract |

### _getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### _getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

### authorizeLendPoolNFT

```solidity
function authorizeLendPoolNFT(address[] nftAssets) external
```

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

### _checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

### depositETH

```solidity
function depositETH(address onBehalfOf, uint16 referralCode) external payable
```

_deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (bTokens)
is minted._

| Name | Type | Description |
| ---- | ---- | ----------- |
| onBehalfOf | address | address of the user who will receive the bTokens representing the deposit |
| referralCode | uint16 | integrators are assigned a referral code and can potentially receive rewards. |

### withdrawETH

```solidity
function withdrawETH(uint256 amount, address to) external
```

_withdraws the WETH _reserves of msg.sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | amount of bWETH to withdraw and receive native ETH |
| to | address | address of the user who will receive native ETH |

### borrowETH

```solidity
function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount of ETH to borrow |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| onBehalfOf | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16 | integrators are assigned a referral code and can potentially receive rewards |

### batchBorrowETH

```solidity
function batchBorrowETH(uint256[] amounts, address[] nftAssets, uint256[] nftTokenIds, address onBehalfOf, uint16 referralCode) external
```

### repayETH

```solidity
function repayETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |

### batchRepayETH

```solidity
function batchRepayETH(address[] nftAssets, uint256[] nftTokenIds, uint256[] amounts) external payable returns (uint256[], bool[])
```

### _repayETH

```solidity
function _repayETH(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

### auctionETH

```solidity
function auctionETH(address nftAsset, uint256 nftTokenId, address onBehalfOf) external payable
```

_auction a borrow on the WETH reserve_

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftAsset | address | The address of the underlying NFT used as collateral |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### _safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

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

## BlockContext

### __gap

```solidity
uint256[50] __gap
```

### _blockTimestamp

```solidity
function _blockTimestamp() internal view virtual returns (uint256)
```

### _blockNumber

```solidity
function _blockNumber() internal view virtual returns (uint256)
```

## WETH9

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### Approval

```solidity
event Approval(address src, address guy, uint256 wad)
```

### Transfer

```solidity
event Transfer(address src, address dst, uint256 wad)
```

### Deposit

```solidity
event Deposit(address dst, uint256 wad)
```

### Withdrawal

```solidity
event Withdrawal(address src, uint256 wad)
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### allowance

```solidity
mapping(address => mapping(address => uint256)) allowance
```

### receive

```solidity
receive() external payable
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 wad) public
```

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

### approve

```solidity
function approve(address guy, uint256 wad) public returns (bool)
```

### transfer

```solidity
function transfer(address dst, uint256 wad) public returns (bool)
```

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) public returns (bool)
```

## WETH9Mocked

### mint

```solidity
function mint(uint256 value) public returns (bool)
```

## SelfdestructTransfer

### destroyAndTransfer

```solidity
function destroyAndTransfer(address payable to) external payable
```

