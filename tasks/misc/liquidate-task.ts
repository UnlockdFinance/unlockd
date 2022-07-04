import BigNumber from "bignumber.js";
import { BigNumberish } from "ethers";
import { task } from "hardhat/config";
import {
  ConfigNames,
  getCryptoPunksMarketAddress,
  getWrappedPunkTokenAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import { MAX_UINT_AMOUNT } from "../../helpers/constants";
import {
  getUnlockdProtocolDataProvider,
  getUToken,
  getDeploySigner,
  getLendPool,
  getLendPoolAddressesProvider,
  getMintableERC20,
  getPunkGateway,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { convertToCurrencyDecimals, getContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

// LendPool liquidate tasks
task("dev:pool-auction", "Doing WETH auction task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());
    const dataProvider = await getUnlockdProtocolDataProvider(await addressesProvider.getUnlockdDataProvider());

    const signer = await getDeploySigner();
    const signerAddress = await signer.getAddress();

    const loanData = await dataProvider.getLoanDataByCollateral(token, id);

    const amountDecimals = await convertToCurrencyDecimals(loanData.reserveAsset, amount);

    await waitForTx(await lendPool.auction(token, id));

    console.log("OK");
  });

task("dev:pool-redeem", "Doing WETH redeem task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to redeem, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());
    const dataProvider = await getUnlockdProtocolDataProvider(await addressesProvider.getUnlockdDataProvider());

    const signer = await getDeploySigner();
    const signerAddress = await signer.getAddress();

    const loanData = await dataProvider.getLoanDataByCollateral(token, id);
    const amountDecimals = await convertToCurrencyDecimals(loanData.reserveAsset, amount);

    const auctionData = await lendPool.getNftAuctionData(token, id);

    await waitForTx(await lendPool.redeem(token, id, amountDecimals));

    console.log("OK");
  });

task("dev:pool-liquidate-nftx", "Doing WETH liquidate NFTX task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    const signer = await getDeploySigner();
    const signerAddress = await signer.getAddress();

    const wethGateway = await getWETHGateway();

    await waitForTx(await lendPool.liquidateNFTX(token, id));

    console.log("OK");
  });

// WETHGateway liquidate tasks
task("dev:weth-auction", "Doing WETH auction task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const signer = await getDeploySigner();
    const signerAddress = await signer.getAddress();

    const wethGateway = await getWETHGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const amountDecimals = await convertToCurrencyDecimals(weth.address, amount);

    await waitForTx(await wethGateway.auction(token, id));

    console.log("OK");
  });

task("dev:weth-redeem", "Doing WETH redeem task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    const wethGateway = await getWETHGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const amountDecimals = await convertToCurrencyDecimals(weth.address, amount);

    const auctionData = await lendPool.getNftAuctionData(token, id);

    const sendValue = amountDecimals;

    await waitForTx(await wethGateway.redeemETH(token, id, amountDecimals, { value: sendValue }));

    console.log("OK");
  });

task("dev:weth-liquidate-nftx", "Doing WETH liquidate NFTX task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const addressesProvider = await getLendPoolAddressesProvider();
    const dataProvider = await getUnlockdProtocolDataProvider(await addressesProvider.getUnlockdDataProvider());
    const loanData = await dataProvider.getLoanDataByCollateral(token, id);
    console.log("currentAmount:", loanData.currentAmount.toString());

    const wethGateway = await getWETHGateway();

    await waitForTx(await wethGateway.liquidateNFTX(token, id));

    console.log("OK");
  });

// PunkGateway liquidate with ETH tasks
task("dev:punk-auction", "Doing CryptoPunks auction ETH task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("id", "Token ID of CryptoPunks")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const signer = await getDeploySigner();
    const signerAddress = await signer.getAddress();

    const punkGateway = await getPunkGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const amountDecimals = await convertToCurrencyDecimals(weth.address, amount);

    await waitForTx(await punkGateway.auction(id));

    console.log("OK");
  });

task("dev:punk-redeem-eth", "Doing CryptoPunks redeem ETH task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("id", "Token ID of CryptoPunks")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const poolConfig = loadPoolConfig(pool);

    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    const punksAddress = await getCryptoPunksMarketAddress(poolConfig);
    const wpunksAddress = await getWrappedPunkTokenAddress(poolConfig, punksAddress);

    const punkGateway = await getPunkGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const amountDecimals = await convertToCurrencyDecimals(weth.address, amount);

    const auctionData = await lendPool.getNftAuctionData(wpunksAddress, id);

    const sendValue = amountDecimals;

    await waitForTx(await punkGateway.redeemETH(id, amountDecimals, { value: sendValue }));

    console.log("OK");
  });

task("dev:punk-liquidate-nftx", "Doing CryptoPunks liquidate NFTX task")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("id", "Token ID of CryptoPunks")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const punkGateway = await getPunkGateway();

    await waitForTx(await punkGateway.liquidateNFTX(id));

    console.log("OK");
  });
