import { task } from "hardhat/config";
import { ConfigNames, getGenesisPoolAdmin, loadPoolConfig } from "../../helpers/configuration";
import { deployNFTOracle, deployUnlockdUpgradeableProxy } from "../../helpers/contracts-deployments";
import {
  getAllMockedNfts,
  getLendPoolAddressesProvider,
  getNFTOracle,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork, insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { addAssetsInNFTOraclewithSigner } from "../../helpers/oracles-helpers";
import { eContractid, eNetwork, ICommonConfiguration, tEthereumAddress } from "../../helpers/types";
import { NFTOracle, UnlockdUpgradeableProxy } from "../../types";

task("full:deploy-oracle-nft", "Deploy nft oracle for full enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("skipOracle", "Skip deploy oracles")
  .addFlag("skipProvider", "Skip set oracles to address provider")
  .addOptionalParam("feedAdmin", "Address of price feed")
  .setAction(async ({ verify, pool, skipOracle, skipProvider, feedAdmin }, DRE) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const { NftsAssets, NFTXVaultFactory, SushiSwapRouter } = poolConfig as ICommonConfiguration;

      const nftOracleAddress = getParamPerNetwork(poolConfig.NFTOracle, network);
      const addressesProvider = await getLendPoolAddressesProvider();

      if (skipOracle) {
        if (nftOracleAddress == undefined || !notFalsyOrZeroAddress(nftOracleAddress)) {
          throw Error("Invalid NFT Oracle address in pool config");
        }
        console.log("Reuse existed nft oracle proxy:", nftOracleAddress);
        await waitForTx(await addressesProvider.setNFTOracle(nftOracleAddress));
        return;
      }

      const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
      if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
        throw Error("Invalid pool proxy admin in config");
      }
      const proxyAdminOwnerAddress = await proxyAdmin.owner();
      const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);

      if (feedAdmin == undefined || !notFalsyOrZeroAddress(feedAdmin)) {
        feedAdmin = await getGenesisPoolAdmin(poolConfig);
      }

      const nftsAssets = getParamPerNetwork(NftsAssets, network);

      const tokens = Object.entries(nftsAssets).map(([tokenSymbol, tokenAddress]) => {
        return tokenAddress;
      }) as string[];

      const nftxVaultFactory = getParamPerNetwork(NFTXVaultFactory, network);
      if (nftxVaultFactory == undefined || !notFalsyOrZeroAddress(nftxVaultFactory)) {
        throw Error("Invalid NFTX Vault Factory address in config");
      }
      const sushiSwapRouter = getParamPerNetwork(SushiSwapRouter, network);
      if (sushiSwapRouter == undefined || !notFalsyOrZeroAddress(sushiSwapRouter)) {
        throw Error("Invalid SushiSwap Router address in config");
      }

      const lendpoolConfigurator = await addressesProvider.getLendPoolConfigurator();

      const nftOracleImpl = await deployNFTOracle(verify);
      const initEncodedData = nftOracleImpl.interface.encodeFunctionData("initialize", [
        feedAdmin,
        nftxVaultFactory,
        sushiSwapRouter,
        lendpoolConfigurator,
      ]);

      let nftOracle: NFTOracle;
      let nftOracleProxy: UnlockdUpgradeableProxy;

      if (nftOracleAddress != undefined && notFalsyOrZeroAddress(nftOracleAddress)) {
        console.log("Upgrading exist nft oracle proxy to new implementation...");

        await insertContractAddressInDb(eContractid.NFTOracle, nftOracleAddress);

        nftOracleProxy = await getUnlockdUpgradeableProxy(nftOracleAddress);

        // only proxy admin can do upgrading
        await waitForTx(
          await proxyAdmin.connect(proxyAdminOwnerSigner).upgrade(nftOracleProxy.address, nftOracleImpl.address)
        );

        nftOracle = await getNFTOracle(nftOracleProxy.address);
      } else {
        console.log("Deploying new nft oracle proxy & implementation...");
        console.log("oracle data", initEncodedData);
        nftOracleProxy = await deployUnlockdUpgradeableProxy(
          eContractid.NFTOracle,
          proxyAdmin.address,
          nftOracleImpl.address,
          initEncodedData,
          verify
        );

        nftOracle = await getNFTOracle(nftOracleProxy.address);

        await nftOracle.setPriceManagerStatus(lendpoolConfigurator, true);

        const mockNfts = await getAllMockedNfts();

        const allNftAddresses = Object.entries(mockNfts).reduce(
          (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, tokenContract]) => ({
            ...accum,
            [tokenSymbol]: tokenContract.address,
          }),
          {}
        );

        const allNftMaxSupply = Object.entries(poolConfig.Mocks.AllNftsMaxSupply).reduce(
          (accum: { [tokenSymbol: string]: string }, [tokenSymbol, tokenMaxSupply]) => ({
            ...accum,
            [tokenSymbol]: tokenMaxSupply,
          }),
          {}
        );

        const allNftPrices = Object.entries(poolConfig.Mocks.AllNftsInitialPrices).reduce(
          (accum: { [tokenSymbol: string]: string }, [tokenSymbol, tokenPrice]) => ({
            ...accum,
            [tokenSymbol]: tokenPrice,
          }),
          {}
        );
        // only oracle owner can add assets
        const oracleOwnerAddress = await nftOracle.owner();
        const oracleOwnerSigner = DRE.ethers.provider.getSigner(oracleOwnerAddress);
        // await waitForTx(await nftOracle.connect(oracleOwnerSigner).setCollections(tokens));
        await addAssetsInNFTOraclewithSigner(allNftAddresses, nftOracle, oracleOwnerSigner);
        // await setPricesInNFTOracleWithSigner(
        //   allNftPrices,
        //   allNftAddresses,
        //   allNftMaxSupply,
        //   nftOracle,
        //   oracleOwnerSigner
        // );
      }

      // Register the proxy oracle on the addressesProvider
      if (!skipProvider) {
        const addressesProvider = await getLendPoolAddressesProvider();
        await waitForTx(await addressesProvider.setNFTOracle(nftOracle.address));
      }

      console.log("NFT Oracle: proxy %s, implementation %s", nftOracle.address, nftOracleImpl.address);
    } catch (error) {
      throw error;
    }
  });
