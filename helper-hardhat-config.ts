// @ts-ignore
import { HardhatNetworkForkingUserConfig } from "hardhat/types";
import { eEthereumNetwork, iParamsPerNetwork } from "./helpers/types";

require("dotenv").config();

const FORK = process.env.FORK || "";
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : 0;
const GWEI = 1000 * 1000 * 1000;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || ""

export const buildForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode;
  if (FORK) {
    forkMode = {
      url: RPC_ENDPOINT,
    };
    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    } 
  }
  return forkMode;
};

interface AccountsConfig {
  mnemonic: string;
  path: string;
  initialIndex: number;
  count: number;
  passphrase: string;
}
export const buildAccountsConfig = (): AccountsConfig => {
  return {
    mnemonic: process.env.MNEMONIC!,
    path: "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 20,
    passphrase: "",
  }
};

export const NETWORKS_DEFAULT_GAS: iParamsPerNetwork<number> = {
  [eEthereumNetwork.goerli]: 100 * GWEI,
  [eEthereumNetwork.main]: 65 * GWEI,
  [eEthereumNetwork.hardhat]: 65 * GWEI,
  [eEthereumNetwork.localhost]: 65 * GWEI,
};

export const BLOCK_TO_FORK: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.main]: 0,
  [eEthereumNetwork.goerli]: 0,
  [eEthereumNetwork.hardhat]: 0,
  [eEthereumNetwork.localhost]: 0,
};
