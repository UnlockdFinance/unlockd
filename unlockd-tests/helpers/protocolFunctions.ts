import { MAX_INTEGER } from "ethereumjs-util";
import { Wallet, Contract, BigNumber } from "ethers";
import { Contracts } from "./constants";

//#region UnlockdProtocolDataProvider
const getNftConfigurationDataByTokenId = async (wallet: Wallet, nftAddress: string, nftTokenId: string) => {
  return await Contracts.dataProvider.connect(wallet).getNftConfigurationDataByTokenId(nftAddress, nftTokenId);
};

const getLoanDataByCollateral = async (wallet: Wallet, nftAddress: string, nftTokenId: string) => {
  return await Contracts.dataProvider.connect(wallet).getLoanDataByCollateral(nftAddress, nftTokenId);
};

//#endregion

//#region  Reserves Mintable ERC20
const approve = async (wallet: Wallet, token: Contract, spender: string, amount: string) => {
  var gas = await token.connect(wallet).estimateGas.approve(spender, amount);
  var strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);
  const tx = await token.connect(wallet).approve(spender, amount, { gasLimit: gasPrice.toFixed(0) });
  await tx.wait();
};

const getBalance = async (wallet: Wallet, token: Contract, address: string) => {
  return await token.connect(wallet).balanceOf(address);
};
//#endregion

//#region  Nfts Mintable ERC721
const approveNft = async (wallet: Wallet, collection: Contract, to: string, tokenId: string) => {
  const tx = await collection.connect(wallet).approve(to, tokenId);
  await tx.wait();
};

const getApprovedNft = async (wallet: Wallet, collection: Contract, tokenId: string) => {
  return await collection.connect(wallet).getApproved(tokenId);
};

const setApproveForAllNft = async (wallet: Wallet, collection: Contract, operator: string, approved: boolean) => {
  const tx = await collection.connect(wallet).setApprovalForAll(operator, approved);
  await tx.wait();
};

const isApprovedNft = async (wallet: Wallet, collection: Contract, owner: string, operator: string) => {
  return await collection.connect(wallet).isApprovedForAll(owner, operator);
};

//#endregion

//#region  LendPool
const liquidate = async (wallet: Wallet, nftAsset: string, nftTokenId: string, amount: string) => {
  return await Contracts.lendPool.connect(wallet).liquidate(nftAsset, nftTokenId, amount);
};

const triggerUserCollateral = async (wallet: Wallet, nftAsset: string, nftTokenId: string) => {
  return await Contracts.lendPool
    .connect(wallet)
    .triggerUserCollateral(nftAsset, nftTokenId, { value: 1000000000000000 });
};

const getTimeframe = async (wallet: Wallet) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).getTimeframe();
};

const getConfigFee = async (wallet: Wallet) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).getConfigFee();
};

const getNftConfigByTokenId = async (wallet: Wallet, nftAddress: string, nftTokenId: number) => {
  return await Contracts.lendPool.connect(wallet).getNftConfigByTokenId(nftAddress, nftTokenId);
};

const getReserveConfiguration = async (wallet: Wallet, asset: string) => {
  return await Contracts.lendPool.connect(wallet).getReserveConfiguration(asset);
};

const getNftsList = async (wallet: Wallet) => {
  return await Contracts.lendPool.connect(wallet).getNftsList();
};

const getNftConfiguration = async (wallet: Wallet, nftAddress: string) => {
  return await Contracts.lendPool.connect(wallet).getNftConfiguration(nftAddress);
};

const deposit = async (wallet: Wallet, asset: string, amount: BigNumber, onBehalfOf: string) => {
  //var gas = await Contracts.lendPool.connect(wallet).deposit(asset, amount, onBehalfOf, 0);
  //var strGas = gas.toString();
  //const gasPrice = Math.round(parseInt(strGas)*1.1);
  return await Contracts.lendPool.connect(wallet).deposit(asset, amount, onBehalfOf, 0);
};

const withdraw = async (wallet: Wallet, asset: string, amount: BigNumber, to: string) => {
  const tx = await Contracts.lendPool.connect(wallet).withdraw(asset, amount, to);
  await tx.wait();
};

const borrow = async (
  wallet: Wallet,
  asset: string,
  amount: BigNumber,
  nftAsset: string,
  nftTokenId: number,
  onBehalfOf: string
) => {
  var gas = await Contracts.lendPool
    .connect(wallet)
    .estimateGas.borrow(asset, amount, nftAsset, nftTokenId, onBehalfOf, 0);

  var strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);

  return await Contracts.lendPool
    .connect(wallet)
    .borrow(asset, amount, nftAsset, nftTokenId, onBehalfOf, 0, { gasLimit: gasPrice.toFixed(0) });
};

const getCollateralData = async (wallet: Wallet, collection: string, nftTokenId: number, reserve: string) => {
  return await Contracts.lendPool.connect(wallet).getNftCollateralData(collection, nftTokenId, reserve);
};

const getDebtData = async (wallet: Wallet, collection: string, nftTokenId: number) => {
  return await Contracts.lendPool.connect(wallet).getNftDebtData(collection, nftTokenId);
};

const redeem = async (wallet: Wallet, collection: string, nftTokenId: number, amount: number, bidfine: number) => {
  var gas = await Contracts.lendPool.connect(wallet).estimateGas.redeem(collection, nftTokenId, amount, bidfine);
  var strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);
  return await Contracts.lendPool
    .connect(wallet)
    .redeem(collection, nftTokenId, amount, bidfine, { gasLimit: gasPrice.toFixed(0) });
};

const repay = async (wallet: Wallet, collection: string, nftTokenId: number, amount: number) => {
  return await Contracts.lendPool.connect(wallet).repay(collection, nftTokenId, amount);
};
const auction = async (wallet: Wallet, collection: string, nftTokenId: number, bidprice: number, to: string) => {
  return await Contracts.lendPool.connect(wallet).auction(collection, nftTokenId, bidprice, to);
};

const getLiquidateFeePercentage = async (wallet: Wallet) => {
  return await Contracts.lendPool.connect(wallet).getLiquidateFeePercentage();
};
const getNftLiquidatePrice = async (wallet: Wallet, collection: string, nftTokenId: number) => {
  return await Contracts.lendPool.connect(wallet).getNftLiquidatePrice(collection, nftTokenId);
};
const getNftAuctionData = async (wallet: Wallet, collection: string, nftTokenId: number) => {
  return await Contracts.lendPool.connect(wallet).getNftAuctionData(collection, nftTokenId);
};
const getNftData = async (wallet: Wallet, collection: string) => {
  return await Contracts.lendPool.connect(wallet).getNftData(collection);
};
const getNftAssetConfig = async (wallet: Wallet, nftAsset: string, nftTokenId: number) => {
  return await Contracts.lendPool.connect(wallet).getNftAssetConfig(nftAsset, nftTokenId);
};
const getReserveNormalizedIncome = async (wallet: Wallet, collection: string) => {
  return await Contracts.lendPool.connect(wallet).getReserveNormalizedIncome(collection);
};
const getReserveNormalizedVariableDebt = async (wallet: Wallet, collection: string) => {
  return await Contracts.lendPool.connect(wallet).getReserveNormalizedVariableDebt(collection);
};
const getReservesList = async (wallet: Wallet) => {
  return await Contracts.lendPool.connect(wallet).getReservesList();
};
const liquidateNFTX = async (wallet: Wallet, nftAsset: string, nftTokenId: number) => {
  var gas = await Contracts.lendPool.connect(wallet).estimateGas.liquidateNFTX(nftAsset, nftTokenId);

  var strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);
  console.log(gasPrice);
  return await Contracts.lendPool
    .connect(wallet)
    .liquidateNFTX(nftAsset, nftTokenId, { gasLimit: gasPrice.toFixed(0) });
};
//#endregion

//#region WETHGateway
const depositETH = async (wallet: Wallet, amount: number, onBehalfOf: string) => {
  return await Contracts.wethGateway.connect(wallet).depositETH(onBehalfOf, 0, { value: amount });
};

const withdrawETH = async (wallet: Wallet, amount: BigNumber, to: string) => {
  const tx = await Contracts.wethGateway.connect(wallet).withdrawETH(amount, to);
  await tx.wait();
};

const borrowETH = async (
  wallet: Wallet,
  amount: BigNumber,
  nftAsset: string,
  nftTokenId: number,
  onBehalfOf: string,
  nftConfigFee: BigNumber
) => {
  var gas = await Contracts.wethGateway
    .connect(wallet)
    .estimateGas.borroweth(amount, nftAsset, nftTokenId, onBehalfOf, 0, nftConfigFee);

  var strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);

  return await Contracts.wethGateway
    .connect(wallet)
    .borrowETH(amount, nftAsset, nftTokenId, onBehalfOf, 0, nftConfigFee, { gasLimit: gasPrice.toFixed(0) });
};
//#endregion

//#region Lendpool loan
const getLoanIdTracker = async (wallet: Wallet) => {
  return await Contracts.lendPoolLoan.connect(wallet).getLoanIdTracker();
};
const getLoan = async (wallet: Wallet, loanId: number) => {
  return await Contracts.lendPoolLoan.connect(wallet).getLoan(loanId);
};
const getCollateralLoanId = async (wallet: Wallet, collection: string, tokenid: number) => {
  return await Contracts.lendPoolLoan.connect(wallet).getCollateralLoanId(collection, tokenid);
};

//#endregion

//#region  Nftoracle
const getNftPrice = async (wallet: Wallet, collection: string, tokenid: number) => {
  return await Contracts.nftOracle.connect(wallet).getNFTPrice(collection, tokenid);
};

const setNftPrice = async (wallet: Wallet, collection: string, tokenid: number, price: BigNumber) => {
  return await Contracts.nftOracle.connect(wallet).setNFTPrice(collection, tokenid, price);
};
const getNFTOracleOwner = async (wallet: Wallet) => {
  return await Contracts.nftOracle.connect(wallet).owner();
};

const setPriceManagerStatus = async (wallet: Wallet, newPriceManager: string, val: boolean) => {
  return await Contracts.nftOracle.connect(wallet).setPriceManagerStatus(newPriceManager, val);
};
//#endregion

//#region  Reserve Oracle
const getAssetPrice = async (wallet: Wallet, asset: string) => {
  return await Contracts.reserveOracle.connect(wallet).getAssetPrice(asset);
};
//#endregion

//#region AddressProvider for any doubts in the parameters check the LendPoolAddressProvider Contract
//Addresses provider for any doubts in the parameters check the LendPoolAddressProvider Contract
const getAddress = async (wallet: Wallet, bytesAddress: string) => {
  console.log(bytesAddress);
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getAddress(bytesAddress);
};
const setAddress = async (wallet: Wallet, id: string, address: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setAddress(id, address);
};
const getMarketId = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getMarketId();
};

const setMarketId = async (wallet: Wallet, marketId: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setMarketId(marketId);
};

const getLendPool = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool();
};

const setLendPoolImpl = async (wallet: Wallet, lendpoolAddress: string, encodedCallData: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolImpl(lendpoolAddress, encodedCallData);
};

const getLendPoolConfigurator = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPoolConfigurator();
};

const setLendPoolConfiguratorImpl = async (wallet: Wallet, lendpoolAddress: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolConfiguratorImpl(lendpoolAddress, []);
};

const getLtvManager = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getLtvManager();
};

const setLtvManager = async (wallet: Wallet, ltvAddress: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setLtvManager(ltvAddress);
};

const getLendPoolLiquidator = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPoolLiquidator();
};

const setLendPoolLiquidator = async (wallet: Wallet, lendPoolLiquidatorAddress: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolLiquidator(lendPoolLiquidatorAddress);
};

const getPoolAdmin = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getPoolAdmin();
};

const setPoolAdmin = async (wallet: Wallet, admin: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setPoolAdmin(admin);
};

const getEmergencyAdmin = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getEmergencyAdmin();
};

const setEmergencyAdmin = async (wallet: Wallet, emergencyAdmin: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setEmergencyAdmin(emergencyAdmin);
};

const getReserveOracle = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getReserveOracle();
};

const setReserveOracle = async (wallet: Wallet, reserveOracle: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setReserveOracle(reserveOracle);
};

const getNFTOracle = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getNFTOracle();
};

const setNFTOracle = async (wallet: Wallet, nftOracle: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setNFTOracle(nftOracle);
};

const getLendPoolLoan = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool().wait();
};

const setLendPoolLoanImpl = async (wallet: Wallet, loanAddress: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setLendPoolImpl(loanAddress, []);
};

const getUNFTRegistry = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getUNFTRegistry();
};

const setUNFTRegistry = async (wallet: Wallet, factory: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setUNFTRegistry(factory);
};

const getIncentivesController = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getIncentivesController();
};

const setIncentivesController = async (wallet: Wallet, controller: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setIncentivesController(controller);
};

const getUIDataProvider = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getUIDataProvider();
};

const setUIDataProvider = async (wallet: Wallet, provider: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setUIDataProvider(provider);
};

const getUnlockdDataProvider = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getUnlockdDataProvider();
};

const setUnlockdDataProvider = async (wallet: Wallet, provider: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setUnlockdDataProvider(provider);
};

const getWalletBalanceProvider = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getWalletBalanceProvider();
};

const setWalletBalanceProvider = async (wallet: Wallet, provider: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setWalletBalanceProvider(provider);
};

const setProtocolDataProvider = async (wallet: Wallet, protocolDataProviderAddress: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setUnlockdDataProvider(protocolDataProviderAddress);
};

const getProtocolDataProvider = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getUnlockdDataProvider();
};

const getNFTXVaultFactory = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getNFTXVaultFactory();
};

const setNFTXVaultFactory = async (wallet: Wallet, address: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setNFTXVaultFactory(address);
};

const getSushiSwapRouter = async (wallet: Wallet) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).getSushiSwapRouter();
};

const setSushiSwapRouter = async (wallet: Wallet, address: string) => {
  return await Contracts.lendPoolAddressesProvider.connect(wallet).setSushiSwapRouter(address);
};
//#endregion

//#region Interest Rates
const variableRateSlope1 = async (wallet: Wallet) => {
  return await Contracts.interestRate.connect(wallet).variableRateSlope1();
};

const variableRateSlope2 = async (wallet: Wallet) => {
  return await Contracts.interestRate.connect(wallet).variableRateSlope2();
};

const baseVariableBorrowRate = async (wallet: Wallet) => {
  return await Contracts.interestRate.connect(wallet).baseVariableBorrowRate();
};
//#endregion

//#region UNFTRegistry
const getUNFTAddresses = async (wallet: Wallet, nftAddress: string) => {
  return await Contracts.unftRegistry.connect(wallet).getUNFTAddresses(nftAddress);
};
//#endregion

//#region NFTXVaultFactory
const getTotalVaults = async (wallet: Wallet) => {
  return await Contracts.nftxVaultFactory.connect(wallet).numVaults();
};

const vaultsForAsset = async (wallet: Wallet, assetAddress: string) => {
  return await Contracts.nftxVaultFactory.connect(wallet).vaultsForAsset(assetAddress);
};

const createNFTXVault = async (
  wallet: Wallet,
  name: string,
  symbol: string,
  assetAddress: string,
  is1155 = false,
  allowAllItems = true
) => {
  return await Contracts.nftxVaultFactory
    .connect(wallet)
    .createVault(name, symbol, assetAddress, is1155, allowAllItems);
};
//#endregion

//#region NFTXVault
const mintNFTX = async (wallet: Wallet, token: Contract, tokenIds: string[], amounts: string[]) => {
  return await token.connect(wallet).mint(tokenIds, amounts);
};
//#endregion

//#region LendPoolConfigurator for any doubts in the parameters
// check the LendPoolConfigurator.sol or ILendPoolconfigurator.sol
const setTimeframe = async (wallet: Wallet, newTimeframe: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setTimeframe(newTimeframe);
};

const setConfigFee = async (wallet: Wallet, configFee: BigNumber) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setConfigFee(configFee);
};

const setAllowToSellNFTX = async (wallet: Wallet, nftAsset: string, val: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setAllowToSellNFTX(nftAsset, val);
};

const setBorrowingFlagOnReserve = async (wallet: Wallet, asset: string, flag: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setBorrowingFlagOnReserve(asset, flag);
};

const setActiveFlagOnReserve = async (wallet: Wallet, asset: string, flag: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setActiveFlagOnReserve(asset, flag);
};

const setFreezeFlagOnReserve = async (wallet: Wallet, asset: string, flag: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setFreezeFlagOnReserve(asset, flag);
};

const setReserveFactor = async (wallet: Wallet, asset: string, factor: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setReserveFactor(asset, factor);
};

const setReserveInterestRateAddress = async (wallet: Wallet, assets: string[], rateAddress: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setReserveInterestRateAddress(assets, rateAddress);
};

const setActiveFlagOnNft = async (wallet: Wallet, asset: string, flag: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setActiveFlagOnNft(asset, flag);
};

const setFreezeFlagOnNft = async (wallet: Wallet, assets: string[], flag: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setFreezeFlagOnNft(assets, flag);
};

const configureNftAsCollateral = async (
  wallet: Wallet,
  asset: string,
  tokenId: string,
  newPrice: BigNumber,
  ltv: string,
  liquidationThreshold: string,
  liquidationBonus: string,
  redeemDuration: string,
  auctionDuration: string,
  redeemFine: string,
  active: boolean,
  freeze: boolean
) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).configureNftAsCollateral(
    asset,
    tokenId,
    newPrice,
    ltv,
    liquidationThreshold,
    liquidationBonus,
    redeemDuration,
    auctionDuration,
    redeemFine,
    active,
    false,
    { gasLimit: 500000 } //TODO: always active running the function from the task. Need Fix.
  );
};

const configureNftAsAuction = async (
  wallet: Wallet,
  assets: string,
  tokenId: string,
  redeemDuration: string,
  auctionDuration: string,
  redeemFine: string
) => {
  return await Contracts.lendPoolConfigurator
    .connect(wallet)
    .configureNftAsAuction(assets, tokenId, redeemDuration, auctionDuration, redeemFine);
};

const setNftRedeemThreshold = async (wallet: Wallet, asset: string, nftTokenId: number, redeemThreshold: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setNftRedeemThreshold(asset, nftTokenId, redeemThreshold);
};

const setNftMinBidFine = async (wallet: Wallet, assets: string[], minBidFine: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setNftMinBidFine(assets, minBidFine);
};

const setNftMaxSupplyAndTokenId = async (wallet: Wallet, assets: string[], maxSupply: string, maxTokenId: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setNftMaxSupplyAndTokenId(assets, maxSupply, maxTokenId);
};

const setMaxNumberOfReserves = async (wallet: Wallet, newVal: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setMaxNumberOfReserves(newVal);
};

const setMaxNumberOfNfts = async (wallet: Wallet, newVal: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setMaxNumberOfNfts(newVal);
};

const setLiquidationFeePercentage = async (wallet: Wallet, newVal: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setLiquidationFeePercentage(newVal);
};

const setPoolPause = async (wallet: Wallet, val: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setPoolPause(val);
};

const setLtvManagerStatus = async (wallet: Wallet, newLtvManager: string, val: boolean) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).setLtvManagerStatus(newLtvManager, val);
};

const getTokenImplementation = async (wallet: Wallet, proxyAddress: string) => {
  return await Contracts.lendPoolConfigurator.connect(wallet).getTokenImplementation(proxyAddress);
};

//#endregion

//#region uToken
const RESERVE_TREASURY_ADDRESS = async (wallet: Wallet) => {
  return await Contracts.uToken.connect(wallet).RESERVE_TREASURY_ADDRESS();
};
//#endregion

//          NFT's
//       asset: nftaddress,
//       maxSupply: maxsupply,
//       maxTokenId: maxtokenid,
//       baseLTV: '3000', // 30%
//       liquidationThreshold: '9000', // 90%
//       liquidationBonus: '500', // 5%
//       redeemDuration: "2", // 2 hours
//       auctionDuration: "2", // 2 hours
//       redeemFine: "500", // 5%
//       redeemThreshold: "5000", // 50%
//       minBidFine: "2000", // 0.2 ETH

/////////////////////////////////////////////////////////////////////////////////////

// Exported functions
export const Functions = {
  DATAPROVIDER: {
    getNftConfigurationDataByTokenId: getNftConfigurationDataByTokenId,
    getLoanDataByCollateral: getLoanDataByCollateral,
  },
  UTOKEN: {
    RESERVE_TREASURY_ADDRESS: RESERVE_TREASURY_ADDRESS,
  },
  RESERVES: {
    approve: approve,
    getBalance: getBalance,
  },
  NFTS: {
    approve: approveNft,
    getApprovedNft: getApprovedNft,
    setApproveForAllNft: setApproveForAllNft,
    isApprovedNft: isApprovedNft,
  },
  LENDPOOL: {
    triggerUserCollateral: triggerUserCollateral,
    getConfigFee: getConfigFee,
    getTimeframe: getTimeframe,
    getNftConfigByTokenId: getNftConfigByTokenId,
    liquidateNFTX: liquidateNFTX,
    getReserveConfiguration: getReserveConfiguration,
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
    repay: repay,
    auction: auction,
    getNftLiquidatePrice: getNftLiquidatePrice,
    getNftAuctionData: getNftAuctionData,
    getNftAssetConfig: getNftAssetConfig,
    getReserveNormalizedIncome: getReserveNormalizedIncome,
    getReserveNormalizedVariableDebt: getReserveNormalizedVariableDebt,
    getReservesList: getReservesList,
    liquidate: liquidate,
  },
  WETH_GATEWAY: {
    depositETH: depositETH,
    withdrawETH: withdrawETH,
    borrowETH: borrowETH,
  },
  LENDPOOL_LOAN: {
    getLoanIdTracker: getLoanIdTracker,
    getLoan: getLoan,
    getCollateralLoanId: getCollateralLoanId,
  },
  NFTORACLE: {
    getNftPrice: getNftPrice,
    setNftPrice: setNftPrice,
    getNFTOracleOwner: getNFTOracleOwner,
    setPriceManagerStatus: setPriceManagerStatus,
  },
  RESERVEORACLE: {
    getAssetPrice: getAssetPrice,
  },
  LENDPOOLADDRESSPROVIDER: {
    getAddress: getAddress,
    setAddress: setAddress,
    getMarketId: getMarketId,
    setMarketId: setMarketId,
    getLendPool: getLendPool,
    setLendPoolImpl: setLendPoolImpl,
    getLendPoolConfigurator: getLendPoolConfigurator,
    setLendPoolConfiguratorImpl: setLendPoolConfiguratorImpl,
    getLtvManager: getLtvManager,
    setLtvManager: setLtvManager,
    setLendPoolLiquidator: setLendPoolLiquidator,
    getLendPoolLiquidator: getLendPoolLiquidator,
    setProtocolDataProvider: setProtocolDataProvider,
    getProtocolDataProvider: getProtocolDataProvider,
    getNFTXVaultFactory: getNFTXVaultFactory,
    setNFTXVaultFactory: setNFTXVaultFactory,
    getSushiSwapRouter: getSushiSwapRouter,
    setSushiSwapRouter: setSushiSwapRouter,
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
    setConfigFee: setConfigFee,
    setTimeframe: setTimeframe,
    setActiveFlagOnNft: setActiveFlagOnNft,
    configureNftAsCollateral: configureNftAsCollateral,
    setBorrowingFlagOnReserve: setBorrowingFlagOnReserve,
    setActiveFlagOnReserve: setActiveFlagOnReserve,
    setFreezeFlagOnReserve: setFreezeFlagOnReserve,
    setReserveFactor: setReserveFactor,
    setReserveInterestRateAddress: setReserveInterestRateAddress,
    setFreezeFlagOnNft: setFreezeFlagOnNft,
    configureNftAsAuction: configureNftAsAuction,
    setNftRedeemThreshold: setNftRedeemThreshold,
    setNftMinBidFine: setNftMinBidFine,
    setNftMaxSupplyAndTokenId: setNftMaxSupplyAndTokenId,
    setMaxNumberOfReserves: setMaxNumberOfReserves,
    setMaxNumberOfNfts: setMaxNumberOfNfts,
    setLiquidationFeePercentage: setLiquidationFeePercentage,
    setPoolPause: setPoolPause,
    setLtvManagerStatus: setLtvManagerStatus,
    getTokenImplementation: getTokenImplementation,
    setAllowToSellNFTX: setAllowToSellNFTX,
  },
  NFTXFACTORY: {
    vaultsForAsset: vaultsForAsset,
    createNFTXVault: createNFTXVault,
    getTotalVaults: getTotalVaults,
  },
  NFTXVAULT: {
    mintNFTX: mintNFTX,
  },
};
