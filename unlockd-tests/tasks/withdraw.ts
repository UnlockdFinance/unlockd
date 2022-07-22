import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import {getWallet } from "../helpers/config"; 

import { parseUnits } from "@ethersproject/units";


task("unlockd-tests:deposit:simple-withdraw", "User 0 Deposits 1000 DAI in an empty reserve")
.addFlag("amount", "Reserve amount")
.setAction( async ({amount}) => {
   /*  const wallet = await getWallet();                                                                 
    await Functions.LENDPOOL.withdraw(wallet, MockContracts.DAI.address, amount, "0x1a470e9916f3dFF8E268A69A39fa2E9F7B954927");
    */
});