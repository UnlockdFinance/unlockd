import { Wallet, Contract, BigNumber } from "ethers";
import { Contracts } from "./constants";

//Reserves
const approve = async (wallet: Wallet, token: Contract, spender: string, amount: string) => {
    const tx = await token.connect(wallet).approve(spender, amount);
    await tx.wait();
}

const getBalance = async (wallet: Wallet, token: Contract, address: string) => {
    return await token.connect(wallet).balanceOf(address);
  
}

//Nfts
const approveNft = async (wallet: Wallet, collection: Contract, to: string, tokenId: string) => {
    const tx = await collection.connect(wallet).approve(to, tokenId);
    await tx.wait();
}


//LendPool
const deposit = async (wallet: Wallet, asset: string, amount: BigNumber, onBehalfOf: string) => {
    const tx = await Contracts.lendPool.connect(wallet).deposit(asset, amount, onBehalfOf, 0);
    await tx.wait();
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
//Lendpool loan
const getLoanIdTracker = async (wallet: Wallet) => {
    return await Contracts.lendPoolLoan.connect(wallet).getLoanIdTracker();
}
const getLoan = async (wallet: Wallet, loanId: number) => {
    return await Contracts.lendPoolLoan.connect(wallet).getLoan(loanId);
}

//Nftoracle
const getNftPrice = async(wallet: Wallet, collection: string, tokenid: number) => {
    return await Contracts.nftOracle.connect(wallet).getNFTPrice(collection, tokenid);
}
const setNftPrice = async(wallet: Wallet, collection: string, tokenid: number, price: BigNumber) => {
    return await Contracts.nftOracle.connect(wallet).setNFTPrice(collection, tokenid, price);
}
const getNFTOracleOwner = async(wallet: Wallet) => {
    return await Contracts.nftOracle.connect(wallet).owner();
} 

// Reserve Oracle
const getAssetPrice = async (wallet: Wallet, asset: string) => {
    return await Contracts.reserveOracle.connect(wallet).getAssetPrice(asset);
}

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

const getNFTXVaultFactory = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getNFTXVaultFactory();
}

const setNFTXVaultFactory = async (wallet: Wallet, factory: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setNFTXVaultFactory(factory);
}

const getSushiSwapRouter = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getSushiSwapRouter();
}

const setSushiSwapRouter = async (wallet: Wallet, router: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setSushiSwapRouter(router);
}

// interest Rates
const variableRateSlope1 = async (wallet: Wallet) => {
    return await Contracts.interestRate.connect(wallet).variableRateSlope1();
}

const variableRateSlope2 = async (wallet: Wallet) => {
    return await Contracts.interestRate.connect(wallet).variableRateSlope2();
}

const baseVariableBorrowRate = async (wallet: Wallet) => {
    return await Contracts.interestRate.connect(wallet).baseVariableBorrowRate();
}


//Exported functions
export const Functions = {
    RESERVES: {
        approve: approve,
        getBalance: getBalance,
    },
    NFTS: {
        approve: approveNft
    },
    LENDPOOL: {
        deposit: deposit,
        withdraw: withdraw,
        borrow: borrow,
        getCollateralData: getCollateralData,
        getDebtData: getDebtData,
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
    },
    INTERESTRATE: {
        variableRateSlope1: variableRateSlope1,
        variableRateSlope2: variableRateSlope2,
        baseVariableBorrowRate: baseVariableBorrowRate,
    },
}