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

  let strategyName32;
  let proxyAdmin;

  before(async () => {});
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });
  it("GenericYVaultStrategy: Check funds distribution (40% debt ratio)", async () => {
    const { genericYVaultStrategy, uWETH } = testEnv;
    uWETH.addStrategy(
      genericYVaultStrategy.address, //STRATEGY ADDRESS
      4000, // DEBT RATIO
      0, //MIN DEBT PER HARVEST
      "115792089237316195423570985008687907853269984665640564039457584007913129639935" // MAX DEBT PER HARVEST
    );
  });
});
