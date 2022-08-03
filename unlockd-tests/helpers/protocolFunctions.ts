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
const auction = async (wallet: Wallet, collection: string, nftTokenId: number, bidprice: number, to: string) => {
    return await Contracts.lendPool.connect(wallet).auction(collection, nftTokenId, bidprice, to);
}

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
const getCollateralLoanId = async (wallet: Wallet, collection: string, tokenid: number) => {
    return await Contracts.lendPoolLoan.connect(wallet).getCollateralLoanId(collection, tokenid);
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

//Addresses provider

const getLendPool = async (wallet: Wallet) => { 
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool().wait();
}

const getMarketId = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getMarketId();
}

const setLendPoolLiquidator = async (wallet: Wallet, lendPoolLiquidatorAddress: string) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolLiquidator(lendPoolLiquidatorAddress);
}

const getLendPoolLiquidator = async (wallet: Wallet) => {
    return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPoolLiquidator();
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

// NFTX
const getNFTXVault = async (wallet: Wallet, assetAddress: string) => {
    return await Contracts.nftxVaultFactory.connect(wallet).vaultsForAsset(assetAddress);
}

const createNFTXVault = async (wallet: Wallet, name: string, symbol: string, assetAddress: string, is1155 = false, allowAllItems = true) => {
    return await Contracts.nftxVaultFactory.connect(wallet).createVault(name, symbol, assetAddress, is1155, allowAllItems)
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
        getLiquidateFeePercentage: getLiquidateFeePercentage,
        redeem: redeem,
        repay: repay,
        auction: auction
    },
    LENDPOOL_LOAN: {
        getLoanIdTracker: getLoanIdTracker,
        getLoan: getLoan,
        getCollateralLoanId: getCollateralLoanId
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
        getLendPool: getLendPool,
        getMarketId: getMarketId,
        setLendPoolLiquidator: setLendPoolLiquidator,
        getLendPoolLiquidator: getLendPoolLiquidator,
        setProtocolDataProvider: setProtocolDataProvider,
        getProtocolDataProvider: getProtocolDataProvider,
        getNFTXVaultFactory: getNFTXVaultFactory,
        setNFTXVaultFactory: setNFTXVaultFactory,
        getSushiSwapRouter: getSushiSwapRouter,
        setSushiSwapRouter: setSushiSwapRouter
    },
    INTERESTRATE: {
        variableRateSlope1: variableRateSlope1,
        variableRateSlope2: variableRateSlope2,
        baseVariableBorrowRate: baseVariableBorrowRate,
    },
    NFTX: {
        getNFTXVault: getNFTXVault,
        createNFTXVault: createNFTXVault
    }
}