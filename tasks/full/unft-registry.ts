import { task } from "hardhat/config";
import { ConfigNames } from "../../helpers/configuration";
import { deployUNFTRegistry } from "../../helpers/contracts-deployments";

task("full:deploy-unft-registry", "Deploy unft registry ")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");
    console.log("DRE::::::", DRE.network.name);
    //////////////////////////////////////////////////////////////////////////
    // Reuse/deploy UnftRegistry Vault
    console.log("Deploying new UnftRegistry Vault implementation...");
    const unftRegistryImpl = await deployUNFTRegistry(verify);
    console.log("New UnftRegistry implementation with address:", unftRegistryImpl.address);
  });
