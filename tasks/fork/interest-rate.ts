import { task } from "hardhat/config";
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  getLendPoolLiquidator,
  loadPoolConfig,
} from "../../helpers/configuration";
import { deployLendPoolAddressesProvider, deployRateStrategy } from "../../helpers/contracts-deployments";
import {
  getDeploySigner,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getNFTXVaultFactory,
  getSushiSwapRouter,
  getUnlockdProtocolDataProvider,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork, rawInsertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eNetwork, tEthereumAddress } from "../../helpers/types";

task("fork:deploy-interest-rate", "Deploy new interest rate")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("testUpgrade", "Test upgradeability")
  .addFlag("skipRegistry")
  .setAction(async ({ pool, testupgrade }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();
    const lendpoolConfigurator = await getLendPoolConfiguratorProxy();

    let strategyRates: [
      string, // addresses provider
      string,
      string,
      string,
      string
    ];
    const rateStrategies: Record<string, typeof strategyRates> = {};
    const strategyAddresses: Record<string, tEthereumAddress> = {};

    const reservesConfig = Object.entries(poolConfig.ReservesConfig);
    const reserves = getParamPerNetwork(poolConfig.ReserveAssets, network);
    console.log(reserves);
    for (const [symbol, params] of reservesConfig) {
      const { strategy, uTokenImpl, reserveDecimals } = params;
      const { optimalUtilizationRate, baseVariableBorrowRate, variableRateSlope1, variableRateSlope2 } = strategy;

      rateStrategies[strategy.name] = [
        addressesProvider.address,
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
      ];
      console.log(rateStrategies[strategy.name]);
      const interestRateAddress = await deployRateStrategy(strategy.name, rateStrategies[strategy.name], false);
      rawInsertContractAddressInDb(strategy.name, strategyAddresses[strategy.name]);

      await lendpoolConfigurator.setReserveInterestRateAddress([reserves[symbol]], interestRateAddress);
    }
  });
