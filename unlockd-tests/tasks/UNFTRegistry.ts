import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getUserWallet } from "../helpers/config";

//Get Asset price 
task("unftRegistry:getUNFTAddresses", "User 0 Deposits {amount} {reserve} in an empty reserve")
  .addParam("nftaddress", "The asset address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.UNFTREGISTRY.getUNFTAddresses(wallet, nftaddress);
    console.log(tx);
  }
);