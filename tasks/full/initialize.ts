import { task } from "hardhat/config";
import { exit } from "process";
import { ConfigNames, getTreasuryAddress, getYVaultWETHAddress, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH } from "../../helpers/constants";
import { getLendPoolAddressesProvider, getPunkGateway, getWETHGateway } from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import {
  configureNftsByHelper,
  configureReservesByHelper,
  initNftsByHelper,
  initReservesByHelper,
} from "../../helpers/init-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

task("full:initialize-lend-pool", "Initialize lend pool configuration.")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    try {
      await localBRE.run("set-DRE");
      const network = <eNetwork>localBRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      const addressesProvider = await getLendPoolAddressesProvider();

      const admin = await addressesProvider.getPoolAdmin();

      const treasuryAddress = await getTreasuryAddress(poolConfig);

      //////////////////////////////////////////////////////////////////////////
      console.log("Init & Config Reserve assets");
      const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);

      if (!reserveAssets) {
        throw "Reserve assets is undefined. Check ReserveAssets configuration at config directory";
      }

      await initReservesByHelper(
        poolConfig.ReservesConfig,
        reserveAssets,
        poolConfig.UTokenNamePrefix,
        poolConfig.UTokenSymbolPrefix,
        poolConfig.DebtTokenNamePrefix,
        poolConfig.DebtTokenSymbolPrefix,
        admin,
        treasuryAddress,
        pool,
        verify
      );
      await configureReservesByHelper(poolConfig.ReservesConfig, reserveAssets, admin);
      console.log("Setting WETH YVault in addresses provider...");
      const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);

      if (yVaultWETHAddress == undefined || !notFalsyOrZeroAddress(yVaultWETHAddress)) {
        throw Error("Invalid WETH YVault address in pool config");
      }
      await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_YVAULT_WETH, yVaultWETHAddress));

      //////////////////////////////////////////////////////////////////////////
      console.log("Init & Config NFT assets");

      const nftsAssets = getParamPerNetwork(poolConfig.NftsAssets, network);

      if (!nftsAssets) {
        throw "NFT assets is undefined. Check NftsAssets configuration at config directory";
      }

      await initNftsByHelper(poolConfig.NftsConfig, nftsAssets, admin, pool, verify);
      await configureNftsByHelper(poolConfig.NftsConfig, nftsAssets, admin);
    } catch (err) {
      console.error(err);
      exit(1);
    }
  });

task("full:initialize-gateway", "Initialize gateway configuration.")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    try {
      await localBRE.run("set-DRE");
      const network = <eNetwork>localBRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      console.log("Banana 1");
      const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);
      if (!reserveAssets) {
        throw "Reserve assets is undefined. Check ReserveAssets configuration at config directory";
      }

      console.log("Banana 2");
      const nftsAssets = getParamPerNetwork(poolConfig.NftsAssets, network);
      if (!nftsAssets) {
        throw "NFT assets is undefined. Check NftsAssets configuration at config directory";
      }

      console.log("Banana 3");
      const wethGateway = await getWETHGateway();
      const nftAddresses: string[] = [];
      for (const [assetSymbol, assetAddress] of Object.entries(nftsAssets) as [string, string][]) {
        nftAddresses.push(assetAddress);
      }
      console.log("WETHGateway: authorizeLendPoolNFT:", nftAddresses);
      await waitForTx(await wethGateway.authorizeLendPoolNFT(nftAddresses));

      console.log("Banana 4");
      const punkGateway = await getPunkGateway();
      const reserveAddresses: string[] = [];
      for (const [assetSymbol, assetAddress] of Object.entries(reserveAssets) as [string, string][]) {
        reserveAddresses.push(assetAddress);
      }
      console.log("PunkGateway: authorizeLendPoolERC20:", reserveAddresses);
      await waitForTx(await punkGateway.authorizeLendPoolERC20(reserveAddresses));
    } catch (err) {
      console.error(err);
      exit(1);
    }
  });
