import { zeroAddress } from "ethereumjs-util";
import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import {
  ConfigNames,
  getConvexBooster,
  getCurveCRVWETHPool,
  getCurveCVXWETHPool,
  getCurveETHAlETHPool,
  getUniswapRouter,
  loadPoolConfig,
} from "../helpers/configuration";
import { SAFETRANSFERFROM_FUNCTION_SELECTOR } from "../helpers/constants";
import { deployGenericConvexETHStrategy, deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getBooster,
  getLendPoolAddressesProvider,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
} from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  createRandomAddress,
  evmRevert,
  evmSnapshot,
  fundWithERC20,
  fundWithERC721,
  impersonateAccountsHardhat,
  notFalsyOrZeroAddress,
  stopImpersonateAccountsHardhat,
} from "../helpers/misc-utils";
import { eContractid, eNetwork, ExecutionInfo, IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { Booster } from "../types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import "./helpers/utils/math";
const { expect } = require("chai");

makeSuite("Convex ETH Strategy negatives", (testEnv: TestEnv) => {
  let snapshotId;
  let genericConvexETHStrategyImpl;
  let convexBoosterAddress;
  let curvePoolAddress;
  let curveCRVWETHPoolAddress;
  let curveCVXWETHPoolAddress;
  let uniswapRouterAddress;
  let strategyName32;
  let proxyAdmin;

  before(async () => {
    const { reservoirAdapter, configurator, deployer, nftOracle, loan, reservoirModules, dWETH } = testEnv;

    // Redeploy Convex strategy implementation to test `initialize()`
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolAdmin = await addressesProvider.getPoolAdmin();
    const strategyName = "Convex WETH Strategy";
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    console.log("Deploying new GenericConvexETH strategy implementation...");
    genericConvexETHStrategyImpl = await deployGenericConvexETHStrategy(false);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);

    const dataProvider = await getUnlockdProtocolDataProvider();
    const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
    const uTokenAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;

    convexBoosterAddress = await getConvexBooster(poolConfig);
    if (!convexBoosterAddress) {
      throw "Convex Booster is undefined. Check Convex Booster configuration at config directory";
    }
    curvePoolAddress = await getCurveETHAlETHPool(poolConfig);
    if (!curvePoolAddress) {
      throw "Curve ETH<>AlETH pool is undefined. Check Curve ETH<>AlETH configuration at config directory";
    }
    curveCRVWETHPoolAddress = await getCurveCRVWETHPool(poolConfig);
    if (!curveCRVWETHPoolAddress) {
      throw "Curve CRV<>WETH pool is undefined. Check Curve CRV<>WETH configuration at config directory";
    }
    curveCVXWETHPoolAddress = await getCurveCVXWETHPool(poolConfig);
    if (!curveCVXWETHPoolAddress) {
      throw "Curve CVX<>WETH pool is undefined. Check Curve CVX<>WETH configuration at config directory";
    }
    uniswapRouterAddress = await getUniswapRouter(poolConfig);
    if (!uniswapRouterAddress) {
      throw "Uniswap router is undefined. Check UniSwapRouter configuration at config directory";
    }
  });
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });

  it("GenericConvexETHStrategy Negatives: Check `initialize()` zero params", async () => {
    const { addressesProvider, uWETH, deployer } = testEnv;

    // Convex Booster zero address
    //@ts-ignore
    let initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      zeroAddress(), // convex booster
      49, // pool ID,
      curvePoolAddress, // curve pool
      curveCRVWETHPoolAddress, // CRV<>WETH curve pool
      curveCVXWETHPoolAddress, // CVX<>WETH curve pool
      uniswapRouterAddress, // router
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");

    // CurvePool zero address
    //@ts-ignore
    initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      convexBoosterAddress, // convex booster
      49, // pool ID,
      zeroAddress(), // curve pool
      curveCRVWETHPoolAddress, // CRV<>WETH curve pool
      curveCVXWETHPoolAddress, // CVX<>WETH curve pool
      uniswapRouterAddress, // router
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");

    // CRV<>WETH curve pool zero address
    //@ts-ignore
    initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      convexBoosterAddress, // convex booster
      49, // pool ID,
      curvePoolAddress, // curve pool
      zeroAddress(), // CRV<>WETH curve pool
      curveCVXWETHPoolAddress, // CVX<>WETH curve pool
      uniswapRouterAddress, // router
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");

    // CVX<>WETH curve pool zero address
    //@ts-ignore
    initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      convexBoosterAddress, // convex booster
      49, // pool ID,
      curvePoolAddress, // curve pool
      curveCRVWETHPoolAddress, // CRV<>WETH curve pool
      zeroAddress(), // CVX<>WETH curve pool
      uniswapRouterAddress, // router
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");

    // router zero address
    //@ts-ignore
    initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      convexBoosterAddress, // convex booster
      49, // pool ID,
      curvePoolAddress, // curve pool
      curveCRVWETHPoolAddress, // CRV<>WETH curve pool
      curveCVXWETHPoolAddress, // CVX<>WETH curve pool
      zeroAddress(), // router
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");
  });

  it("GenericConvexETHStrategy Negatives: Check `initialize()`: Convex pool is in shutdown mode", async () => {
    const { addressesProvider, uWETH, deployer } = testEnv;

    // Shut down Convex pool
    const booster: Booster = await getBooster(convexBoosterAddress);
    const poolManager = await booster.poolManager();
    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [poolManager],
    });

    await booster.shutdownPool(49);

    await (DRE as HardhatRuntimeEnvironment).network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [poolManager],
    });

    // Convex Booster zero address
    //@ts-ignore
    let initEncodedData = genericConvexETHStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      convexBoosterAddress, // convex booster
      49, // pool ID,
      curvePoolAddress, // curve pool
      curveCRVWETHPoolAddress, // CRV<>WETH curve pool
      curveCVXWETHPoolAddress, // CVX<>WETH curve pool
      uniswapRouterAddress, // router
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericConvexETHStrategy,
        proxyAdmin.address,
        genericConvexETHStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("ConvexPoolShutdown");
  });

  it("GenericConvexETHStrategy Negatives: Check `setMaxSingleTrade()` negatives", async () => {
    const { genericConvexETHStrategy } = testEnv;

    // `setMaxSingleTrade(uint256 _maxSingleTrade)`
    await expect(genericConvexETHStrategy.setMaxSingleTrade(0)).to.be.revertedWith("InvalidZeroAmount");
  });

  it("GenericConvexETHStrategy Negatives: Check `setRouter()` negatives", async () => {
    const { genericConvexETHStrategy } = testEnv;

    // `setRouter(address _router)`
    await expect(genericConvexETHStrategy.setRouter(zeroAddress())).to.be.revertedWith("InvalidZeroAddress");
  });
});
