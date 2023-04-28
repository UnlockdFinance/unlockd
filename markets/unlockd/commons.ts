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
    [eEthereumNetwork.goerli]: "0x8CBfc7F0f4Fd5D4221335f471aEC44B822f56660",
    [eEthereumNetwork.main]: "0xb7493E15Af772c14c7cE3180Ff388925e6593c6b",
  },
  ProxyAdminFund: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0xA9d67F1b0f46cc0588ED20AA071aB50b9A2D38f8",
    [eEthereumNetwork.main]: "0x38a97DE7216b54FCc83A918CF5dB1Bb0447913a4",
  },

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.hardhat]: "0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15",
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0x3800107a25762D789c6dD36DeDa01aFef7d5E94F",
    [eEthereumNetwork.main]: "0x67539d650922Af9D2c611251ac9749f167e51Ac0",
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.hardhat]: "0x51d25beeef0193c96cfda7fff9bd7411c2bdbdd3",
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0x6050DAb083016FE89a64A7aAb13aEF05E730c94b",
    [eEthereumNetwork.main]: "0x653f5769e08FB9cd6c4faC48Bad8a1B64B7Cf85d",
  },
  EmergencyAdminIndex: 2,
  LendPoolLiquidator: {
    [eEthereumNetwork.hardhat]: "0xA2874be6Acdc314dd055f6869a2dBdF62c983436",
    [eEthereumNetwork.localhost]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.goerli]: "0xD90d48680Ed26e873e9461f286EC95AD603abE7a",
    [eEthereumNetwork.main]: "0xA296478f65BCDA4153343c8D1f24D768110D6e16",
  },
  LendPoolLiquidatorIndex: 3,
  LtvManager: {
    // The wallet address that will be set as loan to value Manager
    [eEthereumNetwork.hardhat]: "0x392b30d9c3ac1ef8dac7dfc394311fb9e5554c53",
    [eEthereumNetwork.localhost]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.goerli]: "0xD90d48680Ed26e873e9461f286EC95AD603abE7a",
    [eEthereumNetwork.main]: "0x0685a82e74fbe03B7cC217f3DeD902C4d1aA78Cd",
  },
  LtvManagerIndex: 3,

  UNFTRegistry: {
    /// Add contract From U
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: "0x8b89F971cA1A5dE1B7df7f554a3024eE84FeeB05",
    [eEthereumNetwork.goerli]: "0xF6bA9b7ce803fd04355673F782FA719A19c902Fb",
    [eEthereumNetwork.main]: "0x255f25335662c88Fcc7deC402cADf2f4f0E08300",
  },

  ProviderRegistry: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x4Ac593920D734BE24250cb0bfAC39DF621C6e636",
    [eEthereumNetwork.main]: "0xe5BF48BC5Fd3FCD1c7Fc76795C7b08ccc139a949",
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.hardhat]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x67539d650922Af9D2c611251ac9749f167e51Ac0",
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
  GenericYVaultStrategy: {
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  GenericConvexETHStrategy: {
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
    [eEthereumNetwork.goerli]: "0x3aFE908110e5c5275Bc96a9e42DB1B322590bDa4",
    [eEthereumNetwork.main]: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
  },
  WrappedPunkToken: {
    [eEthereumNetwork.hardhat]: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6", //mainnet
    [eEthereumNetwork.localhost]: "0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847",
    [eEthereumNetwork.goerli]: "0x97F1f0E9A8F55Bf1Da9392332a0C44cE52E83E38",
    [eEthereumNetwork.main]: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",
  },

  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.hardhat]: "0xb37c26638305f8b3d9c4c316f46caf9bdea8a47b",
    [eEthereumNetwork.localhost]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.goerli]: "0x99f9870D36711f30C93a6614f179AaFf047Ec3f2",
    [eEthereumNetwork.main]: "0xc9B7b4dc9FB5CA759f7a8c0E8416FA303BEd389D",
  },
  IncentivesController: {
    [eEthereumNetwork.hardhat]: "0x26FC1f11E612366d3367fc0cbFfF9e819da91C8d",
    [eEthereumNetwork.localhost]: "0xF9107B537482fE7cE75a6646BEad2A97BFA4eB0E",
    [eEthereumNetwork.goerli]: "0x876252A90E1CfEF75b40E235629a2E67BC7E68A8",
    [eEthereumNetwork.main]: "0xf40a2617170af5d8079D7a476F6475b2106328D4",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  NFTXVaultFactory: {
    [eEthereumNetwork.hardhat]: "0xBE86f647b167567525cCAAfcd6f881F1Ee558216", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "0x2cC3790f7CF280fA898E4913CA980410cF38e53b",
    [eEthereumNetwork.goerli]: "0xe01Cf5099e700c282A56E815ABd0C4948298Afae",
    [eEthereumNetwork.main]: "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
  },
  ConvexBooster: {
    [eEthereumNetwork.hardhat]: "0xF403C135812408BFbE8713b5A23a04b3D48AAE31", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xF403C135812408BFbE8713b5A23a04b3D48AAE31",
  },
  CurveETHAlETHPool: {
    [eEthereumNetwork.hardhat]: "0xC4C319E2D4d66CcA4464C0c2B32c9Bd23ebe784e", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xC4C319E2D4d66CcA4464C0c2B32c9Bd23ebe784e",
  },
  CurveCRVWETHPool: { 
    [eEthereumNetwork.hardhat]: "0x8301AE4fc9c624d1D396cbDAa1ed877821D7C511", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x8301AE4fc9c624d1D396cbDAa1ed877821D7C511",
  },
  CurveCVXWETHPool: {
    [eEthereumNetwork.hardhat]: "0xb576491f1e6e5e62f1d8f26062ee822b40b0e0d4", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xb576491f1e6e5e62f1d8f26062ee822b40b0e0d4",
  },
  UniSwapRouter: {
    [eEthereumNetwork.hardhat]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
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
  },
  BlurModule: {
    [eEthereumNetwork.hardhat]: "0xb1096516fc33bb64a77158b10f155846e74bd7fa", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xb1096516fc33bb64a77158b10f155846e74bd7fa",
  },
  FoundationModule: {
    [eEthereumNetwork.hardhat]: "0x5c8a351d4ff680203e05af56cb9d748898c7b39a", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x5c8a351d4ff680203e05af56cb9d748898c7b39a",
  },
  LooksRareModule: {
    [eEthereumNetwork.hardhat]: "0x385df8cbc196f5f780367f3cdc96af072a916f7e", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x532486bb46581b032134159c1d31962cdab1e6a7",
    [eEthereumNetwork.main]: "0x385df8cbc196f5f780367f3cdc96af072a916f7e",
  },
  SeaportModule: {
    [eEthereumNetwork.hardhat]: "0x20794ef7693441799a3f38fcc22a12b3e04b9572", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x04c3af2cad3d1c037930184161ec24ba3a631129",
    [eEthereumNetwork.main]: "0x20794ef7693441799a3f38fcc22a12b3e04b9572",
  },
  SeaportV14Module: {
    [eEthereumNetwork.hardhat]: "0xfb3f14829f15b1303d6ca677e3fae5a558e064d1", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x9ec973b9471fd632aee6d67e0c74855d115bdbad",
    [eEthereumNetwork.main]: "0xfb3f14829f15b1303d6ca677e3fae5a558e064d1", //,
  },
  SudoSwapModule: {
    [eEthereumNetwork.hardhat]: "0x79abbfdf20fc6dd0c51693bf9a481f7351a70fd2", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x79abbfdf20fc6dd0c51693bf9a481f7351a70fd2",
  },
  X2Y2Module: {
    [eEthereumNetwork.hardhat]: "0x613d3c588f6b8f89302b463f8f19f7241b2857e2", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x6a789513b2e555f9d3539bf9a053a57d2bfca426",
    [eEthereumNetwork.main]: "0x613d3c588f6b8f89302b463f8f19f7241b2857e2",
  },
  ZeroExv4Module: {
    [eEthereumNetwork.hardhat]: "0x8162beec776442afd262b672730bb5d0d8af16a1", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x29fcac61d9b2a3c55f3e1149d0278126c31abe74",
    [eEthereumNetwork.main]: "0x8162beec776442afd262b672730bb5d0d8af16a1",
  },
  ZoraModule: {
    [eEthereumNetwork.hardhat]: "0x982b49de82a3ea5b8c42895482d9dd9bfefadf82", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x982b49de82a3ea5b8c42895482d9dd9bfefadf82",
  },
  ElementModule: {
    [eEthereumNetwork.hardhat]: "0xef82b43719dd13ba33ef7d93e6f0d1f690eea5b2", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xef82b43719dd13ba33ef7d93e6f0d1f690eea5b2",
  },
  NFTXModule: {
    [eEthereumNetwork.hardhat]: "0x27eb35119dda39df73db6681019edc4c16311acc", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0x27eb35119dda39df73db6681019edc4c16311acc",
  },
  RaribleModule: {
    [eEthereumNetwork.hardhat]: "0xa29d7914cd525dea9afad0dceec6f49404476486", //mainnet address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "0xa29d7914cd525dea9afad0dceec6f49404476486",
  }
};
