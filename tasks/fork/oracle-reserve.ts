import { task } from "hardhat/config";
import { ConfigNames, getWrappedNativeTokenAddress, loadPoolConfig } from "../../helpers/configuration";
import { deployReserveOracle, deployUnlockdUpgradeableProxy } from "../../helpers/contracts-deployments";
import {
  getDeploySigner,
  getLendPoolAddressesProvider,
  getPairsTokenAggregator,
  getReserveOracle,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
} from "../../helpers/contracts-getters";
import {
  getEthersSignerByAddress,
  getParamPerNetwork,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eEthereumNetwork, eNetwork, ICommonConfiguration } from "../../helpers/types";
import { ReserveOracle, UnlockdUpgradeableProxy } from "../../types";

task("fork:deploy-oracle-reserve", "Deploy reserve oracle for full enviroment")
  .addFlag("testUpgrade", "Test upgradeability")
  .addFlag("skipOracle", "Skip deploy oracles")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ testupgrade, skipOracle, pool }, DRE) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const UsdAddress = poolConfig.ProtocolGlobalParams.UsdAddress;

      const { ReserveAssets, ReserveAggregators } = poolConfig as ICommonConfiguration;

      const addressesProvider = await getLendPoolAddressesProvider();
      const reserveOracleAddress = getParamPerNetwork(poolConfig.ReserveOracle, network);

      if (skipOracle) {
        if (reserveOracleAddress == undefined || !notFalsyOrZeroAddress(reserveOracleAddress)) {
          throw Error("Invalid Reserve Oracle address in pool config");
        }
        console.log("Reuse existed reserve oracle proxy:", reserveOracleAddress);
        await waitForTx(await addressesProvider.setReserveOracle(reserveOracleAddress));
        return;
      }

      const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
      console.log("PROXY admin:", proxyAdmin.address);
      const proxyOwnerAddress = await proxyAdmin.owner();

      const reserveAssets = getParamPerNetwork(ReserveAssets, network);
      const reserveAssetsWithUSD = {
        ...reserveAssets,
        USD: UsdAddress,
      };
      const reserveAggregators = getParamPerNetwork(ReserveAggregators, network);

      const [tokens, aggregators] = getPairsTokenAggregator(
        reserveAssetsWithUSD,
        reserveAggregators,
        poolConfig.OracleQuoteCurrency
      );

      const weth = await getWrappedNativeTokenAddress(poolConfig);

      const reserveOracleImpl = await deployReserveOracle([], false);
      const initEncodedData = reserveOracleImpl.interface.encodeFunctionData("initialize", [weth]);

      let reserveOracle: ReserveOracle;
      let reserveOracleProxy: UnlockdUpgradeableProxy;

      if (reserveOracleAddress != undefined && notFalsyOrZeroAddress(reserveOracleAddress)) {
        console.log("Upgrading exist reserve oracle proxy to new implementation...");

        await insertContractAddressInDb(eContractid.ReserveOracle, reserveOracleAddress);

        reserveOracleProxy = await getUnlockdUpgradeableProxy(reserveOracleAddress);
        // only proxy admin can do upgrading
        const ownerSigner = DRE.ethers.provider.getSigner(proxyOwnerAddress);
        await waitForTx(
          await proxyAdmin.connect(ownerSigner).upgrade(reserveOracleProxy.address, reserveOracleImpl.address)
        );

        reserveOracle = await getReserveOracle(reserveOracleProxy.address);
      } else {
        console.log("Deploying new reserve oracle proxy & implementation...");

        reserveOracleProxy = await deployUnlockdUpgradeableProxy(
          eContractid.ReserveOracle,
          proxyAdmin.address,
          reserveOracleImpl.address,
          initEncodedData,
          false
        );

        reserveOracle = await getReserveOracle(reserveOracleProxy.address);

        const oracleOwnerSigner = await getEthersSignerByAddress(await reserveOracle.owner());
        await waitForTx(await reserveOracle.connect(oracleOwnerSigner).setAggregators(tokens, aggregators));
      }

      // Register the proxy oracle on the addressesProvider
      await waitForTx(await addressesProvider.setReserveOracle(reserveOracle.address));

      console.log("Reserve Oracle: proxy %s, implementation %s", reserveOracle.address, reserveOracleImpl.address);
    } catch (error) {
      //throw error;
      console.log(error);
    }
  });
