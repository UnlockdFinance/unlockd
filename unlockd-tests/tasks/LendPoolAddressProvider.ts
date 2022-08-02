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

task("tests:provider:getProtocolDataProvider", "User gets the ProtocolDataProvider Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getProtocolDataProvider(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setProtocolDataProvider", "User sets a new ProtocolDataProvider address")
.addParam("protocoldataprovideraddress", "The ProtocolDataProvider Address") 
.setAction( async ({protocoldataprovideraddress}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setProtocolDataProvider(wallet, protocoldataprovideraddress)
    console.log(tx);
}); 

task("tests:provider:getNFTXVaultFactory", "User gets the NFTXVaultFactory Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getNFTXVaultFactory(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setNFTXVaultFactory", "User sets the NFTXVaultFactory Address")
.addParam("address", "The NFTXVaultFactory Address") 
.setAction( async ({address}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setNFTXVaultFactory(wallet, address)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:getSushiSwapRouter", "User gets the SushiSwapRouter Address")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getSushiSwapRouter(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:provider:setSushiSwapRouter", "User sets the SushiSwapRouter Address")
.addParam("address", "The SushiSwapRouter Address") 
.setAction( async ({address}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setSushiSwapRouter(wallet, address)
    console.log(JSON.stringify(tx));
}); 
