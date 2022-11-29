import { task } from "hardhat/config";
import { ConfigNames } from "../../helpers/configuration";
import { deployUNFTRegistry, deployUnlockdUpgradeableProxy } from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getMintableERC721,
  getProxyAdminSigner,
  getUNFTRegistryProxy,
} from "../../helpers/contracts-getters";
import { getContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid, NftContractId } from "../../helpers/types";

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
      "Unlockd Bound NFT",
      "uBound",
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

    for (const tokenSymbol of Object.keys(NftContractId)) {
      let tokenAddress = await getContractAddressInDb(tokenSymbol);
      console.log(tokenAddress);
      await waitForTx(await unftRegistryProxy.createUNFT(tokenAddress));
      console.log("UNFT created successfully");
      const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses(tokenAddress);
      console.log("UNFT Token:", tokenAddress, uNftProxy);
    }
  });
