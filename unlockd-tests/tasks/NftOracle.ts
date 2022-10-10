import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import {getUserWallet, getOwnerWallet } from "../helpers/config";
import { parseEther, parseUnits } from "@ethersproject/units";

//Get NFT price 
task("nftoracle:getnftprice", "User 0 Deposits {amount} {reserve} in an empty reserve")
.addParam("collection", "The collection address") 
.addParam("tokenid", "The token id")
.setAction( async ({collection, tokenid}) => {
    const wallet = await getUserWallet();  
    const price = await Functions.NFTORACLE.getNftPrice(wallet, collection, tokenid);
    console.log("NFT price: ", price.toString() / 10**18);
   
}); 
 
//Set NFT price
task("nftoracle:setnftprice", "User 0 Deposits {amount} {reserve} in an empty reserve")
.addParam("collection", "The collection address") 
.addParam("tokenid", "The token id")
.addParam("price", "The asset price")
.setAction( async ({collection, tokenid, price}) => {
    const wallet = await getOwnerWallet();  
    price = await parseEther(price);  
    console.log("New price: ", price.toString() / 10**18);
    await Functions.NFTORACLE.setNftPrice(wallet, collection, tokenid, price);
   
});  

//Get NFT owner
task("nftoracle:getoracleowner", "User 0 Deposits {amount} {reserve} in an empty reserve")
.setAction( async () => {
    const wallet = await getUserWallet();   
    const owner = await Functions.NFTORACLE.getNFTOracleOwner(wallet);
    console.log(owner);
});

task("nftoracle:setpricemanager", "adds an address as Price Manager")
.addParam("newpricemanager", "the address to add as Price Manager") 
.addParam("val", "true for new price manager") 
.setAction( async ({newpricemanager, val}) => {
    const wallet = await getOwnerWallet(); 
    await Functions.NFTORACLE.setPriceManagerStatus(wallet, newpricemanager, val);
    console.log("address added");
});