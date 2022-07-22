import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import {getOwnerWallet, getUserWallet } from "../helpers/config"; 
import {  Contracts, MockContracts } from "../helpers/constants";
import { parseUnits } from "@ethersproject/units";

//Deposit funds to the pool
task("lendpool:deposit", "User 0 Deposits {amount} {reserve} in an empty reserve")
.addParam("amount", "Reserve amount") 
.addParam("reserve", "The reserve")  //must be set to 'DAI' or 'USDC'
.addParam("onbehalfof", "On behalf of to deposit")
.setAction( async ({amount, reserve, onbehalfof}) => {
    const wallet = await getUserWallet();  
    const tokenContract = MockContracts[reserve];
    amount = await parseUnits(amount.toString())    
  
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount)  
    await Functions.LENDPOOL.deposit(wallet, tokenContract.address, amount, onbehalfof);
   
}); 
//Withdrawing funds from the pool
task("lendpool:withdraw", "User 0 Withdraws {amount} {reserve} from the reserves")
.addParam("amount", "Amount to withdraw") 
.addParam("reserve", "The reserve")  //must be set to 'DAI' or 'USDC'
.addParam("to", "Who will reveive the withdrawal")
.setAction( async ({amount, reserve, to}) => {
    const wallet = await getUserWallet();  
    const tokenContract = MockContracts[reserve];
    amount = await parseUnits(amount.toString())    
    
    await Functions.LENDPOOL.withdraw(wallet, tokenContract.address, amount, to);
   
}); 
//Borrowing 
task("lendpool:borrow", "User 0 Withdraws {amount} {reserve} from the reserves")
.addParam("asset", "reserve asset to borrow") 
.addParam("amount", "amount to borrow")  //must be set to 'DAI' or 'USDC'
.addParam("name", "NFT collection")
.addParam("collection", "NFT name")
.addParam("tokenid", "the NFT token ID")
.addParam("onbehalfof", "Who will reveive the borrowed amount")
.setAction( async ({asset, amount, name, collection, tokenid, onbehalfof}) => {
    const wallet = await getUserWallet();  
    amount = await parseUnits(amount.toString())    
    console.log(amount);
    const nftContract = MockContracts[name];
    await Functions.NFTS.approve(wallet, nftContract, Contracts.lendPool.address, tokenid);
    await Functions.LENDPOOL.borrow(wallet, asset, amount, collection, tokenid, onbehalfof);
   
}); 