import { task } from "hardhat/config";
import { checkVerification } from "../../helpers/etherscan-verification";
import { ConfigNames } from "../../helpers/configuration";
import { printContracts } from "../../helpers/misc-utils";
import { loadPoolConfig, getGenesisPoolAdmin, getEmergencyAdmin } from "../../helpers/configuration";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../../helpers/contracts-helpers";
import { formatEther } from "@ethersproject/units";

task("unlockd:mock", "Deploy a mock enviroment for testnets")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    const POOL_NAME = ConfigNames.Unlockd;
    await localBRE.run("set-DRE");

    const poolConfig = loadPoolConfig(POOL_NAME);

    const deployerSigner = await getDeploySigner();
    const poolAdminSigner = await getEthersSignerByAddress(await getGenesisPoolAdmin(poolConfig));
    const emergencyAdminSigner = await getEthersSignerByAddress(await getEmergencyAdmin(poolConfig));

    console.log(
      "Deployer:",
      await deployerSigner.getAddress(),
      "Balance:",
      formatEther(await deployerSigner.getBalance())
    );
    console.log(
      "PoolAdmin:",
      await poolAdminSigner.getAddress(),
      "Balance:",
      formatEther(await poolAdminSigner.getBalance())
    );
    console.log(
      "EmergencyAdmin:",
      await emergencyAdminSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance())
    );

    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    console.log("\n\nMigration started");

    ///////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy mock aggregators");
    await localBRE.run("dev:deploy-all-mock-aggregators", { verify, pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy mock reserves");
    await localBRE.run("dev:deploy-mock-reserves", { verify });

    console.log("\n\nDeploy mock nfts");
    await localBRE.run("dev:deploy-mock-nfts", { verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy mock unft registry");
    await localBRE.run("dev:deploy-mock-unft-registry", { verify, pool: POOL_NAME });

    console.log("\n\nDeploy mock unft tokens");
    await localBRE.run("dev:deploy-mock-unft-tokens", { verify, pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy proxy admin");
    await localBRE.run("full:deploy-proxy-admin", { verify, pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy address provider");
    await localBRE.run("dev:deploy-address-provider", { verify, pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy lend pool");
    await localBRE.run("dev:deploy-lend-pool", { verify, pool: POOL_NAME });

    console.log("\n\nDeploy reserve oracle");
    await localBRE.run("dev:deploy-oracle-reserve", { verify, pool: POOL_NAME });

    console.log("\n\nDeploy nft oracle");
    await localBRE.run("dev:deploy-oracle-nft", { verify, pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy WETH Gateway");
    await localBRE.run("full:deploy-weth-gateway", { verify, pool: POOL_NAME });

    console.log("\n\nDeploy PUNK Gateway"); // MUST AFTER WETH GATEWAY
    await localBRE.run("full:deploy-punk-gateway", { verify, pool: POOL_NAME });

    console.log("\n\nDeploy unlockd collect contract"); // APPROVE Transfer Function for ERC20
    await localBRE.run("full:deploy-unlockd-collector", { verify, pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize lend pool");
    await localBRE.run("dev:initialize-lend-pool", { verify, pool: POOL_NAME });

    console.log("\n\nFinished migrations");
    printContracts();

    console.log(
      "Deployer:",
      await deployerSigner.getAddress(),
      "Balance:",
      formatEther(await deployerSigner.getBalance())
    );
    console.log(
      "PoolAdmin:",
      await poolAdminSigner.getAddress(),
      "Balance:",
      formatEther(await poolAdminSigner.getBalance())
    );
    console.log(
      "EmergencyAdmin:",
      await emergencyAdminSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance())
    );
  });
