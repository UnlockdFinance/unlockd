import lendPoolContract from "../artifacts/contracts/protocol/LendPool.sol/LendPool.json";
import { ethers } from "hardhat"
import * as dotenv from "dotenv";
dotenv.config();

const PK1 = process.env.PRIVATE_KEY;
var provider = ethers.providers.getDefaultProvider('rinkeby');
var address  = '0x74a9a20f67d5499b62255bfa1dca195d06aa4617';
var abi = lendPoolContract.abi;

