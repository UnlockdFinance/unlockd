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
    console.log("Loan ID: ", loanIdTracker.toString());
   
}); 

task("lendpoolloan:getloan", "Returns the loan")
.addParam("loanid", "The loan id")
.setAction( async ({loanid}) => {
    const wallet = await getUserWallet();  
    const loan= await Functions.LENDPOOL_LOAN.getLoan(wallet, loanid);
    console.log("Loan data: ");
    console.log("Loan id: ", loan.loanId.toString());
    console.log("Borrower: ", loan.borrower);
    console.log("NFT Collection: ", loan.nftAsset);
    console.log("NFT Token ID: ", loan.nftTokenId.toString());
    console.log("Reserve Asset: ", loan.reserveAsset);
    console.log("Scaled amount", loan.scaledAmount.toString() / 10**18);
    console.log("Bid start timestamp (UNIX): ", loan.bidStartTimestamp.toString());
    console.log("Bidder address: ", loan.bidderAddress);
    console.log("Bid price: ", loan.bidPrice.toString());
    console.log("Bid borrow amount: ", loan.bidBorrowAmount.toString());
    console.log("First bidder address: ", loan.firstBidderAddress);
   
}); 

task("lendpoolloan:getcollateralloanid", "Returns the loan")
.addParam("collection", "The collection address")
.addParam("tokenid", "The NFT id")
.setAction( async ({collection, tokenid}) => {
    const wallet = await getUserWallet();  
    const loan= await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, collection, tokenid);
    console.log(loan);
   
}); 
