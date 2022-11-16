// @ts-ignore
import { HardhatNetworkForkingUserConfig } from "hardhat/types";
import { eEthereumNetwork, iParamsPerNetwork } from "./helpers/types";

require("dotenv").config();

const INFURA_KEY = process.env.INFURA_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";
const FORK = process.env.FORK || "";
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : 0;
const FORK_NETWORK = process.env.FORK || "";
const GWEI = 1000 * 1000 * 1000;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || ""

export const buildForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode;
  if (FORK) {
    console.log("FORK");
    forkMode = {
      url: RPC_ENDPOINT,
    };
    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    }
  }
  return forkMode;
};

export const buildUnlockdForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode;
  if (FORK_NETWORK) {
    switch (FORK_NETWORK) {
      case "MAINNET":
        forkMode = {
          url: ALCHEMY_KEY
            ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
            : `https://mainnet.infura.io/v3/${INFURA_KEY}`,
        };
        break;
      case "GOERLI":
        forkMode = {
          url: ALCHEMY_KEY
            ? `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_KEY}`
            : `https://goerli.infura.io/v3/${INFURA_KEY}`,
        };
        break;
    }

    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    }
  }
  return forkMode;
};

export const NETWORKS_DEFAULT_GAS: iParamsPerNetwork<number> = {
  [eEthereumNetwork.goerli]: 65 * GWEI,
  [eEthereumNetwork.main]: 65 * GWEI,
  [eEthereumNetwork.hardhat]: 65 * GWEI,
  [eEthereumNetwork.localhost]: 65 * GWEI,
};

export const BLOCK_TO_FORK: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.main]: 13623705,
  [eEthereumNetwork.goerli]: 0,
  [eEthereumNetwork.hardhat]: 0,
  [eEthereumNetwork.localhost]: 0,
};
