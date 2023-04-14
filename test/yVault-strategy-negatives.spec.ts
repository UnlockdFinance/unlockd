import { zeroAddress } from "ethereumjs-util";
import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { FORK_BLOCK_NUMBER } from "../hardhat.config";
import { ConfigNames, getYVaultWETHAddress, loadPoolConfig } from "../helpers/configuration";
import { deployGenericYVaultStrategy, deployUnlockdUpgradeableProxy } from "../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
} from "../helpers/contracts-getters";
import {
  evmRevert,
  evmSnapshot,
  fundWithERC20,
  fundWithERC721,
  impersonateAccountsHardhat,
  notFalsyOrZeroAddress,
  stopImpersonateAccountsHardhat,
} from "../helpers/misc-utils";
import { eContractid, eNetwork, ExecutionInfo, IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
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
  it("GenericYVaultStrategy Negatives: Check `_invest()` negatives", async () => {
    const { genericYVaultStrategy } = testEnv;

    await expect(genericYVaultStrategy.invest(ethers.utils.parseEther("10"))).to.be.revertedWith(
      "NotEnoughFundsToInvest"
    );
  });
  it("GenericYVaultStrategy BASE Strategy Negatives: Check `initialize()` zero params - address provider", async () => {
    const { addressesProvider, uWETH, deployer } = testEnv;

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
  it("GenericYVaultStrategy BASE Strategy Negatives: Check `initialize()` zero params - uToken address", async () => {
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
  it("GenericYVaultStrategy BASE Strategy Negatives: Check `initialize()` zero params - Keepers address", async () => {
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
  it("GenericYVaultStrategy BASE Strategy Negatives: updateKeepers zero address", async () => {
    const { genericYVaultStrategy } = testEnv;

    await expect(genericYVaultStrategy.updateKeepers([zeroAddress()], true)).to.be.revertedWith("InvalidZeroAddress");
  });
});
