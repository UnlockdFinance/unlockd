import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { APPROVAL_AMOUNT_LENDING_POOL, oneEther } from "../helpers/constants";
import { convertToCurrencyDecimals, convertToCurrencyUnits } from "../helpers/contracts-helpers";
import { ProtocolErrors } from "../helpers/types";
import { setNftAssetPrice, setNftAssetPriceForDebt } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Liquidation SudoSwap", (testEnv) => {
  let baycInitPrice: BN;

  before("Before liquidation sudoswap: set config", async () => {
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });

    baycInitPrice = await testEnv.nftOracle.getNFTPrice(testEnv.bayc.address, 101);
  });

  after("After liquidation: reset config", async () => {
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

    await setNftAssetPrice(testEnv, "BAYC", 101, baycInitPrice.toString());
  });

  it("WETH - Borrows WETH", async () => {
    const { users, pool, nftOracle, reserveOracle, weth, bayc, configurator, deployer } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    //mints WETH to depositor
    await weth.connect(depositor.signer).mint(await convertToCurrencyDecimals(weth.address, "1000"));

    //approve protocol to access depositor wallet
    await weth.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //deposits WETH
    const amountDeposit = await convertToCurrencyDecimals(weth.address, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await bayc.connect(borrower.signer).mint("101");

    //approve protocol to access borrower wallet
    await bayc.connect(borrower.signer).setApprovalForAll(pool.address, true);

    //borrows
    const price = await convertToCurrencyDecimals(weth.address, "1000");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, "101", price, 4000, 7000, 100, 1, 2, 25, true, false);

    await configurator.setTimeframe(3600);

    const nftColDataBefore = await pool.getNftCollateralData(bayc.address, 101, weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      weth.address,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", borrower.address, "0");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("WETH - Drop the health factor below 1", async () => {
    const { weth, bayc, users, pool, nftOracle } = testEnv;
    const borrower = users[1];

    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "101");

    const debAmountUnits = await convertToCurrencyUnits(weth.address, nftDebtDataBefore.totalDebt.toString());
    await setNftAssetPriceForDebt(testEnv, "BAYC", 101, "WETH", debAmountUnits, "80");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("USDC - Borrows USDC", async () => {
    const { users, pool, reserveOracle, usdc, bayc, uBAYC, configurator, deployer, nftOracle } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    await setNftAssetPrice(testEnv, "BAYC", 101, baycInitPrice.toString());

    //mints USDC to depositor
    await usdc.connect(depositor.signer).mint(await convertToCurrencyDecimals(usdc.address, "100000"));

    //approve protocol to access depositor wallet
    await usdc.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //deposits USDC
    const amountDeposit = await convertToCurrencyDecimals(usdc.address, "100000");

    await pool.connect(depositor.signer).deposit(usdc.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await bayc.connect(borrower.signer).mint("102");

    //approve protocol to access borrower wallet
    await bayc.connect(borrower.signer).setApprovalForAll(pool.address, true);

    //borrows
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, "102", "5000000000000000000", 4000, 7000, 100, 1, 2, 25, true, false);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    const nftColDataBefore = await pool.getNftCollateralData(bayc.address, 102, usdc.address);

    const usdcPrice = await reserveOracle.getAssetPrice(usdc.address);

    const amountBorrow = await convertToCurrencyDecimals(
      usdc.address,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(usdcPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );
    console.log(amountBorrow.toString());
    await pool
      .connect(borrower.signer)
      .borrow(usdc.address, amountBorrow.toString(), bayc.address, "102", borrower.address, "0");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "102");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );

    const tokenOwner = await bayc.ownerOf("102");
    expect(tokenOwner).to.be.equal(uBAYC.address, "Invalid token owner after auction");
  });

  it("USDC - Drop the health factor below 1", async () => {
    const { usdc, bayc, users, pool, nftOracle } = testEnv;
    const borrower = users[1];

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "102");

    const debAmountUnits = await convertToCurrencyUnits(usdc.address, nftDebtDataBefore.totalDebt.toString());
    await setNftAssetPriceForDebt(testEnv, "BAYC", 102, "USDC", debAmountUnits, "80");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "102");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });
});
