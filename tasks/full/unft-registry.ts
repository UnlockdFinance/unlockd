import { task } from "hardhat/config";
import { deployUNFTRegistry } from "../../helpers/contracts-deployments";

task("full:deploy-unft-registry", "Deploy unft registry ")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    //////////////////////////////////////////////////////////////////////////
    // Reuse/deploy UnftRegistry Vault
    console.log("Deploying new UnftRegistry Vault implementation...");
    const unftRegistryImpl = await deployUNFTRegistry(verify);
    console.log("New UnftRegistry implementation with address:", unftRegistryImpl.address);
  });
