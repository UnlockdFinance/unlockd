import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import {getOwnerWallet, getUserWallet } from "../helpers/config"; 
import {  Contracts, MockContracts } from "../helpers/constants";
import { parseUnits } from "@ethersproject/units";
  
//Deposit funds to the pool
task("lendpoolloan:getloanidtracker", "Returns the loan ID tracker")
.setAction( async () => {
    const wallet = await getUserWallet();  
    const loanIdTracker = await Functions.LENDPOOL_LOAN.getLoanIdTracker(wallet);
    console.log(loanIdTracker);
   
}); 

task("lendpoolloan:getloan", "Returns the loan")
.addParam("loanid", "The loan id")
.setAction( async ({loanid}) => {
    const wallet = await getUserWallet();  
    const loan= await Functions.LENDPOOL_LOAN.getLoan(wallet, loanid);
    console.log(loan);
   
}); 
