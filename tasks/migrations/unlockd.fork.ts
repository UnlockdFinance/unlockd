import { formatEther, parseEther } from "@ethersproject/units";
import { isZeroAddress } from "ethereumjs-util";
import { task } from "hardhat/config";
import { FORK } from "../../hardhat.config";
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  getLendPoolLiquidator,
  loadPoolConfig,
} from "../../helpers/configuration";
import {
  FUNDED_ACCOUNTS_GOERLI,
  FUNDED_ACCOUNTS_MAINNET,
  FUNDED_ACCOUNT_GOERLI,
  FUNDED_ACCOUNT_MAINNET,
} from "../../helpers/constants";
import { deploySelfdestructTransferMock } from "../../helpers/contracts-deployments";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { getEthersSignerByAddress, getParamPerNetwork } from "../../helpers/contracts-helpers";
import { checkVerification } from "../../helpers/etherscan-verification";
import {
  fundSignersWithETH,
  fundSignersWithToken,
  impersonateAccountsHardhat,
  printContracts,
  stopImpersonateAccountsHardhat,
  waitForTx,
} from "../../helpers/misc-utils";
import { eNetwork, TokenContractId } from "../../helpers/types";

task("unlockd:fork", "Deploy a mock enviroment for testnets")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addFlag("skipRegistry", "Skip addresses provider registration at Addresses Provider Registry")
  .addFlag("skipOracle", "Skip deploy oracles")
  .setAction(async ({ verify, skipRegistry, skipOracle }, DRE) => {
    const POOL_NAME = ConfigNames.Unlockd;
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(POOL_NAME);

    const deployerSigner = await getDeploySigner();
    const poolAdminSigner = await getEthersSignerByAddress(await getGenesisPoolAdmin(poolConfig));
    const emergencyAdminSigner = await getEthersSignerByAddress(await getEmergencyAdmin(poolConfig));
    const lendPoolLiquidatorSigner = await getEthersSignerByAddress(await getLendPoolLiquidator(poolConfig));

    // Fund addresses

    const ACCOUNTS = FORK === "goerli" ? FUNDED_ACCOUNTS_GOERLI : FUNDED_ACCOUNTS_MAINNET;

    // Fund ERC20s
    const reserveAssets = getParamPerNetwork(poolConfig.ReserveAssets, network);
    for (const tokenSymbol of Object.keys(reserveAssets)) {
      // Fund token holder contracts with ETH
      await impersonateAccountsHardhat([ACCOUNTS["ETH"]]);

      const selfdestructContract = await deploySelfdestructTransferMock();

      // Selfdestruct the mock, pointing to token owner address
      await waitForTx(await selfdestructContract.destroyAndTransfer(ACCOUNTS[tokenSymbol], { value: parseEther("1") }));
      // Fund actual Unlockd addresses with token
      await impersonateAccountsHardhat([ACCOUNTS[tokenSymbol]]);
      const impersonatedAccountToken = await getEthersSignerByAddress(ACCOUNTS[tokenSymbol]);

      await fundSignersWithToken(
        reserveAssets[tokenSymbol],
        impersonatedAccountToken,
        tokenSymbol,
        [deployerSigner, poolAdminSigner, emergencyAdminSigner, lendPoolLiquidatorSigner],
        "1000"
      );
      await stopImpersonateAccountsHardhat([ACCOUNTS[tokenSymbol]]);
    }

    console.log(
      "Deployer:",
      await deployerSigner.getAddress(),
      "Balance:",
      formatEther(await deployerSigner.getBalance()),
      "ETH"
    );
    console.log(
      "PoolAdmin:",
      await poolAdminSigner.getAddress(),
      "Balance:",
      formatEther(await poolAdminSigner.getBalance()),
      "ETH"
    );
    console.log(
      "EmergencyAdmin:",
      await emergencyAdminSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance()),
      "ETH"
    );
    console.log(
      "LendPool Liquidator:",
      await lendPoolLiquidatorSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance()),
      "ETH"
    );

    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    console.log("\n\nMigration started");

    ////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy proxy admin");
    await DRE.run("full:deploy-proxy-admin", { pool: POOL_NAME, verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy address provider");
    await DRE.run("full:deploy-address-provider", { pool: POOL_NAME, skipRegistry: skipRegistry, verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Incentives Controller");
    await DRE.run("full:deploy-incentives-controller", { verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy UNFT Registry");
    await DRE.run("full:deploy-unft-registry", { pool: POOL_NAME, verify, createunfts: true });

    //////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy lend pool");
    await DRE.run("full:deploy-lend-pool", { pool: POOL_NAME, verify: verify });

    console.log("\n\nDeploy reserve oracle");
    await DRE.run("full:deploy-oracle-reserve", { pool: POOL_NAME, skipOracle, verify: verify });

    console.log("\n\nDeploy nft oracle");
    await DRE.run("full:deploy-oracle-nft", { pool: POOL_NAME, skipOracle, verify: verify });

    ////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize lend pool");
    await DRE.run("full:initialize-lend-pool", { pool: POOL_NAME, verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy WETH Gateway");
    await DRE.run("full:deploy-weth-gateway", { pool: POOL_NAME, verify: verify });

    console.log("\n\nDeploy PUNK Gateway"); // MUST AFTER WETH GATEWAY
    await DRE.run("full:deploy-punk-gateway", { pool: POOL_NAME, verify: verify });

    // //////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize gateway");
    await DRE.run("full:initialize-gateway", { pool: POOL_NAME, verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy data provider");
    await DRE.run("full:deploy-data-provider", {
      pool: POOL_NAME,
      wallet: true,
      ui: true,
      protocol: true,
      verify: verify,
    });

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
    console.log(
      "LendPoolLiquidator:",
      await lendPoolLiquidatorSigner.getAddress(),
      "Balance:",
      formatEther(await lendPoolLiquidatorSigner.getBalance())
    );
  });
