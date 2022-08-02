import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet } from "../helpers/config"; 
 
/** 
 * This file will use the lendpoolProvider to get and set addresses or names
*/
task("tests:provider:getMarketId", "User gets the market id address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getMarketId(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setMarketId", "User sets a new Market Id name")
.addParam("marketId", "The Market Id string/name") 
.setAction( async ({marketId}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setMarketId(wallet, marketId)
    console.log(tx);
}); 

task("tests:provider:getLendPool", "User gets the LendPool address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLendPool(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setLendPoolImpl", "User sets a lendpool address")
.addParam("provideraddress", "The LendPool Provider Address") 
.addParam("encodeddata", "The data to initialize the lendPool") 
.setAction( async ({provideraddress, encodeddata}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setLendPoolImpl(wallet, provideraddress, encodeddata)
    console.log(tx);
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

task("tests:provider:getPoolAdmin", "User gets the lendpool admin Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getPoolAdmin(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setPoolAdmin", "User sets a lendpool admin address")
.addParam("admin", "The LendPoolLiquidator Wallet Address") 
.setAction( async ({admin}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setPoolAdmin(wallet, admin)
    console.log(tx);
}); 

task("tests:provider:getEmergencyAdmin", "User gets the lendpool emergency admin Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getEmergencyAdmin(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setEmergencyAdmin", "User sets a lendpool emergency admin address")
.addParam("emergencyadmin", "The LendPoolLiquidator Wallet Address") 
.setAction( async ({emergencyadmin}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setEmergencyAdmin(wallet, emergencyadmin)
    console.log(tx);
}); 

task("tests:provider:getNFTXVaultFactory", "User gets the NFTXVaultFactory Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getNFTXVaultFactory(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setNFTXVaultFactory", "User sets a new NFTXVaultFactory address")
.addParam("nftxvaultfactoryaddress", "The NFTXVaultFactory Address") 
.setAction( async ({nftxvaultfactoryaddress}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setNFTXVaultFactory(wallet, nftxvaultfactoryaddress)
    console.log(tx);
}); 

task("tests:provider:getSushiSwapRouter", "User gets the Sushiswap router Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getSushiSwapRouter(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setSushiSwapRouter", "User sets a new Sushiswap router address")
.addParam("sushiswaprouteraddress", "The Sushiswap router Address") 
.setAction( async ({sushiswaprouteraddress}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setSushiSwapRouter(wallet, sushiswaprouteraddress)
    console.log(tx);
}); 