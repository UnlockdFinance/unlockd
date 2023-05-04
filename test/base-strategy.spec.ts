import { zeroAddress } from "ethereumjs-util";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../helpers/configuration";
import { deployGenericYVaultStrategy, deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
} from "../helpers/contracts-getters";
import { evmRevert, evmSnapshot, notFalsyOrZeroAddress } from "../helpers/misc-utils";
import { eContractid, eNetwork } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import "./helpers/utils/math";
const { expect } = require("chai");

makeSuite("yVault Strategy negatives", (testEnv: TestEnv) => {
  let snapshotId;
  let genericYVaultStrategyImpl;
  let uniswapRouterAddress;
  let strategyName32;
  let proxyAdmin;
  before(async () => {
    const { reservoirAdapter, configurator, deployer, nftOracle, loan, reservoirModules, dWETH } = testEnv;
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolAdmin = await addressesProvider.getPoolAdmin();
    const strategyName = "Yearn yvWETH Strategy";
    strategyName32 = ethers.utils.formatBytes32String(strategyName);

    console.log("Deploying new GenericYVault strategy implementation...");
    genericYVaultStrategyImpl = await deployGenericYVaultStrategy(false);

    proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }

    const dataProvider = await getUnlockdProtocolDataProvider();
    const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
    const uTokenAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.uTokenAddress;
    const yVaultWETHAddress = await getYVaultWETHAddress(poolConfig);
    if (!yVaultWETHAddress) {
      throw "YVault is undefined. Check ReserveAssets configuration at config directory";
    }
  });
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });
  it("Base Strategy Negatives: Check `initialize()` zero params - addresses provider address", async () => {
    const { uWETH, deployer } = testEnv;

    //@ts-ignore
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      zeroAddress(), // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      genericYVaultStrategyImpl.address, // yearn vault
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");
  });
  it("Base Strategy Negatives: Check `initialize()` zero params - uToken address", async () => {
    const { addressesProvider, uWETH, deployer } = testEnv;

    //@ts-ignore
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      zeroAddress(), // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      genericYVaultStrategyImpl.address, // yearn vault
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");
  });
  it("Base Strategy Negatives: Check `initialize()` zero params - Keepers address", async () => {
    const { addressesProvider, uWETH, deployer } = testEnv;

    //@ts-ignore
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [zeroAddress()], // keeper
      strategyName32, // strategy name
      genericYVaultStrategyImpl.address, // yearn vault
    ]);

    await expect(
      deployUnlockdUpgradeableProxy(
        eContractid.GenericYVaultStrategy,
        proxyAdmin.address,
        genericYVaultStrategyImpl.address,
        initEncodedData,
        false
      )
    ).to.be.revertedWith("InvalidZeroAddress");
  });
  it("Base Strategy Negatives: Check `updateKeepers()` zero address and invalid pool admin", async () => {
    const { genericYVaultStrategy, users } = testEnv;

    await expect(genericYVaultStrategy.updateKeepers([zeroAddress()], true)).to.be.revertedWith("InvalidZeroAddress");
    await expect(
      genericYVaultStrategy.connect(users[2].signer).updateKeepers([zeroAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin");
  });
  it("Base Strategy Negatives: Check `setEmergencyExit()`invalid pool admin", async () => {
    const { genericYVaultStrategy, users } = testEnv;

    await expect(genericYVaultStrategy.connect(users[2].signer).setEmergencyExit(true)).to.be.revertedWith(
      "CallerNotPoolAdmin"
    );
  });
  it("Base Strategy Negatives: Check `setEmergencyExit()`invalid pool admin", async () => {
    const { genericYVaultStrategy, users } = testEnv;

    await expect(genericYVaultStrategy.connect(users[2].signer).setEmergencyExit(true)).to.be.revertedWith(
      "CallerNotPoolAdmin"
    );
  });
  it("Base Strategy Setters: Check setters", async () => {
    const { genericYVaultStrategy, genericConvexETHStrategy, users } = testEnv;

    // Yearn
    await genericYVaultStrategy.setEmergencyExit(true);

    expect(await genericYVaultStrategy.emergencyExit()).to.be.eq(true);

    await genericYVaultStrategy.updateKeepers([users[1].address, users[2].address], true);

    expect(await genericYVaultStrategy.keepers(users[1].address)).to.be.eq(true);
    expect(await genericYVaultStrategy.keepers(users[2].address)).to.be.eq(true);

    await genericYVaultStrategy.setMaxSingleTrade(parseEther("100"));
    expect(await genericYVaultStrategy.maxSingleTrade()).to.be.eq(parseEther("100"));

    // Convex
    await genericConvexETHStrategy.setEmergencyExit(true);

    expect(await genericConvexETHStrategy.emergencyExit()).to.be.eq(true);

    await genericConvexETHStrategy.updateKeepers([users[1].address, users[2].address], true);

    expect(await genericConvexETHStrategy.keepers(users[1].address)).to.be.eq(true);
    expect(await genericConvexETHStrategy.keepers(users[2].address)).to.be.eq(true);

    await genericConvexETHStrategy.setMaxSingleTrade(parseEther("100"));
    expect(await genericConvexETHStrategy.maxSingleTrade()).to.be.eq(parseEther("100"));

    await genericConvexETHStrategy.setRouter(users[2].address);
    expect(await genericConvexETHStrategy.router()).to.be.eq(users[2].address);
  });
});
