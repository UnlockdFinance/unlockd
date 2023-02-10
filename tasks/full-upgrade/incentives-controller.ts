import { task } from "hardhat/config";
import { ConfigNames } from "../../helpers/configuration";
import { deployMockIncentivesController } from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider } from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";

task("full-upgrade:deploy-incentives-controller", "Deploy unft registry ")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    //////////////////////////////////////////////////////////////////////////
    // Deploy incentives controller
    console.log("Deploying new Incentives Controller Implementation...");
    const incentivesController = await deployMockIncentivesController(verify);

    const addressProvider = await getLendPoolAddressesProvider();
    await waitForTx(await addressProvider.setIncentivesController(incentivesController.address));
  });
