import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet } from "../helpers/config"; 
 
/** 
 * This file will use the LendPoolConfigurator 
 * for full reference check the ILendPoolConfigurator.sol
*/

task("configurator:setBorrowingFlagOnReserve", "Enables or disables borrowing on each reserve")
.addParam("assets", "NFT addresses") 
.addParam("flag", "A boolean, true to enable ; false to disable") 
.setAction( async ({assets, flag }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setBorrowingFlagOnReserve(wallet, [assets], flag)
    console.log(tx);
}); 

task("configurator:setActiveFlagOnReserve", "Activates or deactivates each reserve")
.addParam("assets", "NFT addresses") 
.addParam("flag", "A boolean, true for Active; false for not active") 
.setAction( async ({assets, flag }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setActiveFlagOnReserve(wallet, [assets], flag)
    console.log(tx);
}); 

task("configurator:setFreezeFlagOnReserve", "Freezes or unfreezes each reserve")
.addParam("assets", "NFT addresses") 
.addParam("flag", "A boolean, true for freeze; false for unfreeze") 
.setAction( async ({assets, flag }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setFreezeFlagOnReserve(wallet, [assets], flag)
    console.log(tx);
}); 

task("configurator:setReserveFactor", "Updates the reserve factor of a reserve")
.addParam("assets", "NFT addresses") 
.addParam("factor", "The new reserve factor of the reserve") 
.setAction( async ({assets, factor }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setReserveFactor(wallet, [assets], factor)
    console.log(tx);
}); 

task("configurator:setReserveInterestRateAddress", "Sets the interest rate strategy of a reserve")
.addParam("assets", "NFT addresses") 
.addParam("rateaddress", "the new address of the interest strategy contract") 
.setAction( async ({assets, rateaddress }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setReserveInterestRateAddress(wallet, [assets], rateaddress)
    console.log(tx);
}); 

task("configurator:setActiveFlagOnNft", "Activates or Deactivates the reserves")
.addParam("assets", "NFT addresses") 
.addParam("flag", "A boolean, True for Active; False for not active") 
.setAction( async ({assets, flag }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setActiveFlagOnNft(wallet, [assets], flag)
    console.log(tx);
}); 

task("configurator:setFreezeFlagOnNft", "Freezes or unfreezes each NFT")
.addParam("assets", "NFT addresses") 
.addParam("flag", "A boolean, true for freeze; false for unfreeze") 
.setAction( async ({assets, flag }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setFreezeFlagOnNft(wallet, [assets], flag)
    console.log(tx);
}); 

task("configurator:configureNftAsCollateral", 
"configure the ltv, liquidationThreshold, liquidationBonus for a reserve asset.")
.addParam("asset", "the address of the underlying NFT asset")
.addParam("tokenid", "the tokenId of the underlying NFT asset")  
.addParam("ltv", "The loan to value of the asset when used as NFT") 
.addParam("threshold", "The threshold at which loans using this asset as collateral will be considered undercollateralized") 
.addParam("bonus", "The bonus liquidators receive to liquidate this asset. The values is always below 100%. A value of 5% means the liquidator will receive a 5% bonus") 
.addParam("redeemduration", "the address of the underlying NFT asset")
.addParam("auctionduration", "the tokenId of the underlying NFT asset")  
.addParam("redeemfine", "The loan to value of the asset when used as NFT") 
.addParam("active", "if the nft asset is active or not (BOOL true or false)") 
.addParam("freeze", "if the nft asset is frozen or not (BOOL true or false)") 
.setAction( async ({asset, tokenid, ltv, threshold, bonus, redeemduration, auctionduration, redeemfine, active, freeze}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.configureNftAsCollateral(
        wallet, 
        asset,
        tokenid,
        ltv, 
        threshold, 
        bonus,
        redeemduration,
        auctionduration,
        redeemfine,
        active,
        freeze
    )

    console.log(tx);
}); 

task("configurator:configureNftAsAuction", "Configures the NFT auction parameters")
.addParam("assets", "he address of the underlying NFT asset") 
.addParam("tokenid", "The tokenId of the underlying asset")
.addParam("redeemduration", "The max duration for the redeem") 
.addParam("auctionduration", "The auction duration") 
.addParam("redeemfine", "The fine for the redeem") 
.setAction( async ({assets, tokenid, redeemduration, auctionduration, redeemfine}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.configureNftAsAuction(
        wallet, 
        assets,
        tokenid, 
        redeemduration, 
        auctionduration, 
        redeemfine
    )

    console.log(tx);
}); 

task("configurator:setNftRedeemThreshold", "Activates or Deactivates the reserves")
.addParam("assets", "NFT addresses") 
.addParam("redeemthreshold", "The threshold for the redeem") 
.setAction( async ({assets, redeemthreshold }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setNftRedeemThreshold(wallet, [assets], redeemthreshold)
    console.log(tx);
}); 

task("configurator:setNftMinBidFine", "Freezes or unfreezes each NFT")
.addParam("assets", "NFT addresses") 
.addParam("minbidfine", "The minimum bid fine value") 
.setAction( async ({assets, minbidfine }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setNftMinBidFine(wallet, [assets], minbidfine)
    console.log(tx);
});

task("configurator:setNftMaxSupplyAndTokenId", "Configures the NFT auction parameters")
.addParam("assets", "he address of the underlying NFT asset") 
.addParam("maxsupply", "The max duration for the redeem") 
.addParam("maxtokenId", "The auction duration")  
.setAction( async ({assets, maxsupply, maxtokenId}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setNftMaxSupplyAndTokenId(
        wallet, 
        [assets], 
        maxsupply, 
        maxtokenId
    )

    console.log(tx);
}); 

task("configurator:setMaxNumberOfReserves", "sets the max amount of reserves | 32 as limit")
.addParam("newval", "the new value to set as the max reserves") 
.setAction( async ({newval}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setMaxNumberOfReserves(wallet, newval)
    console.log(tx);
});

task("configurator:setMaxNumberOfNfts", "sets the max amount of NFTs | 256 as limit")
.addParam("newval", "the new value to set as the max NFTs") 
.setAction( async ({newval}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setMaxNumberOfNfts(wallet, newval)
    console.log(tx);
});

task("configurator:setLiquidationFeePercentage", "sets the liquidation fee percentage")
.addParam("newval", "the new value to set as the max fee percentage") 
.setAction( async ({newval}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setLiquidationFeePercentage(wallet, newval)
    console.log(tx);
});

task("configurator:setPoolPause", "pauses or unpauses all the actions of the protocol, including uToken transfers")
.addParam("val", "true if protocol needs to be paused, false otherwise") 
.setAction( async ({val}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setPoolPause(wallet, val)
    console.log(tx);
});

task("configurator:getTokenImplementation", "pauses or unpauses all the actions of the protocol, including uToken transfers")
.addParam("proxyaddress", "true if protocol needs to be paused, false otherwise") 
.setAction( async ({proxyaddress}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.getTokenImplementation(wallet, proxyaddress)
    console.log(tx);
});
