import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getUserWallet } from "../helpers/config";

// Get the treasury address from the uToken
task("utoken:getreasuryaddress", "Gets the reserve treasury address").setAction(async () => {
  const wallet = await getUserWallet();
  const tx = await Functions.UTOKEN.RESERVE_TREASURY_ADDRESS(wallet);
  console.log(JSON.stringify(tx));
});
