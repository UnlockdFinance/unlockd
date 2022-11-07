import {
  oneEther,
  MOCK_RESERVE_AGGREGATORS_PRICES,
  MOCK_NFT_AGGREGATORS_PRICES,
  MOCK_NFT_AGGREGATORS_MAXSUPPLY,
  ZERO_ADDRESS
} from '../../helpers/constants';
import { ICommonConfiguration, eEthereumNetwork } from '../../helpers/types';

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: 'Commons',
  UTokenNamePrefix: 'Unlockd interest bearing',
  UTokenSymbolPrefix: 'unlockd',
  DebtTokenNamePrefix: 'Unlockd debt bearing',
  DebtTokenSymbolPrefix: "unlockdDebt",

  ProviderId: 0, // Overriden in index.ts
  OracleQuoteCurrency: 'ETH',
  OracleQuoteUnit: oneEther.toString(),
  ProtocolGlobalParams: {
    MockUsdPrice: '425107839690',
    UsdAddress: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e', //index 19, lowercase
    NilAddress: '0x0000000000000000000000000000000000000000',
    OneAddress: '0x0000000000000000000000000000000000000001',
  },

  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    UNftNamePrefix: 'Unlock Bound NFT',
    UNftSymbolPrefix: 'UBound',
    AllAssetsInitialPrices: {
      ...MOCK_RESERVE_AGGREGATORS_PRICES,
    },
    AllNftsInitialPrices: {
      ...MOCK_NFT_AGGREGATORS_PRICES,
    },
    AllNftsMaxSupply: {
      ...MOCK_NFT_AGGREGATORS_MAXSUPPLY,
    },
  },

  // ----------------
  // COMMON PROTOCOL ADDRESSES ACROSS POOLS
  // ----------------

  ProxyAdminPool: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: '0xc4738F82A7945816755E8e12c06E8eCF71526167',
    [eEthereumNetwork.main]: '0x501c991E0D31D408c25bCf00da27BdF2759A394a',
  },
  ProxyAdminFund: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: '0xc0025E8b72EE8e2792be48F0a39f3F6b4d5D73B0',
    [eEthereumNetwork.main]: '0x2A71a0F5cef1fFc519027AD12f19453110e70666',
  },

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.hardhat]: '0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59',
    [eEthereumNetwork.localhost]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.goerli]: '0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59',
    [eEthereumNetwork.main]: '0x868964fa49a6fd6e116FE82c8f4165904406f479',
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.hardhat]: '0x2db0E3e340c561a0DBc92B07173d4FbC5c47f062',
    [eEthereumNetwork.localhost]: '0x51d25beeef0193c96cfda7fff9bd7411c2bdbdd3',
    [eEthereumNetwork.goerli]: '0x2db0E3e340c561a0DBc92B07173d4FbC5c47f062',
    [eEthereumNetwork.main]: '0x2CFa21b4dEc4409670899d05b8644e9C432250de',
  },
  EmergencyAdminIndex: 1,
  LendPoolLiquidator: {
    [eEthereumNetwork.hardhat]: '0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15',
    [eEthereumNetwork.localhost]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.goerli]: '0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59',
    [eEthereumNetwork.main]: '0x868964fa49a6fd6e116FE82c8f4165904406f479',
  },
  LendPoolLiquidatorIndex: 0,
  LtvManager: {                             // The wallet address that will be set as loan to value Manager
    [eEthereumNetwork.hardhat]: '0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15',
    [eEthereumNetwork.localhost]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.goerli]: '0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59',
    [eEthereumNetwork.main]: '',
  }, 
  LtvManagerIndex: 0,

  UNFTRegistry: { /// Add contract From U
    [eEthereumNetwork.hardhat]: '0x38b9ACfdFCB9072CBEE195172AEC60ED14880327',
    [eEthereumNetwork.localhost]: '0x8b89F971cA1A5dE1B7df7f554a3024eE84FeeB05',
    [eEthereumNetwork.goerli]: '0x478F4396227b863D4e299BA94aB9A01Db825ab2f',
    [eEthereumNetwork.main]: '0x79d922DD382E42A156bC0A354861cDBC4F09110d',
  },

  ProviderRegistry: {
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.goerli]: '0x8817F99eb2528eB42b025bE419cbe07f59cEd295',
    [eEthereumNetwork.main]: '',
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.hardhat]: '0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15',
    [eEthereumNetwork.localhost]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.goerli]: '0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59',
    [eEthereumNetwork.main]: '0x868964fa49a6fd6e116FE82c8f4165904406f479',
  },
 
  ReserveOracle: {
    [eEthereumNetwork.hardhat]: '', /// LEND POOL ADDRESS PROVIDER REGISTRY 
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '',
  },
  NFTOracle: {
    [eEthereumNetwork.hardhat]:'',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '',
  },

  ReserveAggregators: {
    // https://data.chain.link/ethereum/mainnet/crypto-eth
    // https://docs.chain.link/docs/ethereum-addresses/
    [eEthereumNetwork.hardhat]: {
      DAI: '0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D',
      USDC: '0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf',
      USD: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
    },
    [eEthereumNetwork.localhost]: {
      DAI: '0x10F6794a3Df86bD8B97c7d6D625BAB54677D443b',
      USDC: '0x2cC3790f7CF280fA898E4913CA980410cF38e53b',
      USD: '0x6B8dcBD1bb131ED184221902df1Fe21019ccD7dc',
    },
    [eEthereumNetwork.goerli]: {
      DAI: '0x0d79df66BE487753B02D015Fb622DED7f0E9798d',
      USDC: '0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7',
      USD: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',//ETH - USD
    },
    [eEthereumNetwork.main]: {
      USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', //ETH - USD
    },
  },
  ReserveAssets: {
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {},
  },
  ReservesConfig: {},
  NftsAssets: {
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {},
  },
  NftsConfig: {
  },
  WrappedNativeToken: { //WETH
    [eEthereumNetwork.hardhat]: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // deployed in local evm
    [eEthereumNetwork.localhost]: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    [eEthereumNetwork.goerli]: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    [eEthereumNetwork.main]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  CryptoPunksMarket: { // hardhat dev:deploy-mock-nfts 
    [eEthereumNetwork.hardhat]: '', // deployed in local evm
    [eEthereumNetwork.localhost]: '0xb2f97A3c2E48cd368901657e31Faaa93035CE390',
    [eEthereumNetwork.goerli]: '0x8B6A9c27A5D8bD4B20431EE636B02Fc4aaD778d7',
    [eEthereumNetwork.main]: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
  },
  WrappedPunkToken: {
    [eEthereumNetwork.hardhat]: '0x74e4418A41169Fb951Ca886976ccd8b36968c4Ab', // deployed in local evm
    [eEthereumNetwork.localhost]: '0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847',
    [eEthereumNetwork.goerli]: '0xa9ED41c141d04647276F24EE06258e57a041a158',
    [eEthereumNetwork.main]: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
  },

  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.hardhat]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.localhost]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.goerli]: '0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59',
    [eEthereumNetwork.main]: '0x43078AbfB76bd24885Fd64eFFB22049f92a8c495',
  },
  IncentivesController: {
    [eEthereumNetwork.hardhat]: '0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15',
    [eEthereumNetwork.localhost]: "0xd062F368df81E0A7f4fB6e8F5ce5AC7deD388796",
    [eEthereumNetwork.goerli]: '0x676DA7Ad769870970EdE52D896057331fC4892F7',
    [eEthereumNetwork.main]: '0x26FC1f11E612366d3367fc0cbFfF9e819da91C8d',
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  NFTXVaultFactory: {
    [eEthereumNetwork.hardhat]: '0xe01Cf5099e700c282A56E815ABd0C4948298Afae',//goerli address for forking tests
    [eEthereumNetwork.localhost]: '0x10F6794a3Df86bD8B97c7d6D625BAB54677D443b',
    [eEthereumNetwork.goerli]: '0xe01Cf5099e700c282A56E815ABd0C4948298Afae',
    [eEthereumNetwork.main]: '0xBE86f647b167567525cCAAfcd6f881F1Ee558216',
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  SushiSwapRouter: {
    [eEthereumNetwork.hardhat]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', //goerli address for forking tests
    [eEthereumNetwork.localhost]: '0x2cC3790f7CF280fA898E4913CA980410cF38e53b',
    [eEthereumNetwork.goerli]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', 
    [eEthereumNetwork.main]: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  },
};
