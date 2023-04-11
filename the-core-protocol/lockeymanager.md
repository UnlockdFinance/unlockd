# LockeyManager

This contract will manage the percentage that Lockey NFT holders can get if configured. Currently, the amount is 100%, which means no discounts are having an effect when the user does a buyout on an auction or a debt market listing.

{% hint style="warning" %}
The borrower can end up "losing" a portion of his amount if the Lockey percentages change.\
\
Example: the Lockey holders can have a 3% discount when buying out an NFT on an auction.\
\
If the buyout price is 50ETH, means a regular buyer will pay the whole amount but a Lockey holder will pay 48.5ETH.
{% endhint %}

## View Methods

### getLockeyDiscountPercentage

`function getLockeyDiscountPercentage() external view returns (uint256)`

The function returns the percentage that the Lockey holder will pay to a buyout on an auction.

{% hint style="info" %}
for the example above, if the Lockey holder has a 3% discount it means the function will return 97%, using this way will minimize the calculations to achieve the right amount.
{% endhint %}

#### Return Values

| Type    | Description                                     |
| ------- | ----------------------------------------------- |
| uint256 | the percentage amount a Lockey holder will pay. |

### getLockeyDiscountPercentageOnDebtMarket

`function getLockeyDiscountPercentageOnDebtMarket() external view returns (uint256)`

The function returns the percentage that the Lockey holder will pay for a debt market listing.\
It will follow the same logic as the example above.

#### Return Values

| Type    | Description                                     |
| ------- | ----------------------------------------------- |
| uint256 | the percentage amount a Lockey holder will pay. |

## Write Methods

### setLockeyDiscountPercentage

`function setLockeyDiscountPercentage(uint256 discountPercentage) external onlyPoolAdmin`

The percentage to be discounted can only be set by the PoolAdmin, this is the percentage that the Lockey holders can have for an auction. By default, the number should be 100%

#### Call Params

| Name               | Type    | Description                                                                   |
| ------------------ | ------- | ----------------------------------------------------------------------------- |
| discountPercentage | uint256 | default = 100 any value lower than that will make the lockey holder pay less. |

### setLockeyDiscountPercentageOnDebtMarket

`function setLockeyDiscountPercentageOnDebtMarket(uint256 discountPercentage) external onlyPoolAdmin`

The percentage to be discounted can only be set by the PoolAdmin, this is the percentage that the Lockey holders can have for a debt market listing purchase. By default, the number should be 100%

#### Call Params

| Name               | Type    | Description                                                                   |
| ------------------ | ------- | ----------------------------------------------------------------------------- |
| discountPercentage | uint256 | default = 100 any value lower than that will make the lockey holder pay less. |
