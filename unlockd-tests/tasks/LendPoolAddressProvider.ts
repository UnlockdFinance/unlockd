import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet } from "../helpers/config"; 

task("tests:provider:getMarketId", "User gets the market id address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getMarketId(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:getLendPoolLiquidator", "User gets the lendPoolLiquidator Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLendPoolLiquidator(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setLendPoolLiquidator", "User sets a new LendPoolLiquidator address")
.addParam("lendpoolliquidatoraddress", "The LendPoolLiquidator Wallet Address") 
.setAction( async ({lendpoolliquidatoraddress}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setLendPoolLiquidator(wallet, lendpoolliquidatoraddress)
    console.log(tx);
}); 