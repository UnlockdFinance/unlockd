import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import {getWallet } from "../helpers/config"; 
import { MockContracts, Contracts } from "../helpers/constants";
import { parseUnits } from "@ethersproject/units";


task("unlockd-tests:deposit:simple-deposit", "Deploy nft oracle for full enviroment").setAction( async () => {
    const wallet = await getWallet();                                                                 
    await Functions.LENDPOOL.deposit(wallet, MockContracts.DAI.address, parseUnits('1.0'), "0x1a470e9916f3dFF8E268A69A39fa2E9F7B954927");
   
})