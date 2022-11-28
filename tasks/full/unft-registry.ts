import { task } from "hardhat/config";
import { ConfigNames } from "../../helpers/configuration";
import { deployUNFTRegistry, deployUnlockdUpgradeableProxy } from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getProxyAdminSigner,
  getUNFTRegistryProxy,
} from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid } from "../../helpers/types";
import { LendPoolAddressesProvider } from "../../types";

task("full:deploy-unft-registry", "Deploy unft registry ")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");
    //////////////////////////////////////////////////////////////////////////
    // Reuse/deploy UnftRegistry Vault
    console.log("Deploying new UnftRegistry Vault implementation...");
    const unftRegistryImpl = await deployUNFTRegistry(verify);
    console.log("New UnftRegistry implementation with address:", unftRegistryImpl.address);

    const initEncodedData = unftRegistryImpl.interface.encodeFunctionData("initialize", [
      unftRegistryImpl.address,
      "Bored Apes Yatch Club",
      "BAYC",
    ]);

    const proxyAdminAddress = await (await getProxyAdminSigner()).getAddress();

    await deployUnlockdUpgradeableProxy(
      eContractid.UNFTRegistry,
      proxyAdminAddress,
      unftRegistryImpl.address,
      initEncodedData,
      verify
    );

    const unftRegistryProxy = await getUNFTRegistryProxy(unftRegistryImpl.addresses);
    const addressProvider = await getLendPoolAddressesProvider();
    await waitForTx(await addressProvider.setUNFTRegistry(unftRegistryProxy.address));
    console.log("Printed registry:::", unftRegistryProxy.address);
    await waitForTx(await unftRegistryProxy.createUNFT("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"));
    console.log("UNFT created successfully");
    const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D");
    console.log("UNFT Token:", "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", uNftProxy);
  });
