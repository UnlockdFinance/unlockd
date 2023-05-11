import { task } from "hardhat/config";
import { ConfigNames, getWrappedNativeTokenAddress, loadPoolConfig } from "../../helpers/configuration";
import { deployMockYVault, deployUnlockdUpgradeableProxy } from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider, getMockYVault, getUnlockdProxyAdminById } from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";

import { eContractid, eNetwork } from "../../helpers/types";

task("upgrade:deploy-mock-yvault", "Deploy the lockey holders contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();
    const weth = await getWrappedNativeTokenAddress(poolConfig);

    console.log("Deploying new mock YVault implementation...");
    const mockYVaultImpl = await deployMockYVault(true);

    const initEncodedData = mockYVaultImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address,
      weth,
      "MockYVault",
      "YVWeth",
    ]);
    const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);
    let mockYVaultProxy = await getMockYVault();
    console.log("MOCK PROXY", mockYVaultProxy.address);
    if (mockYVaultProxy != undefined && notFalsyOrZeroAddress(mockYVaultProxy.address)) {
      console.log("Upgrading existing mock yvault proxy to new implementation...");

      await insertContractAddressInDb(eContractid.MockYVault, mockYVaultProxy.address);

      // only proxy admin can do upgrading
      await waitForTx(
        await proxyAdmin.connect(proxyAdminOwnerSigner).upgrade(mockYVaultProxy.address, mockYVaultImpl.address)
      );
      console.log("Upgraded mock yvault");
    } else {
      console.log("Deploying new mock yvault proxy...");
      let mockYVaultProxy = await deployUnlockdUpgradeableProxy(
        eContractid.MockYVault,
        proxyAdmin.address,
        mockYVaultImpl.address,
        initEncodedData,
        false
      );
    }
    console.log("Mock YVault deployed at proxy: ", mockYVaultProxy.address);
  });
