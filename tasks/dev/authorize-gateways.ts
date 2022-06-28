import { task } from "hardhat/config";
import { waitForTx } from "../../helpers/misc-utils";
import { getAllTokenAddresses, getAllNftAddresses } from "../../helpers/mock-helpers";
import { getAllMockedTokens, getAllMockedNfts, getWETHGateway, getPunkGateway } from "../../helpers/contracts-getters";

task("dev:authorize-gateways", "Authorize Gateways to do transactions.").setAction(
  async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    console.log("Autorization started: ");

    const mockTokens = await getAllMockedTokens();
    const allTokenAddresses = getAllTokenAddresses(mockTokens);
    const mockNfts = await getAllMockedNfts();
    const allNftAddresses = getAllNftAddresses(mockNfts);

    ////////////////////////////////////////////////////////////////////////////
    // Init & Config Reserve assets
    const wethGateway = await getWETHGateway();
    let nftAddresses: string[] = [];
    for (const [assetSymbol, assetAddress] of Object.entries(allNftAddresses) as [string, string][]) {
      nftAddresses.push(assetAddress);
      console.log("Symbol: ", assetSymbol, " Address: ", assetAddress);
    }
    await waitForTx(await wethGateway.authorizeLendPoolNFT(nftAddresses));

    ////////////////////////////////////////////////////////////////////////////
    // Init & Config NFT assets
    const punkGateway = await getPunkGateway();
    let reserveAddresses: string[] = [];
    for (const [assetSymbol, assetAddress] of Object.entries(allTokenAddresses) as [string, string][]) {
      reserveAddresses.push(assetAddress);
      console.log("Symbol: ", assetSymbol, " Address: ", assetAddress);
    }
    await waitForTx(await punkGateway.authorizeLendPoolERC20(reserveAddresses));

    console.log("ERC20 addresses authorized!");
    ////////////////////////////////////////////////////////////////////////////
  }
);
