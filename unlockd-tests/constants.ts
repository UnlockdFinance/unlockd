import { task } from "hardhat/config";
import { Contract, providers, utils, Wallet } from "ethers";
import dotenv from 'dotenv';
import {getWallet } from "./helpers/config"; 
import addressesProviderArtifact from '../artifacts/contracts/protocol/LendPoolAddressesProvider.sol/LendPoolAddressesProvider.json'; //import the required contract abis
import lendPoolArtifact from "../artifacts/contracts/protocol/LendPool.sol/LendPool.json";
import lendPoolLoanArtifact from "../artifacts/contracts/protocol/LendPoolLoan.sol/LendPoolLoan.json";
import erc20Artifact from "../artifacts/contracts/mock/MintableERC20.sol/MintableERC20.json";
import deployments from "../deployments/deployed-contracts-rinkeby.json"
dotenv.config();

// Protocol
export const addressesProviderContract = new Contract(deployments.LendPoolAddressesProvider.address, addressesProviderArtifact.abi);
export const lendPoolContract = new Contract(deployments.LendPool.address, lendPoolArtifact.abi);
export const lendPoolLoanContract = new Contract(deployments.LendPoolLoan.address, lendPoolLoanArtifact.abi);

// Mocks
export const erc20Contract = new Contract(deployments.DAI.address, erc20Artifact.abi);
 