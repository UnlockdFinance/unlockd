# WETH Gateway

If you need to use native ETH in the protocol, it must first be wrapped into WETH. The WETH Gateway contract is a helper contract to easily wrap and unwrap ETH as necessary when interacting with the protocol, since only ERC20 is used within protocol interactions. This allows users to interact with the LendPool seamlessly without previously wrapping ETH themselves.

The source code of the WETH Gateway can be found on [Github](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development/contracts/protocol/WETHGateway.sol).

## View methods

### isCallerInWhitelist

`function isCallerInWhitelist(address caller) external view returns (bool)`

Checks if the caller is whitelisted.

#### Call params

| Name   | Type    | Description               |
| ------ | ------- | ------------------------- |
| caller | address | The address to be checked |

#### Return values

| Type | Description                                                    |
| ---- | -------------------------------------------------------------- |
| bool | Returns `true` if the caller is whitelisted, `false` otherwise |

### getWETHAddress

`function getWETHAddress() external view returns (address)`

Returns the WETH address currently set in the WETH Gateway.

#### Return values

| Type    | Description      |
| ------- | ---------------- |
| address | The WETH address |

## Write methods

### depositETH

`function depositETH(address onBehalfOf, uint16 referralCode) external payable override nonReentrant`

Deposits the user-chosen amount of ETH into the protocol, minting the same amount passed as `msg.value` of corresponding uTokens, and transferring them to the `onBehalfOf` address.

Example: Bob deposits 100 ETH into Unlockd, and gets 100 uWETH in return as proof of the deposited amount.

{% hint style="warning" %}
Ensure that the `depositETH()` transaction also includes the amount of ETH you are depositing in the `msg.value`.
{% endhint %}

#### Call params

| Name         | Type    | Description                                                                                                               |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| onBehalfOf   | address | <p>address whom will receive the uWETH.<br>Use <code>msg.sender</code> when the uTokens should be sent to the caller.</p> |
| referralCode | uint16  | Referral code. The referral program is currently in development. Therefore, `referralCode` must be set to 0.              |
|              |         |                                                                                                                           |

### withdrawETH

`function withdrawETH(uint256 amount, address to) external override nonReentrant`

Withdraws `amount` of the WETH, unwraps it to ETH, and transfers the ETH to the `to` address.

Example: Bob withdraws 10 ETH. Bob will get 10 ETH and will burn the same amount in uTokens.

{% hint style="warning" %}
Ensure you set the relevant ERC20 allowance of uWETH, before calling this function, so the `WETHGateway` contract can burn the associated uWETH.
{% endhint %}

#### Call params

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| amount | uint256 | The amount to be withdrawn                  |
| to     | address | address that will receive the unwrapped ETH |

