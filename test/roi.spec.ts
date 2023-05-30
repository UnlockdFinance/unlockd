import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { formatEther } from "ethers/lib/utils";
import { getReservesConfigByPool } from "../helpers/configuration";
import { ADDRESS_ID_YVAULT_WETH } from "../helpers/constants";
import { getMintableERC20, getYVault } from "../helpers/contracts-getters";
import {
  advanceTimeAndBlock,
  evmRevert,
  evmSnapshot,
  fundWithERC20,
  fundWithERC721,
  waitForTx,
} from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, IReserveParams, iUnlockdPoolAssets, UnlockdPools } from "../helpers/types";
import {
  approveERC20,
  approveERC721,
  borrow,
  configuration as actionsConfiguration,
  deposit,
  mintERC20,
  setApprovalForAll,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("Roi test", (testEnv: TestEnv) => {
  let snapshotId;
  beforeEach(async () => {
    snapshotId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapshotId);
  });
  it("(1) Deposits 100 ETH into Unlockd. (2) Yearn earns rewards. (3) Withdraws rewards", async () => {
    const { users, pool, weth, addressesProvider, uWETH, configurator, nftOracle, bayc, debtWETH, dataProvider } =
      testEnv;
    const vault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    await configurator.setReserveFactor(weth.address, 0);
    console.log("Initial liquidity index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log("Initial variable borrow index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log("Initial liquidity rate: ", (await dataProvider.getReserveData(weth.address)).liquidityRate);
    console.log("Initial variable borrow rate: ", (await dataProvider.getReserveData(weth.address)).variableBorrowRate);
    //////////////////////////////////////////////////////////////////
    ///                         DEPOSIT                            ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         DEPOSIT                            ///
      //////////////////////////////////////////////////////////////////
      `
    );
    const depositor = users[1];
    const depositor2 = users[2];

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");
    await pool.connect(depositor.signer).deposit(weth.address, parseEther("100"), depositor.address, 0);

    await fundWithERC20("WETH", depositor2.address, "1000");
    await approveERC20(testEnv, depositor2, "WETH");
    await pool.connect(depositor2.signer).deposit(weth.address, parseEther("100"), depositor2.address, 0);

    let valueHeldInUToken = (await vault.balanceOf(uWETH.address))
      .mul(await yvault.pricePerShare())
      .div(parseEther("1"));

    console.log(
      "User UToken balance after deposit: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log("Pool balance after deposit: ", formatEther((await vault.balanceOf(uWETH.address)).toString()));
    console.log("Value held in UToken after deposit: ", formatEther(await valueHeldInUToken.toString()));

    let debtScaledSupply = await debtWETH.scaledTotalSupply();
    let utokenScaledSupply = await uWETH.scaledTotalSupply();
    let numerator = valueHeldInUToken.add(debtScaledSupply);
    let utokenPrice = numerator.div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after deposit: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after deposit: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator after deposit: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after deposit: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log("After deposit liquidity index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log(
      "After deposit variable borrow index: ",
      (await dataProvider.getReserveData(weth.address)).liquidityIndex
    );
    console.log("After deposit liquidity rate: ", (await dataProvider.getReserveData(weth.address)).liquidityRate);
    console.log(
      "After deposit variable borrow rate: ",
      (await dataProvider.getReserveData(weth.address)).variableBorrowRate
    );

    console.log("NORMALIZED INCOME: ", (await pool.getReserveNormalizedIncome(weth.address)).toString());
    console.log("NORMALIZED DEBT: ", (await pool.getReserveNormalizedVariableDebt(weth.address)).toString());

    let depositedLiquidity = (await uWETH.scaledTotalSupply()).add(await debtWETH.scaledTotalSupply());
    console.log("DEPOSITED LIQUIDITY: ", depositedLiquidity.toString());
    let gainedLiquidityBase = (await debtWETH.totalSupply()).sub(await debtWETH.scaledTotalSupply());
    console.log("GAINED LIQUIDITY BASE: ", gainedLiquidityBase.toString());
    let availableLiquidity = await uWETH.getAvailableLiquidity();
    console.log("AVAILABLE LIQUIDITY:", availableLiquidity.toString());
    let gainedLiquidity = availableLiquidity.add(debtScaledSupply).sub(depositedLiquidity).sub(gainedLiquidityBase);
    console.log("GAINED LIQUIDITY: ", gainedLiquidity.toString());

    //////////////////////////////////////////////////////////////////
    ///                      YEARN REALIZE GAINS                   ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                      YEARN REALIZE GAINS                   ///
      //////////////////////////////////////////////////////////////////
      `
    );
    // Mock gains on Yearn Vault
    // await fundWithERC20("WETH", await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH), "10000");

    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.totalSupply());

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after gains: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after gains: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator after gains: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after gains: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );
    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after gains: ", formatEther(await valueHeldInUToken.toString()));

    console.log("After gains liquidity index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log(
      "After gains variable borrow index: ",
      (await dataProvider.getReserveData(weth.address)).liquidityIndex
    );
    console.log("After gains liquidity rate: ", (await dataProvider.getReserveData(weth.address)).liquidityRate);
    console.log(
      "After gains variable borrow rate: ",
      (await dataProvider.getReserveData(weth.address)).variableBorrowRate
    );

    console.log("NORMALIZED INCOME: ", (await pool.getReserveNormalizedIncome(weth.address)).toString());
    console.log("NORMALIZED DEBT: ", (await pool.getReserveNormalizedVariableDebt(weth.address)).toString());

    depositedLiquidity = (await uWETH.scaledTotalSupply()).add(await debtWETH.scaledTotalSupply());
    console.log("DEPOSITED LIQUIDITY: ", depositedLiquidity.toString());
    gainedLiquidityBase = (await debtWETH.totalSupply()).sub(await debtWETH.scaledTotalSupply());
    console.log("GAINED LIQUIDITY BASE: ", gainedLiquidityBase.toString());
    availableLiquidity = await uWETH.getAvailableLiquidity();
    console.log("AVAILABLE LIQUIDITY:", availableLiquidity.toString());
    gainedLiquidity = availableLiquidity.add(debtScaledSupply).sub(depositedLiquidity).sub(gainedLiquidityBase);
    console.log("GAINED LIQUIDITY: ", gainedLiquidity.toString());

    //////////////////////////////////////////////////////////////////
    ///                         BORROW                            ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         BORROW                             ///
      //////////////////////////////////////////////////////////////////
      `
    );
    const borrower = users[3];
    await fundWithERC20("WETH", borrower.address, "1000");
    await approveERC20(testEnv, borrower, "WETH");

    const tokenId = testEnv.tokenIdTracker;
    await fundWithERC721("BAYC", borrower.address, tokenId);
    await approveERC721(testEnv, borrower, "BAYC", tokenId.toString());

    await configurator.setLtvManagerStatus(users[0].address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(users[0].signer).configureNftsAsCollateral([collData]);
    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("3"), bayc.address, tokenId, borrower.address, 0);

    await advanceTimeAndBlock(60 * 60 * 24 * 30); // 1 MONTH

    console.log(
      "User UToken balance after borrow: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log(
      "User 2 UToken balance after borrow: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );
    console.log("Pool balance after borrow: ", formatEther((await vault.balanceOf(uWETH.address)).toString()));
    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after borrow: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply before withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply before withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken before withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log("After borrow liquidity index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log(
      "After borrow variable borrow index: ",
      (await dataProvider.getReserveData(weth.address)).liquidityIndex
    );
    console.log("After borrow liquidity rate: ", (await dataProvider.getReserveData(weth.address)).liquidityRate);
    console.log(
      "After borrow variable borrow rate: ",
      (await dataProvider.getReserveData(weth.address)).variableBorrowRate
    );

    console.log("NORMALIZED INCOME: ", (await pool.getReserveNormalizedIncome(weth.address)).toString());
    console.log("NORMALIZED DEBT: ", (await pool.getReserveNormalizedVariableDebt(weth.address)).toString());

    depositedLiquidity = (await uWETH.scaledTotalSupply()).add(await debtWETH.scaledTotalSupply());
    console.log("DEPOSITED LIQUIDITY: ", depositedLiquidity.toString());
    gainedLiquidityBase = (await debtWETH.totalSupply()).sub(await debtWETH.scaledTotalSupply());
    console.log("GAINED LIQUIDITY BASE: ", gainedLiquidityBase.toString());
    availableLiquidity = await uWETH.getAvailableLiquidity();
    console.log("AVAILABLE LIQUIDITY:", availableLiquidity.toString());
    gainedLiquidity = availableLiquidity.add(debtScaledSupply).sub(depositedLiquidity).sub(gainedLiquidityBase);
    console.log("GAINED LIQUIDITY: ", gainedLiquidity.toString());
    //////////////////////////////////////////////////////////////////
    ///                     WITHDRAW FUNDS                         ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         WITHDRAW FUNDS                     ///
      //////////////////////////////////////////////////////////////////
      `
    );
    console.log(
      "Depositor WETH before withdrawal: ",
      formatEther((await weth.balanceOf(depositor.address)).toString())
    );
    console.log(
      "Depositor uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );
    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(depositor.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor.address
      );
    console.log("Depositor WETH after withdrawal: ", formatEther((await weth.balanceOf(depositor.address)).toString()));
    console.log(
      "Depositor uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after withdraw: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log("After withdraw liquidity index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log(
      "After withdraw variable borrow index: ",
      (await dataProvider.getReserveData(weth.address)).liquidityIndex
    );
    console.log("After withdraw liquidity rate: ", (await dataProvider.getReserveData(weth.address)).liquidityRate);
    console.log(
      "After withdraw variable borrow rate: ",
      (await dataProvider.getReserveData(weth.address)).variableBorrowRate
    );

    console.log("NORMALIZED INCOME: ", (await pool.getReserveNormalizedIncome(weth.address)).toString());
    console.log("NORMALIZED DEBT: ", (await pool.getReserveNormalizedVariableDebt(weth.address)).toString());

    depositedLiquidity = (await uWETH.scaledTotalSupply()).add(await debtWETH.scaledTotalSupply());
    console.log("DEPOSITED LIQUIDITY: ", depositedLiquidity.toString());
    gainedLiquidityBase = (await debtWETH.totalSupply()).sub(await debtWETH.scaledTotalSupply());
    console.log("GAINED LIQUIDITY BASE: ", gainedLiquidityBase.toString());
    availableLiquidity = await uWETH.getAvailableLiquidity();
    console.log("AVAILABLE LIQUIDITY:", availableLiquidity.toString());
    gainedLiquidity = availableLiquidity.add(debtScaledSupply).sub(depositedLiquidity).sub(gainedLiquidityBase);
    console.log("GAINED LIQUIDITY: ", gainedLiquidity.toString());
    //////////////////////////////////////////////////////////////////
    ///                     REPAY FUNDS                         ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         REPAY FUNDS                     ///
      //////////////////////////////////////////////////////////////////
      `
    );

    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(borrower.signer)
      .repay(bayc.address, tokenId, "115792089237316195423570985008687907853269984665640564039457584007913129639935");

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after repay: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());
    console.log("Depositor 2 uWETH after repay: ", formatEther((await uWETH.balanceOf(depositor2.address)).toString()));

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log("After repay liquidity index: ", (await dataProvider.getReserveData(weth.address)).liquidityIndex);
    console.log(
      "After repay variable borrow index: ",
      (await dataProvider.getReserveData(weth.address)).liquidityIndex
    );
    console.log("After repay liquidity rate: ", (await dataProvider.getReserveData(weth.address)).liquidityRate);
    console.log(
      "After repay variable borrow rate: ",
      (await dataProvider.getReserveData(weth.address)).variableBorrowRate
    );

    console.log("NORMALIZED INCOME: ", (await pool.getReserveNormalizedIncome(weth.address)).toString());
    console.log("NORMALIZED DEBT: ", (await pool.getReserveNormalizedVariableDebt(weth.address)).toString());

    depositedLiquidity = (await uWETH.scaledTotalSupply()).add(await debtWETH.scaledTotalSupply());
    console.log("DEPOSITED LIQUIDITY: ", depositedLiquidity.toString());
    gainedLiquidityBase = (await debtWETH.totalSupply()).sub(await debtWETH.scaledTotalSupply());
    console.log("GAINED LIQUIDITY BASE: ", gainedLiquidityBase.toString());
    availableLiquidity = await uWETH.getAvailableLiquidity();
    console.log("AVAILABLE LIQUIDITY:", availableLiquidity.toString());
    gainedLiquidity = availableLiquidity.add(debtScaledSupply).sub(depositedLiquidity).sub(gainedLiquidityBase);
    console.log("GAINED LIQUIDITY: ", gainedLiquidity.toString());
  });
  it.only("(1) Deposits 100 ETH into Unlockd. (2) Yearn earns rewards. (3) Withdraws rewards", async () => {
    const { users, pool, weth, addressesProvider, uWETH, configurator, nftOracle, bayc, debtWETH } = testEnv;
    const vault = await getMintableERC20(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));
    const yvault = await getYVault(await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH));

    //////////////////////////////////////////////////////////////////
    ///                         DEPOSIT                            ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         DEPOSIT                            ///
      //////////////////////////////////////////////////////////////////
      `
    );
    const depositor = users[1];
    const depositor2 = users[2];
    const depositor3 = users[3];
    const depositor4 = users[4];
    const depositor5 = users[5];

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");
    await pool.connect(depositor.signer).deposit(weth.address, parseEther("100"), depositor.address, 0);

    await fundWithERC20("WETH", depositor2.address, "1000");
    await approveERC20(testEnv, depositor2, "WETH");
    await pool.connect(depositor2.signer).deposit(weth.address, parseEther("100"), depositor2.address, 0);

    await fundWithERC20("WETH", depositor3.address, "1000");
    await approveERC20(testEnv, depositor3, "WETH");
    await pool.connect(depositor3.signer).deposit(weth.address, parseEther("100"), depositor3.address, 0);

    await fundWithERC20("WETH", depositor4.address, "1000");
    await approveERC20(testEnv, depositor4, "WETH");
    await pool.connect(depositor4.signer).deposit(weth.address, parseEther("100"), depositor4.address, 0);

    await fundWithERC20("WETH", depositor5.address, "1000");
    await approveERC20(testEnv, depositor5, "WETH");
    await pool.connect(depositor5.signer).deposit(weth.address, parseEther("100"), depositor5.address, 0);
    let valueHeldInUToken = (await vault.balanceOf(uWETH.address))
      .mul(await yvault.pricePerShare())
      .div(parseEther("1"));

    console.log(
      "User UToken balance after deposit: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log("Pool balance after deposit: ", formatEther((await vault.balanceOf(uWETH.address)).toString()));
    console.log("Value held in UToken after deposit: ", formatEther(await valueHeldInUToken.toString()));

    let debtScaledSupply = await debtWETH.scaledTotalSupply();
    let utokenScaledSupply = await uWETH.scaledTotalSupply();
    let numerator = valueHeldInUToken.add(debtScaledSupply);
    let utokenPrice = numerator.div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after deposit: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after deposit: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator after deposit: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after deposit: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );
    //////////////////////////////////////////////////////////////////
    ///                      YEARN REALIZE GAINS                   ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                      YEARN REALIZE GAINS                   ///
      //////////////////////////////////////////////////////////////////
      `
    );
    // Mock gains on Yearn Vault
    //await fundWithERC20("WETH", await addressesProvider.getAddress(ADDRESS_ID_YVAULT_WETH), "1000");

    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.totalSupply());

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after gains: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after gains: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator after gains: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after gains: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );
    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after gains: ", formatEther(await valueHeldInUToken.toString()));
    //////////////////////////////////////////////////////////////////
    ///                         BORROW                            ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         BORROW                            ///
      //////////////////////////////////////////////////////////////////
      `
    );
    const borrower = users[6];
    await fundWithERC20("WETH", borrower.address, "1000");
    await approveERC20(testEnv, borrower, "WETH");

    const tokenId = testEnv.tokenIdTracker;
    await fundWithERC721("BAYC", borrower.address, tokenId);
    await approveERC721(testEnv, borrower, "BAYC", tokenId.toString());

    await configurator.setLtvManagerStatus(users[0].address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("1000"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(users[0].signer).configureNftsAsCollateral([collData]);
    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("250"), bayc.address, tokenId, borrower.address, 0);

    await advanceTimeAndBlock(60 * 60 * 24 * 90); // 1 MONTH

    console.log(
      "User UToken balance after borrow: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log(
      "User 2 UToken balance after borrow: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );
    console.log("Pool balance after borrow: ", formatEther((await vault.balanceOf(uWETH.address)).toString()));
    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after borrow: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply before withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply before withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken before withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    //////////////////////////////////////////////////////////////////
    ///                     WITHDRAW FUNDS                         ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         WITHDRAW FUNDS                     ///
      //////////////////////////////////////////////////////////////////
      `
    );
    console.log(
      "Depositor WETH before withdrawal: ",
      formatEther((await weth.balanceOf(depositor.address)).toString())
    );
    console.log(
      "Depositor uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );
    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(depositor.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor.address
      );
    console.log("Depositor WETH after withdrawal: ", formatEther((await weth.balanceOf(depositor.address)).toString()));
    console.log(
      "Depositor uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after withdraw: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    //////////////////////////////////////////////////////////////////
    ///                     WITHDRAW FUNDS                         ///
    //////////////////////////////////////////////////////////////////
    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         REPAY FUNDS                     ///
      //////////////////////////////////////////////////////////////////
      `
    );

    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(borrower.signer)
      .repay(bayc.address, tokenId, "115792089237316195423570985008687907853269984665640564039457584007913129639935");

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after repay: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());
    console.log("Depositor 2 uWETH after repay: ", formatEther((await uWETH.balanceOf(depositor2.address)).toString()));

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         WITHDRAW FUNDS  DEPOSITOR2                   ///
      //////////////////////////////////////////////////////////////////
      `
    );
    console.log(
      "Depositor 2 uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );
    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(depositor2.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor2.address
      );
    console.log(
      "Depositor 2 WETH after withdrawal: ",
      formatEther((await weth.balanceOf(depositor2.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor2.address)).toString())
    );

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after withdraw: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         WITHDRAW FUNDS  DEPOSITOR3                   ///
      //////////////////////////////////////////////////////////////////
      `
    );
    console.log(
      "Depositor 3 uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor3.address)).toString())
    );
    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(depositor3.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor3.address
      );
    console.log(
      "Depositor 2 WETH after withdrawal: ",
      formatEther((await weth.balanceOf(depositor3.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor3.address)).toString())
    );

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after withdraw: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         WITHDRAW FUNDS  DEPOSITOR4                   ///
      //////////////////////////////////////////////////////////////////
      `
    );
    console.log(
      "Depositor 3 uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor4.address)).toString())
    );
    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(depositor4.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor4.address
      );
    console.log(
      "Depositor 2 WETH after withdrawal: ",
      formatEther((await weth.balanceOf(depositor4.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor4.address)).toString())
    );

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after withdraw: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );

    console.log(
      `
      //////////////////////////////////////////////////////////////////
      ///                         WITHDRAW FUNDS  DEPOSITOR5                   ///
      //////////////////////////////////////////////////////////////////
      `
    );
    console.log(
      "Depositor 3 uWETH before withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor5.address)).toString())
    );
    numerator = valueHeldInUToken.add(await debtWETH.scaledTotalSupply());
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    await pool
      .connect(depositor5.signer)
      .withdraw(
        weth.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        depositor5.address
      );
    console.log(
      "Depositor 2 WETH after withdrawal: ",
      formatEther((await weth.balanceOf(depositor5.address)).toString())
    );
    console.log(
      "Depositor 2 uWETH after withdrawal: ",
      formatEther((await uWETH.balanceOf(depositor5.address)).toString())
    );

    valueHeldInUToken = (await vault.balanceOf(uWETH.address)).mul(await yvault.pricePerShare()).div(parseEther("1"));
    console.log("Value held in UToken after withdraw: ", formatEther(await valueHeldInUToken.toString()));

    debtScaledSupply = await debtWETH.scaledTotalSupply();
    utokenScaledSupply = await uWETH.scaledTotalSupply();
    numerator = valueHeldInUToken.add(debtScaledSupply);
    utokenPrice = numerator.mul(parseEther("1")).div(await uWETH.scaledTotalSupply());

    console.log("Debt scaled supply after withdrawal: ", formatEther(debtScaledSupply.toString()));
    console.log("UToken scaled supply after withdrawal: ", formatEther(utokenScaledSupply.toString()));
    console.log("Numerator before withdrawal: ", formatEther(numerator.toString()));
    console.log(
      "Price per UToken after withdrawal: ",
      formatEther(await uWETH.pricePerUToken(await debtWETH.address)).toString()
    );
  });
});
