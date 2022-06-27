import { task } from "hardhat/config";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, tEthereumAddress, UnlockdPools } from "../../helpers/types";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployUNFTRegistry,
  deployGenericUNFTImpl,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getUNFTRegistryProxy,
  getUnlockdProxyAdminById,
  getConfigMockedNfts,
  getProxyAdminSigner,
} from "../../helpers/contracts-getters";
import { MintableERC721 } from "../../types";

task("dev:deploy-mock-unft-registry", "Deploy bnft registry for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const proxyAdminAddress = await (await getProxyAdminSigner()).getAddress();

    const poolConfig = loadPoolConfig(pool);

    const bnftGenericImpl = await deployGenericUNFTImpl(verify);

    const bnftRegistryImpl = await deployUNFTRegistry(verify);

    const initEncodedData = bnftRegistryImpl.interface.encodeFunctionData("initialize", [
      bnftGenericImpl.address,
      poolConfig.Mocks.UNftNamePrefix,
      poolConfig.Mocks.UNftSymbolPrefix,
    ]);

    const bnftRegistryProxy = await deployUnlockdUpgradeableProxy(
      eContractid.UNFTRegistry,
      proxyAdminAddress,
      bnftRegistryImpl.address,
      initEncodedData,
      verify
    );
  });

task("dev:deploy-mock-unft-tokens", "Deploy bnft tokens for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const poolConfig = loadPoolConfig(pool);

    const bnftRegistryProxy = await getUNFTRegistryProxy();

    const mockedNfts = await getConfigMockedNfts(poolConfig);

    for (const [nftSymbol, mockedNft] of Object.entries(mockedNfts) as [string, MintableERC721][]) {
      await waitForTx(await bnftRegistryProxy.createUNFT(mockedNft.address));
      const { uNftProxy } = await bnftRegistryProxy.getUNFTAddresses(mockedNft.address);
      console.log("UNFT Token:", nftSymbol, uNftProxy);
    }
  });
