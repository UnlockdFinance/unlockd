import { task } from "hardhat/config";
import { exit } from "process";
import { ConfigNames, getTreasuryAddress, getYVaultWETHAddress, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH } from "../../helpers/constants";
import {
  getLendPoolAddressesProvider,
  getPunkGateway,
  getWETHGateway,
  getWrappedPunk,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import {
  configureNftsByHelper,
  configureReservesByHelper,
  initNftsByHelper,
  initReservesByHelper,
} from "../../helpers/init-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

task("fork:initialize-lend-pool", "Initialize lend pool configuration.")
  .addFlag("testUpgrade", "Test upgradeability")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ testupgrade, pool }, localBRE) => {
    try {
      await localBRE.run("set-DRE");
      const network = <eNetwork>localBRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      const addressesProvider = await getLendPoolAddressesProvider();

      const admin = await addressesProvider.getPoolAdmin();

      const treasuryAddress = await getTreasuryAddress(poolConfig);

      //////////////////////////////////////////////////////////////////////////
      if (!testupgrade) {
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
          false
        );
        await configureReservesByHelper(poolConfig.ReservesConfig, reserveAssets, admin);
      }
      const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
      if (!yVaultWETHAddress) {
        throw "YVault is undefined. Check ReserveAssets configuration at config directory";
      }
      console.log("Setting YVaultWETH with address: ", yVaultWETHAddress, " in addressesProvider...");
      await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_YVAULT_WETH, yVaultWETHAddress));

      //////////////////////////////////////////////////////////////////////////
      if (!testupgrade) {
        console.log("Init & Config NFT assets");

        const nftsAssets = getParamPerNetwork(poolConfig.NftsAssets, network);

        if (!nftsAssets) {
          throw "NFT assets is undefined. Check NftsAssets configuration at config directory";
        }
        nftsAssets["WPUNKS"] = await (await getWrappedPunk()).address;
        //await initNftsByHelper(poolConfig.NftsConfig, nftsAssets, admin, pool, false);
        //await configureNftsByHelper(poolConfig.NftsConfig, nftsAssets, admin);
      }
    } catch (err) {
      console.error(err);
      exit(1);
    }
  });

task("fork:initialize-gateway", "Initialize gateway configuration.")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    try {
      await localBRE.run("set-DRE");
      const network = <eNetwork>localBRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);
      if (!reserveAssets) {
        throw "Reserve assets is undefined. Check ReserveAssets configuration at config directory";
      }

      const nftsAssets = getParamPerNetwork(poolConfig.NftsAssets, network);
      if (!nftsAssets) {
        throw "NFT assets is undefined. Check NftsAssets configuration at config directory";
      }
      nftsAssets["WPUNKS"] = await (await getWrappedPunk()).address;
      const wethGateway = await getWETHGateway();
      const nftAddresses: string[] = [];
      for (const [assetSymbol, assetAddress] of Object.entries(nftsAssets) as [string, string][]) {
        nftAddresses.push(assetAddress);
      }
      console.log("WETHGateway: authorizeLendPoolNFT:", nftAddresses);
      await waitForTx(await wethGateway.authorizeLendPoolNFT(nftAddresses));

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
