import { parseEther, parseUnits } from "@ethersproject/units";
import { task } from "hardhat/config";
import { getOwnerWallet, getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

//Get NFT price
task("nftoracle:getnftprice", "User 0 Deposits {amount} {reserve} in an empty reserve")
  .addParam("nftaddress", "The nft address")
  .addParam("tokenid", "The token id")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const price = await Functions.NFTORACLE.getNftPrice(wallet, nftaddress, tokenid);
    console.log("NFT price: ", price.toString() / 10 ** 18);
  });

//Set NFT price
task("nftoracle:setnftprice", "User 0 Deposits {amount} {reserve} in an empty reserve")
  .addParam("nftaddress", "The nft address")
  .addParam("tokenid", "The token id")
  .addParam("price", "The asset price")
  .setAction(async ({ nftaddress, tokenid, price }) => {
    const wallet = await getOwnerWallet();
    //price = await parseEther(price);
    //console.log("New price: ", price.toString() / 10**18);
    await Functions.NFTORACLE.setNftPrice(wallet, nftaddress, tokenid, price);
  });

//Get NFT owner
task("nftoracle:getoracleowner", "User 0 Deposits {amount} {reserve} in an empty reserve").setAction(async () => {
  const wallet = await getUserWallet();
  const owner = await Functions.NFTORACLE.getNFTOracleOwner(wallet);
  console.log(owner);
});

task("nftoracle:setpricemanager", "adds an address as Price Manager")
  .addParam("newpricemanager", "the address to add as Price Manager")
  .addParam("val", "true for new price manager")
  .setAction(async ({ newpricemanager, val }) => {
    const wallet = await getOwnerWallet();
    await Functions.NFTORACLE.setPriceManagerStatus(wallet, newpricemanager, val);
    console.log("address added");
  });
