# Introduction

## Introduction to Unlockd

This documentation describes the public infrastructure we are building, the Unlockd protocol. Unlockd is a decentralized non-custodial liquidity protocol where users can participate as depositors or borrowers. It is, at its core, a set of smart contracts deployed to the Ethereum Mainnet, where depositors provide liquidity in the form of ERC20 tokens to earn a passive income, while borrowers can receive overcollateralized loans by setting their non-fungible ERC721 assets as collateral. The following document contains relevant information about the Smart Contracts designed for the Unlockd protocol, as well as an overview of the most relevant scenarios.

## Risk Framework

At Unlockd, we understand the potential risks of market volatility and how it can affect the protocol. Because of that, we are constantly seeking for new ways to make the protocol safer and more reliable. Unlockd’s Risk Framework breaks down some of the key risks of the protocol and the mitigation techniques in place. You can check the risk framework documentation [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/master/RiskFramework.pdf).

## Contract interactions and use cases

### Deposit

Users can deposit ERC-20 tokens to the protocol via the deposit() function in the LendPool.sol contract. It deposits an amount of underlying asset to the reserves of the protocol, receiving in return overlying uTokens representing the deposit position. In order to deposit, the user must provide the contract with information about the asset and amount to be deposited, as well as the address that will receive the corresponding uTokens. You can check the deposit diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/deposit.png).

### Withdraw

Users can withdraw their deposited assets by triggering the withdraw() function in the LendPool. The withdrawal process burns the equivalent uTokens owned, returning back the original asset to the user. In order to perform a succesful withdrawal, users must specify the asset and amount to withdraw, as well as the address that will receive the underlying assets. You can check the withdraw diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/withdraw.png).

### Borrow

The Unlockd protocol allows users to borrow against their NFT assets, setting them as collateral. Each NFT provided as collateral will be linked to a single loan, which will contain all the data corresponding to the borrow position. The borrowing process requires the user to specify the asset and amount to be borrowed, the collection address and token ID for the non-fungible asset to be set as collateral, and finally an address to specify the loan receiver. You can check the borrow diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/borrow.png).

### Repay

Providing users with over-collateralized loans implies a return of the borrowed amount plus a small fee. The repay function in the LendPool allows users to perform this return of borrowed assets, getting their collateralized non-fungible asset back. In order to repay, the collection address and token ID for the NFT must be provided, as well as the desired amount to repay. The amount is specified due to the fact that partial repayments are allowed (for example, to increase a user's health factor). You can check the repay diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/repay.png).

### Redeem

Users can find themselves in a situation where their health factor has dropped below 1, thus triggering the auction process. In this case, the collateral owner can redeem the NFT loan, thus burning the loan and receiving the non-fungible asset back. In this case, the user must specifty the collection address and token ID for the NFT, the amount to repay the debt, and an additional bid fine as a penalty for triggering the auction process. You can check the redeem diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/redeem.png).

### Liquidate

The liquidation process starts with a non-fungible asset used as collateral in the protocol reaching a health factor value below 1. An external server is monitoring all the protocol loans, making sure to identify unhealthy loans. When an unhealthy loan is identified, the NFT can be set to auction. The auction process begins with Unlockd setting a minimum bid price coming from the liquid NFT marketplace, NFTX. A duration time is set for the auction, and users can bid above the minimum price or the previous highest bid (the first bid will benefit from a return fee in order to incentivize bids). There are two scenarios when an auction gets triggered:

1. If there have been bids, the NFT will be sold to the highest bidder, thus liquidating the NFT and allowing the protocol to get the loaned amount back.
2. If there are no bids, the NFT is liquidated via NFTX. An external server will be monitoring the auction duration, and trigger the NFTX liquidation if no bids are placed. You can check the auction diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/auction.png). You can check the liquidate diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development\_\_documentation/assets/liquidation.png).
