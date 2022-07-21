import { task } from "hardhat/config";
import { Contract, providers, utils, Wallet } from "ethers";
import dotenv from 'dotenv';
import {getWallet } from "./helpers/config"; 
import addressesProviderArtifact from '../artifacts/contracts/protocol/LendPoolAddressesProvider.sol/LendPoolAddressesProvider.json'; //import the required contract abis
dotenv.config();

const testFunction = async () => {
    //Get the signer address
    const wallet = await getWallet();
    //the desired contract (example with the addresses provider: params are => (contract_address, abi, wallet) )
    const addressesProviderContract = new Contract('0xc6F5b7A8dF08D7aeC8fc0B24011661599eFc8ca8', addressesProviderArtifact.abi, wallet);
    //call the required function
    const result = await addressesProviderContract.getNFTOracle();
    console.log(result);
    
};
testFunction().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  
 