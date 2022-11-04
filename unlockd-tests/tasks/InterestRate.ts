import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet } from "../helpers/config"; 
 
task("tests:interestRate:variableRateSlope1", "User gets variableRateSlope1 rate")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.INTERESTRATE.variableRateSlope1(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:interestRate:variableRateSlope2", "User gets variableRateSlope2 rate")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.INTERESTRATE.variableRateSlope2(wallet)
    console.log(JSON.stringify(tx));
}); 

task("tests:interestRate:baseVariableBorrowRate", "User gets baseVariableBorrowRate rate")
.setAction( async () => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.INTERESTRATE.baseVariableBorrowRate(wallet)
    console.log(JSON.stringify(tx));
}); 