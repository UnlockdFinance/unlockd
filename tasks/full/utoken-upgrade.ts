import { BytesLike } from "ethers";
import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployGenericUTokenImpl,
  deployUiPoolDataProvider,
  deployUnlockdProtocolDataProvider,
  deployWalletBalancerProvider,
} from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider, getLendPoolConfiguratorProxy } from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

task("full:upgrade-utoken", "Upgrade UToken")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      const addressesProvider = await getLendPoolAddressesProvider();
      console.log("Deploying new generic UToken implementation...");
      const genericUTokenImpl = await deployGenericUTokenImpl(true);
      const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);
      const reserveAddresses: string[] = [];
      for (const [assetSymbol, assetAddress] of Object.entries(reserveAssets) as [string, string][]) {
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
      const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
        await addressesProvider.getLendPoolConfigurator()
      );
      console.log("Upgrading UTokens with implementation ", genericUTokenImpl.address);
      await lendPoolConfiguratorProxy.updateUToken(updateUTokenInputParams);
    } catch (error) {
      console.log(error);
    }
  });
