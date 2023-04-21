# Introduction

## Introduction to Unlockd

Unlockd is a decentralized, non-custodial liquidity protocol that allows users to participate as depositors or borrowers. It is primarily composed of smart contracts deployed on the Ethereum Mainnet, enabling depositors to provide liquidity with ERC20 tokens and earn passive income. Borrowers, on the other hand, can obtain overcollateralized loans by using their non-fungible ERC721 assets as collateral.&#x20;

This document provides essential information about the smart contracts used in the Unlockd protocol and an overview of its primary use cases.&#x20;

By following the guidelines and understanding the use cases outlined, developers can effectively interact with the smart contract functions and participate in Unlockd's decentralized liquidity protocol.



## Risk Framework

At Unlockd, we understand the potential risks of market volatility and how it can affect the&#x20;

Unlockd acknowledges the potential risks associated with market volatility and continuously seeks ways to improve the protocol's safety and reliability. The Unlockd Risk Framework outlines key risks and the mitigation strategies implemented to address them.

\


## Contract interactions and use cases

### Deposit

Users can deposit ERC-20 tokens into the protocol using the `deposit()` function in the `LendPool.sol` contract. The deposited assets are added to the protocol's reserves, and the user receives uTokens representing their deposit position. The user must provide the asset, the deposit amount, and the address that will receive the uTokens.

### Withdraw

Users can withdraw their deposited assets using the `withdraw()` function in the `LendPool`. The equivalent uTokens are burned, and the original asset is returned to the user. The user must specify the asset, withdrawal amount, and the address that will receive the underlying assets.

### Borrow

The Unlockd protocol enables users to borrow against their NFT assets by using them as collateral. Each NFT collateral is associated with a single loan containing all relevant borrow position data. The user must specify the asset, the borrow amount, the collateral's collection address and token ID, and the loan receiver's address.

### Repay

Users must repay over-collateralized loans, including a small fee. The `repay()` function in the `LendPool` facilitates loan repayment and the return of the collateralized NFT. Users must provide the NFT's collection address and token ID, as well as the repayment amount. Partial repayments are allowed, e.g., to improve a user's health factor.

### Redeem

If a user's health factor drops below 1, an auction process is triggered. The NFT collateral owner can redeem the NFT loan by repaying the debt and an additional bid fine as a penalty for triggering the auction. The user must specify the NFT's collection address and token ID, the repayment amount, and the bid fine.

### Buyout

During an auction, users can perform a buyout if the health factor is below 1. The user pays the NFT's appraised value, not the debt amount, and becomes the new owner upon transaction completion.

### Liquidate

Liquidation occurs when a non-fungible asset used as collateral in the protocol reaches a health factor value below 1. An external server monitors all the protocol loans and identifies unhealthy loans. When an unhealthy loan is detected, the NFT can be put up for auction. The auction process starts with Unlockd setting a minimum bid price equal to the debt. A duration is established for the auction, and users can place bids above the minimum price or the previous highest bid (the first bid benefits from a return fee to incentivize bidding). Two scenarios may arise when an auction is triggered:

* If bids are placed, the NFT is sold to the highest bidder, including the available price from Reservoir, and the highest amount is used to liquidate the NFT, allowing the protocol to recover the loaned amount.
* If no bids are placed, the NFT is liquidated through the Reservoir adapter. An external server monitors the auction duration and triggers the Reservoir sale by accepting the highest offer available in the market, as provided by Reservoir.
