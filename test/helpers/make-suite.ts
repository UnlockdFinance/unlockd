import chai from "chai";
// @ts-ignore
import bignumberChai from "chai-bignumber";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import RouterAbi from "../../abis/ReservoirV6_0_0.json";
import { UPGRADE } from "../../hardhat.config";
import { ConfigNames, getLendPoolLiquidator, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_WETH, SUDOSWAP_PAIRS_GOERLI, SUDOSWAP_PAIRS_MAINNET } from "../../helpers/constants";
import {
  getCryptoPunksMarket,
  getLendPool,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getLendPoolLoanProxy,
  getLockeyManagerProxy,
  getLSSVMPair,
  getMintableERC20,
  getMintableERC721,
  getMockChainlinkOracle,
  getMockIncentivesController,
  getMockNFTOracle,
  getMockReserveOracle,
  getNFTOracle,
  getNFTXVaultFactory,
  getPunkGateway,
  getReserveOracle,
  getReservoirAdapterProxy,
  getSushiSwapRouter,
  getUIPoolDataProvider,
  getUNFT,
  getUNFTRegistryProxy,
  getUnlockdProtocolDataProvider,
  getUToken,
  getWalletProvider,
  getWETHGateway,
  getWETHMocked,
  getWrappedPunk,
} from "../../helpers/contracts-getters";
import { getEthersSigners, getParamPerNetwork } from "../../helpers/contracts-helpers";
import { DRE, evmRevert, evmSnapshot, getNowTimeInSeconds } from "../../helpers/misc-utils";
import { eEthereumNetwork, tEthereumAddress } from "../../helpers/types";
import {
  CryptoPunksMarket,
  LendPoolLoan,
  LockeyManager,
  MockIncentivesController,
  PunkGateway,
  ReservoirAdapter,
  UiPoolDataProvider,
  UNFTRegistry,
  WalletBalanceProvider,
  WrappedPunk,
} from "../../types";
import { ILSSVMPair } from "../../types/ILSSVMPair";
import { INFTXVaultFactoryV2 } from "../../types/INFTXVaultFactoryV2";
import { IUniswapV2Router02 } from "../../types/IUniswapV2Router02";
import { LendPool } from "../../types/LendPool";
import { LendPoolAddressesProvider } from "../../types/LendPoolAddressesProvider";
import { LendPoolConfigurator } from "../../types/LendPoolConfigurator";
import { MintableERC20 } from "../../types/MintableERC20";
import { MintableERC721 } from "../../types/MintableERC721";
import { MockChainlinkOracle } from "../../types/MockChainlinkOracle";
import { MockNFTOracle } from "../../types/MockNFTOracle";
import { MockReserveOracle } from "../../types/MockReserveOracle";
import { NFTOracle } from "../../types/NFTOracle";
import { ReserveOracle } from "../../types/ReserveOracle";
import { UNFT } from "../../types/UNFT";
import { UnlockdProtocolDataProvider } from "../../types/UnlockdProtocolDataProvider";
import { UToken } from "../../types/UToken";
import { WETH9Mocked } from "../../types/WETH9Mocked";
import { WETHGateway } from "../../types/WETHGateway";
import { almostEqual } from "./almost-equal";

chai.use(bignumberChai());
chai.use(almostEqual());
chai.use(solidity);

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface LSSVMPairWithID {
  LSSVMPair: ILSSVMPair;
  collectionName: string;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  users: SignerWithAddress[];
  unftRegistry: UNFTRegistry;
  pool: LendPool;
  loan: LendPoolLoan;
  configurator: LendPoolConfigurator;
  liquidator: SignerWithAddress;
  reserveOracle: ReserveOracle;
  mockChainlinkOracle: MockChainlinkOracle;
  mockReserveOracle: MockReserveOracle;
  nftOracle: NFTOracle;
  mockNftOracle: MockNFTOracle;
  dataProvider: UnlockdProtocolDataProvider;
  uiProvider: UiPoolDataProvider;
  walletProvider: WalletBalanceProvider;
  mockIncentivesController: MockIncentivesController;
  weth: WETH9Mocked;
  uWETH: UToken;
  dai: MintableERC20;
  uDai: UToken;
  usdc: MintableERC20;
  uUsdc: UToken;
  //wpunks: WPUNKSMocked;
  uPUNK: UNFT;
  bayc: MintableERC721;
  uBAYC: UNFT;
  azuki: MintableERC721;
  uAzuki: UNFT;
  tokenId: number;
  addressesProvider: LendPoolAddressesProvider;
  wethGateway: WETHGateway;
  tokenIdTracker: number;

  cryptoPunksMarket: CryptoPunksMarket;
  punkIndexTracker: number;
  wrappedPunk: WrappedPunk;
  punkGateway: PunkGateway;

  roundIdTracker: number;
  nowTimeTracker: number;

  nftxVaultFactory: INFTXVaultFactoryV2;
  sushiSwapRouter: IUniswapV2Router02;
  LSSVMPairs: LSSVMPairWithID[];
  lockeyManager: LockeyManager;
  reservoirAdapter: ReservoirAdapter;

  BlurModule: Contract;
  FoundationModule: Contract;
  LooksRareModule: Contract;
  SeaportModule: Contract;
  SeaportV14Module: Contract;
  SudoSwapModule: Contract;
  X2Y2Module: Contract;
  ZeroExv4Module: Contract;
  ZoraModule: Contract;
  ElementModule: Contract;
  NFTXModule: Contract;
  RaribleModule: Contract;
  reservoirModules: Contract[];
}

let buidlerevmSnapshotId = "0x1";
const setBuidlerevmSnapshotId = (id: string) => {
  buidlerevmSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  unftRegistry: {} as UNFTRegistry,
  pool: {} as LendPool,
  loan: {} as LendPoolLoan,
  configurator: {} as LendPoolConfigurator,
  liquidator: {} as SignerWithAddress,
  dataProvider: {} as UnlockdProtocolDataProvider,
  uiProvider: {} as UiPoolDataProvider,
  walletProvider: {} as WalletBalanceProvider,
  mockIncentivesController: {} as MockIncentivesController,
  reserveOracle: {} as ReserveOracle,
  mockReserveOracle: {} as MockReserveOracle,
  mockNftOracle: {} as MockNFTOracle,
  nftOracle: {} as NFTOracle,
  mockChainlinkOracle: {} as MockChainlinkOracle,
  LSSVMPairs: [] as LSSVMPairWithID[],
  weth: {} as WETH9Mocked,
  uWETH: {} as UToken,
  dai: {} as MintableERC20,
  uDai: {} as UToken,
  usdc: {} as MintableERC20,
  uUsdc: {} as UToken,
  //wpunks: WPUNKSMocked,
  uPUNK: {} as UNFT,
  bayc: {} as MintableERC721,
  uBAYC: {} as UNFT,
  azuki: {} as MintableERC721,
  uAzuki: {} as UNFT,
  tokenId: {} as number,
  addressesProvider: {} as LendPoolAddressesProvider,
  wethGateway: {} as WETHGateway,
  //wpunksGateway: {} as WPUNKSGateway,
  tokenIdTracker: {} as number,
  roundIdTracker: {} as number,
  nowTimeTracker: {} as number,
  lockeyManager: {} as LockeyManager,
  reservoirAdapter: {} as ReservoirAdapter,
  BlurModule: {} as Contract,
  FoundationModule: {} as Contract,
  LooksRareModule: {} as Contract,
  SeaportModule: {} as Contract,
  SeaportV14Module: {} as Contract,
  SudoSwapModule: {} as Contract,
  X2Y2Module: {} as Contract,
  ZeroExv4Module: {} as Contract,
  ZoraModule: {} as Contract,
  ElementModule: {} as Contract,
  NFTXModule: {} as Contract,
  RaribleModule: {} as Contract,
  reservoirModules: [] as Contract[],
} as TestEnv;

export async function initializeMakeSuite(network?: string) {
  const [_deployer, ...restSigners] = await getEthersSigners();
  const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }

  testEnv.deployer = deployer;
  const liquidator = await getLendPoolLiquidator(poolConfig);

  testEnv.liquidator = testEnv.users.find((signer) => signer.address === liquidator)!;

  testEnv.unftRegistry = await getUNFTRegistryProxy();

  testEnv.pool = await getLendPool();

  testEnv.loan = await getLendPoolLoanProxy();

  testEnv.configurator = await getLendPoolConfiguratorProxy();

  testEnv.addressesProvider = await getLendPoolAddressesProvider();

  testEnv.reserveOracle = await getReserveOracle();
  testEnv.mockChainlinkOracle = await getMockChainlinkOracle();
  testEnv.mockReserveOracle = await getMockReserveOracle();
  testEnv.nftOracle = await getNFTOracle();

  testEnv.mockNftOracle = await getMockNFTOracle();

  testEnv.dataProvider = await getUnlockdProtocolDataProvider();
  testEnv.walletProvider = await getWalletProvider();
  testEnv.uiProvider = await getUIPoolDataProvider();

  testEnv.mockIncentivesController = await getMockIncentivesController();

  // Reserve Tokens
  const allReserveTokens = await testEnv.dataProvider.getAllReservesTokenDatas();

  const uDaiAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "DAI")?.uTokenAddress;
  const uUsdcAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "USDC")?.uTokenAddress;
  const uWEthAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;

  const daiAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "DAI")?.tokenAddress;
  const usdcAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "USDC")?.tokenAddress;
  const wethAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.tokenAddress;

  console.log("uDai", uDaiAddress);
  console.log("uUSDC", uUsdcAddress);
  console.log("uWETH", uWEthAddress);
  console.log("daiAdd", daiAddress);
  console.log("usdcAdd", usdcAddress);
  console.log("wethAdd", wethAddress);

  await testEnv.addressesProvider.setAddress(ADDRESS_ID_WETH, wethAddress!);

  // if (!uDaiAddress || !uUsdcAddress || !uWEthAddress) {
  //   console.error("Invalid UTokens", uDaiAddress, uUsdcAddress, uWEthAddress);
  //   process.exit(1);
  // }
  // if (!daiAddress || !usdcAddress || !wethAddress) {
  //   console.error("Invalid Reserve Tokens", daiAddress, usdcAddress, wethAddress);
  //   process.exit(1);
  // }

  // PREPARE MOCK NFTS
  if (daiAddress) testEnv.dai = await getMintableERC20(daiAddress);
  if (usdcAddress) testEnv.usdc = await getMintableERC20(usdcAddress);
  if (wethAddress) testEnv.weth = await getWETHMocked(wethAddress);

  // PREPARE MOCK uNFTS
  if (uDaiAddress) testEnv.uDai = await getUToken(uDaiAddress);

  if (uUsdcAddress) testEnv.uUsdc = await getUToken(uUsdcAddress);

  if (uWEthAddress) testEnv.uWETH = await getUToken(uWEthAddress);
  if (UPGRADE) await testEnv.uWETH.sweepUToken();
  testEnv.wethGateway = await getWETHGateway();

  // NFT Tokens
  const allUNftTokens = await testEnv.dataProvider.getAllNftsTokenDatas();

  const uPunkAddress = allUNftTokens.find((tokenData) => tokenData.nftSymbol === "WPUNKS")?.uNftAddress;
  const uBaycAddress = allUNftTokens.find((tokenData) => tokenData.nftSymbol === "BAYC")?.uNftAddress;
  const uAzukiAddress = allUNftTokens.find((tokenData) => tokenData.nftSymbol === "AZUKI")?.uNftAddress;

  const wpunksAddress = allUNftTokens.find((tokenData) => tokenData.nftSymbol === "WPUNKS")?.nftAddress;
  const baycAddress = allUNftTokens.find((tokenData) => tokenData.nftSymbol === "BAYC")?.nftAddress;
  const azukiAddress = allUNftTokens.find((tokenData) => tokenData.nftSymbol === "AZUKI")?.nftAddress;

  if (!uBaycAddress || !uPunkAddress || !uAzukiAddress) {
    console.error("Invalid UNFT Tokens", uBaycAddress, uPunkAddress, uAzukiAddress);
    process.exit(1);
  }
  if (!baycAddress || !wpunksAddress || !azukiAddress) {
    console.error("Invalid NFT Tokens", baycAddress, wpunksAddress, azukiAddress);
    process.exit(1);
  }

  testEnv.uBAYC = await getUNFT(uBaycAddress);
  testEnv.uPUNK = await getUNFT(uPunkAddress);
  testEnv.uAzuki = await getUNFT(uAzukiAddress);

  testEnv.bayc = await getMintableERC721(baycAddress!);
  testEnv.azuki = await getMintableERC721(azukiAddress!);
  testEnv.tokenId = 1;
  testEnv.cryptoPunksMarket = await getCryptoPunksMarket();

  testEnv.wrappedPunk = await getWrappedPunk();
  testEnv.punkGateway = await getPunkGateway();

  testEnv.tokenIdTracker = 100;
  testEnv.punkIndexTracker = 100;

  testEnv.roundIdTracker = 1;
  testEnv.nowTimeTracker = Number(await getNowTimeInSeconds());

  const sudoSwapPairsForAsset = process.env.FORK == "goerli" ? SUDOSWAP_PAIRS_GOERLI : SUDOSWAP_PAIRS_MAINNET;

  for (const [key] of Object.entries(sudoSwapPairsForAsset)) {
    const pairsForAsset = sudoSwapPairsForAsset[key];

    pairsForAsset.map(async (pair) => {
      let pairWithID: LSSVMPairWithID = {} as LSSVMPairWithID;
      pairWithID.collectionName = key;
      pairWithID.LSSVMPair = await getLSSVMPair(pair);

      testEnv.LSSVMPairs.push(pairWithID);
    });
  }

  testEnv.lockeyManager = await getLockeyManagerProxy();
  testEnv.reservoirAdapter = await getReservoirAdapterProxy();

  const blurModule = getParamPerNetwork(poolConfig.BlurModule, network as eEthereumNetwork);
  if (blurModule) testEnv.BlurModule = new Contract(blurModule, RouterAbi, deployer.signer);
  const foundationModule = getParamPerNetwork(poolConfig.FoundationModule, network as eEthereumNetwork);
  if (foundationModule) testEnv.FoundationModule = new Contract(foundationModule, RouterAbi, deployer.signer);
  const looksrareModule = getParamPerNetwork(poolConfig.LooksRareModule, network as eEthereumNetwork);
  if (looksrareModule) testEnv.LooksRareModule = new Contract(looksrareModule, RouterAbi, deployer.signer);
  const seaportModule = getParamPerNetwork(poolConfig.SeaportModule, network as eEthereumNetwork);
  if (seaportModule) testEnv.SeaportModule = new Contract(seaportModule, RouterAbi, deployer.signer);
  const seaportV14Module = getParamPerNetwork(poolConfig.SeaportV14Module, network as eEthereumNetwork);
  if (seaportV14Module) testEnv.SeaportV14Module = new Contract(seaportV14Module, RouterAbi, deployer.signer);
  const sudoswapModule = getParamPerNetwork(poolConfig.SudoSwapModule, network as eEthereumNetwork);
  if (sudoswapModule) testEnv.SudoSwapModule = new Contract(sudoswapModule, RouterAbi, deployer.signer);
  const x2y2Module = getParamPerNetwork(poolConfig.X2Y2Module, network as eEthereumNetwork);
  if (x2y2Module) testEnv.X2Y2Module = new Contract(x2y2Module, RouterAbi, deployer.signer);
  const zeroExv4Module = getParamPerNetwork(poolConfig.ZeroExv4Module, network as eEthereumNetwork);
  if (zeroExv4Module) testEnv.ZeroExv4Module = new Contract(zeroExv4Module, RouterAbi, deployer.signer);
  const zoraModule = getParamPerNetwork(poolConfig.ZoraModule, network as eEthereumNetwork);
  if (zoraModule) testEnv.ZoraModule = new Contract(zoraModule, RouterAbi, deployer.signer);
  const elementModule = getParamPerNetwork(poolConfig.ElementModule, network as eEthereumNetwork);
  if (elementModule) testEnv.ElementModule = new Contract(elementModule, RouterAbi, deployer.signer);
  const NFTXModule = getParamPerNetwork(poolConfig.NFTXModule, network as eEthereumNetwork);
  if (NFTXModule) testEnv.NFTXModule = new Contract(NFTXModule, RouterAbi, deployer.signer);
  const raribleModule = getParamPerNetwork(poolConfig.RaribleModule, network as eEthereumNetwork);
  if (raribleModule) testEnv.RaribleModule = new Contract(raribleModule, RouterAbi, deployer.signer);

  testEnv.reservoirModules = [
    testEnv.BlurModule,
    testEnv.FoundationModule,
    testEnv.LooksRareModule,
    testEnv.SeaportModule,
    testEnv.SeaportV14Module,
    testEnv.SudoSwapModule,
    testEnv.X2Y2Module,
    testEnv.ZeroExv4Module,
    testEnv.ZoraModule,
    testEnv.ElementModule,
    testEnv.NFTXModule,
    testEnv.RaribleModule,
  ];
}

const setSnapshot = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  setBuidlerevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  await evmRevert(buidlerevmSnapshotId);
};

export function makeSuite(
  name: string,
  tests: (testEnv: TestEnv) => void,
  { only, skip }: { only?: boolean; skip?: boolean } = { only: false, skip: false }
) {
  (only ? describe.only : skip ? describe.skip : describe)(name, () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
}
