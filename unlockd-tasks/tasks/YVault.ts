import { task } from "hardhat/config";
import { ConfigNames, getWrappedNativeTokenAddress, loadPoolConfig } from "../../helpers/configuration";
import {
  deployMockYVault,
  deployRateStrategy,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider, getUnlockdProxyAdminById } from "../../helpers/contracts-getters";
import { eContractid } from "../../helpers/types";
import { getOwnerWallet, getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

task("deploy-yvault", "Deploy Mock Yearn Vault").setAction(async ({}, localBRE) => {
  await localBRE.run("set-DRE");
  const config = loadPoolConfig(ConfigNames.Unlockd);
  const addressesProvider = await getLendPoolAddressesProvider();
  const weth = await getWrappedNativeTokenAddress(config);
  const mockYVaultImpl = await deployMockYVault();

  const initEncodedData = mockYVaultImpl.interface.encodeFunctionData("initialize", [
    addressesProvider.address,
    weth,
    "MockYVault",
    "YVWeth",
  ]);
  const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
  let mockYVaultProxy = await deployUnlockdUpgradeableProxy(
    eContractid.MockYVault,
    proxyAdmin.address,
    mockYVaultImpl.address,
    initEncodedData,
    false
  );
  console.log("Mock YVault deployed successfully at address: " + mockYVaultProxy.address);
});
