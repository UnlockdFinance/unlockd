# debt Tokens

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

#### Parameters

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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The address calling borrow |
| onBehalfOf | address |  |
| amount | uint256 | The amount of debt being minted |
| index | uint256 | The variable debt index of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user is 0 |

### burn

```solidity
function burn(address user, uint256 amount, uint256 index) external
```

_Burns user variable debt
- Only callable by the LendPool_

#### Parameters

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

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The debt balance of the user |

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) public view virtual returns (uint256)
```

_Returns the principal debt balance of the user from_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The debt balance of the user since the last burn/mint action |

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_Returns the total supply of the variable debt token. Represents the total debt accrued by the users_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() public view virtual returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the scaled total supply |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the principal balance of the user and principal total supply._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The principal balance of the user |
| [1] | uint256 | The principal total supply |

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() public view returns (address)
```

_Returns the address of the underlying asset of this uToken_

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

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IIncentivesController | Abstract function implemented by the child uToken/debtToken. Done this way in order to not break compatibility with previous versions of uTokens/debtTokens |

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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address receiving the delegated borrowing power |
| amount | uint256 | the maximum amount being delegated. Delegation will still respect the liquidation constraints (even if delegated, a delegatee cannot force a delegator HF to go below 1) |

### borrowAllowance

```solidity
function borrowAllowance(address fromUser, address toUser) external view returns (uint256)
```

_returns the borrow allowance of the user_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromUser | address | The user to giving allowance |
| toUser | address | The user to give allowance to |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the current allowance of toUser |

### _decreaseBorrowAllowance

```solidity
function _decreaseBorrowAllowance(address delegator, address delegatee, uint256 amount) internal
```

