import { BigNumberish } from "@ethersproject/bignumber";
import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_WETH_GATEWAY } from "../../helpers/constants";
import {
  getIErc721Detailed,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getUNFTRegistryProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress } from "../../helpers/misc-utils";
import { eNetwork, INftParams } from "../../helpers/types";
import { strategyNftParams } from "../../markets/unlockd/nftsConfigs";

task("encode-add-nft-to-pool", "Init and config new nft asset to lend pool")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("asset", "Address of underlying nft asset contract")
  .addParam("tokenId", "Address of underlying nft asset contract")
  .addOptionalParam("strategy", "Name of nft strategy, supported: ClassA, ClassB, ClassC, ClassD, ClassE")
  .setAction(async ({ pool, asset, tokenId, strategy }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);

    const addressesProvider = await getLendPoolAddressesProvider();

    const poolAdminSigner = await getEthersSignerByAddress(await addressesProvider.getPoolAdmin());

    const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );
    console.log("LendPoolConfigurator address:", lendPoolConfiguratorProxy.address);

    const unftRegistryProxyAddress = await addressesProvider.getUNFTRegistry();
    const unftRegistry = await getUNFTRegistryProxy(unftRegistryProxyAddress);
    const { uNftProxy } = await unftRegistry.getUNFTAddresses(asset);
    if (uNftProxy == undefined || !notFalsyOrZeroAddress(uNftProxy)) {
      throw new Error("The UNFT of asset is not created");
    }

    const nftContract = await getIErc721Detailed(asset);
    const nftSymbol = await nftContract.symbol();
    console.log("NFT:", nftSymbol);

    let nftParam: INftParams;
    if (strategy != undefined && strategy != "") {
      nftParam = strategyNftParams[strategy];
    } else {
      nftParam = poolConfig.NftsConfig[nftSymbol];
    }
    if (nftParam == undefined) {
      throw new Error("The strategy of asset is not exist");
    }

    console.log("NFT Strategy:", nftParam);

    console.log("Initialize nft to lend pool");
    const initInputParams: {
      underlyingAsset: string;
    }[] = [
      {
        underlyingAsset: asset,
      },
    ];
    const batchInitNftEncodeData = lendPoolConfiguratorProxy.interface.encodeFunctionData("batchInitNft", [
      initInputParams,
    ]);
    console.log("EncodeData: batchInitNft:", batchInitNftEncodeData);

    console.log("Configure nft parameters to lend pool");
    const cfgInputParams: {
      asset: string;
      tokenId: BigNumberish;
      baseLTV: BigNumberish;
      liquidationThreshold: BigNumberish;
      liquidationBonus: BigNumberish;
      redeemDuration: BigNumberish;
      auctionDuration: BigNumberish;
      redeemFine: BigNumberish;
      redeemThreshold: BigNumberish;
      minBidFine: BigNumberish;
      maxSupply: BigNumberish;
      maxTokenId: BigNumberish;
    }[] = [
      {
        asset: asset,
        tokenId: tokenId,
        baseLTV: nftParam.baseLTVAsCollateral,
        liquidationThreshold: nftParam.liquidationThreshold,
        liquidationBonus: nftParam.liquidationBonus,
        redeemDuration: nftParam.redeemDuration,
        auctionDuration: nftParam.auctionDuration,
        redeemFine: nftParam.redeemFine,
        redeemThreshold: nftParam.redeemThreshold,
        minBidFine: nftParam.minBidFine,
        maxSupply: nftParam.maxSupply,
        maxTokenId: nftParam.maxTokenId,
      },
    ];
    const batchCfgNftEncodeData = lendPoolConfiguratorProxy.interface.encodeFunctionData("batchConfigNft", [
      cfgInputParams,
    ]);
    console.log("EncodeData: batchConfigNft:", batchCfgNftEncodeData);

    console.log("OK");
  });

task("encode-authorize-lendpool-nft", "WETH gateway authorize to lend pool")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("assets", "Address list of underlying nft asset contract")
  .setAction(async ({ pool, assets }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);

    const addressesProvider = await getLendPoolAddressesProvider();

    const wethGateway = await getWETHGateway(await addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY));

    const assetSplits = new String(assets).split(",");

    console.log("WETHGateway address:", wethGateway.address);
    console.log("WETHGateway authorizeLendPoolNFT:", assetSplits);
    const authorizeLendPoolNFTEncodeData = wethGateway.interface.encodeFunctionData("authorizeLendPoolNFT", [
      assetSplits,
    ]);
    console.log("EncodeData: authorizeLendPoolNFT: ", authorizeLendPoolNFTEncodeData);

    console.log("OK");
  });
