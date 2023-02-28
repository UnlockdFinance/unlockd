import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_LOCKEY_COLLECTION, ADDRESS_ID_LOCKEY_HOLDER } from "../../helpers/constants";
import { deployLockeyManager } from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider, getLockeyManagerProxy } from "../../helpers/contracts-getters";
import { getParamPerNetwork, insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("full:deploy-lockey-holders", "Deploy the lockey holders contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(pool);

    console.log("Deploying new Lockey Holders implementation...");
    const lockeyManagerImpl = await deployLockeyManager(verify);

    const addressesProvider = await getLendPoolAddressesProvider();

    console.log("Setting lockey holders implementation with address:", lockeyManagerImpl.address);

    await waitForTx(await addressesProvider.setAddressAsProxy(ADDRESS_ID_LOCKEY_HOLDER, lockeyManagerImpl.address, []));

    const lockeyManagerProxy = await getLockeyManagerProxy(
      await addressesProvider.getAddress(ADDRESS_ID_LOCKEY_HOLDER)
    );

    await insertContractAddressInDb(eContractid.LockeyManager, lockeyManagerProxy.address);

    const lockeyAddress = getParamPerNetwork(poolConfig.LockeyCollection, network);

    if (!lockeyAddress) {
      throw "Lockey address is undefined. Check Lockey Collection configuration at config directory";
    }

    await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_LOCKEY_COLLECTION, lockeyAddress));
  });
