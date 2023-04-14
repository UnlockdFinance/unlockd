import { ethers } from "ethers";
import { task } from "hardhat/config";
import {
  ConfigNames,
  getConvexBooster,
  getCurveCRVWETHPool,
  getCurveCVXWETHPool,
  getCurveETHAlETHPool,
  getUniswapRouter,
  getYVaultWETHAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import { ADDRESS_ID_RESERVOIR_ADAPTER } from "../../helpers/constants";
import {
  deployGenericConvexETHStrategy,
  deployGenericYVaultStrategy,
  deployReservoirAdapter,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getReservoirAdapterProxy,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
} from "../../helpers/contracts-getters";
import { deployContract, getParamPerNetwork, insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";
import { UnlockdUpgradeableProxy } from "../../types";
import { GenericYVaultStrategy } from "../../types/GenericYVaultStrategy";

task("fork:deploy-genericyvault-strategy", "Deploy Unlockd Generic Yearn Vault Strategy")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolAdmin = await addressesProvider.getPoolAdmin();
    const strategyName = "Yearn yvWETH Strategy";
    const strategyName32 = ethers.utils.formatBytes32String(strategyName);

    console.log("Deploying new GenericYVault strategy implementation...");
    const genericYVaultStrategyImpl = await deployGenericYVaultStrategy(verify);

    const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);

    const dataProvider = await getUnlockdProtocolDataProvider();
    const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
    const uTokenAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;
    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }

    console.log("Deploying new GenericYVault strategy proxy...");
    //@ts-ignore
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uTokenAddress, // uToken
      [poolAdmin], // keeper
      strategyName32, // strategy name
      yVaultWETHAddress, // yearn vault
    ]);

    let genericYVaultStrategyAddress = getParamPerNetwork(poolConfig.GenericYVaultStrategy, network);

    let genericYVaultStrategyProxy: UnlockdUpgradeableProxy;

    if (genericYVaultStrategyAddress != undefined && notFalsyOrZeroAddress(genericYVaultStrategyAddress)) {
      console.log("Upgrading existing generic YVault Strategy proxy to new implementation...");

      await insertContractAddressInDb(eContractid.GenericYVaultStrategy, genericYVaultStrategyAddress);

      genericYVaultStrategyProxy = await getUnlockdUpgradeableProxy(genericYVaultStrategyAddress);

      // only proxy admin can do upgrading
      await waitForTx(
        await proxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgrade(genericYVaultStrategyProxy.address, genericYVaultStrategyImpl.address)
      );
    } else {
      // Deploy from scratch
      const genericYVaultStrategyProxy = await deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false
      );
    }
  });
task(
  "fork:deploy-genericonvexeth-strategy",
  "Deploy Unlockd Generic Convex ETH strategy. Change pool and PID for custom ETH-peggedETH strategy"
)
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolAdmin = await addressesProvider.getPoolAdmin();
    const strategyName = "Convex WETH Strategy";
    const strategyName32 = ethers.utils.formatBytes32String(strategyName);

    console.log("Deploying new GenericConvexETH strategy implementation...");
    const genericConvexETHStrategyImpl = await deployGenericConvexETHStrategy(verify);

    const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);

    const dataProvider = await getUnlockdProtocolDataProvider();
    const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
    const uTokenAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;

    const convexBoosterAddress = await getConvexBooster(poolConfig);
    if (!convexBoosterAddress) {
      throw "Convex Booster is undefined. Check Convex Booster configuration at config directory";
    }
    const curvePoolAddress = await getCurveETHAlETHPool(poolConfig);
    if (!curvePoolAddress) {
      throw "Curve ETH<>AlETH pool is undefined. Check Curve ETH<>AlETH configuration at config directory";
    }
    const curveCRVWETHPoolAddress = await getCurveCRVWETHPool(poolConfig);
    if (!curveCRVWETHPoolAddress) {
      throw "Curve CRV<>WETH pool is undefined. Check Curve CRV<>WETH configuration at config directory";
    }
    const curveCVXWETHPoolAddress = await getCurveCVXWETHPool(poolConfig);
    if (!curveCVXWETHPoolAddress) {
      throw "Curve CVX<>WETH pool is undefined. Check Curve CVX<>WETH configuration at config directory";
    }
    const uniswapRouterAddress = await getUniswapRouter(poolConfig);
    if (!uniswapRouterAddress) {
      throw "Uniswap router is undefined. Check UniSwapRouter configuration at config directory";
    }

    console.log("Deploying new GenericYVault strategy proxy...");

    //@ts-ignore
    const initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uTokenAddress, // uToken
      [poolAdmin], // keeper
      strategyName32, // strategy name
      convexBoosterAddress, // convex booster
      49, // pool ID,
      curvePoolAddress, // curve pool
      curveCRVWETHPoolAddress, // CRV<>WETH curve pool
      curveCVXWETHPoolAddress, // CVX<>WETH curve pool
      uniswapRouterAddress, // router
    ]);

    let genericConvexETHStrategyAddress = getParamPerNetwork(poolConfig.GenericConvexETHStrategy, network);

    let genericConvexETHStrategyAddressProxy: UnlockdUpgradeableProxy;

    if (genericConvexETHStrategyAddress != undefined && notFalsyOrZeroAddress(genericConvexETHStrategyAddress)) {
      console.log("Upgrading existing generic Convex ETH Strategy proxy to new implementation...");

      await insertContractAddressInDb(eContractid.GenericConvexETHStrategy, genericConvexETHStrategyAddress);

      genericConvexETHStrategyAddressProxy = await getUnlockdUpgradeableProxy(genericConvexETHStrategyAddress);

      // only proxy admin can do upgrading
      await waitForTx(
        await proxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgrade(genericConvexETHStrategyAddressProxy.address, genericConvexETHStrategyImpl.address)
      );
    } else {
      // Deploy from scratch
      const genericConvexETHStrategyAddressProxy = await deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      );
    }
  });
