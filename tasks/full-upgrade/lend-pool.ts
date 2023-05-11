import { BytesLike } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ConfigNames, getEmergencyAdmin, loadPoolConfig } from "../../helpers/configuration";
import {
  deployGenericUTokenImpl,
  deployLendPool,
  deployLendPoolConfigurator,
  deployLendPoolLoan,
  deployUNFTImplementations,
  deployUnlockdLibraries,
  deployUTokenImplementations,
} from "../../helpers/contracts-deployments";
import {
  getDeploySigner,
  getLendPool,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getLendPoolLoanProxy,
  getMockIncentivesController,
  getUNFTRegistryProxy,
  getUToken,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork, insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eEthereumNetwork, eNetwork } from "../../helpers/types";

task("upgrade:upgrade-lend-pool", "Deploy lend pool for full enviroment")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("verify", "Verify on etherscan")
  .setAction(async ({ pool, verify }, DRE: HardhatRuntimeEnvironment) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      const addressesProvider = await getLendPoolAddressesProvider();

      //////////////////////////////////////////////////////////////////////////
      console.log("Deploying new libraries implementation...");
      await deployUnlockdLibraries(verify);

      // Reuse/deploy lend pool implementation
      console.log("Deploying new lend pool implementation ...");
      const lendPoolImpl = await deployLendPool(verify);
      console.log("Setting lend pool implementation with address:", lendPoolImpl.address);
      // Set lending pool impl to Address provider
      await waitForTx(await addressesProvider.setLendPoolImpl(lendPoolImpl.address, []));

      const address = await addressesProvider.getLendPool();
      const lendPoolProxy = await getLendPool(address);

      await insertContractAddressInDb(eContractid.LendPool, lendPoolProxy.address);

      ////////////////////////////////////////////////////////////////////////
      //Reuse/deploy lend pool loan
      console.log("Deploying new loan implementation...");
      const lendPoolLoanImpl = await deployLendPoolLoan(verify);
      console.log("Setting lend pool loan implementation with address:", lendPoolLoanImpl.address);
      //Set lend pool conf impl to Address Provider
      await waitForTx(await addressesProvider.setLendPoolLoanImpl(lendPoolLoanImpl.address, []));

      const lendPoolLoanProxy = await getLendPoolLoanProxy(await addressesProvider.getLendPoolLoan());

      await insertContractAddressInDb(eContractid.LendPoolLoan, lendPoolLoanProxy.address);

      let lendPoolConfiguratorProxy;
      //////////////////////////////////////////////////////////////////////////

      //Reuse/deploy lend pool configurator
      console.log("Deploying new configurator implementation...");
      const lendPoolConfiguratorImpl = await deployLendPoolConfigurator(verify);
      console.log("Setting lend pool configurator implementation with address:", lendPoolConfiguratorImpl.address);
      //Set lend pool conf impl to Address Provider
      await waitForTx(await addressesProvider.setLendPoolConfiguratorImpl(lendPoolConfiguratorImpl.address, []));

      lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(await addressesProvider.getLendPoolConfigurator());

      await insertContractAddressInDb(eContractid.LendPoolConfigurator, lendPoolConfiguratorProxy.address);
      const admin = await DRE.ethers.getSigner(await getEmergencyAdmin(poolConfig));

      await waitForTx(await lendPoolConfiguratorProxy.setBidDelta("10050"));

      ////////////////////////////////////////////////////////////////////////

      console.log("Deploying new generic UToken implementation...");
      const genericUTokenImpl = await deployGenericUTokenImpl(false);
      const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);
      const reserveAddresses: string[] = [];
      for (const [assetSymbol, assetAddress] of Object.entries(reserveAssets) as [string, string][]) {
        console.log("Adding ", assetSymbol);
        reserveAddresses.push(assetAddress);
      }

      const updateUTokenInputParams: {
        asset: string;
        implementation: string;
        encodedCallData: BytesLike;
      }[] = [];
      for (let i = 0; i < reserveAddresses.length; i++) {
        updateUTokenInputParams.push({
          asset: reserveAddresses[i],
          implementation: genericUTokenImpl.address,
          encodedCallData: [],
        });
      }
      console.log("Upgrading UTokens with implementation ", genericUTokenImpl.address);
      await lendPoolConfiguratorProxy.updateUToken(updateUTokenInputParams);
      // TODO REVIEW DEBT TOKEN DEPLOYMENT
      // Generic UToken & DebtToken Implementation in Pool

      await deployUTokenImplementations(pool, poolConfig.ReservesConfig, false);
    } catch (error) {
      console.log(error);
    }
  });
