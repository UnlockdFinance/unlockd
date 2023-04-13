import { ethers } from "ethers";
import { task } from "hardhat/config";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_RESERVOIR_ADAPTER } from "../../helpers/constants";
import {
  deployGenericYVaultStrategy,
  deployReservoirAdapter,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getReservoirAdapterProxy,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
} from "../../helpers/contracts-getters";
import { deployContract, insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";
import { GenericYVaultStrategy } from "../../types/GenericYVaultStrategy";

task("fork:deploy-strategies", "Deploy uToken strategies contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolAdmin = await addressesProvider.getPoolAdmin();
    const strategyName = "Generic YVault Strategy";
    const strategyName32 = ethers.utils.formatBytes32String(strategyName);

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

    console.log("Deploying new GenericYVault strategy proxy...");
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address,
      uTokenAddress,
      [poolAdmin],
      strategyName32,
      yVaultWETHAddress,
    ]);

    const genericYVaultStrategyProxy = await deployUnlockdUpgradeableProxy(
      eContractid.YVault,
      proxyAdmin.address,
      genericYVaultStrategyImpl.address,
      initEncodedData,
      false
    );

    await insertContractAddressInDb(eContractid.YVault, genericYVaultStrategyProxy.address);
  });
