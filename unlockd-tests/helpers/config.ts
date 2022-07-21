import { Contract, providers , utils, Wallet } from "ethers";
import dotenv from 'dotenv';
dotenv.config();

export const getWallet = async (): Promise<Wallet> =>{
    const provider = await new providers.JsonRpcProvider( process.env.RPC_ENDPOINT ) ;
    return new Wallet( process.env.PRIVATE_KEY as string, provider);
}  

