import { eContractid, INftParams, SymbolMap } from '../../helpers/types';

export const strategyNftClassA: INftParams = {
  tokenId: "1",
  baseLTVAsCollateral: '5000', // 50%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "24", // 24 hours
  auctionDuration: "24", // 24 hours
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBidFine: "2000", // 0.2 ETH
  uNftImpl: eContractid.UNFT,
  maxSupply: "0",
  maxTokenId: "0",
};

export const strategyNftClassB: INftParams = {
  tokenId: "1",
  baseLTVAsCollateral: '4000', // 40%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "24", // 24 hours
  auctionDuration: "24", // 24 hours
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBidFine: "2000", // 0.2 ETH
  uNftImpl: eContractid.UNFT,
  maxSupply: "0",
  maxTokenId: "0",
};

export const strategyNftClassC: INftParams = {
  tokenId: "1",
  baseLTVAsCollateral: '3000', // 30%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "24", // 24 hours
  auctionDuration: "24", // 24 hours
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBidFine: "2000", // 0.2 ETH
  uNftImpl: eContractid.UNFT,
  maxSupply: "0",
  maxTokenId: "0",
};

export const strategyNftClassD: INftParams = {
  tokenId: "1",
  baseLTVAsCollateral: '2000', // 20%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "24", // 24 hours
  auctionDuration: "24", // 24 hours
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBidFine: "2000", // 0.2 ETH
  uNftImpl: eContractid.UNFT,
  maxSupply: "0",
  maxTokenId: "0",
};

export const strategyNftClassE: INftParams = {
  tokenId: "1",
  baseLTVAsCollateral: '1000', // 10%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "24", // 24 hours
  auctionDuration: "24", // 24 hours
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBidFine: "2000", // 0.2 ETH
  uNftImpl: eContractid.UNFT,
  maxSupply: "0",
  maxTokenId: "0",
};

export const strategyNft_WPUNKS: INftParams = {
  ...strategyNftClassB,
  maxSupply: "10000",
  maxTokenId: "9999",
};

export const strategyNft_BAYC: INftParams = {
  ...strategyNftClassB,
  maxSupply: "10000",
  maxTokenId: "9999",
};

export const strategyNft_DOODLE: INftParams = {
  ...strategyNftClassB,
  maxSupply: "10000",
  maxTokenId: "9999",
};

export const strategyNft_MAYC: INftParams = {
  ...strategyNftClassB,
  maxSupply: "20000",
  maxTokenId: "30007",
};

export const strategyNft_CLONEX: INftParams = {
  ...strategyNftClassB,
  maxSupply: "20000",
  maxTokenId: "19999",
};

export const strategyNft_AZUKI: INftParams = {
  ...strategyNftClassB,
  maxSupply: "10000",
  maxTokenId: "9999",
};

export const strategyNft_KONGZ: INftParams = {
  ...strategyNftClassB,
  maxSupply: "5000",
  maxTokenId: "5000",
};

export const strategyNft_COOL: INftParams = {
  ...strategyNftClassB,
  maxSupply: "10000",
  maxTokenId: "9999",
};

export const strategyNft_MEEBITS: INftParams = {
  ...strategyNftClassB,
  maxSupply: "20000",
  maxTokenId: "19999",
};

export const strategyNft_WOW: INftParams = {
  ...strategyNftClassB,
  maxSupply: "10000",
  maxTokenId: "9999",
};

export const strategyNft_LAND: INftParams = {
  ...strategyNftClassB,
  maxSupply: "90000",
  maxTokenId: "89999",
};

export const strategyNftParams: SymbolMap<INftParams> = {
  "ClassA": strategyNftClassA,
  "ClassB": strategyNftClassB,
  "ClassC": strategyNftClassC,
  "ClassD": strategyNftClassD,
  "ClassE": strategyNftClassE,
  "WPUNKS": strategyNft_WPUNKS,
  "BAYC": strategyNft_BAYC,
  "DOODLE": strategyNft_DOODLE,
  "SDOODLE": strategyNft_DOODLE,
  "MAYC": strategyNft_MAYC,
  "CLONEX": strategyNft_CLONEX,
  "AZUKI": strategyNft_AZUKI,
  "KONGZ": strategyNft_KONGZ,
  "COOL": strategyNft_COOL,
  "MEEBITS": strategyNft_MEEBITS,
  "WOW": strategyNft_WOW,
  "LAND": strategyNft_LAND,
};
