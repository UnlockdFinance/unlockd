# LendPool

The `LendPool` contract is the main contract of the protocol. It exposes all the user-oriented actions that can be invoked using either Solidity or web3 libraries.

The source code can be found on [GitHub](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/master/contracts/protocol/LendPool.sol) here**.**

{% hint style="info" %}
LendPool methods deposit, withdraw, triggerUserCollateral, borrow, repay, auction, redeem, liquidate, and liquidateNFTX are only for ERC20 and ERC721. \
If you want to deposit, withdraw, triggerUserCollateral, borrow, repay, auction, or redeem using native ETH, use WETHGateway instead.\
If you want to borrow or repay using CryptoPunks as collateral, use PunkGateway.
{% endhint %}

****

## Methods

### deposit

`function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override nonReentrant whenNotPaused`

Deposit the user-chosen amount of a certain `asset` into the protocol, minting the same `amount` of corresponding uTokens, and transferring them to the `onBehalfOf` address.

Example: Bob deposits 100 WETH and will get 100 uWETH in return as proof of the deposited amount.

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
When depositing, the `LendPool` contract must have`allowance()`**to spend funds on behalf of**`msg.sender` for at least the`amount of` the **`asset`** being deposited. \
This can be done via the standard ERC20 `approve()` method.
{% endhint %}

#### Call Params

| Name         | Type    | Description                                                                                                                 |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| asset        | address | the address of the underlying asset (ERC20)                                                                                 |
| amount       | uint256 | the amount to deposit expressed in wei units                                                                                |
| onBehalfOf   | address | <p>address whom will receive the uTokens.<br>Use <code>msg.sender</code> when the uTokens should be sent to the caller.</p> |
| referralCode | uint16  | the referral program is not working at the moment use 0                                                                     |

### withdraw

`function withdraw(address asset, uint256 amount, address to) external override nonReentrant whenNotPaused returns (uint256)`

Withdraws the amount of the underlying `asset` based on the `amount` of uTokens being held and burns the same amount of uTokens.&#x20;

Example: Bob withdraws 10 ETH. Bob will get 10 ETH and will burn the same amount in uTokens.

{% hint style="warning" %}
When withdrawing `to` another address, the `msg.sender`should hold enough uTokens that the lendPool will burn.
{% endhint %}

#### Call Params

| Name   | Type    | Description                                      |
| ------ | ------- | ------------------------------------------------ |
| asset  | address | address of the underlying asset (ERC20)          |
| amount | uint256 | the amount to be withdraw expressed in wei units |
| to     | address | the address that will receive the asset.         |

#### Return Params

| Type    | Description                   |
| ------- | ----------------------------- |
| uint256 | the amount that was withdrawn |

### triggerUserCollateral

`function triggerUserCollateral(address nftAsset, uint256 nftTokenId) external payable override onlyHolder(nftAsset, nftTokenId) whenNotPaused`

This will ensure that the user holds the `nftAsset` or the uNFT version of it (ERC721). It will charge a small fee to the user to configure his NFT on the protocol.

{% hint style="info" %}
This function needs to be done before borrowing. Otherwise, it will revert.
{% endhint %}

#### Call Params&#x20;

| Name       | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| nftAsset   | address | the adress of the underlying NFT asset used as collateral  |
| nftTokenId | uint256 | the TokenId of the underlying NFT asset used as collateral |

### borrow

`function borrow(address asset, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external override nonReentrant whenNotPaused`

The user will be able to borrow an `amount` of `asset` using his `nftAsset` as collateral to a wallet `onBehalfOf` and will also receive the same `amount` in debt tokens as proof of debt.

Example: Alice borrows 10 ETH using her Lockey NFT with tokenid 1. \
Alice will lock her NFT and get a uNFT (wrapped version of the collateral), debt tokens representing her debt to the protocol and the 10 ETH.

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
The borrowing can only be done if your NFT is configured on the protocol.

To do this, the triggerUserCollateral needs to be called first. \
Also, there's a `_timeFrame` variable configured that will validate the time between configuring the NFT and the borrow. If the time is exceeded, it will revert.\


The `_timeFrame` can be checked with `getTimeframe()`
{% endhint %}

#### Call Params

| Name         | Type    | Description                                                                                                                                                 |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset        | address | The address of the underlying asset to borrow                                                                                                               |
| amount       | uint256 | the amount to be borrowed expressed in wei units                                                                                                            |
| nftAsset     | address | the address of the underlying NFT used as collateral                                                                                                        |
| nftTokenId   | uint256 | the tokenId of the underlying NFT used as collateral                                                                                                        |
| onBehalfOf   | address | <p>address whom will receive the borrowed amount.<br>Use <code>msg.sender</code> when the debt tokens and borrowed amount should be sent to the caller.</p> |
| referralCode | uint16  | the referral program is not working at the moment use 0                                                                                                     |

### repay

`function repay(address nftAsset, uint256 nftTokenId, uint256 amount) external override nonReentrant whenNotPaused returns (uint256, bool)`

Repays a borrowed `amount` equal to or less than the amount owed from the specified collateral, `nftAsset`. It will burn the same `amount` of `debt tokens`.

Example: Alice decides to pay 2 ETH from the borrowed amount. Alice will use her uNFT to identify the loan, will give 2 ETH and will burn the same amount in debt tokens.

#### Call Params

| Name       | Type    | Description                                     |
| ---------- | ------- | ----------------------------------------------- |
| nftAsset   | address | the underlying NFT address used as collateral   |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral  |
| amount     | uint256 | the amount that the user wants to repay         |

#### Return Values

| Type    | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| uint256 | the repayed amount                                                         |
| bool    | will return true if the total amount is repaid or false if partially paid. |

### auction

`function auction(address nftAsset, uint256 nftTokenId, uint256 bidPrice, address onBehalfOf) external override nonReentrant whenNotPaused`

When the health factor is below one, the users can trigger an auction if they want to buy the collateral asset, the NFT used in the loan. The bidPrice needs to be higher than&#x20;

Example: Alice's NFT price went down, and the health factor (HF) went below 1. Bob, that loves the Lockeys decide to bid. \
If there's a second bid, the first bidder will get a 2.5% bidFine for being the first. The bidFine will also be paid if Alice decides to redeem part of the debt and make the HF go above one.

| Name       | Type    | Description                                                                                            |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------ |
| nftAsset   | address | the underlying NFT address used as collateral with HF < 1                                              |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral with HF < 1                                             |
| bidPrice   | uint256 | the amount that the msg.sender decides to bid needs to be higher than previous or the debt amount + 1% |
| onBehalfOf | address | address whom will receive the NFT in case the auction is successful                                    |
