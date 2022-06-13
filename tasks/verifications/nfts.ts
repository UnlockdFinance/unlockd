import { task } from "hardhat/config";
import { loadPoolConfig, ConfigNames } from "../../helpers/configuration";
import {
  getUNFT,
  getLendPoolAddressesProvider,
  getUnlockdUpgradeableProxy,
  getUNFTRegistryProxy,
  getUNFTRegistryImpl,
  getLendPool,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork, verifyContract } from "../../helpers/contracts-helpers";
import { eContractid, eNetwork, ICommonConfiguration, IReserveParams } from "../../helpers/types";

task("verify:nfts", "Verify nfts contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, all, pool }, localDRE) => {
    await localDRE.run("set-DRE");
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const { NftsAssets, NftsConfig } = poolConfig as ICommonConfiguration;

    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPoolProxy = await getLendPool(await addressesProvider.getLendPool());

    const bnftRegistryAddress = await addressesProvider.getUNFTRegistry();
    const bnftRegistryProxy = await getUnlockdUpgradeableProxy(bnftRegistryAddress);
    const bnftRegistryImpl = await getUNFTRegistryImpl();
    const bnftRegistry = await getUNFTRegistryProxy(bnftRegistryAddress);

    const bnftGenericImpl = await getUNFT(await bnftRegistry.uNftGenericImpl());

    // UNFTRegistry proxy
    console.log("\n- Verifying UNFT Registry Proxy...\n");
    await verifyContract(eContractid.UnlockdUpgradeableProxy, bnftRegistryProxy, [
      bnftRegistryImpl.address,
      addressesProvider.address,
      bnftRegistryImpl.interface.encodeFunctionData("initialize", [
        bnftGenericImpl.address,
        poolConfig.Mocks.UNftNamePrefix,
        poolConfig.Mocks.UNftSymbolPrefix,
      ]),
    ]);

    // UNFT generic implementation
    console.log("\n- Verifying UNFT Generic Implementation...\n");
    await verifyContract(eContractid.UNFT, bnftGenericImpl, []);

    const configs = Object.entries(NftsConfig) as [string, IReserveParams][];
    for (const entry of Object.entries(getParamPerNetwork(NftsAssets, network))) {
      const [token, tokenAddress] = entry;
      console.log(`- Verifying ${token} token related contracts`);

      const tokenConfig = configs.find(([symbol]) => symbol === token);
      if (!tokenConfig) {
        throw `NftsConfig not found for ${token} token`;
      }

      const { uNftAddress } = await lendPoolProxy.getNftData(tokenAddress);
      //const { uNftProxy, uNftImpl } = await bnftRegistry.getUNFTAddresses(tokenAddress);

      // UNFT proxy for each nft asset
      console.log("\n- Verifying UNFT Proxy...\n");
      await verifyContract(eContractid.UnlockdUpgradeableProxy, await getUnlockdUpgradeableProxy(uNftAddress), [
        bnftRegistry.address,
      ]);
    }
  });
