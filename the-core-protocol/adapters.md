# Adapters

Adapters allow for the integration of several external liquidation markets, and are based on a BaseAdapter contract that contains generic liquidation functionality. As of today, Unlockd's primary adapter used for liquidations is Reservoir

## Reservoir Adapter

Reservoir adapter aims at leveraging Reservoir's powerful infrastructure for trading NFTs across major marketplaces and chains. It liquidates NFT's seeking for the best offers accross different marketplaces, such as OpenSea, LooksRare and X2Y2. The liquidation process is as follows:

1. Trigger \`liquidateReservoir()\`, passing the specific calldata which holds the transfer of the NFT to reservoir's Router contract

{% hint style="info" %}
\`liquidateReservoir()\` is note permissionless, effectively enabling only Unlockd specific addresses to execute liquidations on Reservoir
{% endhint %}

2. Validate the calldata specifically designed to:
   1. Transfer the NFT in a safely manner to the specific reservoir module the NFT should be liquidated in
   2. Execute Reservoir router's \`execute()\` function with the specific calldata
3. Transfer the NFT to Reservoir's target module, where the NFT will be "automatically" liquidated
4. Validate the amount liquidated matches the expected liquidation price
5. Settle liquidation
