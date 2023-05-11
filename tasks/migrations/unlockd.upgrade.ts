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
  WETH_GOERLI,
  WETH_MAINNET,
} from "../../helpers/constants";
import {
  deployCryptoPunksMarket,
  deployMockChainlinkOracle,
  deployMockNFTOracle,
  deployMockReserveOracle,
  deploySelfdestructTransferMock,
  deployWrappedPunk,
} from "../../helpers/contracts-deployments";
import {
  getDeploySigner,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
} from "../../helpers/contracts-getters";
import {
  getEthersSignerByAddress,
  getParamPerNetwork,
  registerContractInJsonDb,
} from "../../helpers/contracts-helpers";
import { checkVerification } from "../../helpers/etherscan-verification";
import {
  impersonateAccountsHardhat,
  printContracts,
  stopImpersonateAccountsHardhat,
  waitForTx,
} from "../../helpers/misc-utils";
import { eEthereumNetwork, eNetwork, tEthereumAddress, TokenContractId } from "../../helpers/types";

task("unlockd:upgrade", "Deploy upgrade for Unlockd strategies").setAction(
  async (
    {
      verify,
      testupgrade,
      skipRegistry,
      skipOracle,
      upgradeLendPool,
      upgradeLendPoolLoan,
      upgradeLendPoolConfigurator,
      upgradeUToken,
      upgradeWallet,
      upgradeProtocolDataProvider,
      upgradeUiDataProvider,
      upgradeInterestRate,
    },
    DRE
  ) => {
    const POOL_NAME = ConfigNames.Unlockd;
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(POOL_NAME);

    const deployerSigner = await getDeploySigner();
    const poolAdminSigner = await getEthersSignerByAddress(await getGenesisPoolAdmin(poolConfig));
    const emergencyAdminSigner = await getEthersSignerByAddress(await getEmergencyAdmin(poolConfig));
    const lendPoolLiquidatorSigner = await getEthersSignerByAddress(await getLendPoolLiquidator(poolConfig));

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

    console.log("\n\nMigration started");

    const addressesProvider = await getLendPoolAddressesProvider();

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Lockey Holders");
    await DRE.run("upgrade:deploy-lockey-holders", { pool: POOL_NAME, verify: verify });
    //////////////////////////////////////////////////////////////////////////

    console.log("\nUpgrade lend pool");
    await DRE.run("upgrade:upgrade-lend-pool", {
      pool: POOL_NAME,
      verify: verify,
    });

    //////////////////////////////////////////////////////////////////////////

    console.log("\n\nDeploy Debt Market");
    await DRE.run("fork:deploy-debt-market", {});

    //////////////////////////////////////////////////////////////////////////

    if (testupgrade && upgradeInterestRate) {
      await DRE.run("fork:deploy-interest-rate", {
        pool: POOL_NAME,
        testupgrade: testupgrade,
      });
    }

    console.log("\n\nDeploy reserve oracle");
    await DRE.run("fork:deploy-oracle-reserve", {
      pool: POOL_NAME,
      skiporacle: skipOracle,
      testupgrade: testupgrade,
    });

    console.log("-> Deploy mock reserve oracle...");
    const mockReserveOracleImpl = await deployMockReserveOracle([], false);
    await waitForTx(await mockReserveOracleImpl.initialize(FORK === "goerli" ? WETH_GOERLI : WETH_MAINNET));

    console.log("-> Deploy mock ChainLink oracle...");
    await deployMockChainlinkOracle("18", false); // Dummy aggregator for test

    console.log("\n\nDeploy nft oracle");
    await DRE.run("fork:deploy-oracle-nft", { pool: POOL_NAME, skipOracle: skipOracle, testupgrade: testupgrade });

    console.log("-> Prepare mock nft oracle...");

    const lendPoolConfigurator = await getLendPoolConfiguratorProxy(await addressesProvider.getLendPoolConfigurator());
    const mockNftOracleImpl = await deployMockNFTOracle(false);
    await waitForTx(
      await mockNftOracleImpl.initialize(await addressesProvider.getPoolAdmin(), lendPoolConfigurator.address)
    );

    ////////////////////////////////////////////////////////////////////////

    console.log("\n\nInitialize lend pool");
    await DRE.run("fork:initialize-lend-pool", { pool: POOL_NAME, testupgrade: testupgrade });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy WETH Gateway");
    await DRE.run("fork:deploy-weth-gateway", { pool: POOL_NAME, testupgrade: testupgrade });

    console.log("\n\nDeploy PUNK Gateway"); // MUST AFTER WETH GATEWAY
    await DRE.run("fork:deploy-punk-gateway", { pool: POOL_NAME, testupgrade: testupgrade });

    // //////////////////////////////////////////////////////////////////////////
    if (!testupgrade) {
      console.log("\n\nInitialize gateway");
      await DRE.run("fork:initialize-gateway", { pool: POOL_NAME, verify: false });
    }

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Reservoir Adapter");
    await DRE.run("fork:deploy-reservoir-adapter", { pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy data provider");
    await DRE.run("fork:deploy-data-provider", {
      pool: POOL_NAME,
      testupgrade: testupgrade,
      wallet: upgradeWallet,
      ui: upgradeUiDataProvider,
      protocol: upgradeProtocolDataProvider,
    });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Strategies");

    console.log("\n\nDeploy Generic Yearn Vault Strategy...");
    await DRE.run("fork:deploy-genericyvault-strategy", { pool: POOL_NAME });

    console.log("\n\nDeploy Generic Convex ETH Strategy...");
    await DRE.run("fork:deploy-genericonvexeth-strategy", { pool: POOL_NAME });

    //////////////////////////////////////////////////////////////////////////

    console.log("\n\nFinished migrations");
    printContracts(testupgrade ? "main" : "");

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
  }
);
