import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getUserWallet } from "../helpers/config";

// Get the treasury address from the uToken
task("dataProvider:getNftConfigurationDataByTokenId", "Gets individual NFT configuration")
  .addParam("nftaddress", "The asset address")
  .addParam("nfttokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, nfttokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.DATAPROVIDER.getNftConfigurationDataByTokenId(wallet, nftaddress, nfttokenid).then(
      (data) => data.toString()
    );
    console.log(await tx);
  });

task("dataProvider:getLoanDataByCollateral", "Gets individual NFT loan")
  .addParam("nftaddress", "The asset address")
  .addParam("nfttokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, nfttokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.DATAPROVIDER.getLoanDataByCollateral(wallet, nftaddress, nfttokenid).then((v) =>
      v.toString()
    );
    console.log(tx);
  });
