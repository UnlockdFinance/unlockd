import {Contracts} from './constants';
import { Wallet, Contract, BigNumber } from "ethers";


const approve = async (wallet: Wallet, token: Contract, spender: string, amount: string) => {
    const tx = await token.connect(wallet).approve(spender, amount);
    await tx.wait();
}

const deposit = async (wallet: Wallet, asset: string, amount: BigNumber, onBehalfOf: string) => {
    const tx = await Contracts.lendPool.connect(wallet).deposit(asset, amount, onBehalfOf, 0);
    await tx.wait();

}

const getLendPool = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool().wait();
}

const getBalance = async (wallet: Wallet, token: Contract, address: string) => {
    return await token.connect(wallet).balanceOf(address);
  
}

//Exported functions
export const Functions = {
    RESERVES: {
        approve: approve,
        getBalance: getBalance,
    },
    LENDPOOL: {
        getLendPool: getLendPool,
        deposit: deposit,

    }
}