import {
  BorrowLogicFactory,
  ConfiguratorLogicFactory,
  CryptoPunksMarketFactory,
  CustomERC721Factory,
  DebtTokenFactory,
  GenericLogicFactory,
  InterestRateFactory,
  LendPoolAddressesProviderFactory,
  LendPoolAddressesProviderRegistryFactory,
  LendPoolConfiguratorFactory,
  LendPoolFactory,
  LendPoolLoanFactory,
  LiquidateLogicFactory,
  LockeyHolderFactory,
  MintableERC20Factory,
  MintableERC721Factory,
  MockChainlinkOracleFactory,
  MockIncentivesControllerFactory,
  MockNFTOracleFactory,
  MockReserveOracleFactory,
  NFTOracleFactory,
  PunkGatewayFactory,
  ReserveLogicFactory,
  ReserveOracleFactory,
  //NftLogicFactory,
  SelfdestructTransferFactory,
  SupplyLogicFactory,
  UiPoolDataProviderFactory,
  UNFTFactory,
  UNFTRegistryFactory,
  UnlockdCollectorFactory,
  UnlockdProtocolDataProviderFactory,
  UnlockdProxyAdminFactory,
  UnlockdUpgradeableProxyFactory,
  UTokenFactory,
  WalletBalanceProviderFactory,
  WETH9MockedFactory,
  WETHGatewayFactory,
  WrappedPunkFactory,
} from "../types";
import { IERC20DetailedFactory } from "../types/IERC20DetailedFactory";
import { IERC721DetailedFactory } from "../types/IERC721DetailedFactory";
import { ILSSVMPairFactory } from "../types/ILSSVMPairFactory";
import { INFTXVaultFactory } from "../types/INFTXVaultFactory";
import { INFTXVaultFactoryV2Factory } from "../types/INFTXVaultFactoryV2Factory";
import { IUniswapV2Router02Factory } from "../types/IUniswapV2Router02Factory";
import { IYVaultFactory } from "../types/IYVaultFactory";
import { getEthersSigners, MockNftMap, MockTokenMap } from "./contracts-helpers";
import { DRE, getDb, omit } from "./misc-utils";
import { eContractid, NftContractId, PoolConfiguration, tEthereumAddress, TokenContractId } from "./types";

export const getFirstSigner = async () => (await getEthersSigners())[0];

export const getSecondSigner = async () => (await getEthersSigners())[1];

export const getThirdSigner = async () => (await getEthersSigners())[2];

export const getDeploySigner = async () => (await getEthersSigners())[0];

export const getPoolAdminSigner = async () => (await getEthersSigners())[0];

export const getPoolOwnerSigner = async () => (await getEthersSigners())[0];

export const getLtvManagerSigner = async () => (await getEthersSigners())[0];

export const getLendPoolLiquidatorSigner = async () => (await getEthersSigners())[0];

export const getEmergencyAdminSigner = async () => (await getEthersSigners())[1];

export const getProxyAdminSigner = async () => (await getEthersSigners())[2];

export const getLendPoolAddressesProviderRegistry = async (address?: tEthereumAddress, db?: string) => {
  return await LendPoolAddressesProviderRegistryFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolAddressesProviderRegistry}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};

export const getLendPoolAddressesProvider = async (address?: tEthereumAddress, db?: string) => {
  return await LendPoolAddressesProviderFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolAddressesProvider}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};
export const getUnlockdProxyAdminPool = async (address?: tEthereumAddress, db?: string) => {
  return await LendPoolAddressesProviderFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UnlockdProxyAdminPool}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};
export const getLendPoolConfiguratorProxy = async (address?: tEthereumAddress, db?: string) => {
  return await LendPoolConfiguratorFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolConfigurator}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};

export const getUNFTRegistryProxy = async (address?: tEthereumAddress, db?: string) => {
  return await UNFTRegistryFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UNFTRegistry}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};

export const getLendPoolLoanProxy = async (address?: tEthereumAddress, db?: string) => {
  return await LendPoolLoanFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolLoan}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};

export const getLockeyHolderProxy = async (address?: tEthereumAddress) => {
  return await LockeyHolderFactory.connect(
    address || (await getDb(DRE.network.name).get(`${eContractid.LockeyHolder}`).value()).address,
    await getDeploySigner()
  );
};

export const getLendPool = async (address?: tEthereumAddress, db?: string) =>
  await LendPoolFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPool}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getReserveOracle = async (address?: tEthereumAddress, db?: string) =>
  await ReserveOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.ReserveOracle}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getReserveOracleImpl = async (address?: tEthereumAddress, db?: string) =>
  await ReserveOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.ReserveOracleImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMockChainlinkOracle = async (address?: tEthereumAddress, db?: string) =>
  await MockChainlinkOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.MockChainlinkOracle}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getNFTOracle = async (address?: tEthereumAddress, db?: string) =>
  await NFTOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.NFTOracle}`)
          .value()
      ).address,
    await getDeploySigner()
  );

// export const getMockNFT = async (address?: tEthereumAddress, db?: string) =>
//   await MockNFTOracleFactory.connect(
//     address || (await getDb(db ? db : `${DRE.network.name}`).get(`${eContractid.MockNFT}`).value()).address,
//     await getDeploySigner()
//   );

export const getNFTOracleImpl = async (address?: tEthereumAddress, db?: string) =>
  await NFTOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.NFTOracleImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMockReserveOracle = async (address?: tEthereumAddress, db?: string) =>
  await MockReserveOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.MockReserveOracle}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMockNFTOracle = async (address?: tEthereumAddress, db?: string) =>
  await MockNFTOracleFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.MockNFTOracle}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUToken = async (address?: tEthereumAddress, db?: string) =>
  await UTokenFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UToken}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getDebtToken = async (address?: tEthereumAddress, db?: string) =>
  await DebtTokenFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.DebtToken}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUNFT = async (address?: tEthereumAddress, db?: string) =>
  await UNFTFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UNFT}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMintableERC20 = async (address: tEthereumAddress, db?: string) =>
  await MintableERC20Factory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.MintableERC20}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMintableERC721 = async (address: tEthereumAddress, db?: string) =>
  await MintableERC721Factory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.MintableERC721}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getCustomERC721 = async (address: tEthereumAddress, db?: string) =>
  await CustomERC721Factory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.CustomERC721}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getIErc20Detailed = async (address: tEthereumAddress, db?: string) =>
  await IERC20DetailedFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.IERC20Detailed}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getIErc721Detailed = async (address: tEthereumAddress, db?: string) =>
  await IERC721DetailedFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.IERC721Detailed}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUnlockdProtocolDataProvider = async (address?: tEthereumAddress, db?: string) =>
  await UnlockdProtocolDataProviderFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UnlockdProtocolDataProvider}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUIPoolDataProvider = async (address?: tEthereumAddress, db?: string) =>
  await UiPoolDataProviderFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UIPoolDataProvider}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getInterestRate = async (address?: tEthereumAddress, db?: string) =>
  await InterestRateFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.InterestRate}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMockedTokens = async (config: PoolConfiguration, db?: string) => {
  const tokenSymbols = Object.keys(config.ReservesConfig);
  const database = getDb(db ? db : `${DRE.network.name}`);
  const tokens: MockTokenMap = await tokenSymbols.reduce<Promise<MockTokenMap>>(async (acc, tokenSymbol) => {
    const accumulator = await acc;
    const address = database.get(`${tokenSymbol.toUpperCase()}`).value().address;
    accumulator[tokenSymbol] = await getMintableERC20(address);
    return Promise.resolve(acc);
  }, Promise.resolve({}));
  return tokens;
};

export const getAllMockedTokens = async (db?: string) => {
  const database = getDb(db ? db : `${DRE.network.name}`);
  const tokens: MockTokenMap = await Object.keys(TokenContractId).reduce<Promise<MockTokenMap>>(
    async (acc, tokenSymbol) => {
      const accumulator = await acc;
      const address = database.get(`${tokenSymbol.toUpperCase()}`).value().address;
      accumulator[tokenSymbol] = await getMintableERC20(address);
      return Promise.resolve(acc);
    },
    Promise.resolve({})
  );
  return tokens;
};

export const getConfigMockedNfts = async (config: PoolConfiguration, db?: string) => {
  const tokenSymbols = Object.keys(config.NftsConfig);
  const database = getDb(db ? db : `${DRE.network.name}`);
  const tokens: MockNftMap = await tokenSymbols.reduce<Promise<MockNftMap>>(async (acc, tokenSymbol) => {
    const accumulator = await acc;
    const address = database.get(`${tokenSymbol.toUpperCase()}`).value().address;
    accumulator[tokenSymbol] = await getMintableERC721(address);
    return Promise.resolve(acc);
  }, Promise.resolve({}));
  return tokens;
};

export const getAllMockedNfts = async (db?: string) => {
  const database = getDb(db ? db : `${DRE.network.name}`);
  const tokens: MockNftMap = await Object.keys(NftContractId).reduce<Promise<MockNftMap>>(async (acc, tokenSymbol) => {
    const accumulator = await acc;
    const address = database.get(`${tokenSymbol.toUpperCase()}`).value().address;
    accumulator[tokenSymbol] = await getMintableERC721(address);
    return Promise.resolve(acc);
  }, Promise.resolve({}));
  return tokens;
};

export const getQuoteCurrencies = (oracleQuoteCurrency: string): string[] => {
  switch (oracleQuoteCurrency) {
    case "ETH":
    case "WETH":
    default:
      return ["ETH", "WETH"];
  }
};

export const getPairsTokenAggregator = (
  allAssetsAddresses: {
    [tokenSymbol: string]: tEthereumAddress;
  },
  aggregatorsAddresses: { [tokenSymbol: string]: tEthereumAddress },
  oracleQuoteCurrency: string
): [string[], string[]] => {
  const assetsWithoutQuoteCurrency = omit(allAssetsAddresses, getQuoteCurrencies(oracleQuoteCurrency));
  const pairs = Object.entries(assetsWithoutQuoteCurrency).map(([tokenSymbol, tokenAddress]) => {
    //if (true/*tokenSymbol !== 'WETH' && tokenSymbol !== 'ETH' && tokenSymbol !== 'LpWETH'*/) {
    const aggregatorAddressIndex = Object.keys(aggregatorsAddresses).findIndex((value) => value === tokenSymbol);
    if (aggregatorAddressIndex < 0) {
      throw Error(`can not find aggregator for ${tokenSymbol}`);
    }
    const [, aggregatorAddress] = (Object.entries(aggregatorsAddresses) as [string, tEthereumAddress][])[
      aggregatorAddressIndex
    ];
    return [tokenAddress, aggregatorAddress];
    //}
  }) as [string, string][];

  const mappedPairs = pairs.map(([asset]) => asset);
  const mappedAggregators = pairs.map(([, source]) => source);

  return [mappedPairs, mappedAggregators];
};

/*
export const getNftLogic = async (address?: tEthereumAddress, db?: string) =>
  await NftLogicFactory.connect(
    address || (await getDb(db ? db : `${DRE.network.name}`).get(`${eContractid.NftLogic}`).value()).address,
    await getDeploySigner()
  );
*/

export const getReserveLogic = async (address?: tEthereumAddress, db?: string) =>
  await ReserveLogicFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.ReserveLogic}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getGenericLogic = async (address?: tEthereumAddress, db?: string) =>
  await GenericLogicFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.GenericLogic}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getSupplyLogic = async (address?: tEthereumAddress, db?: string) =>
  await SupplyLogicFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.SupplyLogic}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getBorrowLogic = async (address?: tEthereumAddress, db?: string) =>
  await BorrowLogicFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.BorrowLogic}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getLiquidateLogic = async (address?: tEthereumAddress, db?: string) =>
  await LiquidateLogicFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LiquidateLogic}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getConfiguratorLogic = async (address?: tEthereumAddress, db?: string) =>
  await ConfiguratorLogicFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.ConfiguratorLogic}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getWETHGateway = async (address?: tEthereumAddress, db?: string) =>
  await WETHGatewayFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.WETHGateway}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getWETHGatewayImpl = async (address?: tEthereumAddress, db?: string) =>
  await WETHGatewayFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.WETHGatewayImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getWETHMocked = async (address?: tEthereumAddress, db?: string) =>
  await WETH9MockedFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.WETHMocked}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getSelfdestructTransferMock = async (address?: tEthereumAddress, db?: string) =>
  await SelfdestructTransferFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.SelfdestructTransferMock}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUnlockdUpgradeableProxy = async (address: tEthereumAddress, db?: string) =>
  await UnlockdUpgradeableProxyFactory.connect(address, await getDeploySigner());

export const getUnlockdProxyAdminByAddress = async (address: tEthereumAddress, db?: string) =>
  await UnlockdProxyAdminFactory.connect(address, await getDeploySigner());

export const getUnlockdProxyAdminById = async (id: string, db?: string) =>
  await UnlockdProxyAdminFactory.connect(
    (
      await getDb(db ? db : `${DRE.network.name}`)
        .get(`${id}`)
        .value()
    ).address,
    await getDeploySigner()
  );

export const getLendPoolImpl = async (address?: tEthereumAddress, db?: string) =>
  await LendPoolFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getLendPoolConfiguratorImpl = async (address?: tEthereumAddress, db?: string) =>
  await LendPoolConfiguratorFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolConfiguratorImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getLendPoolLoanImpl = async (address?: tEthereumAddress, db?: string) =>
  await LendPoolLoanFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LendPoolLoanImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUNFTRegistryImpl = async (address?: tEthereumAddress, db?: string) => {
  return await UNFTRegistryFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UNFTRegistryImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );
};

export const getWalletProvider = async (address?: tEthereumAddress, db?: string) =>
  await WalletBalanceProviderFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.WalletBalanceProvider}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getAddressById = async (id: string, db?: string): Promise<tEthereumAddress | undefined> =>
  (
    await getDb(db ? db : `${DRE.network.name}`)
      .get(`${id}`)
      .value()
  )?.address || undefined;

export const getCryptoPunksMarket = async (address?: tEthereumAddress, db?: string) =>
  await CryptoPunksMarketFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.CryptoPunksMarket}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getWrappedPunk = async (address?: tEthereumAddress, db?: string) =>
  await WrappedPunkFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.WrappedPunk}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getPunkGateway = async (address?: tEthereumAddress, db?: string) =>
  await PunkGatewayFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.PunkGateway}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getPunkGatewayImpl = async (address?: tEthereumAddress, db?: string) =>
  await PunkGatewayFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.PunkGatewayImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getMockIncentivesController = async (address?: tEthereumAddress, db?: string) =>
  await MockIncentivesControllerFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.MockIncentivesController}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUnlockdCollectorProxy = async (address?: tEthereumAddress, db?: string) =>
  await UnlockdCollectorFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UnlockdCollector}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getUnlockdCollectorImpl = async (address?: tEthereumAddress, db?: string) =>
  await UnlockdCollectorFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.UnlockdCollectorImpl}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getNFTXVaultFactory = async (address?: tEthereumAddress, db?: string) =>
  await INFTXVaultFactoryV2Factory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.NFTXVaultFactory}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getNFTXVault = async (address: tEthereumAddress, db?: string) =>
  await INFTXVaultFactory.connect(address, await getDeploySigner());

export const getSushiSwapRouter = async (address?: tEthereumAddress, db?: string) =>
  await IUniswapV2Router02Factory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.SushiSwapRouter}`)
          .value()
      ).address,
    await getDeploySigner()
  );

export const getLSSVMPair = async (address?: tEthereumAddress, db?: string) =>
  await ILSSVMPairFactory.connect(
    address ||
      (
        await getDb(db ? db : `${DRE.network.name}`)
          .get(`${eContractid.LSSVMPPair}`)
          .value()
      ).address,
    await getDeploySigner()
  );
export const getYVault = async (address: tEthereumAddress, db?: string) =>
  await IYVaultFactory.connect(address, await getDeploySigner());
