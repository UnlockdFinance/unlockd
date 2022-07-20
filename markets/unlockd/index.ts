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
    MAYC: strategyNft_MAYC,
    CLONEX: strategyNft_CLONEX,
    AZUKI: strategyNft_AZUKI,
    KONGZ: strategyNft_KONGZ,
    COOL: strategyNft_COOL,
    MEEBITS: strategyNft_MEEBITS,
    WOW: strategyNft_WOW,
    LAND: strategyNft_LAND,
  },

  ReserveAssets: {
    [eEthereumNetwork.hardhat]: {
      // WETH: '0x44e12d4D37f6DDAA00c086442998B1A61365BCa9',
      // DAI: '0xa05ffF82bcC0C599984b0839218DC6ee9328d1Fb', 
      // USDC: '0x025FE4760c6f14dE878C22cEb09A3235F16dAe53',
    },
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.localhost]: {
      WETH: '0xB4B4ead1A260F1572b88b9D8ABa5A152D166c104',
      DAI: '0xa05ffF82bcC0C599984b0839218DC6ee9328d1Fb',
      USDC: '0x025FE4760c6f14dE878C22cEb09A3235F16dAe53',
    },
    [eEthereumNetwork.develop]: {
      WETH: '0x3C73A32C11E20101be3D5ff2F67Af15a4ACbF298',
      DAI: '0xcB3b65Fb934d5A49a4738d8c6CC328dc96120ad7',
      USDC: '0x5C6105989c5Be5f88b88fD0b2cE15A282d7c9F07',
    },
    [eEthereumNetwork.kovan]: {
      WETH: '0x2F4dA7F22E603aac1A9840D384d63c91a40ddD8D',
      DAI: '0x02176F918da9E5eBbD42C313713eDD218aFAd52c',
      USDC: '0x0bb5261d7b100bcfAe9976aFFFae50B7dDaBa176',
    },
    [eEthereumNetwork.rinkeby]: {
      WETH: '0x37F9A15422AC08cEe0BEcD6aEeb0351A07ebe4cc',
      DAI: '0x9D86b26a87EF18FfcB47379f1C013506e8cfEf64',
      USDC: '0xcb6AB11831E22bAFc7E29E4e58A109e8A4Bb850c',
    },
    [eEthereumNetwork.goerli]: {
      //WETH: ,
      //DAI: ,
      //USDC: ,
    },
    [eEthereumNetwork.main]: {
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  NftsAssets: {
    [eEthereumNetwork.hardhat]: {
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
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.localhost]: {
      WPUNKS: '0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847',
      BAYC: '0x4e07D87De1CF586D51C3665e6a4d36eB9d99a457',
      DOODLE: '0x2F7f69a3cd22FcfFB5E0C0fB7Ae5Eb278b3919Ff',
      COOL: '0xC7F247a33C79BB0fABc3605479372D3Ba188fcbc',
      MEEBITS: '0x69D1108D37825212736aC101B445b6B57a390d13',
      MAYC: '0x8b89F971cA1A5dE1B7df7f554a3024eE84FeeB05',
    },
    [eEthereumNetwork.develop]: {
      WPUNKS: '0xcDbBC001976F79db2fC1ECfd140031fE970CeaEc',
      BAYC: '0x818674fb778147DC81c85f9af3d5cd73E03545B2',
      DOODLE: '0x54Db2bbf13cC6b2073CcDf9A06B7A2862eb8C3cC',
      COOL: '0xD83948C3deF2a75F9E4A0c0D9e5E7e050a6c2423',
      MEEBITS: '0x0DD78C9209f57088bAB52C953C8bD51BDA3570A2',
      MAYC: '0x5EDB2c61d14648D8b2adb559a6AE13F7E3a11678',
      WOW: '0xdB5DD4ecBd172BfAc198e617122D00CaD12ee2ae',
      CLONEX: '0xA446Ab62fb4bdCEdAF69259354ad0C1C7ccb87ff',
      AZUKI: '0x048e8A2738F4d292Cf30e8468066ce930dFBDAfa',
      KONGZ: '0x65217942f01E563e5F292ba0C7285D0ce85fDE1e',
      LAND: '',
    },
    [eEthereumNetwork.kovan]: {
      WPUNKS: '0x8Ffc30191AdF56C3Bb06BD03A358fdBfA2C06f63',
      BAYC: '0x9131f9809f38FF12E65599530A2cA2Bc9C73Dfef',
      DOODLE: '0x3413C9399D5EBEe4A0a9E4DC1a9D750033A1ff99',
      COOL: '0x7759b23A458Ff7d4F0a7aBA4D170Cff58D1DccA2',
      MEEBITS: '0xfb92ab53d8F72c925BCBdfe1f8F8EddcD89159f8',
      MAYC: '0x4427b97F2AD7ceC0FA40b9a54061956E1ADf5927',
      WOW: '0xe1700D190C39B934E4402030Fa8bE601Babf724A',
      CLONEX: '0x4Ab75F1436D7bDa892DDf1Cd5Fc6774993CF7b05',
      AZUKI: '0xd9570f0Fd191598fA10a5766824316B3BD01001a',
      KONGZ: '0xb08AD9349f7e38414aDA9CeC0a4A803019cAB795',
    },
    [eEthereumNetwork.rinkeby]: {
      WPUNKS: '0x5df4C9cD5A27Cf8229dD79Ae8109DBD109C5e95D',
      BAYC: '0xac160e3C8a8C992866035A140b590fF96B7AF753',
      DOODLE: '0x6CfbA2Fae2A5E5b79F7f51F869Cce01858773033',
      COOL: '0x7D61A186CeD539727cc9cE26dD16e385b48b0192',
      MEEBITS: '0x7251Ff74FA258a612F59E4E790dD83F729129e79',
      MAYC: '0x8636412cdc6672418C95e7d56764770b520Cd6F5',
      WOW: '0x51e83435267A5782B5C96208b24061859eAA6eb8',
      CLONEX: '0x5d4902fc7425B5660b5EeA3b40aCDd9443B4e206',
      AZUKI: '0x8453d7709F7124ab428b7d9BC1c6ea65804ce05C',
      KONGZ: '0x78EEed79Abcc9814eDB1015eC2665c7C427C26C6',
      LAND: '0x0eA6Aa8695Ea90fF8646C93B5A118b4b20c35Eff', // Mock proxy Address
    },
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {
      WPUNKS: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
      BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      // LAND: '0xF87E31492Faf9A91B02Ee0dEAAd50d51d56D5d4d',
    },
  },
};

export default UnlockdConfig;
