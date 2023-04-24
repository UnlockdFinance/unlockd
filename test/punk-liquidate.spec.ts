import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { UPGRADE } from "../hardhat.config";
import { getReservesConfigByPool } from "../helpers/configuration";
import { MAX_UINT_AMOUNT, oneEther, ONE_DAY } from "../helpers/constants";
import { getDebtToken } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals, convertToCurrencyUnits } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  fundWithERC20,
  fundWithWrappedPunk,
  increaseTime,
  sleep,
  waitForTx,
} from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  IReserveParams,
  iUnlockdPoolAssets,
  ProtocolErrors,
  ProtocolLoanState,
  UnlockdPools,
} from "../helpers/types";
import {
  approveERC20,
  approveERC20PunkGateway,
  configuration as actionsConfiguration,
  deposit,
  mintERC20,
  setNftAssetPrice,
  setNftAssetPriceForDebt,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const chai = require("chai");
const { expect } = chai;

makeSuite("PunkGateway-Liquidate", (testEnv: TestEnv) => {
  const zero = BN.from(0);
  let punkInitPrice: BN;

  before("Initializing configuration", async () => {
    const { wethGateway, punkGateway, users } = testEnv;
    const [depositor, borrower] = users;
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });
    await wethGateway.authorizeCallerWhitelist(
      [depositor.address, users[0].address, borrower.address, punkGateway.address],
      true
    );
    await punkGateway.authorizeCallerWhitelist([depositor.address, users[0].address, borrower.address], true);
    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <iUnlockdPoolAssets<IReserveParams>>(
      getReservesConfigByPool(UnlockdPools.proto)
    );
  });
  after("Reset", async () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("Borrow USDC and liquidate it", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      wethGateway,
      usdc,
      pool,
      dataProvider,
      reserveOracle,
      nftOracle,
      configurator,
      deployer,
    } = testEnv;
    if (JSON.stringify(usdc) !== "{}") {
      const [depositor, borrower] = users;
      const liquidator = users[4];
      const depositUnit = "200000";
      const depositSize = await convertToCurrencyDecimals(deployer, usdc, "200000");

      await sleep(1000 * 1);
      await setNftAssetPrice(testEnv, "WPUNKS", 101, parseEther("50").toString());

      // Delegates borrowing power of WETH to WETHGateway
      const reserveData = await pool.getReserveData(usdc.address);
      const debtToken = await getDebtToken(reserveData.debtTokenAddress);
      await waitForTx(await debtToken.connect(borrower.signer).approveDelegation(punkGateway.address, MAX_UINT_AMOUNT));

      const punkIndex = testEnv.punkIndexTracker++;

      const getPunkOwner = async () => {
        const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

        return owner;
      };

      // Deposit USDC
      await fundWithERC20("USDC", depositor.address, "200000");
      await approveERC20(testEnv, depositor, "USDC");
      await deposit(testEnv, depositor, "", "USDC", depositUnit.toString(), depositor.address, "success", "");

      // mint native punk
      await waitForTx(await cryptoPunksMarket.connect(borrower.signer).getPunk(punkIndex));
      await waitForTx(
        await cryptoPunksMarket.connect(borrower.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
      );

      const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(wrappedPunk.address, punkIndex);

      // borrow usdc, health factor above 1
      const nftColDataBefore = await pool.getNftCollateralData(wrappedPunk.address, 101, usdc.address);

      await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);

      await nftOracle.connect(deployer.signer).setPriceManagerStatus(configurator.address, true);

      await configurator.connect(deployer.signer).setTimeframe(720000);

      const collData: IConfigNftAsCollateralInput = {
        asset: wrappedPunk.address,
        nftTokenId: punkIndex.toString(),
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
      await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

      const usdcPrice = await reserveOracle.getAssetPrice(usdc.address);
      const amountBorrow = await convertToCurrencyDecimals(
        deployer,
        usdc,
        new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
          .div(usdcPrice.toString())
          .multipliedBy(0.95)
          .toFixed(0)
      );

      await waitForTx(
        await punkGateway.connect(borrower.signer).borrow(usdc.address, amountBorrow, punkIndex, borrower.address, "0")
      );

      await waitForTx(await wrappedPunk.connect(liquidator.signer).setApprovalForAll(punkGateway.address, true));

      const nftDebtDataAfterBorrow = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
      expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(oneEther.toFixed(0));

      // Drop the health factor below 1
      const debAmountUnits = await convertToCurrencyUnits(deployer, usdc, nftDebtDataAfterBorrow.totalDebt.toString());
      await setNftAssetPriceForDebt(testEnv, "WPUNKS", punkIndex, "USDC", debAmountUnits, "80");
      const nftDebtDataAfterOracle = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
      expect(nftDebtDataAfterOracle.healthFactor.toString()).to.be.bignumber.lt(oneEther.toFixed(0));

      // Liquidate USDC loan
      await fundWithERC20("USDC", liquidator.address, "200000");
      await approveERC20PunkGateway(testEnv, liquidator, "USDC");

      const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(usdc.address, wrappedPunk.address, punkIndex);
      const liquidateAmount = liquidatePrice.add(liquidatePrice.mul(5).div(100));
      await waitForTx(
        await punkGateway.connect(liquidator.signer).auction(punkIndex, liquidateAmount, liquidator.address)
      );

      await increaseTime(nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber());

      const extraAmount = await convertToCurrencyDecimals(deployer, usdc, "100");
      await waitForTx(await punkGateway.connect(liquidator.signer).liquidate(punkIndex, extraAmount));

      const loanDataAfter = await dataProvider.getLoanDataByLoanId(nftDebtDataAfterBorrow.loanId);
      expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

      const punkOwner = await getPunkOwner();
      expect(punkOwner).to.be.equal(liquidator.address, "Invalid punk owner after liquidation");
    }
  });

  it("Borrow ETH and liquidate it", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      weth,
      wethGateway,
      pool,
      dataProvider,
      loan,
      reserveOracle,
      nftOracle,
      configurator,
      deployer,
    } = testEnv;

    const [depositor, user] = users;
    const liquidator = users[4];
    const depositSize = parseEther("50");

    await sleep(1000 * 1);

    const punkIndex = testEnv.punkIndexTracker++;

    await setNftAssetPrice(testEnv, "WPUNKS", punkIndex, parseEther("50").toString());

    // Deposit with native ETH
    await waitForTx(
      await wethGateway.connect(depositor.signer).depositETH(depositor.address, "0", { value: depositSize })
    );

    const getPunkOwner = async () => {
      const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

      return owner;
    };

    // mint native punk

    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(user.address, punkIndex);
    await waitForTx(
      await cryptoPunksMarket.connect(user.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
    );

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(wrappedPunk.address, punkIndex);

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(user.signer).approveDelegation(wethGateway.address, MAX_UINT_AMOUNT));

    // borrow eth, health factor above 1
    const nftColDataBefore = await pool.getNftCollateralData(wrappedPunk.address, punkIndex, weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);

    await nftOracle.connect(deployer.signer).setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: wrappedPunk.address,
      nftTokenId: punkIndex.toString(),
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
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    await waitForTx(await punkGateway.connect(user.signer).borrowETH(amountBorrow, punkIndex, user.address, "0"));

    await waitForTx(await wrappedPunk.connect(liquidator.signer).setApprovalForAll(punkGateway.address, true));

    const nftDebtDataAfterBorrow = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(oneEther.toFixed(0));

    // Drop the health factor below 1
    const debAmountUnits = await convertToCurrencyUnits(deployer, weth, nftDebtDataAfterBorrow.totalDebt.toString());
    await setNftAssetPriceForDebt(testEnv, "WPUNKS", punkIndex, "WETH", debAmountUnits, "80");
    const nftDebtDataAfterOracle = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataAfterOracle.healthFactor.toString()).to.be.bignumber.lt(oneEther.toFixed(0));

    // Liquidate ETH loan with native ETH
    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, wrappedPunk.address, punkIndex);
    const liquidateAmountSend = liquidatePrice.add(liquidatePrice.mul(5).div(100));
    await waitForTx(
      await punkGateway
        .connect(liquidator.signer)
        .auctionETH(punkIndex, liquidator.address, { value: liquidateAmountSend })
    );

    await increaseTime(nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber());

    const extraAmount = await convertToCurrencyDecimals(deployer, weth, "1");
    await waitForTx(await punkGateway.connect(liquidator.signer).liquidateETH(punkIndex, { value: extraAmount }));

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(nftDebtDataAfterBorrow.loanId);
    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    const punkOwner = await getPunkOwner();
    expect(punkOwner).to.be.equal(liquidator.address, "Invalid punk owner after liquidation");
  });
  it("Borrow ETH and liquidate it through buyout", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      weth,
      wethGateway,
      pool,
      dataProvider,
      loan,
      reserveOracle,
      nftOracle,
      configurator,
      deployer,
    } = testEnv;

    const depositor = users[0];
    const borrower = users[1];
    const buyer = users[4];
    const bidder = users[5];
    const depositSize = parseEther("50");

    await sleep(1000 * 1);

    const punkIndex = testEnv.punkIndexTracker++;

    await setNftAssetPrice(testEnv, "WPUNKS", punkIndex, parseEther("50").toString());

    // Deposit with native ETH
    await waitForTx(
      await wethGateway.connect(depositor.signer).depositETH(depositor.address, "0", { value: depositSize })
    );

    const getPunkOwner = async () => {
      const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

      return owner;
    };

    // mint native punk

    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(borrower.address, punkIndex);
    await waitForTx(
      await cryptoPunksMarket.connect(borrower.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
    );

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(wrappedPunk.address, punkIndex);

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(borrower.signer).approveDelegation(wethGateway.address, MAX_UINT_AMOUNT));

    // borrow eth, health factor above 1
    const nftColDataBefore = await pool.getNftCollateralData(wrappedPunk.address, punkIndex, weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);

    await nftOracle.connect(deployer.signer).setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: wrappedPunk.address,
      nftTokenId: punkIndex.toString(),
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
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "40");

    await waitForTx(
      await punkGateway.connect(borrower.signer).borrowETH(amountBorrow, punkIndex, borrower.address, "0")
    );

    await waitForTx(await wrappedPunk.connect(buyer.signer).setApprovalForAll(punkGateway.address, true));

    const nftDebtDataAfterBorrow = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(oneEther.toFixed(0));

    // Drop the health factor below 1
    await nftOracle.setNFTPrice(wrappedPunk.address, punkIndex, parseEther("50")); // 50 eth
    const nftDebtDataBeforeAuction = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataBeforeAuction.healthFactor.toString()).to.be.bignumber.lt(oneEther.toFixed(0));

    // Bid 50 ETH on loan
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);

    const bidderBalanceBeforeAuction = await weth.balanceOf(bidder.address);
    await waitForTx(
      await punkGateway.connect(bidder.signer).auctionETH(punkIndex, bidder.address, { value: parseEther("50") })
    );

    // Try to get a discount not being a lockey holder (expect revert)
    const nftPrice = await nftOracle.getNFTPrice(wrappedPunk.address, punkIndex);
    const buyoutAmountIncorrect = new BigNumber(
      new BigNumber(nftPrice.toString()).percentMul(new BigNumber("9700"))
    ).toFixed(0);

    await expect(
      punkGateway.connect(buyer.signer).buyoutETH(punkIndex, buyer.address, { value: buyoutAmountIncorrect })
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE);

    const buyoutAmount = nftPrice;

    // Execute buyout successfully (expect success)
    await waitForTx(
      await punkGateway.connect(buyer.signer).buyoutETH(punkIndex, buyer.address, { value: buyoutAmount })
    );

    // Buyer should own the NFT.
    expect(await cryptoPunksMarket.punkIndexToAddress(punkIndex), "buyer should be the new owner").to.be.eq(
      buyer.address
    );

    // Bidder should have its ETH bid amount back.
    const bidderBalanceAfterBuyout = await weth.balanceOf(bidder.address);
    expect(bidderBalanceAfterBuyout).to.be.gt(bidderBalanceBeforeAuction.add(parseEther("50")));

    // Loan should be defaulted
    const loanDataAfter = await dataProvider.getLoanDataByLoanId(nftDebtDataBeforeAuction.loanId);
    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    // Borrower should have the remaining amount (buyout amount - borrow amount) back
    const borrowerBalanceAfterBuyoutInWeth = await weth.balanceOf(borrower.address);
    await expect(borrowerBalanceAfterBuyoutInWeth).to.be.gt(0);
  });
  it("Borrow WETH and liquidate it through buyout", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      weth,
      wethGateway,
      pool,
      dataProvider,
      loan,
      reserveOracle,
      nftOracle,
      configurator,
      deployer,
    } = testEnv;

    const depositor = users[0];
    const borrower = users[1];
    const buyer = users[4];
    const bidder = users[5];
    const depositSize = parseEther("50");

    await sleep(1000 * 1);

    const punkIndex = testEnv.punkIndexTracker++;

    await setNftAssetPrice(testEnv, "WPUNKS", punkIndex, parseEther("50").toString());

    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    // Deposit with WETH
    await waitForTx(await pool.connect(depositor.signer).deposit(weth.address, depositSize, depositor.address, 0));

    const getPunkOwner = async () => {
      const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

      return owner;
    };

    // mint native punk

    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(borrower.address, punkIndex);
    await waitForTx(
      await cryptoPunksMarket.connect(borrower.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
    );

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(wrappedPunk.address, punkIndex);

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(borrower.signer).approveDelegation(punkGateway.address, MAX_UINT_AMOUNT));

    // borrow eth, health factor above 1
    const nftColDataBefore = await pool.getNftCollateralData(wrappedPunk.address, punkIndex, weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);

    await nftOracle.connect(deployer.signer).setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: wrappedPunk.address,
      nftTokenId: punkIndex.toString(),
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
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "40");

    await waitForTx(
      await punkGateway.connect(borrower.signer).borrow(weth.address, amountBorrow, punkIndex, borrower.address, "0")
    );

    await waitForTx(await wrappedPunk.connect(buyer.signer).setApprovalForAll(punkGateway.address, true));

    const nftDebtDataAfterBorrow = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(oneEther.toFixed(0));

    // Drop the health factor below 1
    await nftOracle.setNFTPrice(wrappedPunk.address, punkIndex, parseEther("50")); // 50 eth
    const nftDebtDataBeforeAuction = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataBeforeAuction.healthFactor.toString()).to.be.bignumber.lt(oneEther.toFixed(0));

    // Bid 50 ETH on loan
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);

    await fundWithERC20("WETH", bidder.address, "100");
    await approveERC20PunkGateway(testEnv, bidder, "WETH");

    await waitForTx(await punkGateway.connect(bidder.signer).auction(punkIndex, parseEther("50"), bidder.address));
    const bidderBalanceAfterAuction = await weth.balanceOf(bidder.address);

    // Try to get a discount not being a lockey holder (expect revert)
    const nftPrice = await nftOracle.getNFTPrice(wrappedPunk.address, punkIndex);
    const buyoutAmountIncorrect = new BigNumber(
      new BigNumber(nftPrice.toString()).percentMul(new BigNumber("9700"))
    ).toFixed(0);

    await fundWithERC20("WETH", buyer.address, "100");
    await approveERC20PunkGateway(testEnv, buyer, "WETH");

    await expect(
      punkGateway.connect(buyer.signer).buyout(punkIndex, buyoutAmountIncorrect, buyer.address)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE);

    const buyoutAmount = nftPrice;

    // Execute buyout successfully (expect success)
    await waitForTx(await punkGateway.connect(buyer.signer).buyout(punkIndex, buyoutAmount, buyer.address));

    // Buyer should own the NFT.
    expect(await cryptoPunksMarket.punkIndexToAddress(punkIndex), "buyer should be the new owner").to.be.eq(
      buyer.address
    );

    // Bidder should have its WETH bid amount back.
    const bidderBalanceAfterBuyout = await weth.balanceOf(bidder.address);
    expect(bidderBalanceAfterBuyout).to.be.gt(bidderBalanceAfterAuction.add(parseEther("50")));

    // Loan should be defaulted
    const loanDataAfter = await dataProvider.getLoanDataByLoanId(nftDebtDataBeforeAuction.loanId);
    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    // Borrower should have the remaining amount (buyout amount - borrow amount) back
    const borrowerBalanceAfterBuyoutInWeth = await weth.balanceOf(borrower.address);
    await expect(borrowerBalanceAfterBuyoutInWeth).to.be.gt(0);
  });
  it("Borrow ETH and redeem it", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      uPUNK,
      punkGateway,
      weth,
      wethGateway,
      pool,
      dataProvider,
      loan,
      reserveOracle,
      nftOracle,
      liquidator,
      configurator,
      deployer,
    } = testEnv;
    await pool.connect(deployer.signer).updateSafeHealthFactor(BN.from("1100000000000000000"));

    const [depositor, borrower] = users;
    const depositSize = parseEther("50");

    await sleep(1000 * 1);

    const punkIndex = testEnv.punkIndexTracker++;

    await setNftAssetPrice(testEnv, "WPUNKS", punkIndex, parseEther("50").toString());

    // Deposit with native ETH
    await waitForTx(
      await wethGateway.connect(depositor.signer).depositETH(depositor.address, "0", { value: depositSize })
    );

    const getPunkOwner = async () => {
      const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

      return owner;
    };

    // mint native punk

    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(borrower.address, punkIndex);
    await waitForTx(
      await cryptoPunksMarket.connect(borrower.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
    );

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(wrappedPunk.address, punkIndex);

    // borrow eth, health factor above 1
    const nftColDataBefore = await pool.getNftCollateralData(wrappedPunk.address, punkIndex, weth.address);

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(borrower.signer).approveDelegation(wethGateway.address, MAX_UINT_AMOUNT));

    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);

    await nftOracle.connect(deployer.signer).setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: wrappedPunk.address,
      nftTokenId: punkIndex.toString(),
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 5000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);
    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    await waitForTx(
      await punkGateway.connect(borrower.signer).borrowETH(amountBorrow, punkIndex, borrower.address, "0")
    );

    await waitForTx(await wrappedPunk.connect(borrower.signer).setApprovalForAll(punkGateway.address, true));

    const nftDebtDataAfterBorrow = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(oneEther.toFixed(0));

    // Drop the health factor below 1
    const debAmountUnits = await convertToCurrencyUnits(deployer, weth, nftDebtDataAfterBorrow.totalDebt.toString());
    await setNftAssetPriceForDebt(testEnv, "WPUNKS", punkIndex, "WETH", debAmountUnits, "80");
    const nftDebtDataAfterOracle = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    expect(nftDebtDataAfterOracle.healthFactor.toString()).to.be.bignumber.lt(oneEther.toFixed(0));

    // Auction ETH loan with native ETH
    const { liquidatePrice } = await dataProvider.getNftLiquidatePrice(weth.address, wrappedPunk.address, punkIndex);
    const liquidateAmountSend = liquidatePrice.add(liquidatePrice.mul(5).div(100));
    await waitForTx(
      await punkGateway
        .connect(liquidator.signer)
        .auctionETH(punkIndex, liquidator.address, { value: liquidateAmountSend })
    );

    // Redeem ETH loan with native ETH
    await increaseTime(nftCfgData.redeemDuration.mul(24).sub(1).toNumber());

    const auctionDataBeforeRedeem = await pool.getNftAuctionData(wrappedPunk.address, punkIndex);
    const debtDataBeforeRedeem = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    const redeemAmount = new BigNumber(debtDataBeforeRedeem.totalDebt.toString()).multipliedBy(0.51).toFixed(0);
    const bidFineAmount = new BigNumber(auctionDataBeforeRedeem.bidFine.toString()).multipliedBy(1.1).toFixed(0);
    const redeemAmountSend = new BigNumber(redeemAmount).plus(bidFineAmount).toFixed(0);
    await waitForTx(
      await punkGateway.connect(borrower.signer).redeemETH(punkIndex, redeemAmount, bidFineAmount, {
        value: redeemAmountSend,
      })
    );

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(nftDebtDataAfterBorrow.loanId);
    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Active, "Invalid loan state after redeem");

    const punkOwner = await getPunkOwner();
    expect(punkOwner).to.be.equal(wrappedPunk.address, "Invalid punk owner after redeem");

    const wpunkOwner = await wrappedPunk.ownerOf(punkIndex);
    expect(wpunkOwner).to.be.equal(uPUNK.address, "Invalid wpunk owner after redeem");

    // Repay loan
    const debtDataBeforeRepay = await pool.getNftDebtData(wrappedPunk.address, punkIndex);
    const repayAmount = new BigNumber(debtDataBeforeRepay.totalDebt.toString()).multipliedBy(1.1).toFixed(0);
    await waitForTx(
      await punkGateway.connect(borrower.signer).repayETH(punkIndex, MAX_UINT_AMOUNT, { value: repayAmount })
    );

    const loanDataAfterRepay = await dataProvider.getLoanDataByLoanId(nftDebtDataAfterBorrow.loanId);
    expect(loanDataAfterRepay.state).to.be.equal(ProtocolLoanState.Repaid, "Invalid loan state after repay");
  });
});
