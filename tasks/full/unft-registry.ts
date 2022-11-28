import { task } from "hardhat/config";
import { ConfigNames } from "../../helpers/configuration";
import { deployUNFTRegistry } from "../../helpers/contracts-deployments";
import { getUNFTRegistryProxy } from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";

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

    const unftRegistryProxy = await getUNFTRegistryProxy(unftRegistryImpl.addresses);
    console.log("Printed registry:::", unftRegistryProxy.address);
    await waitForTx(await unftRegistryProxy.createUNFT("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"));
    console.log("UNFT created successfully");
    const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D");
    console.log("UNFT Token:", "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", uNftProxy);
  });
