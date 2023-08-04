import { BytesLike } from "ethers";
import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployGenericDebtToken,
  deployUiPoolDataProvider,
  deployUnlockdProtocolDataProvider,
  deployWalletBalancerProvider,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getUnlockdProtocolDataProvider,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

task("full:upgrade-debttoken", "Upgrade DebtToken")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);

      const addressesProvider = await getLendPoolAddressesProvider();
      console.log("Deploying new generic DebtToken implementation...");
      const genericDebtTokenImpl = await deployGenericDebtToken(true);
      const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);
      const reserveAddresses: string[] = [];
      for (const [assetSymbol, assetAddress] of Object.entries(reserveAssets) as [string, string][]) {
        reserveAddresses.push(assetAddress);
      }
      console.log("RESERVE ADDRESSES: " + reserveAddresses);
      const updateDebtTokenInputParams: {
        asset: string;
        implementation: string;
        encodedCallData: BytesLike;
      }[] = [];
      for (let i = 0; i < reserveAddresses.length; i++) {
        updateDebtTokenInputParams.push({
          asset: reserveAddresses[i],
          implementation: genericDebtTokenImpl.address,
          encodedCallData: [],
        });
      }
      const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
        await addressesProvider.getLendPoolConfigurator()
      );
      console.log("Upgrading DebtTokens with implementation ", genericDebtTokenImpl.address);
      await lendPoolConfiguratorProxy.updateDebtToken(updateDebtTokenInputParams);
    } catch (error) {
      console.log(error);
    }
  });
