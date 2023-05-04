import { zeroAddress } from "ethereumjs-util";
import { ethers } from "ethers";
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
  it("GenericYVaultStrategy Negatives: Check `initialize()` zero params - yVault address", async () => {
    const { addressesProvider, uWETH, deployer } = testEnv;

    //@ts-ignore
    const initEncodedData = genericYVaultStrategyImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address, // address provider
      uWETH.address, // uToken
      [deployer.address], // keeper
      strategyName32, // strategy name
      zeroAddress(), // yearn vault
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
  it("GenericYVaultStrategy Negatives: Check `setMaxSingleTrade()` negatives", async () => {
    const { genericYVaultStrategy } = testEnv;

    // `setMaxSingleTrade(uint256 _maxSingleTrade)`
    await expect(genericYVaultStrategy.setMaxSingleTrade(0)).to.be.revertedWith("InvalidZeroAmount");
  });
  it("GenericYVaultStrategy Negatives: Check `invest()` negatives", async () => {
    const { genericYVaultStrategy } = testEnv;

    await expect(genericYVaultStrategy.invest(ethers.utils.parseEther("10"))).to.be.revertedWith(
      "NotEnoughFundsToInvest"
    );
  });

  it("GenericYVaultStrategy Negatives: Check `harvest()` onlyKeepers", async () => {
    const { genericYVaultStrategy, uWETH, deployer } = testEnv;
    await uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      4000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
    await genericYVaultStrategy.updateKeepers([deployer.address], false);
    await expect(genericYVaultStrategy.harvest()).to.be.revertedWith("InvalidKeeper()");
  });
});
