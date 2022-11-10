import {ethers} from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Env Variables
const API_KEY = process.env.ALCHEMY_KEY || "";
const PK1 = process.env.PRIVATE_KEY || "";
const MARKET_ADDRESS = process.env.CRYPTOPUNKSMARKET || "";
const MINT_ADDRESS = process.env.MINTABLEERC721 || "";
const LENDPOOL_ADDRESS = process.env.LENDPOOL || "";

// Contracts JSON
const marketContract = require(
    "../artifacts/contracts/mock/CryptoPunksMarket.sol/CryptoPunksMarket.json"
);

const mintContract = require(
    "../artifacts/contracts/mock/MintableERC721.sol/MintableERC721.json"
);

const lendPoolContract = require(
    "../artifacts/contracts/protocol/LendPool.sol/LendPool.json"
);

// Provider
//const alchemyProvider = new ethers.providers.AlchemyProvider("Goerli", API_KEY);
const rpc = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/daf6274673de4818800cfdaaf6ed1c57"
);

// Signer
const signer = new ethers.Wallet(PK1, rpc);

// Contracts
const punksMarket = new ethers.Contract(MARKET_ADDRESS, marketContract.abi, signer);
const erc721 = new ethers.Contract(MINT_ADDRESS, mintContract.abi, signer);
const lendPool = new ethers.Contract("0xA0cf099d1547B15823d96C7663A1EA0b5C25231e", mintContract.abi, signer);

async function main() {
    const test = await lendPool.deposit("");
    console.log(test);
}

main();