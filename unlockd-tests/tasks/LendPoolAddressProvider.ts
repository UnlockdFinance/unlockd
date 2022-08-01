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