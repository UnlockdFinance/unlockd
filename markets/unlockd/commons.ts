import BigNumber from 'bignumber.js';
import {
  oneEther,
  oneRay,
  RAY,
  ZERO_ADDRESS,
  MOCK_RESERVE_AGGREGATORS_PRICES,
  MOCK_NFT_AGGREGATORS_PRICES,
  MOCK_NFT_AGGREGATORS_MAXSUPPLY
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
    UsdAddress: '0x9ceb4d4c184d1786614a593a03621b7f37f8685f', //index 19, lowercase
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
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.develop]: '0x740A26A9aa27e193C8d15d75A1ca1C19AE735c21',
    [eEthereumNetwork.kovan]: '0x8da1Cb92f02f5c441A275036Ed26BB03ad6C40Cb',
    [eEthereumNetwork.rinkeby]: '0x353753F28D6679d2Bef6b7e34a7aBddEd2896589', //UnlockdProxyAdminPool
    [eEthereumNetwork.goerli]: undefined,
    [eEthereumNetwork.main]: '0x501c991E0D31D408c25bCf00da27BdF2759A394a',
  },
  ProxyAdminFund: {
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.develop]: '0x0B815174656df530906CC39E983431f0Ec442C59',
    [eEthereumNetwork.kovan]: '0x4C8FA526099383508D1AdAE511EaEc7D587DB99b',
    [eEthereumNetwork.rinkeby]: '0x57F0344cB587e12DBE1F97eaD4573517aaC4268E', //  UnlockdProxyAdminFund
    [eEthereumNetwork.goerli]: undefined,
    [eEthereumNetwork.main]: '0x2A71a0F5cef1fFc519027AD12f19453110e70666',
  },

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.coverage]: undefined,
    // [eEthereumNetwork.hardhat]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.develop]: '0xad93fB0e59eC703422dD38dCb7AcB8e323C8cc5B',
    [eEthereumNetwork.kovan]: '0x249D0dF00d8ca96952A9fc29ddD3199bD035A05B',
    [eEthereumNetwork.rinkeby]: '0xa2f4F4e465AAE91241D61E3518c9f2e7cb74c014', // Primary account
    [eEthereumNetwork.goerli]: undefined,
    [eEthereumNetwork.main]: '0x868964fa49a6fd6e116FE82c8f4165904406f479',
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    // [eEthereumNetwork.hardhat]: '0x51d25beeef0193c96cfda7fff9bd7411c2bdbdd3',
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.develop]: '0x14048d069A5E821eB82E01a275fdfC915C5BcfC4',
    [eEthereumNetwork.kovan]: '0x8956D65982Edc6397540d9f2C2be249E98DAFE8b',
    [eEthereumNetwork.rinkeby]: '0x225EBB792a900B29918feF50389d4AD2CD49321D', // Secundary Acc
    [eEthereumNetwork.goerli]: undefined,
    [eEthereumNetwork.main]: '0x2CFa21b4dEc4409670899d05b8644e9C432250de',
  },
  EmergencyAdminIndex: 1,
  LendPoolLiquidator: {
    [eEthereumNetwork.coverage]: undefined,
    // [eEthereumNetwork.hardhat]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.develop]: '0xad93fB0e59eC703422dD38dCb7AcB8e323C8cc5B',
    [eEthereumNetwork.kovan]: '0x249D0dF00d8ca96952A9fc29ddD3199bD035A05B',
    [eEthereumNetwork.rinkeby]: '0xa2f4F4e465AAE91241D61E3518c9f2e7cb74c014', // Primary account
    [eEthereumNetwork.goerli]: undefined,
    [eEthereumNetwork.main]: '0x868964fa49a6fd6e116FE82c8f4165904406f479',
  },
  LendPoolLiquidatorIndex: 0,

  UNFTRegistry: { /// Add contract From U
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '0x38b9ACfdFCB9072CBEE195172AEC60ED14880327',
    [eEthereumNetwork.localhost]: '0xCE1e5D792d24F62b29D35DeB85eC04b1F66447b1',
    [eEthereumNetwork.develop]: '0xf440346C93868879B5D3b8e5f96fEc57D4f2dcdf',
    [eEthereumNetwork.kovan]: '0xC5d1624B46db4F3F628400C0F41c49220c210c3F',
    [eEthereumNetwork.rinkeby]: '0x97eFb9F600b7514850D45A84Fcd01d2345c32859',// dev:deploy-mock-unft-registry Second Address
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '0x79d922DD382E42A156bC0A354861cDBC4F09110d',
  },

  ProviderRegistry: {
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.develop]: '',
    [eEthereumNetwork.kovan]: '',
    [eEthereumNetwork.rinkeby]: '0x0f6D786e3F9a83337cD7632D7100559711d0777B', // LendPoolAddressesProviderRegistry address from deployed address-provider
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '',
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.develop]: '0xad93fB0e59eC703422dD38dCb7AcB8e323C8cc5B',
    [eEthereumNetwork.kovan]: '0x249D0dF00d8ca96952A9fc29ddD3199bD035A05B',
    [eEthereumNetwork.rinkeby]: '',
    [eEthereumNetwork.main]: '0x868964fa49a6fd6e116FE82c8f4165904406f479',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.goerli]: '',
  },
 
  ReserveOracle: {
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '', /// LEND POOL ADDRESS PROVIDER REGISTRY 
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.develop]: '',
    [eEthereumNetwork.kovan]: '',
    [eEthereumNetwork.rinkeby]: '',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '',
  },
  NFTOracle: {
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]:'',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.develop]: '',
    [eEthereumNetwork.kovan]: '',
    [eEthereumNetwork.rinkeby]: '',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '',
  },

  ReserveAggregators: {
    // https://data.chain.link/ethereum/mainnet/crypto-eth
    // https://docs.chain.link/docs/ethereum-addresses/
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {
      DAI: '0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D',
      USDC: '0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf',
      USD: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    [eEthereumNetwork.localhost]: {
      DAI: '0x10F6794a3Df86bD8B97c7d6D625BAB54677D443b',
      USDC: '0x2cC3790f7CF280fA898E4913CA980410cF38e53b',
      USD: '0x6B8dcBD1bb131ED184221902df1Fe21019ccD7dc',
    },
    [eEthereumNetwork.develop]: {
      DAI: '0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D',
      USDC: '0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf',
      USD: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e', //ETH - USD
    },
    [eEthereumNetwork.kovan]: {
      DAI: '0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541',
      USDC: '0x64EaC61A2DFda2c3Fa04eED49AA33D021AeC8838',
      USD: '0x9326BFA02ADD2366b30bacB125260Af641031331', //ETH - USD
    },
    [eEthereumNetwork.rinkeby]: {//dev:deploy-all-mock-aggregators
      DAI: '0x15AC86247e4C477c28197F04CFB120461EE89639',
      USDC: '0x6B5f743988Abd94ab644587c9fc878A93A544F06',
      USD: '0x485547d5aD4e4f071eA2368A15962FAF593D337c',
    },
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {
      USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', //ETH - USD
    },
  },
  ReserveAssets: {
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.main]: {},
    [eEthereumNetwork.rinkeby]: {},
    [eEthereumNetwork.kovan]: {},
    [eEthereumNetwork.develop]: {},
    [eEthereumNetwork.goerli]: {},
  },
  ReservesConfig: {},
  NftsAssets: {
    [eEthereumNetwork.coverage]: {},
    // [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.hardhat]: {      
    },
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {},
    [eEthereumNetwork.rinkeby]: {
      // WPUNKS: '0x74e4418A41169Fb951Ca886976ccd8b36968c4Ab',
      // BAYC: '0x588D1a07ccdb224cB28dCd8E3dD46E16B3a72b5e',
      // DOODLE: '0x10cACFfBf3Cdcfb365FDdC4795079417768BaA74',
      // COOL: '0x1F912E9b691858052196F11Aff9d8B6f89951AbD',
      // MEEBITS: '0xA1BaBAB6d6cf1DC9C87Be22D1d5142CF905016a4',
      // MAYC: '0x9C235dF4053a415f028b8386ed13ae8162843a6e',
      // WOW: '0xdfC14f7A536944467834EF7ce7b05a9a79BCDFaD',
      // CLONEX: '0xdd04ba0254972CC736F6966c496B4941f02BD816',
      // AZUKI: '0x050Cd8082B86c5F469e0ba72ef4400E5E454886D',
      // KONGZ: '0x8fC9F05f7B21346FD5E9Fa3C963d3941eb861940',
    },
    [eEthereumNetwork.kovan]: {},
    [eEthereumNetwork.develop]: {},
  },
  NftsConfig: {
  },
  WrappedNativeToken: { //WETH
    [eEthereumNetwork.coverage]: '', // deployed in local evm
    [eEthereumNetwork.hardhat]: '0xb49dBe8e2A5a140b3b810c33ac2ba4907A3CA95e', // deployed in local evm
    [eEthereumNetwork.localhost]: '0xB4B4ead1A260F1572b88b9D8ABa5A152D166c104',
    [eEthereumNetwork.develop]: '0x3C73A32C11E20101be3D5ff2F67Af15a4ACbF298',
    [eEthereumNetwork.rinkeby]: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    [eEthereumNetwork.kovan]: '0x2F4dA7F22E603aac1A9840D384d63c91a40ddD8D',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  CryptoPunksMarket: {
    [eEthereumNetwork.coverage]: '', // deployed in local evm
    [eEthereumNetwork.hardhat]: '', // deployed in local evm
    [eEthereumNetwork.localhost]: '0xb2f97A3c2E48cd368901657e31Faaa93035CE390',
    [eEthereumNetwork.develop]: '0xE159fC1226dbCe3e9d511e884a067D09C3290B9E',
    [eEthereumNetwork.rinkeby]: '0x20e8B8A9C393dBc15959f523eC00870B71740895',
    [eEthereumNetwork.kovan]: '',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
  },
  WrappedPunkToken: {
    [eEthereumNetwork.coverage]: '', // deployed in local evm
    [eEthereumNetwork.hardhat]: '0x74e4418A41169Fb951Ca886976ccd8b36968c4Ab', // deployed in local evm
    [eEthereumNetwork.localhost]: '0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847',
    [eEthereumNetwork.develop]: '0xcDbBC001976F79db2fC1ECfd140031fE970CeaEc',
    [eEthereumNetwork.rinkeby]: '0xeA680AbAD948CF24436d5b963154B9b9bd3b4d57', //dev:deploy-mock-nfts WrappedPunk
    [eEthereumNetwork.kovan]: '0x8Ffc30191AdF56C3Bb06BD03A358fdBfA2C06f63',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
  },

  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.coverage]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.hardhat]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.localhost]: '0x5b69e6884c70f42819fb35bf3c25578ee11aaa15',
    [eEthereumNetwork.develop]: '0xA9620F4655620863FaC5AD87DcB4e3ab5e1C5b86',
    [eEthereumNetwork.rinkeby]: '0x65d68d5A1eC6Ef3c454BBA4Af0DdF08C0Ba5F10e', // 3rd Account
    [eEthereumNetwork.kovan]: '0xBC6E81c410FF3b32cDa031267772713f93599077',
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: '0x43078AbfB76bd24885Fd64eFFB22049f92a8c495',
  },
  IncentivesController: {
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: '0xD800e97aE32b06C1e89ca5126c7bF6aEF89D6B24',
    [eEthereumNetwork.localhost]: "0x1eaA4a267eDcde0eB5e08D08810Aa1696b123a2D",
    [eEthereumNetwork.develop]: '0x602bE80f0Bf54E0AffaCD794dfe3ac0f867F7581',
    [eEthereumNetwork.rinkeby]: '0xa2f4F4e465AAE91241D61E3518c9f2e7cb74c014', // Primary Account
    [eEthereumNetwork.kovan]: '0x0c5E94DC433A0c67Bbc25801759284A6e1Dd85Bb',
    [eEthereumNetwork.goerli]: ZERO_ADDRESS,
    [eEthereumNetwork.main]: '0x26FC1f11E612366d3367fc0cbFfF9e819da91C8d',
  },
  NFTXVaultFactory: {
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.develop]: '',
    [eEthereumNetwork.rinkeby]: '0xbbc53022Af15Bb973AD906577c84784c47C14371',
    [eEthereumNetwork.kovan]: '',
    [eEthereumNetwork.goerli]: ZERO_ADDRESS,
    [eEthereumNetwork.main]: '0xBE86f647b167567525cCAAfcd6f881F1Ee558216',
  },
  SushiSwapRouter: {
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.localhost]: '',
    [eEthereumNetwork.develop]: '',
    [eEthereumNetwork.rinkeby]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    [eEthereumNetwork.kovan]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    [eEthereumNetwork.goerli]: ZERO_ADDRESS,
    [eEthereumNetwork.main]: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  },
};
