import { oneRay, ZERO_ADDRESS } from '../../helpers/constants';
import { IUnlockdConfiguration, eEthereumNetwork } from '../../helpers/types';

import { CommonsConfig } from './commons';
import {
  strategyWETH,
  strategyDAI,
  strategyUSDC,
} from './reservesConfigs';
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
} from './nftsConfigs';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const UnlockdConfig: IUnlockdConfiguration = {
  ...CommonsConfig,
  MarketId: 'Unlockd genesis market',
  ProviderId: 1,
  ReservesConfig: { 
    WETH: strategyWETH,
    DAI: strategyDAI,
    USDC: strategyUSDC,
  },
  NftsConfig: {
    WPUNKS: strategyNft_WPUNKS,
    BAYC: strategyNft_BAYC,
    DOODLE: strategyNft_DOODLE,
    /*  MAYC: strategyNft_MAYC,
    CLONEX: strategyNft_CLONEX,
    AZUKI: strategyNft_AZUKI,
    KONGZ: strategyNft_KONGZ,
    COOL: strategyNft_COOL,
    MEEBITS: strategyNft_MEEBITS,
    WOW: strategyNft_WOW,
    LAND: strategyNft_LAND, */
  },

  ReserveAssets: {
    [eEthereumNetwork.hardhat]: {
      // WETH: '0x44e12d4D37f6DDAA00c086442998B1A61365BCa9',
      // DAI: '0xa05ffF82bcC0C599984b0839218DC6ee9328d1Fb', 
      // USDC: '0x025FE4760c6f14dE878C22cEb09A3235F16dAe53',
    },
    [eEthereumNetwork.localhost]: {
      WETH: '0xe83eC7DdC55b673f852c5e2c230D353F45FE1739',
      DAI: '0x4C791a863374043b7270aE67B8bbE3483A4B1FD1',
      USDC: '0xCfacF3D15F03441930535686014E84Fb91153966',
    },
    [eEthereumNetwork.goerli]: {
      WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
      //DAI: '0xba8E26A7ea78c628331baFD32eB0C77047F2cBCa',
      //USDC: '0x103a065B2c676123dF6EdDbf41e06d361Dd15905',
    },
    [eEthereumNetwork.main]: {
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  NftsAssets: {
    [eEthereumNetwork.hardhat]: { //dev:deploy-mock-nfts
      // WPUNKS: '0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847',
      // BAYC: '0x4e07D87De1CF586D51C3665e6a4d36eB9d99a457',
      // DOODLE: '0x2F7f69a3cd22FcfFB5E0C0fB7Ae5Eb278b3919Ff',
      // COOL: '0xC7F247a33C79BB0fABc3605479372D3Ba188fcbc',
      // MEEBITS: '0x69D1108D37825212736aC101B445b6B57a390d13',
      // MAYC: '0x8b89F971cA1A5dE1B7df7f554a3024eE84FeeB05',
      // WOW: '0x1864c9342339c36588F7f31d1079690a7003c7a2',
      // CLONEX: '0xd062F368df81E0A7f4fB6e8F5ce5AC7deD388796',
      // AZUKI: '0x10F6794a3Df86bD8B97c7d6D625BAB54677D443b',
      // KONGZ: '0xF9107B537482fE7cE75a6646BEad2A97BFA4eB0E',
    },
    [eEthereumNetwork.localhost]: {
      WPUNKS: '0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847',
      BAYC: '0x4e07D87De1CF586D51C3665e6a4d36eB9d99a457',
      DOODLE: '0x2F7f69a3cd22FcfFB5E0C0fB7Ae5Eb278b3919Ff',
    },
    [eEthereumNetwork.goerli]: {
      //WPUNKS: '0xa9ED41c141d04647276F24EE06258e57a041a158',
      BAYC: '0x39F14ED58de5955b85EF0832aD9bBa009202f0EB',
      // DOODLE: '0x324A7e207E292F395A09956FCEac6e638a4E9581',
      // COOL: '0xC0c31e50c6412f76C84B31b825b8DeF7072B042d',
      // MEEBITS: '0x05a95e8509498cc461e5c2f157eaebb7b8ad1b78',
      // MAYC: '0x8c15f1c3868f7439549d85fe1b09e34e9646a983',
      // WOW: '0x19a0c8e54abe75032f1a30a16524254d2067169b',
      // CLONEX: '0xebcf822cea4807a75638de8de73f154c6e4d8a86',
      // AZUKI: '0xC637a2BED4a06D0aF324802927CC08b70C780c9a',
      // KONGZ: '0x616aC013B9230CF272D6bD875889450636833CA4',
      // LAND: '0x04659598aAf487f139118996f99a186463037209', 
    },
    [eEthereumNetwork.main]: {
      WPUNKS: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
      BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      LAND: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
    },
  },
};

export default UnlockdConfig;
