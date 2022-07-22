import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import {getWallet } from "../helpers/config"; 
import {  Contracts, MockContracts } from "../helpers/constants";
import {
    convertToCurrencyDecimals,
  } from "../../helpers/contracts-helpers";
import { parseUnits } from "@ethersproject/units";


task("unlockd-tests:deposit:simple-deposit", "User 0 Deposits {amount} {reserve} in an empty reserve")
.addParam("amount", "Reserve amount") 
.addParam("reserve", "The reserve")  //must be set to 'DAI' or 'USDC'
.addParam("onbehalfof", "On behalf of to deposit")
.setAction( async ({amount, reserve, onbehalfof}) => {
    const wallet = await getWallet();  
    const tokenContract = MockContracts[reserve];
    amount = await parseUnits(amount.toString())    
  
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount)  
    await Functions.LENDPOOL.deposit(wallet, tokenContract.address, amount, onbehalfof);
   
}); 