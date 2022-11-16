import { providers, Wallet, ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

export const getMnemonicWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  let mnemonic = process.env.MNEMONIC as string;
  return ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
};

export const getMnemonicEmergencyWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  let mnemonic = process.env.MNEMONIC as string;
  let path = "m/44'/60'/0'/0/1";
  return ethers.Wallet.fromMnemonic(mnemonic, path).connect(provider);
};

export const getOwnerWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  return new Wallet(process.env.PRIVATE_KEY as string, provider);
};

export const getUserWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  return new Wallet(process.env.PRIVATE_KEY_USER as string, provider);
};

export const getUser2Wallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  return new Wallet(process.env.PRIVATE_KEY_USER2 as string, provider);
};

export const getUser3Wallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  return new Wallet(process.env.PRIVATE_KEY_USER3 as string, provider);
};

export const getUser4Wallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  return new Wallet(process.env.PRIVATE_KEY_USER4 as string, provider);
};

export const getUser5Wallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
  return new Wallet(process.env.PRIVATE_KEY_USER5 as string, provider);
};

export const getWalletByNumber = async (walletNumber: number): Promise<Wallet> => {
  if (walletNumber == 2) return getUser2Wallet();
  if (walletNumber == 3) return getUser3Wallet();
  if (walletNumber == 4) return getUser4Wallet();
  if (walletNumber == 5) return getUser5Wallet();
  return getUserWallet();
};
