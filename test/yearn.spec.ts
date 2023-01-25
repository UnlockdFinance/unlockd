import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH } from "../helpers/constants";
import { getMintableERC20, getYVault } from "../helpers/contracts-getters";
import { advanceTimeAndBlock, fundWithERC20, fundWithERC721, waitForTx } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, IReserveParams, iUnlockdPoolAssets, UnlockdPools } from "../helpers/types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  deposit,
  mintERC20,
  setApprovalForAll,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import { calculateExpectedYVaultShares } from "./helpers/utils/helpers";
import { wadDiv } from "./helpers/utils/math";

const chai = require("chai");

const { expect } = chai;

makeSuite("UToken: Yearn integration", (testEnv) => {
  before("Initializing configuration", async () => {
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <iUnlockdPoolAssets<IReserveParams>>(
      getReservesConfigByPool(UnlockdPools.proto)
    );
  });
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("User 0 deposits 10 WETH in an empty reserve, WETH is deposited into Yearn Vault and yvWETH wrapped tokens are given back to UToken", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user0 = users[0];

    await fundWithERC20("WETH", user0.address, "10");
    await approveERC20(testEnv, user0, "WETH");

    await pool.connect(user0.signer).deposit(weth.address, parseEther("10"), user0.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);
    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHExpectedBalance = wadDiv(parseEther("10"), pricePerShare);
    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));
  });
  it("User 1 deposits 10 WETH in the reserve, WETH is deposited into Yearn Vault and yvWETH wrapped tokens are given back to UToken", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user1 = users[1];

    await fundWithERC20("WETH", user1.address, "10");

    await approveERC20(testEnv, user1, "WETH");

    await pool.connect(user1.signer).deposit(weth.address, parseEther("10"), user1.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);
    // YVault computes shares in the following forma, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHExpectedBalance = wadDiv(parseEther("20"), pricePerShare);

    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));
  });
  it("User 0 withdraws 10 WETH, WETH is withdrawn from the Yearn Vault and WETH is given back to user", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user0 = users[0];

    await fundWithERC20("WETH", user0.address, "10");
    await approveERC20(testEnv, user0, "WETH");

    const userUTokenBalanceBefore = await uWETH.balanceOf(user0.address);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    await pool.connect(user0.signer).withdraw(weth.address, userUTokenBalanceBefore, user0.address);

    const userUTokenBalanceAfter = await uWETH.balanceOf(user0.address);

    const yvWETHBalanceAfter = await erc20YVault.balanceOf(uWETH.address);
    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHExpectedBalance = wadDiv(parseEther("10"), pricePerShare);

    // Expect user to not have uTokens
    await expect(userUTokenBalanceAfter).to.be.equal(0);

    // Expect UToken to have shares corresponding to 10 ETH less deposited in vault
    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalanceAfter, yvWETHBalanceAfter.add(1000));
  });

  it("User 2 deposits 1000 WETH in the reserve. WETH is deposited into Yearn Vault and yvWETH wrapped tokens are given back to UToken", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user2 = users[2];

    await fundWithERC20("WETH", user2.address, "1000");
    await approveERC20(testEnv, user2, "WETH");

    await pool.connect(user2.signer).deposit(weth.address, parseEther("1000"), user2.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);

    // Vault has now 1020 WETH, from which 1010 come from UToken deposits

    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHExpectedBalance = wadDiv(parseEther("1010"), pricePerShare);

    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));
  });

  it("User 2 withdraws 1000 WETH from the reserve. WETH is withdrawn from Yearn Vault and WETH is given back to user", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user2 = users[2];

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    await pool.connect(user2.signer).withdraw(weth.address, parseEther("1000"), user2.address);

    const userUTokenBalanceAfter = await uWETH.balanceOf(user2.address);
    const pricePerShare = await yVault.pricePerShare();

    const yvWETHBalanceAfter = await erc20YVault.balanceOf(uWETH.address);
    const uTokenTotalSupply = await uWETH.totalSupply();

    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHExpectedBalance = wadDiv(uTokenTotalSupply, pricePerShare);

    // Expect user to not have uTokens
    await expect(userUTokenBalanceAfter).to.be.equal(parseEther("0"));

    // Expect UToken to have shares corresponding to 10 ETH less deposited in vault
    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalanceAfter, yvWETHBalanceAfter.add(1000));
  });
});
