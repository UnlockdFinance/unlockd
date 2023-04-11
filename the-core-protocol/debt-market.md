# Debt Market

The Debt Market allows users to sell their debt, also called loans. When a user borrows, he becomes a borrower and starts a loan at Unlockd. If the user wants, he can add it to the marketplace and sell it for a fixed price or to the highest bidder (using an English Auction over an X period of your choice). The borrower will create a listing, asking for an amount for him. If a buyer wins an auction or buys the fixed term, the protocol will send the user the amount he asked for and burn his debt, minting the same debt and giving the uNFT to the new owner. The buyer must remind himself that his buying the debt! To withdraw the NFT, the new owner must also pay the debt. NFT = Asked amount + debt;

{% hint style="warning" %}
If a user borrows again, or if an auction ends, and before the user claims the NFT, the user borrows more, the auction and listing will get cancelled, the eth will get returned to the buyer, and the user will have to create a new listing.&#x20;
{% endhint %}

## View Methods

### getDebtId

```
function getDebtId(address nftAsset, uint256 tokenId) 
external view override returns (uint256)
```

Gets the id of the debt listing created.

#### Call Params

| Name     | Type    | Description                                  |
| -------- | ------- | -------------------------------------------- |
| nftAsset | address | the address of the borrowed underlying asset |
| tokenId  | uint256 | the tokenId of the underlying borrowed asset |

#### Return Values

| Type    | Description                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| uint256 | returns the id of the debt listing created by the borrower. If 0 is returned means that there is no listing created. |

### getDebt

```
function getDebt(uint256 debtId) 
external view override returns (DataTypes.DebtMarketListing memory sellDebt)
```

It will return the struct containing the params used to create the debt listing.

#### Call Params

|        |         |                                                |
| ------ | ------- | ---------------------------------------------- |
| debtId | uint256 | The id of the listing created to sell the debt |

#### Return Values

|                             |                                                                       |
| --------------------------- | --------------------------------------------------------------------- |
| DataTypes.DebtMarketListing | A struct containing all the variables used to create the debt listing |

### getDebtIdTracker

```
function getDebtIdTracker() 
external view override returns (CountersUpgradeable.Counter memory)
```

It will return the next number to be used to create a debt listing.

#### Return Values

| Type                        | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| CountersUpgradeable.Counter | an integer with the next number to be used as debtId. |

## Write Methods

### createDebtListing

```
createDebtListing(
    address nftAsset,
    uint256 tokenId,
    uint256 sellPrice,
    address onBehalfOf,
    uint256 startBiddingPrice,
    uint256 auctionEndTimestamp
  ) 
external override nonReentrant nonDuplicatedDebt(nftAsset, tokenId) 
onlyOwnerOfBorrowedNft(nftAsset, tokenId)
```

This function will allow the borrower to create his selling position. The user can choose if he wants a Fixed Price, an Auction, or both. In the case of both, if someone pays the fixed price or bids above it, he will become the new owner of the debt.

{% hint style="info" %}
**Example:** Bob borrowed 0.3ETH using mfer 1318 as collateral.

He decides that he wants to sell his position for 0.7ETH.

A new buyer, Alice, appears and pays the 0.7ETH making him the new owner.&#x20;

Bobs will get his 0.7ETH + 0.3ETH(he has previously asked for loan) = 1ETH

Alice paid 0.7ETH and has minted Bob's debt. She must pay the debt first if she wants to withdraw the NFT.&#x20;
{% endhint %}

#### Call Params

| Name                | Type    | Description                                  |
| ------------------- | ------- | -------------------------------------------- |
| nftAsset            | address | the address of the borrowed underlying asset |
| tokenId             | uint256 | the tokenId of the underlying borrowed asset |
| sellPrice           | uint256 | the amount the user wants for him            |
| onBehalfOf          | adress  | the wallet that will receive the funds       |
| startBiddingPrice   | uint256 | the amount to start an auction               |
| auctionEndTimestamp | uint256 | when will the auction end                    |

### cancelDebtListing

```
function cancelDebtListing(
    address nftAsset,
    uint256 tokenId
) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId)
```

This function will cancel the debt listing if it exists. If a user borrows more, automatically, his listing will be cancelled, even if a user bought it but did not claim it. The idea is to prevent the user from borrowing more and front-run the new owner.

#### Call Params

| Name     | Type    | Description                                  |
| -------- | ------- | -------------------------------------------- |
| nftAsset | address | the address of the borrowed underlying asset |
| tokenId  | uint256 | the tokenId of the borrowed underlying asset |

### buy

```
function buy(
    address nftAsset,
    uint256 tokenId,
    address onBehalfOf,
    uint256 amount
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId)
```

If a buyer decides to pay the fixed price and become the new owner, this is the function to call.

#### Call Params

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| nftAsset   | address | the address of the borrowed underlying asset |
| tokenId    | uint256 | the tokenId of the borrowed underlying asset |
| onBehalfOf | address | the address that will get the debt and uNFT  |
| amount     | uint256 | the amount to pay in wei                     |

### bid

```
function bid(
    address nftAsset,
    uint256 tokenId,
    uint256 bidPrice,
    address onBehalfOf
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId)
```

The bid function will allow the user to bid on auctions listed by the borrowers.

{% hint style="info" %}
If the bid surpasses the fixed price (in case it has mixed auctions and fixed price), the debt will automatically work like a buy, making the bidder the new owner.
{% endhint %}

#### Call Params

| Name       | Type    | Description                                          |
| ---------- | ------- | ---------------------------------------------------- |
| nftAsset   | address | the address of the borrowed underlying asset         |
| tokenId    | uint256 | the tokenId of the borrowed underlying asset         |
| bidPrice   | uint256 | the bid amount in wei the user wants to offer.       |
| onBehalfOf | address | the address that will get the debt and uNFT (if won) |

### claim

```
function claim(
    address nftAsset,
    uint256 tokenId,
    address onBehalfOf
  ) external override nonReentrant debtShouldExistGuard(nftAsset, tokenId)
```

When an auction ends, the winner can claim the debt. The debt and the uNFT will be burned and minted from the seller to the new owner (buyer).

{% hint style="warning" %}
If the borrower decides to borrow more after the auction ends and before the buyer claims. The auction will get cancelled, the buyer will get his ETH back, and the borrower will increase his debt.
{% endhint %}

#### Call Params

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| nftAsset   | address | the address of the borrowed underlying asset |
| tokenId    | uint256 | the tokenId of the borrowed underlying asset |
| onBehalfOf | address | the address that will get the debt and uNFT  |

