import { task } from "hardhat/config";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_RESERVOIR_ADAPTER } from "../../helpers/constants";
import { deployGenericYVaultStrategy, deployReservoirAdapter } from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getReservoirAdapterProxy,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
} from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("fork:deploy-reservoir-adapter", "Deploy Reservoir Adapter contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();

    console.log("Deploying new GenericYVault strategy implementation...");
    const genericYVaultStrategyImpl = await deployGenericYVaultStrategy(verify);

    const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);

    const dataProvider = await getUnlockdProtocolDataProvider();
    const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
    const uTokenAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;
    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider,
      uTokenAddress,
      [await addressesProvider.getPoolAdmin()],
      "GenericYVaultStrategy",
      yVaultWETHAddress,
    ]);

    const reservoirAdapterProxy = await getReservoirAdapterProxy(
      await addressesProvider.getAddress(ADDRESS_ID_RESERVOIR_ADAPTER)
    );

    await insertContractAddressInDb(eContractid.ReservoirAdapter, reservoirAdapterProxy.address);
  });
