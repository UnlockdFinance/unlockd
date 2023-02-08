import {
  MOCK_NFT_AGGREGATORS_MAXSUPPLY,
  MOCK_NFT_AGGREGATORS_PRICES,
  MOCK_RESERVE_AGGREGATORS_PRICES,
  oneEther,
  ZERO_ADDRESS,
} from "../../helpers/constants";
import { eEthereumNetwork, ICommonConfiguration } from "../../helpers/types";

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: "Commons",
  UTokenNamePrefix: "Unlockd interest bearing",
  UTokenSymbolPrefix: "unlockd",
  DebtTokenNamePrefix: "Unlockd debt bearing",
  DebtTokenSymbolPrefix: "unlockdDebt",

  ProviderId: 0, // Overriden in index.ts
  OracleQuoteCurrency: "ETH",
  OracleQuoteUnit: oneEther.toString(),
  ProtocolGlobalParams: {
    MockUsdPrice: "425107839690",
    UsdAddress: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //index 19, lowercase
    NilAddress: "0x0000000000000000000000000000000000000000",
    OneAddress: "0x0000000000000000000000000000000000000001",
  },

  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    UNftNamePrefix: "Unlock Bound NFT",
    UNftSymbolPrefix: "UBound",
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
    [eEthereumNetwork.goerli]: '0x8CBfc7F0f4Fd5D4221335f471aEC44B822f56660',
    [eEthereumNetwork.main]: '0xb7493E15Af772c14c7cE3180Ff388925e6593c6b',
  },
  ProxyAdminFund: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: '0xA9d67F1b0f46cc0588ED20AA071aB50b9A2D38f8',
    [eEthereumNetwork.main]: '0x38a97DE7216b54FCc83A918CF5dB1Bb0447913a4',
  },

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.hardhat]: "0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15",
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59",
    [eEthereumNetwork.main]: "0x0756cCC18E390dbdD0F9855A3B38458bb6157E31",
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.hardhat]: "0x51d25beeef0193c96cfda7fff9bd7411c2bdbdd3",
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0x51d25beeef0193c96cfda7fff9bd7411c2bdbdd3",
    [eEthereumNetwork.main]: "0x653f5769e08FB9cd6c4faC48Bad8a1B64B7Cf85d",
  },
  EmergencyAdminIndex: 1,
  LendPoolLiquidator: {
    [eEthereumNetwork.hardhat]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.localhost]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.goerli]: "0xbec583e93262ad87b08cffbd4d8d97fc80e191ac",
    [eEthereumNetwork.main]: "0x0685a82e74fbe03B7cC217f3DeD902C4d1aA78Cd",
  },
  LendPoolLiquidatorIndex: 0,
  LtvManager: { 
    // The wallet address that will be set as loan to value Manager
    [eEthereumNetwork.hardhat]: "0x392b30d9c3ac1ef8dac7dfc394311fb9e5554c53",
    [eEthereumNetwork.localhost]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.goerli]: "0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59",
    [eEthereumNetwork.main]: "0x0685a82e74fbe03B7cC217f3DeD902C4d1aA78Cd",
  },
  LtvManagerIndex: 0,

  UNFTRegistry: {
    /// Add contract From U
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: "0x8b89F971cA1A5dE1B7df7f554a3024eE84FeeB05",
    [eEthereumNetwork.goerli]: "0x66Bd8515F157A203EEFedc4A739E3e0BcE7FA76c",
    [eEthereumNetwork.main]: "0x255f25335662c88Fcc7deC402cADf2f4f0E08300",
  },

  ProviderRegistry: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x7C5AB2070cC4820e50145606d9f24409175959Ad",
    [eEthereumNetwork.main]: "0xe5BF48BC5Fd3FCD1c7Fc76795C7b08ccc139a949",
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.hardhat]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0xB9E29f1256F1AfDc460b99BB4307a20B6053bd59",
    [eEthereumNetwork.main]: "0x67539d650922Af9D2c611251ac9749f167e51Ac0",
  },
 
  ReserveOracle: {
    [eEthereumNetwork.hardhat]: "", /// LEND POOL ADDRESS PROVIDER REGISTRY
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  NFTOracle: {
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },

  ReserveAggregators: {
    // https://data.chain.link/ethereum/mainnet/crypto-eth
    // https://docs.chain.link/docs/ethereum-addresses/
    [eEthereumNetwork.hardhat]: {
      DAI: "0x773616e4d11a78f511299002da57a0a94577f1f4",
      USDC: "0x986b5e1e1755e3c2440e960477f25201b0a8bbd4",
      USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    },
    [eEthereumNetwork.localhost]: {
      DAI: "0x53933349dA8E97b77c1f43Ba01192adb8C510fA7",
      USDC: "0x51998F16F707a0cdd5ECE2a56c034552dF3fb855",
      USD: "0x8e090D5B023252bE8d05d4c33b959A6F4A8BdD9e",
    },
    [eEthereumNetwork.goerli]: {
      DAI: "0x0d79df66BE487753B02D015Fb622DED7f0E9798d", // DAI - USD
      USDC: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7", // USDC - USD
      USD: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", // ETH - USD
    },
    [eEthereumNetwork.main]: {
      DAI: "0x773616E4d11A78F511299002da57A0a94577F1f4",
      USDC: "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4",
      USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //ETH - USD
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
  NftsConfig: {},
  WrappedNativeToken: {
    //WETH
    [eEthereumNetwork.hardhat]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // mainnet
    [eEthereumNetwork.localhost]: "0xB4B4ead1A260F1572b88b9D8ABa5A152D166c104",
    [eEthereumNetwork.goerli]: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    [eEthereumNetwork.main]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  CryptoPunksMarket: {
    [eEthereumNetwork.hardhat]: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb", // mainnet
    [eEthereumNetwork.localhost]: "0xb2f97A3c2E48cd368901657e31Faaa93035CE390",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
  }, 
  WrappedPunkToken: {
    [eEthereumNetwork.hardhat]: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",  //mainnet
    [eEthereumNetwork.localhost]: "0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847",
    [eEthereumNetwork.goerli]: "0xa9ED41c141d04647276F24EE06258e57a041a158",
    [eEthereumNetwork.main]: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",
  },

  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.hardhat]: "0xb37c26638305f8b3d9c4c316f46caf9bdea8a47b", 
    [eEthereumNetwork.localhost]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.goerli]: "0xf260132F9189Af2F3fb058995fa6C294AcE00D92",
    [eEthereumNetwork.main]: "0xc9B7b4dc9FB5CA759f7a8c0E8416FA303BEd389D",
  },
  IncentivesController: {
    [eEthereumNetwork.hardhat]: "0x26FC1f11E612366d3367fc0cbFfF9e819da91C8d",
    [eEthereumNetwork.localhost]: "0xF9107B537482fE7cE75a6646BEad2A97BFA4eB0E",
    [eEthereumNetwork.goerli]: "0xaa46E190C34B4f65b1f5d702Fac021b2525C93a5",
    [eEthereumNetwork.main]: "0xf40a2617170af5d8079D7a476F6475b2106328D4",
  }, 
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  NFTXVaultFactory: {
    [eEthereumNetwork.hardhat]: "0xBE86f647b167567525cCAAfcd6f881F1Ee558216", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "0x2cC3790f7CF280fA898E4913CA980410cF38e53b",
    [eEthereumNetwork.goerli]: "0xe01Cf5099e700c282A56E815ABd0C4948298Afae",
    [eEthereumNetwork.main]: "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  SushiSwapRouter: {
    [eEthereumNetwork.hardhat]: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "0x6B8dcBD1bb131ED184221902df1Fe21019ccD7dc",
    [eEthereumNetwork.goerli]: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    [eEthereumNetwork.main]: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  LSSVMRouter: {
    [eEthereumNetwork.hardhat]: "0x2b2e8cda09bba9660dca5cb6233787738ad68329", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x25b4EfC43c9dCAe134233CD577fFca7CfAd6748F",
    [eEthereumNetwork.main]: "0x2b2e8cda09bba9660dca5cb6233787738ad68329",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  YVaultWETH: { 
    [eEthereumNetwork.hardhat]: "0xa258C4606Ca8206D8aA700cE2143D7db854D168c", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xa258C4606Ca8206D8aA700cE2143D7db854D168c",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  LockeyCollection: { 
    [eEthereumNetwork.hardhat]: "0x9a29a9DBC70eA932637216A2BF9EbE7E60023798", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x9a29a9DBC70eA932637216A2BF9EbE7E60023798",
  }  
};
