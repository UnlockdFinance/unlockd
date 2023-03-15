import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { UPGRADE } from "../hardhat.config";
import { getReservesConfigByPool } from "../helpers/configuration";
import { ADDRESS_ID_PUNKS, ADDRESS_ID_WETH, ADDRESS_ID_WPUNKS, MAX_UINT_AMOUNT, ONE_YEAR } from "../helpers/constants";
import { getDebtToken } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals, getEthersSignerByAddress } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  createRandomAddress,
  fundWithERC20,
  fundWithWrappedPunk,
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
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import { getERC20TokenBalance, getLoanData, getReserveData } from "./helpers/utils/helpers";

const chai = require("chai");
const { expect } = chai;

makeSuite("PunkGateway", (testEnv: TestEnv) => {
  const zero = BN.from(0);

  before("Initializing configuration", async () => {
    const { wethGateway, punkGateway, users, addressesProvider, weth } = testEnv;
    const [depositor, borrower] = users;

    await addressesProvider.setAddress(ADDRESS_ID_WETH, weth.address);
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });
    await wethGateway.authorizeCallerWhitelist([depositor.address, users[0].address, punkGateway.address], true);
    await punkGateway.authorizeCallerWhitelist([depositor.address, users[0].address], true);
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

  it("Owner can do emergency CryptoPunks recovery", async () => {
    const { users, cryptoPunksMarket, punkGateway, deployer } = testEnv;
    const user = users[0];
    const punkIndex = testEnv.punkIndexTracker++;
    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(user.address, punkIndex);

    await waitForTx(await cryptoPunksMarket.connect(user.signer).transferPunk(punkGateway.address, punkIndex));

    const tokenOwnerAfterBadTransfer = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

    expect(tokenOwnerAfterBadTransfer).to.be.eq(punkGateway.address, "User should have lost the punk here.");

    await punkGateway
      .connect(deployer.signer)
      .emergencyPunksTransfer(cryptoPunksMarket.address, user.address, punkIndex);

    const tokenOwnerAfterRecovery = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

    expect(tokenOwnerAfterRecovery).to.be.eq(user.address, "User should recover the punk due emergency transfer");
  });

  it("Should fail: not supported collection", async () => {
    const { users, cryptoPunksMarket, punkGateway, deployer, pool, addressesProvider, wrappedPunk } = testEnv;
    const user = users[0];
    const punkIndex = testEnv.punkIndexTracker++;
    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(user.address, punkIndex);
    await addressesProvider.setAddress(ADDRESS_ID_PUNKS, cryptoPunksMarket.address);
    await addressesProvider.setAddress(ADDRESS_ID_WPUNKS, await createRandomAddress());
    await expect(pool.connect(user.signer).approveValuation(cryptoPunksMarket.address, punkIndex)).to.be.revertedWith(
      ProtocolErrors.LP_COLLECTION_NOT_SUPPORTED
    );
  });

  it("Should fail: not holder", async () => {
    const { users, cryptoPunksMarket, punkGateway, deployer, pool, addressesProvider, wrappedPunk } = testEnv;
    const user = users[0];
    const user2 = users[1];
    const punkIndex = testEnv.punkIndexTracker++;
    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }

    await fundWithWrappedPunk(user.address, punkIndex);
    await addressesProvider.setAddress(ADDRESS_ID_PUNKS, cryptoPunksMarket.address);
    await addressesProvider.setAddress(ADDRESS_ID_WPUNKS, await createRandomAddress());
    await expect(pool.connect(user2.signer).approveValuation(cryptoPunksMarket.address, punkIndex)).to.be.revertedWith(
      ProtocolErrors.LP_CALLER_NOT_NFT_HOLDER
    );
  });

  it("Check approve valuation on cryptopunks", async () => {
    const { users, cryptoPunksMarket, punkGateway, deployer, pool, addressesProvider, wrappedPunk } = testEnv;
    const user = users[0];
    const punkIndex = testEnv.punkIndexTracker++;
    if (!UPGRADE) {
      await cryptoPunksMarket.allInitialOwnersAssigned();
    }
    await fundWithWrappedPunk(user.address, punkIndex);
    await addressesProvider.setAddress(ADDRESS_ID_PUNKS, cryptoPunksMarket.address);
    await addressesProvider.setAddress(ADDRESS_ID_WPUNKS, wrappedPunk.address);
    const configFee = await pool.getConfigFee();
    await pool.connect(user.signer).approveValuation(cryptoPunksMarket.address, punkIndex, { value: configFee });
  });

  it("Borrow some USDC and repay it", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      wethGateway,
      pool,
      dataProvider,
      usdc,
      deployer,
      configurator,
      reserveOracle,
      nftOracle,
    } = testEnv;
    if (JSON.stringify(usdc) !== "{}") {
      const [depositor, borrower] = users;

      // Deposit USDC
      await fundWithERC20("USDC", depositor.address, "10000");
      await approveERC20(testEnv, depositor, "USDC");

      await deposit(testEnv, depositor, "", "USDC", "10000", depositor.address, "success", "");

      const borrowSize1 = await convertToCurrencyDecimals(deployer, usdc, "1");
      const borrowSize2 = await convertToCurrencyDecimals(deployer, usdc, "2");
      const borrowSizeAll = borrowSize1.add(borrowSize2);
      const repaySize = borrowSizeAll.add(borrowSizeAll.mul(5).div(100));
      const punkIndex = 0;

      // Mint for interest
      await fundWithERC20("USDC", borrower.address, "3000");
      await approveERC20PunkGateway(testEnv, borrower, "USDC");

      const getDebtBalance = async () => {
        const loan = await getLoanData(pool, dataProvider, wrappedPunk.address, `${punkIndex}`, "0");

        return BN.from(loan.currentAmount.toFixed(0));
      };
      const getPunkOwner = async () => {
        const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

        return owner;
      };
      const getWrappedPunkOwner = async () => {
        const owner = await wrappedPunk.ownerOf(punkIndex);

        return owner;
      };

      await waitForTx(await cryptoPunksMarket.connect(borrower.signer).getPunk(punkIndex));
      await waitForTx(
        await cryptoPunksMarket.connect(borrower.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
      );

      const usdcBalanceBefore = await getERC20TokenBalance(usdc.address, borrower.address);

      // Delegates borrowing power of WETH to WETHGateway
      const reserveData = await pool.getReserveData(usdc.address);
      const debtToken = await getDebtToken(reserveData.debtTokenAddress);
      await waitForTx(await debtToken.connect(borrower.signer).approveDelegation(punkGateway.address, MAX_UINT_AMOUNT));

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

      await fundWithWrappedPunk(borrower.address, punkIndex);

      // borrow first usdc
      await waitForTx(
        await punkGateway.connect(borrower.signer).borrow(usdc.address, borrowSize1, punkIndex, borrower.address, "0")
      );

      await advanceTimeAndBlock(100);

      const collData2: IConfigNftAsCollateralInput = {
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
      await configurator.connect(deployer.signer).configureNftsAsCollateral([collData2]);

      // borrow more usdc
      await waitForTx(
        await punkGateway.connect(borrower.signer).borrow(usdc.address, borrowSize2, punkIndex, borrower.address, "0")
      );

      const usdcBalanceAfterBorrow = await usdc.balanceOf(borrower.address);
      const debtAfterBorrow = await getDebtBalance();
      const wrapperPunkOwner = await getWrappedPunkOwner();

      expect(usdcBalanceAfterBorrow).to.be.gte(usdcBalanceBefore.add(borrowSizeAll));
      expect(debtAfterBorrow).to.be.gte(borrowSizeAll);

      await advanceTimeAndBlock(100);

      // Repay partial
      await waitForTx(await punkGateway.connect(borrower.signer).repay(punkIndex, repaySize.div(2)));

      const usdcBalanceAfterPartialRepay = await getERC20TokenBalance(usdc.address, borrower.address);
      const debtAfterPartialRepay = await getDebtBalance();
      expect(usdcBalanceAfterPartialRepay).to.be.lt(usdcBalanceAfterBorrow);
      expect(debtAfterPartialRepay).to.be.lt(debtAfterBorrow);
      expect(await getPunkOwner()).to.be.eq(wrappedPunk.address);
      expect(await getWrappedPunkOwner(), "WrappedPunk should owned by loan after partial borrow").to.be.eq(
        wrapperPunkOwner
      );

      await advanceTimeAndBlock(100);

      // Repay full
      await waitForTx(await wrappedPunk.connect(borrower.signer).setApprovalForAll(punkGateway.address, true));

      await waitForTx(await punkGateway.connect(borrower.signer).repay(punkIndex, repaySize));

      const usdcBalanceAfterFullRepay = await getERC20TokenBalance(usdc.address, borrower.address);
      const debtAfterFullRepay = await getDebtBalance();
      expect(usdcBalanceAfterFullRepay).to.be.lt(usdcBalanceAfterPartialRepay);
      expect(debtAfterFullRepay).to.be.eq(zero);
      expect(await getPunkOwner()).to.be.eq(borrower.address);
    }
  });

  it("Borrow some ETH and repay it", async () => {
    const {
      users,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      wethGateway,
      weth,
      pool,
      dataProvider,
      loan,
      configurator,
      nftOracle,
      deployer,
      uWETH,
    } = testEnv;

    const [depositor, user, anotherUser] = users;
    const depositSize = await convertToCurrencyDecimals(depositor, weth, "50");

    // Deposit with native ETH

    await wethGateway.connect(depositor.signer).depositETH(depositor.address, 0, { value: depositSize });

    const borrowSize1 = parseEther("1");
    const borrowSize2 = parseEther("2");
    const borrowSizeAll = borrowSize1.add(borrowSize2);
    const repaySize = borrowSizeAll.add(borrowSizeAll.mul(5).div(100));
    const punkIndex = testEnv.punkIndexTracker++;

    const getDebtBalance = async () => {
      const loan = await getLoanData(pool, dataProvider, wrappedPunk.address, `${punkIndex}`, "0");

      return BN.from(loan.currentAmount.toFixed(0));
    };
    const getPunkOwner = async () => {
      const owner = await cryptoPunksMarket.punkIndexToAddress(punkIndex);

      return owner;
    };
    const getWrappedPunkOwner = async () => {
      const owner = await wrappedPunk.ownerOf(punkIndex);

      return owner;
    };

    await advanceTimeAndBlock(100);

    await fundWithWrappedPunk(user.address, punkIndex);

    await waitForTx(
      await cryptoPunksMarket.connect(user.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
    );

    await advanceTimeAndBlock(100);

    const ethBalanceBefore = await user.signer.getBalance();

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(user.signer).approveDelegation(wethGateway.address, MAX_UINT_AMOUNT));

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

    // borrow first eth
    await waitForTx(await punkGateway.connect(user.signer).borrowETH(borrowSize1, punkIndex, user.address, "0"));
    await advanceTimeAndBlock(100);

    const collData2: IConfigNftAsCollateralInput = {
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
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData2]);

    // borrow more eth
    await waitForTx(await punkGateway.connect(user.signer).borrowETH(borrowSize2, punkIndex, user.address, "0"));

    // Check debt
    const loanDataAfterBorrow = await dataProvider.getLoanDataByCollateral(wrappedPunk.address, punkIndex);
    expect(loanDataAfterBorrow.state).to.be.eq(ProtocolLoanState.Active);

    const wrapperPunkOwner = await getWrappedPunkOwner();
    const debtAfterBorrow = await getDebtBalance();

    expect(await user.signer.getBalance(), "current eth balance shoud increase").to.be.gt(ethBalanceBefore);
    expect(debtAfterBorrow, "debt should gte borrowSize").to.be.gte(borrowSizeAll);

    await advanceTimeAndBlock(100);

    // Repay partial
    await waitForTx(
      await punkGateway.connect(user.signer).repayETH(punkIndex, repaySize.div(2), {
        value: repaySize.div(2),
      })
    );
    const loanDataAfterRepayPart = await dataProvider.getLoanDataByLoanId(loanDataAfterBorrow.loanId);
    const debtAfterPartialRepay = await getDebtBalance();

    expect(debtAfterPartialRepay).to.be.lt(debtAfterBorrow);
    expect(await getPunkOwner()).to.be.eq(wrappedPunk.address);
    expect(await getWrappedPunkOwner(), "WrappedPunk should owned by loan after partial borrow").to.be.eq(
      wrapperPunkOwner
    );
    expect(loanDataAfterRepayPart.state).to.be.eq(ProtocolLoanState.Active);

    await advanceTimeAndBlock(100);

    // Repay full
    await waitForTx(await wrappedPunk.connect(user.signer).setApprovalForAll(punkGateway.address, true));
    await waitForTx(
      await punkGateway.connect(user.signer).repayETH(punkIndex, MAX_UINT_AMOUNT, {
        value: repaySize,
      })
    );
    const debtAfterFullRepay = await getDebtBalance();
    const loanDataAfterRepayFull = await dataProvider.getLoanDataByLoanId(loanDataAfterBorrow.loanId);

    expect(debtAfterFullRepay).to.be.eq(zero);
    expect(await getPunkOwner()).to.be.eq(user.address);
    expect(loanDataAfterRepayFull.state).to.be.eq(ProtocolLoanState.Repaid);
  });

  it("Borrow all ETH and repay it", async () => {
    const {
      users,
      pool,
      cryptoPunksMarket,
      wrappedPunk,
      punkGateway,
      weth,
      uWETH,
      wethGateway,
      dataProvider,
      configurator,
      deployer,
      nftOracle,
    } = testEnv;

    const [depositor, user] = users;
    const depositSize = parseEther("5");

    // advance block to make some interests
    const secondsToTravel = new BigNumber(365).multipliedBy(ONE_YEAR).div(365).toNumber();
    await advanceTimeAndBlock(secondsToTravel);

    const wethReserveData = await getReserveData(dataProvider, weth.address);
    const borrowSize = new BigNumber(wethReserveData.availableLiquidity);
    const repaySize = borrowSize.plus(borrowSize.multipliedBy(5).dividedBy(100));
    const punkIndex = testEnv.punkIndexTracker++;

    await fundWithWrappedPunk(user.address, punkIndex);
    await waitForTx(
      await cryptoPunksMarket.connect(user.signer).offerPunkForSaleToAddress(punkIndex, 0, punkGateway.address)
    );

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(user.signer).approveDelegation(wethGateway.address, MAX_UINT_AMOUNT));

    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);

    await nftOracle.connect(deployer.signer).setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: wrappedPunk.address,
      nftTokenId: punkIndex.toString(),
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
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    // borrow all eth
    await waitForTx(
      await punkGateway.connect(user.signer).borrowETH(borrowSize.toFixed(0), punkIndex, user.address, "0")
    );

    // Check results
    const loanDataAfterBorrow = await dataProvider.getLoanDataByCollateral(wrappedPunk.address, punkIndex);
    expect(loanDataAfterBorrow.state).to.be.eq(ProtocolLoanState.Active);

    // Repay all eth
    await waitForTx(await wrappedPunk.connect(user.signer).setApprovalForAll(punkGateway.address, true));
    await waitForTx(
      await punkGateway.connect(user.signer).repayETH(punkIndex, MAX_UINT_AMOUNT, {
        value: repaySize.toFixed(0),
      })
    );

    // Check results
    const loanDataAfterRepayFull = await dataProvider.getLoanDataByLoanId(loanDataAfterBorrow.loanId);
    expect(loanDataAfterRepayFull.state).to.be.eq(ProtocolLoanState.Repaid);
  });
});
