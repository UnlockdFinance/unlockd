import { task } from "hardhat/config";
import { waitForTx } from "../../helpers/misc-utils";
import { getWETHGateway, getUNFTRegistryProxy, getNFTOracle } from "../../helpers/contracts-getters";
import { getLendPoolConfiguratorProxy } from "../../helpers/contracts-getters";


task("unft-registerNFT", "Deploy unft tokens for dev enviroment")
  .addParam("nftaddress", `The address of the NFT to use`)
  .setAction(async ({ nftaddress, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const unftRegistryProxy = await getUNFTRegistryProxy();
    await waitForTx(await unftRegistryProxy.createUNFT(nftaddress));
    const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses(nftaddress);
    console.log("UNFT Token:", nftaddress, uNftProxy);
  }
);

task("addAsset-NFTOracle", "Add an NFT Address to the Oracle")
  .addParam("nftaddress", `The address of the NFT to add`)
  .setAction(async ({ nftaddress, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const nftOracle = await getNFTOracle();
    await waitForTx(await nftOracle.addCollection(nftaddress));
    console.log("NFTOracle: token address added: ", nftaddress);
  }
);

task("initNFTReserve", "Initializes the NFT Reserve")
  .addParam("nftaddress", `The address of the NFT to add`)
  .setAction(async ({ nftaddress, pool }, localBRE) => {

    await localBRE.run("set-DRE");
    console.log("-> Prepare NFT pools...");
    const configurator = await getLendPoolConfiguratorProxy();
    //const { uNftImpl } = await unftRegistryProxy.getUNFTAddresses(nftaddress);

    const tx3 = await waitForTx(await configurator.batchInitNft([{underlyingAsset: nftaddress}]));
    console.log(tx3);
  }
);

task("configNFTReserve", "Initializes the NFT Reserve")
  .addParam("nftaddress", `The address of the NFT to add`)
  .addParam("nftsymbol", `The address of the NFT to add`)
  .addParam("maxsupply", `The address of the NFT to add`)
  .addParam("maxtokenid", `The address of the NFT to add`)
  .setAction(async ({ nftaddress, nftsymbol, maxsupply, maxtokenid, pool }, localBRE) => {

    await localBRE.run("set-DRE");
    console.log("-> Prepare NFT pools...");
    // NFT params from pool + mocked tokens
    const configurator = await getLendPoolConfiguratorProxy();
    const nftsParams = {
      asset: nftaddress,
      maxSupply: maxsupply,
      maxTokenId: maxtokenid,
      baseLTV: '3000', // 30%
      liquidationThreshold: '9000', // 90%
      liquidationBonus: '500', // 5%
      redeemDuration: "2", // 2 day
      auctionDuration: "2", // 2 day
      redeemFine: "500", // 5%
      redeemThreshold: "5000", // 50%
      minBidFine: "2000", // 0.2 ETH
    };
    console.log("2");

    const tx = await waitForTx(await configurator.batchConfigNft([nftsParams]));
    console.log(tx);
  }
);

task("auth-wethgateway", "Authorize Weth Gateway to do transactions.")
.addParam("nftaddress", "the address of the NFT to authorize") 
.setAction( async ({ nftaddress, pool }, localBRE) => {
    await localBRE.run("set-DRE");
    
    ////////////////////////////////////////////////////////////////////////////
    // Init & Config Reserve assets
    const wethGateway = await getWETHGateway();
    await waitForTx(await wethGateway.authorizeLendPoolNFT([nftaddress]));
    console.log("ERC721 addresses authorized!");
    }
);


// task("tests:auth-punkgateway", "Authorize Weth Gateway to do transactions.")
// .addParam("tokenaddress", "the address of the NFT to authorize") 
// .setAction( async ({ tokenaddress } ) => {
//     ////////////////////////////////////////////////////////////////////////////
//     // Init & Config NFT assets
//     const punkGateway = await getPunkGateway();
//     await waitForTx(await punkGateway.authorizeLendPoolERC20(tokenaddress));
//     console.log("ERC20 addresses authorized!");
//     ////////////////////////////////////////////////////////////////////////////
//   }
// );