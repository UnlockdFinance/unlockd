import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_RESERVOIR_ADAPTER } from "../../helpers/constants";
import { deployReservoirAdapter } from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider, getReservoirAdapterProxy } from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("fork:deploy-reservoir-adapter", "Deploy Reservoir Adapter contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    console.log("Deploying new Reservoir Adapter implementation...");
    const reservoirAdapterImpl = await deployReservoirAdapter(verify);

    const addressesProvider = await getLendPoolAddressesProvider();

    console.log("Setting reservoir adapter implementation with address:", reservoirAdapterImpl.address);

    await waitForTx(
      await addressesProvider.setAddressAsProxy(ADDRESS_ID_RESERVOIR_ADAPTER, reservoirAdapterImpl.address, [])
    );

    const reservoirAdapterProxy = await getReservoirAdapterProxy(
      await addressesProvider.getAddress(ADDRESS_ID_RESERVOIR_ADAPTER)
    );

    await insertContractAddressInDb(eContractid.ReservoirAdapter, reservoirAdapterProxy.address);
  });
