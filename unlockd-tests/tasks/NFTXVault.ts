import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet } from "../helpers/config";
import { MockContracts } from "../helpers/constants";
import { INFTXVaultFactory } from "../../types/INFTXVaultFactory";

task("nftxvault:mintNFTX", "Mints the token in NFTX")
  .addParam("nftname", "The address of the NFTs going into vault")
  .addParam("tokenids", "The tokenIds to mint on the vault")
  .addParam("amounts", "The amounts to mint on the vault")
  .setAction(async ({ nftname, tokenids, amounts }) => {
    const wallet = await getOwnerWallet();
    const nftContract = MockContracts[nftname];
    const nftxAddress = await Functions.NFTXFACTORY.vaultsForAsset(wallet, nftContract.address);
    const nftxVault = await INFTXVaultFactory.connect(nftxAddress[0], wallet);
    await Functions.NFTS.setApproveForAllNft(wallet, nftContract, nftxVault.address, true);
    await Functions.NFTXVAULT.mintNFTX(wallet, nftxVault, [tokenids], [amounts]);
  });
