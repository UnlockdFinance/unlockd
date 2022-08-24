import { task } from "hardhat/config";
import { waitForTx } from "../../helpers/misc-utils";
import { getWETHGateway, getUNFTRegistryProxy, getUToken } from "../../helpers/contracts-getters";
import { getLendPoolConfiguratorProxy } from "../../helpers/contracts-getters";


task("uToken-register", "Deploy uToken")
  .addParam("tokenaddress", `The address of the ERC20 to use`)
  .setAction(async ({ tokenaddress }) => {

    const uTokenProxy = await getUToken();
    const unftRegistryProxy = await getUNFTRegistryProxy();
    await waitForTx(await unftRegistryProxy.createUNFT(tokenaddress));
    const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses(tokenaddress);
    console.log("UNFT Token:", tokenaddress, uNftProxy);
  }
);