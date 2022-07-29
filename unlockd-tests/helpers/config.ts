import { Contract, providers , utils, Wallet } from "ethers";
import dotenv from 'dotenv';
dotenv.config();

export const getOwnerWallet = async (): Promise<Wallet> =>{
    const provider = await new providers.JsonRpcProvider( process.env.RPC_ENDPOINT ) ;
    return new Wallet( process.env.PRIVATE_KEY as string, provider);
}  

export const getUserWallet = async (): Promise<Wallet> =>{
    const provider = await new providers.JsonRpcProvider( process.env.RPC_ENDPOINT ) ;
    return new Wallet( process.env.PRIVATE_KEY_USER as string, provider);
}  


