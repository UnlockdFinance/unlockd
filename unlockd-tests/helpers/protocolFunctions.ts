
import { Wallet, Contract, BigNumber } from "ethers";
import { Contracts } from "./constants";

//Reserves
const approve = async (wallet: Wallet, token: Contract, spender: string, amount: string) => {
    const tx = await token.connect(wallet).approve(spender, amount);
    await tx.wait();
}

const getBalance = async (wallet: Wallet, token: Contract, address: string) => {
    return await token.connect(wallet).balanceOf(address);
  
}

//Nfts
const approveNft = async (wallet: Wallet, collection: Contract, to: string, tokenId: string) => {
    const tx = await collection.connect(wallet).approve(to, tokenId);
    await tx.wait();
}
//LendPool
const deposit = async (wallet: Wallet, asset: string, amount: BigNumber, onBehalfOf: string) => {
    const tx = await Contracts.lendPool.connect(wallet).deposit(asset, amount, onBehalfOf, 0);
    await tx.wait();
}

const withdraw = async (wallet: Wallet, asset: string, amount: BigNumber, to: string) => {
    const tx = await Contracts.lendPool.connect(wallet).withdraw(asset, amount, to);
    await tx.wait();
}

const borrow = async (wallet: Wallet, asset: string, amount: BigNumber, nftAsset: string, nftTokenId: number, onBehalfOf: string) => {
    return await Contracts.lendPool.connect(wallet).borrow(asset, amount, nftAsset, nftTokenId, onBehalfOf, 0);
}
//Nftoracle
const getNftPrice = async(wallet: Wallet, collection: string, tokenid: number) => {
    return await Contracts.nftOracle.connect(wallet).getNFTPrice(collection, tokenid);
}
const setNftPrice = async(wallet: Wallet, collection: string, tokenid: number, price: BigNumber) => {
    return await Contracts.nftOracle.connect(wallet).setNFTPrice(collection, tokenid, price);
}
const getNFTOracleOwner = async(wallet: Wallet) => {
    return await Contracts.nftOracle.connect(wallet).owner();
}

//Addresses provider

const getLendPool = async (wallet: Wallet) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool().wait();
}


//Exported functions
export const Functions = {
    RESERVES: {
        approve: approve,
        getBalance: getBalance,
    },
    NFTS: {
        approve: approveNft
    },
    LENDPOOL: {
        getLendPool: getLendPool,
        deposit: deposit,
        withdraw: withdraw,
        borrow: borrow

    },
    NFTORACLE: {
        getNftPrice: getNftPrice,
        setNftPrice: setNftPrice,
        getNFTOracleOwner: getNFTOracleOwner
    }
}