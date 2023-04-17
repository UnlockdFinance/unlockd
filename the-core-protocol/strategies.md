# Strategies

One of the key features of Unlockd is its strategies, which are automated approaches for managing and investing funds.

The strategies employed by Unlockd are designed to maximize returns while minimizing risk. They invest funds into liquidity pools on various DeFi platforms, where they can earn interest and receive rewards in the form of tokens.&#x20;

Strategies decide how much and in which protocols reserves should be placed in a modular way, meaning there can be multiple strategies for a single reserve, each interacting with a single or multiple platform.

## Architecture

The design of the Strategies is highly inspired by Yearn Finance. The protocol's reserves are held in the UToken contract, which acts as a Yearn Vault that interacts with the strategies. The UToken can configure each strategy in order to allocate funds to it, and redistribute funds in the most suitable way for the protocol.

Each reserve has its set of strategies to get some yield on it. At the moment, two strategies have been created for WETH: Generic YVault Strategy and Convex ETH-peggedETH strategy.&#x20;

Since gas cost is quite high on Ethereum, users depositing, withdrawing or borrowing from Unlockd don't interact directly with strategy contracts unless there is low liquidity in the pool. Funds are added/substracted from the UToken contract, and the strategies interaction only take place if the amount requested is less than the amount held in the UToken.

## Debt Ratio

A debt ratio can be computed for every strategy linked to a reserve, which indicates the proportion of funds lent compared to the total reserves available in the pool (including reserves and the amount lent across all strategies). Each strategy has a specific target debt ratio. If the debt ratio falls below the target, keepers can activate the harvest function to provide additional collateral to the strategy. Conversely, if the debt ratio exceeds the target, collateral can be withdrawn from the strategy, and consequently from the associated lending platforms.

{% hint style="info" %}
Keepers are whitelisted actors who cannot choose the amount they lend or withdraw from lending platforms: this is automatically computed using the strategy's target debt ratio at each call to `harvest.`
{% endhint %}

## Strategies

### Generic YVault Strategy

This strategy used for WETH is the GenericYVault strategy. It deposits WETH in Yearn's WETH vault and gets vault shares in return, earning the vault's yield.

{% hint style="info" %}
This strategy is built in a generic way so that it can be used for several other Yearn Vaults.
{% endhint %}

### Convex ETH-peggedETH strategy

This strategy consists in depositing Curve LP tokens into Convex Finance, in order to earn extra rewards. The strategy steps are the following:

1. Unwrap WETH and check Curve's pool liquidity distribution
2. Swap ETH for pegged ETH in case Curve's bonus applies for pegged ETH
3. Deposit liquidity in Curve pool, receiving Curve's LP token
4. Deposit Curve's LP token in Convex Finance's Booster, automatically staking Curve's LP tokens into Curve's gauge earning CRV rewards, and also receiving Convex LP tokens
5. Stake Convex LP tokens into Convex's Reward Pool, earning rewards from the Reward Pool itself, and also from several other reward pools linked to the Reward Pool

{% hint style="info" %}
Harvesting this strategy is limited to specific Keepers governed by Unlockd and harvests are only executed through MEV relayers. This allows to mitigate the negative externalities and existential risks posed by miner-extractable value (MEV), benefiting from more optimal swaps and mitigating frontrunning attacks
{% endhint %}

\
