import { IUnlockdConfiguration, eEthereumNetwork } from "../../helpers/types";

import { CommonsConfig } from "./commons";
import { strategyWETH, strategyDAI, strategyUSDC } from "./reservesConfigs";
import {
  strategyNft_AZUKI,
  strategyNft_BAYC,
  strategyNft_CLONEX,
  strategyNft_COOL, 
  strategyNft_DOODLE,
  strategyNft_KONGZ,
  strategyNft_MAYC,
  strategyNft_MEEBITS,
  strategyNft_WOW,
  strategyNft_WPUNKS,
  strategyNft_LAND,
} from "./nftsConfigs";

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const UnlockdConfig: IUnlockdConfiguration = {
  ...CommonsConfig,
  MarketId: "Unlockd genesis market",
  ProviderId: 1,
  ReservesConfig: { 
    WETH: strategyWETH,
    // DAI: strategyDAI,
    // USDC: strategyUSDC,
  },
  NftsConfig: {
    WPUNKS: strategyNft_WPUNKS,
    BAYC: strategyNft_BAYC,
    AZUKI: strategyNft_AZUKI,
    /* DOODLE: strategyNft_DOODLE,
     MAYC: strategyNft_MAYC,
    CLONEX: strategyNft_CLONEX,
    KONGZ: strategyNft_KONGZ,
    COOL: strategyNft_COOL,
    MEEBITS: strategyNft_MEEBITS,
    WOW: strategyNft_WOW,
    LAND: strategyNft_LAND, */
  },

  ReserveAssets: {
    [eEthereumNetwork.hardhat]: {
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      //DAI: '0x9D233A907E065855D2A9c7d4B552ea27fB2E5a36',
      //USDC: '0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557',
    },
    [eEthereumNetwork.localhost]: {
      WETH: "0xB4B4ead1A260F1572b88b9D8ABa5A152D166c104",
      DAI: "0xba8E26A7ea78c628331baFD32eB0C77047F2cBCa",
      USDC: "0x103a065B2c676123dF6EdDbf41e06d361Dd15905",
    },
    [eEthereumNetwork.goerli]: {
      WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      //DAI: "0xba8E26A7ea78c628331baFD32eB0C77047F2cBCa",
      //USDC: "0x103a065B2c676123dF6EdDbf41e06d361Dd15905",
    },
    [eEthereumNetwork.main]: {
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      //DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      //USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
  },
  NftsAssets: {
    [eEthereumNetwork.hardhat]: {
      WPUNKS: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",
      BAYC: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", 
      AZUKI: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
      //MAYC: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      //DOODLE: "0x11FC8C3fd1826f16aD154c18355bcA89a742B1C8",
      // COOL: '0xC7F247a33C79BB0fABc3605479372D3Ba188fcbc',
      // MEEBITS: '0x69D1108D37825212736aC101B445b6B57a390d13',
      // WOW: '0x1864c9342339c36588F7f31d1079690a7003c7a2',
      // CLONEX: '0xd062F368df81E0A7f4fB6e8F5ce5AC7deD388796',
      // KONGZ: '0xF9107B537482fE7cE75a6646BEad2A97BFA4eB0E',
    },
    [eEthereumNetwork.localhost]: {
      WPUNKS: "0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847",
      BAYC: "0x4e07D87De1CF586D51C3665e6a4d36eB9d99a457",
      DOODLE: "0x2F7f69a3cd22FcfFB5E0C0fB7Ae5Eb278b3919Ff",
    },
    [eEthereumNetwork.goerli]: { 
      WPUNKS: "0xC28f63b132e3cEcD44d32AE7505A8E756B7C41bf",
      BAYC: "0x3705a823c23f7a94562295cA60Ec00617DA6823b",
      //DOODLE: '0x11FC8C3fd1826f16aD154c18355bcA89a742B1C8',
      //AZUKI: '0xaD46D0235b2698aaD03803443b7a50383bdefc1c',
      // COOL: '0xC0c31e50c6412f76C84B31b825b8DeF7072B042d',
      // MEEBITS: '0x05a95e8509498cc461e5c2f157eaebb7b8ad1b78',
      // MAYC: '0x8c15f1c3868f7439549d85fe1b09e34e9646a983',
      // WOW: '0x19a0c8e54abe75032f1a30a16524254d2067169b',
      // CLONEX: '0xebcf822cea4807a75638de8de73f154c6e4d8a86',
      // KONGZ: '0x616aC013B9230CF272D6bD875889450636833CA4',
      // LAND: '0x04659598aAf487f139118996f99a186463037209',
    },
    [eEthereumNetwork.main]: {
      WPUNKS: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",
      BAYC: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      DOODLE: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e",
      AZUKI: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
    },
  },
};

export default UnlockdConfig;
