import { Wallet, Contract, BigNumber } from "ethers";
import { Contracts } from "./constants";


//#region  Reserves Mintable ERC20
const approve = async (wallet: Wallet, token: Contract, spender: string, amount: string) => {
    const tx = await token.connect(wallet).approve(spender, amount);
    await tx.wait();
}

const getBalance = async (wallet: Wallet, token: Contract, address: string) => {
    return await token.connect(wallet).balanceOf(address);
  
}
//#endregion

//#region  Nfts Mintable ERC721
const approveNft = async (wallet: Wallet, collection: Contract, to: string, tokenId: string) => {
    const tx = await collection.connect(wallet).approve(to, tokenId);
    await tx.wait();
}
//#endregion

//#region  LendPool 
const getNftsList = async(wallet: Wallet) => {
    return await Contracts.lendPool.connect(wallet).getNftsList();
}

const getNftData = async(wallet: Wallet, nftAddress: string) => {
    return await Contracts.lendPool.connect(wallet).getNftData(nftAddress);
}

const getNftConfiguration = async(wallet: Wallet, nftAddress: string) => {
    return await Contracts.lendPool.connect(wallet).getNftConfiguration(nftAddress);
}

const deposit = async (wallet: Wallet, asset: string, amount: BigNumber, onBehalfOf: string) => {
    return await Contracts.lendPool.connect(wallet).deposit(asset, amount, onBehalfOf, 0);
}

const withdraw = async (wallet: Wallet, asset: string, amount: BigNumber, to: string) => {
    const tx = await Contracts.lendPool.connect(wallet).withdraw(asset, amount, to);
    await tx.wait();
}

const borrow = async (wallet: Wallet, asset: string, amount: BigNumber, nftAsset: string, nftTokenId: number, onBehalfOf: string) => {
    return await Contracts.lendPool.connect(wallet).borrow(asset, amount, nftAsset, nftTokenId, onBehalfOf, 0);
}

const getCollateralData = async (wallet: Wallet, collection: string, nftTokenId: number, reserve: string) => {
    return await Contracts.lendPool.connect(wallet).getNftCollateralData(collection, nftTokenId, reserve);
}

const getDebtData = async (wallet: Wallet, collection: string, nftTokenId: number) => {
    return await Contracts.lendPool.connect(wallet).getNftDebtData(collection, nftTokenId);
}

const redeem = async (wallet: Wallet, collection: string, nftTokenId: number, amount: number) => {
    return await Contracts.lendPool.connect(wallet).redeem(collection, nftTokenId, amount);
}

const repay = async (wallet: Wallet, collection: string, nftTokenId: number, amount: number) => {
    return await Contracts.lendPool.connect(wallet).repay(collection, nftTokenId, amount);
}
//#endregion

//#region  Lendpool loan

const getLiquidateFeePercentage = async (wallet: Wallet) => {
    return await Contracts.lendPool.connect(wallet).getLiquidateFeePercentage();
}
//Lendpool loan
const getLoanIdTracker = async (wallet: Wallet) => {
    return await Contracts.lendPoolLoan.connect(wallet).getLoanIdTracker();
}
const getLoan = async (wallet: Wallet, loanId: number) => {
    return await Contracts.lendPoolLoan.connect(wallet).getLoan(loanId);
}
//#endregion

//#region  Nftoracle
const getNftPrice = async(wallet: Wallet, collection: string, tokenid: number) => {
    return await Contracts.nftOracle.connect(wallet).getNFTPrice(collection, tokenid);
}

const setNftPrice = async(wallet: Wallet, collection: string, tokenid: number, price: BigNumber) => {
    return await Contracts.nftOracle.connect(wallet).setNFTPrice(collection, tokenid, price);
}
const getNFTOracleOwner = async(wallet: Wallet) => {
    return await Contracts.nftOracle.connect(wallet).owner();
} 
//#endregion

//#region  Reserve Oracle
const getAssetPrice = async (wallet: Wallet, asset: string) => {
    return await Contracts.reserveOracle.connect(wallet).getAssetPrice(asset);
}
//#endregion

//#region AddressProvider for any doubts in the parameters check the LendPoolAddressProvider Contract
//Addresses provider for any doubts in the parameters check the LendPoolAddressProvider Contract
const getMarketId = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getMarketId();
}

const setMarketId = async (wallet: Wallet, marketId: string) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setMarketId(marketId);
}

const getLendPool = async (wallet: Wallet) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool().wait();
}

const setLendPoolImpl = async (wallet: Wallet, lendpoolAddress: string, encodedCallData: string) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolImpl(lendpoolAddress, encodedCallData);
}

const getLendPoolLiquidator = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPoolLiquidator();
}

const setLendPoolLiquidator = async (wallet: Wallet, lendPoolLiquidatorAddress: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolLiquidator(lendPoolLiquidatorAddress);
}

const getPoolAdmin = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getPoolAdmin();
}

const setPoolAdmin = async (wallet: Wallet, admin: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setPoolAdmin(admin);
}

const getEmergencyAdmin = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getEmergencyAdmin();
}

const setEmergencyAdmin = async (wallet: Wallet, emergencyAdmin: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setEmergencyAdmin(emergencyAdmin);
}

const getReserveOracle = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getReserveOracle();
}

const setReserveOracle = async (wallet: Wallet, reserveOracle: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setReserveOracle(reserveOracle);
}

const getNFTOracle = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getNFTOracle();
}

const setNFTOracle = async (wallet: Wallet, nftOracle: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setNFTOracle(nftOracle);
}

const getLendPoolLoan = async (wallet: Wallet) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool().wait();
}

const setLendPoolLoanImpl = async (wallet: Wallet, loanAddress: string, encodedCallData: string) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolImpl(loanAddress, encodedCallData);
}

const getUNFTRegistry = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getUNFTRegistry();
}

const setUNFTRegistry = async (wallet: Wallet, factory: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setUNFTRegistry(factory);
}

const getIncentivesController = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getIncentivesController();
}

const setIncentivesController = async (wallet: Wallet, controller: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setIncentivesController(controller);
}

const getUIDataProvider = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getUIDataProvider();
}

const setUIDataProvider = async (wallet: Wallet, provider: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setUIDataProvider(provider);
}

const getUnlockdDataProvider = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getUnlockdDataProvider();
}

const setUnlockdDataProvider = async (wallet: Wallet, provider: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setUnlockdDataProvider(provider);
}

const getWalletBalanceProvider = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getWalletBalanceProvider();
}

const setWalletBalanceProvider = async (wallet: Wallet, provider: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setWalletBalanceProvider(provider);
}

const getOpenseaSeaport = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getOpenseaSeaport();
}

const setOpenseaSeaport = async (wallet: Wallet, exchange: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setOpenseaSeaport(exchange);
}

const setProtocolDataProvider = async (wallet: Wallet, protocolDataProviderAddress: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setUnlockdDataProvider(protocolDataProviderAddress);
}

const getProtocolDataProvider = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getUnlockdDataProvider();
}

const getNFTXVaultFactory = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getNFTXVaultFactory();
}

const setNFTXVaultFactory = async (wallet: Wallet, address: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setNFTXVaultFactory(address);
}

const getSushiSwapRouter =  async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getSushiSwapRouter();
}

const setSushiSwapRouter = async (wallet: Wallet, address: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setSushiSwapRouter(address);
}

//#endregion

//#region Interest Rates
const variableRateSlope1 = async (wallet: Wallet) => {
    return await Contracts.interestRate.connect(wallet).variableRateSlope1();
}

const variableRateSlope2 = async (wallet: Wallet) => {
    return await Contracts.interestRate.connect(wallet).variableRateSlope2();
}

const baseVariableBorrowRate = async (wallet: Wallet) => {
    return await Contracts.interestRate.connect(wallet).baseVariableBorrowRate();
}
//#endregion

//#region UNFTRegistry
const getUNFTAddresses = async (wallet:Wallet, nftAddress: string) => {
    return await Contracts.unftRegistry.connect(wallet).getUNFTAddresses(nftAddress);
}
//#endregion
// NFTX
const getNFTXVault = async (wallet: Wallet, assetAddress: string) => {
    return await Contracts.nftxVaultFactory.connect(wallet).vaultsForAsset(assetAddress);
}

const createNFTXVault = async (wallet: Wallet, name: string, symbol: string, assetAddress: string, is1155 = false, allowAllItems = true) => {
    return await Contracts.nftxVaultFactory.connect(wallet).createVault(name, symbol, assetAddress, is1155, allowAllItems)
}

//#region LendPoolConfigurator
const setActiveFlagOnNft = async (wallet:Wallet, assets: string[], flag: boolean) => {
    return await Contracts.lendPoolConfigurator.connect(wallet).setActiveFlagOnNft(assets, flag);
}

const configureNftAsCollateral = async (
    wallet:Wallet, assets: string[], ltv: string, liquidationThreshold: string, liquidationBonus: string
    ) => {
    return await Contracts.lendPoolConfigurator.connect(wallet).configureNftAsCollateral(
        assets, 
        ltv, 
        liquidationThreshold, 
        liquidationBonus
    );
}
//#endregion

/////////////////////////////////////////////////////////////////////////////////////

// Exported functions
export const Functions = {
    RESERVES: {
        approve: approve,
        getBalance: getBalance,
    },
    NFTS: {
        approve: approveNft
    },
    LENDPOOL: {
        getNftConfiguration: getNftConfiguration,
        getNftData: getNftData,
        getNftsList: getNftsList,
        deposit: deposit,
        withdraw: withdraw,
        borrow: borrow,
        getCollateralData: getCollateralData,
        getDebtData: getDebtData,
        getLiquidateFeePercentage: getLiquidateFeePercentage,
        redeem: redeem,
        repay: repay
    },
    LENDPOOL_LOAN: {
        getLoanIdTracker: getLoanIdTracker,
        getLoan: getLoan
    },
    NFTORACLE: {
        getNftPrice: getNftPrice,
        setNftPrice: setNftPrice,
        getNFTOracleOwner: getNFTOracleOwner
    },
    RESERVEORACLE: {
        getAssetPrice: getAssetPrice,
    },
    LENDPOOLADDRESSPROVIDER: {
        getMarketId: getMarketId,
        setMarketId: setMarketId,
        getLendPool: getLendPool,
        setLendPoolImpl: setLendPoolImpl,
        setLendPoolLiquidator: setLendPoolLiquidator,
        getLendPoolLiquidator: getLendPoolLiquidator,
        getPoolAdmin: getPoolAdmin,
        setPoolAdmin: setPoolAdmin,
        getEmergencyAdmin: getEmergencyAdmin,
        setEmergencyAdmin: setEmergencyAdmin,
        getReserveOracle: getReserveOracle,
        setReserveOracle: setReserveOracle,
        getNFTOracle: getNFTOracle,
        setNFTOracle: setNFTOracle,
        getLendPoolLoan: getLendPoolLoan,
        setLendPoolLoanImpl: setLendPoolLoanImpl,
        getUNFTRegistry: getUNFTRegistry,
        setUNFTRegistry: setUNFTRegistry,
        getIncentivesController: getIncentivesController,
        setIncentivesController: setIncentivesController,
        getUIDataProvider: getUIDataProvider,
        setUIDataProvider: setUIDataProvider,
        getUnlockdDataProvider: getUnlockdDataProvider,
        setUnlockdDataProvider: setUnlockdDataProvider,
        getWalletBalanceProvider: getWalletBalanceProvider,
        setWalletBalanceProvider: setWalletBalanceProvider,
        getOpenseaSeaport: getOpenseaSeaport,
        setOpenseaSeaport: setOpenseaSeaport,
        getNFTXVaultFactory: getNFTXVaultFactory, 
        setNFTXVaultFactory: setNFTXVaultFactory,
        getSushiSwapRouter: getSushiSwapRouter,
        setSushiSwapRouter: setSushiSwapRouter,
        setProtocolDataProvider: setProtocolDataProvider,
        getProtocolDataProvider: getProtocolDataProvider,
    },
    INTERESTRATE: {
        variableRateSlope1: variableRateSlope1,
        variableRateSlope2: variableRateSlope2,
        baseVariableBorrowRate: baseVariableBorrowRate,
    },
    UNFTREGISTRY: {
        getUNFTAddresses: getUNFTAddresses,
    },
    LENDPOOLCONFIGURATOR: {
        setActiveFlagOnNft: setActiveFlagOnNft,
        configureNftAsCollateral: configureNftAsCollateral,
    },
    NFTX: {
        getNFTXVault: getNFTXVault,
        createNFTXVault: createNFTXVault
    }
}