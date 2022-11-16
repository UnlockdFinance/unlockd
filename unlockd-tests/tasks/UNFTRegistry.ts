import { task } from "hardhat/config";
import { getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

//Get Asset price
task("unftRegistry:getUNFTAddresses", "User 0 Deposits {amount} {reserve} in an empty reserve")
  .addParam("nftaddress", "The NFT address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.UNFTREGISTRY.getUNFTAddresses(wallet, nftaddress);
    console.log(tx);
  });
