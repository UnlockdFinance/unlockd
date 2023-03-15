import { task } from "hardhat/config";
import { deployCryptoPunksMarket, deployCustomERC721 } from "../../helpers/contracts-deployments";
import {
  getLendPoolConfiguratorProxy,
  getNFTOracle,
  getUNFTRegistryProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid } from "../../helpers/types";

task("deploy-cryptopunks-market").setAction(async ({}, localBRE) => {
  await localBRE.run("set-DRE");
  const cryptoPunksMarket = await deployCryptoPunksMarket([], true);
  await insertContractAddressInDb(eContractid.CryptoPunksMarket, cryptoPunksMarket.address);
});
