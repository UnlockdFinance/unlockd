import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet, getUserWallet } from "../helpers/config"; 


task("nftxfactory:createNFTXVault", "Creates a Vault on NFTX")
.addParam("nftname", "The NFT Name")
.addParam("nftsymbol", "The NFT Symbol")
.addParam("nftaddress", "The NFT address")
.setAction(async ({ nftname, nftsymbol, nftaddress }) => {
    const wallet = await getOwnerWallet();  
    await Functions.NFTXFACTORY.createNFTXVault(wallet, nftname, nftsymbol, nftaddress);
});


task("nftxfactory:vaultsForAsset", "Gets the vault address on NFTX")
.addParam("nftaddress", "The NFT address")
.setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();  
    const tx = await Functions.NFTXFACTORY.vaultsForAsset(wallet, nftaddress);
    console.log(tx);
});

task("nftxfactory:getTotalVaults", "Gets the total number of vaults on NFTX")
.setAction(async ({}) => {
    const wallet = await getUserWallet();  
    const tx = await Functions.NFTXFACTORY.getTotalVaults(wallet).then(v => v.toString());
    console.log(tx);
});