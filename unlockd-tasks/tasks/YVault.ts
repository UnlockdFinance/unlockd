import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployMockYVault, deployRateStrategy } from "../../helpers/contracts-deployments";
import { getOwnerWallet, getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

task("deploy-yvault", "Deploy Mock Yearn Vault").setAction(async () => {
  const mockYVault = await deployMockYVault();
  console.log("Mock YVault deployed successfully at address: " + mockYVault.address);
});
