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

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

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

### borrowETH

`function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external override nonReentrant`

Borrows `amount` of WETH, sending the `amount` of unwrapped WETH to `msg.sender`.

Example: Alice borrows 10 ETH using her Lockey NFT with tokenid 1 as collateral.&#x20;

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
The borrowing can only be done if your NFT is configured on the protocol.

To do this, the triggerUserCollateral needs to be called first. \
Also, there's a `_timeFrame` variable configured that will validate the time between configuring the NFT and the borrow. If the time is exceeded, it will revert.\


The `_timeFrame` can be checked with the `getTimeframe()` function in the LendPool contract
{% endhint %}

#### Call params

| Amount       | Type    | Description                                                                                                                       |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | Amount to be borrowed, expressed in wei units                                                                                     |
| nftAsset     | address | The NFT contract address                                                                                                          |
| nftTokenId   | uint256 | The NFT token Id                                                                                                                  |
| onBehalfOf   | address | <p>address of user who will incur the debt.</p><p>Use <code>msg.sender</code> when not calling on behalf of a different user.</p> |
| referralCode | uint16  | Referral code. The referral program is currently in development. Therefore, `referralCode` must be set to 0.                      |

### repayETH

`function _repayETH( address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount ) internal returns (uint256, bool)`

Repays a borrowed `amount` equal to or less than the amount owed from the specified collateral, `nftAsset`. It will burn the same `amount` of `debt tokens`.

Example: Alice decides to pay 2 ETH from the borrowed amount. Alice will use her uNFT to identify the loan, will give 2 ETH and will burn the same amount in debt tokens.

{% hint style="warning" %}
Ensure that the `repayETH()` transaction also includes the amount of ETH you are repaying in the `msg.value`.
{% endhint %}

#### Call params

| Name       | Type    | Description                                 |
| ---------- | ------- | ------------------------------------------- |
| nftAsset   | address | The NFT contract address                    |
| nftTokenId | uint256 | The NFT token Id                            |
| amount     | uint256 | Amount to be repaid, expressed in wei units |
| accAmount  | uint256 | The accumulated amount                      |

#### Return values

| Type    | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| uint256 | The paid amount                                                     |
| bool    |  `true` if the total amount is repaid or `false` if partially paid. |

### repayETH

`function _repayETH( address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount ) internal returns (uint256, bool)`

Repays a borrowed `amount` equal to or less than the amount owed from the specified collateral, `nftAsset`. It will burn the same `amount` of `debt tokens`.

Example: Alice decides to pay 2 ETH from the borrowed amount. Alice will use her uNFT to identify the loan, will give 2 ETH and will burn the same amount in debt tokens.
