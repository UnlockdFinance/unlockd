import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getUserWallet, getOwnerWallet } from "../helpers/config";
import { parseUnits } from "@ethersproject/units";

//Get Asset price 
task("reserveoracle:getassetprice", "User 0 Deposits {amount} {reserve} in an empty reserve")
  .addParam("asset", "The asset address")
  .setAction(async ({ asset }) => {
    const wallet = await getUserWallet();
    const price = await Functions.RESERVEORACLE.getAssetPrice(wallet, asset);
    console.log(price.toString());
  });
