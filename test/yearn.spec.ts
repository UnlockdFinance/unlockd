import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { UPGRADE } from "../hardhat.config";
import { getReservesConfigByPool } from "../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH } from "../helpers/constants";
import { getMintableERC20, getYVault } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
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
    const availableLiquidityBefore = await uWETH.getAvailableLiquidity();
    await pool.connect(user0.signer).deposit(weth.address, parseEther("10"), user0.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);
    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    if (!UPGRADE) {
      const yvWETHExpectedBalance = wadDiv(parseEther("10"), pricePerShare);
      await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));
    }
    const availableLiquidity = await uWETH.getAvailableLiquidity();

    await expect(availableLiquidity.toString()).to.be.within(
      availableLiquidityBefore.add(parseEther("10")).sub(1000),
      availableLiquidityBefore.add(parseEther("10"))
    );
  });

  it("User 1 deposits 10 WETH in the reserve, WETH is deposited into Yearn Vault and yvWETH wrapped tokens are given back to UToken", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user1 = users[1];

    await fundWithERC20("WETH", user1.address, "10");

    await approveERC20(testEnv, user1, "WETH");
    const availableLiquidityBefore = await uWETH.getAvailableLiquidity();
    await pool.connect(user1.signer).deposit(weth.address, parseEther("10"), user1.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);
    // YVault computes shares in the following forma, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds

    const yvWETHExpectedBalance = wadDiv(availableLiquidityBefore.add(parseEther("10")), pricePerShare);

    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));

    const availableLiquidity = await uWETH.getAvailableLiquidity();

    await expect(availableLiquidity.toString()).to.be.within(
      availableLiquidityBefore.add(parseEther("10")).sub(1000),
      availableLiquidityBefore.add(parseEther("10"))
    );
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
    const availableLiquidityBefore = await uWETH.getAvailableLiquidity();
    await pool.connect(user0.signer).withdraw(weth.address, userUTokenBalanceBefore, user0.address);

    const userUTokenBalanceAfter = await uWETH.balanceOf(user0.address);

    const yvWETHBalanceAfter = await erc20YVault.balanceOf(uWETH.address);
    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds

    const yvWETHExpectedBalance = wadDiv(availableLiquidityBefore.sub(parseEther("10")), pricePerShare);

    if (!UPGRADE) {
      // Expect user to not have uTokens
      await expect(userUTokenBalanceAfter).to.be.equal(0);

      // Expect UToken to have shares corresponding to 10 ETH less deposited in vault
      await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalanceAfter, yvWETHBalanceAfter.add(1000000000));

      const availableLiquidity = await uWETH.getAvailableLiquidity();

      await expect(availableLiquidity.toString()).to.be.within(parseEther("10").sub(1000), parseEther("10").toString());
    }
  });

  it("User 2 deposits 1000 WETH in the reserve. WETH is deposited into Yearn Vault and yvWETH wrapped tokens are given back to UToken", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user2 = users[2];

    await fundWithERC20("WETH", user2.address, "1000");
    await approveERC20(testEnv, user2, "WETH");

    const availableLiquidityBefore = await uWETH.getAvailableLiquidity();
    await pool.connect(user2.signer).deposit(weth.address, parseEther("1000"), user2.address, 0);

    const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    const pricePerShare = await yVault.pricePerShare();
    const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);

    // Vault has now 1020 WETH, from which 1010 come from UToken deposits

    // YVault computes shares in the following format, we account for a small precision error in assertions below:
    // freeFunds = _totalAssets() - _calculateLockedProfit()
    // shares =  amount * totalSupply / freeFunds
    const yvWETHExpectedBalance = wadDiv(availableLiquidityBefore.add(parseEther("1000")), pricePerShare);

    await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));

    const availableLiquidity = await uWETH.getAvailableLiquidity();

    await expect(availableLiquidity.toString()).to.be.within(
      availableLiquidityBefore.add(parseEther("1000")).sub(1000),
      availableLiquidityBefore.add(parseEther("1000")).toString()
    );
  });

  it("User 2 withdraws 500 WETH from the reserve, then 500 more. WETH is withdrawn from Yearn Vault and WETH is given back to user", async () => {
    const { users, pool, weth, addressesProvider, uWETH } = testEnv;
    const user2 = users[2];
    if (!UPGRADE) {
      const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

      const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

      /* FIRST WITHDRAWAL */
      await pool.connect(user2.signer).withdraw(weth.address, parseEther("500"), user2.address);

      const userUTokenBalanceAfter = await uWETH.balanceOf(user2.address);
      const pricePerShare = await yVault.pricePerShare();

      const yvWETHBalanceAfter = await erc20YVault.balanceOf(uWETH.address);
      const uTokenTotalSupply = await uWETH.totalSupply();

      // YVault computes shares in the following format, we account for a small precision error in assertions below:
      // freeFunds = _totalAssets() - _calculateLockedProfit()
      // shares =  amount * totalSupply / freeFunds
      const yvWETHExpectedBalance = wadDiv(uTokenTotalSupply, pricePerShare);

      // Expect user to have 500 uTokens
      await expect(userUTokenBalanceAfter).to.be.equal(parseEther("500"));

      // Expect UToken to have shares corresponding to 500 ETH less deposited in vault
      await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalanceAfter, yvWETHBalanceAfter.add(1000));

      const availableLiquidity = await uWETH.getAvailableLiquidity();

      await expect(availableLiquidity.toString()).to.be.within(
        parseEther("510").sub(1000),
        parseEther("510").toString()
      );

      /* SECOND WITHDRAWAL */
      await pool.connect(user2.signer).withdraw(weth.address, parseEther("500"), user2.address);

      const userUTokenBalanceAfterSecond = await uWETH.balanceOf(user2.address);
      const pricePerShareSecond = await yVault.pricePerShare();

      const yvWETHBalanceAfterSecond = await erc20YVault.balanceOf(uWETH.address);
      const uTokenTotalSupplySecond = await uWETH.totalSupply();

      // YVault computes shares in the following format, we account for a small precision error in assertions below:
      // freeFunds = _totalAssets() - _calculateLockedProfit()
      // shares =  amount * totalSupply / freeFunds
      const yvWETHExpectedBalanceSecond = wadDiv(uTokenTotalSupplySecond, pricePerShareSecond);

      // Expect user to have 0 uTokens
      await expect(userUTokenBalanceAfterSecond).to.be.equal(parseEther("0"));

      // Expect UToken to have shares corresponding to 500 ETH less deposited in vault
      await expect(yvWETHExpectedBalanceSecond).to.be.within(
        yvWETHBalanceAfterSecond,
        yvWETHBalanceAfterSecond.add(1000)
      );

      const availableLiquiditySecond = await uWETH.getAvailableLiquidity();

      await expect(availableLiquiditySecond.toString()).to.be.within(
        parseEther("10").sub(1000),
        parseEther("10").toString()
      );
    }
  });

  // it("User 3 borrow all liquidity from the pool", async () => {
  //   const { users, pool, weth, addressesProvider, uWETH, deployer, configurator, nftOracle, bayc } = testEnv;
  //   const user3 = users[3];

  //   const tokenIdNum = testEnv.tokenIdTracker++;
  //   const tokenId = tokenIdNum.toString();
  //   await fundWithERC721("BAYC", user3.address, tokenIdNum);

  //   await setApprovalForAll(testEnv, user3, "BAYC");

  //   //await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());

  //   await configurator.setLtvManagerStatus(deployer.address, true);
  //   await nftOracle.setPriceManagerStatus(configurator.address, true);

  //   const price = await convertToCurrencyDecimals(user3, weth, "100");
  //   await configurator.setLtvManagerStatus(deployer.address, true);
  //   await nftOracle.setPriceManagerStatus(bayc.address, true);

  //   const collData: IConfigNftAsCollateralInput = {
  //     asset: bayc.address,
  //     nftTokenId: tokenId,
  //     newPrice: parseEther("100"),
  //     ltv: 4000,
  //     liquidationThreshold: 7000,
  //     redeemThreshold: 9000,
  //     liquidationBonus: 500,
  //     redeemDuration: 100,
  //     auctionDuration: 200,
  //     redeemFine: 500,
  //     minBidFine: 2000,
  //   };
  //   await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

  //   await borrow(testEnv, user3, "WETH", "1", "BAYC", tokenId, user3.address, "365", "success", "");

  //   const yVault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

  //   // const pricePerShare = await yVault.pricePerShare();
  //   // const erc20YVault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
  //   // const yvWETHBalance = await erc20YVault.balanceOf(uWETH.address);

  //   // // Vault has now 1020 WETH, from which 1010 come from UToken deposits

  //   // // YVault computes shares in the following format, we account for a small precision error in assertions below:
  //   // // freeFunds = _totalAssets() - _calculateLockedProfit()
  //   // // shares =  amount * totalSupply / freeFunds
  //   // const yvWETHExpectedBalance = wadDiv(parseEther("1010"), pricePerShare);

  //   // await expect(yvWETHExpectedBalance).to.be.within(yvWETHBalance, yvWETHBalance.add(1000));

  //   // const availableLiquidity = await uWETH.getAvailableLiquidity();

  //   // await expect(availableLiquidity.toString()).to.be.within(parseEther("1010").sub(1000), parseEther("1010").toString());
  // });
});
