import { BigNumberish } from "ethers";
import { APPROVAL_AMOUNT_LENDING_POOL, RAY } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20 } from "../helpers/misc-utils";
import { ProtocolErrors } from "../helpers/types";
import { strategyWETH } from "../markets/unlockd/reservesConfigs";
import { approveERC20 } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";

const { expect } = require("chai");

makeSuite("Configurator-Reserve", (testEnv: TestEnv) => {
  const {
    CALLER_NOT_POOL_ADMIN,
    LPC_RESERVE_LIQUIDITY_NOT_0,
    LPC_INVALID_CONFIGURATION,
    RC_INVALID_RESERVE_FACTOR,
    LP_INVALID_OVERFLOW_VALUE,
  } = ProtocolErrors;

  it("Reverts trying to set an invalid reserve factor", async () => {
    const { configurator, weth } = testEnv;

    const inputs: { asset: string; reserveFactor: BigNumberish }[] = [
      {
        asset: weth.address,
        reserveFactor: 65536,
      },
    ];

    await expect(configurator.batchConfigReserve(inputs)).to.be.revertedWith(RC_INVALID_RESERVE_FACTOR);
  });

  it("Rectivates the ETH reserve", async () => {
    const { configurator, weth, dataProvider } = testEnv;
    await configurator.setActiveFlagOnReserve(weth.address, true);

    const { isActive } = await dataProvider.getReserveConfigurationData(weth.address);
    expect(isActive).to.be.equal(true);
  });

  it("Check the onlyAdmin on deactivateReserve ", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setActiveFlagOnReserve(weth.address, false),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the onlyAdmin on activateReserve ", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setActiveFlagOnReserve(weth.address, true),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Freezes the ETH reserve", async () => {
    const { configurator, weth, dataProvider } = testEnv;

    await configurator.setFreezeFlagOnReserve(weth.address, true);
    const { decimals, reserveFactor, borrowingEnabled, isActive, isFrozen } =
      await dataProvider.getReserveConfigurationData(weth.address);

    expect(borrowingEnabled).to.be.equal(true);
    expect(isActive).to.be.equal(true);
    expect(isFrozen).to.be.equal(true);
    expect(decimals).to.be.equal(strategyWETH.reserveDecimals);
    expect(reserveFactor).to.be.equal(strategyWETH.reserveFactor);
  });

  it("Unfreezes the ETH reserve", async () => {
    const { configurator, dataProvider, weth } = testEnv;
    await configurator.setFreezeFlagOnReserve(weth.address, false);

    const { decimals, reserveFactor, borrowingEnabled, isActive, isFrozen } =
      await dataProvider.getReserveConfigurationData(weth.address);

    expect(borrowingEnabled).to.be.equal(true);
    expect(isActive).to.be.equal(true);
    expect(isFrozen).to.be.equal(false);
    expect(decimals).to.be.equal(strategyWETH.reserveDecimals);
    expect(reserveFactor).to.be.equal(strategyWETH.reserveFactor);
  });

  it("Check the onlyAdmin on freezeReserve ", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setFreezeFlagOnReserve(weth.address, true),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the onlyAdmin on unfreezeReserve ", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setFreezeFlagOnReserve(weth.address, false),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Deactivates the ETH reserve for borrowing", async () => {
    const { configurator, dataProvider, weth } = testEnv;
    await configurator.setBorrowingFlagOnReserve(weth.address, false);
    const { decimals, reserveFactor, borrowingEnabled, isActive, isFrozen } =
      await dataProvider.getReserveConfigurationData(weth.address);

    expect(borrowingEnabled).to.be.equal(false);
    expect(isActive).to.be.equal(true);
    expect(isFrozen).to.be.equal(false);
    expect(decimals).to.be.equal(strategyWETH.reserveDecimals);
    expect(reserveFactor).to.be.equal(strategyWETH.reserveFactor);
  });

  it("Activates the ETH reserve for borrowing", async () => {
    const { configurator, weth, dataProvider } = testEnv;
    await configurator.setBorrowingFlagOnReserve(weth.address, true);
    const { variableBorrowIndex } = await dataProvider.getReserveData(weth.address);

    const { decimals, reserveFactor, borrowingEnabled, isActive, isFrozen } =
      await dataProvider.getReserveConfigurationData(weth.address);

    expect(borrowingEnabled).to.be.equal(true);
    expect(isActive).to.be.equal(true);
    expect(isFrozen).to.be.equal(false);
    expect(decimals).to.be.equal(strategyWETH.reserveDecimals);
    expect(reserveFactor).to.be.equal(strategyWETH.reserveFactor);
  });

  it("Check the onlyAdmin on disableBorrowingOnReserve ", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setBorrowingFlagOnReserve(weth.address, false),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the onlyAdmin on enableBorrowingOnReserve ", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setBorrowingFlagOnReserve(weth.address, true),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Changes the reserve factor of WETH", async () => {
    const { configurator, dataProvider, weth } = testEnv;
    await configurator.setReserveFactor(weth.address, "1000");
    const { reserveFactor } = await dataProvider.getReserveConfigurationData(weth.address);

    expect(reserveFactor).to.be.equal(1000);
  });

  it("Check the onlyLendPoolManager on setReserveFactor", async () => {
    const { configurator, users, weth } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setReserveFactor(weth.address, "2000"),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Batch Changes the reserve factor of WETH & DAI", async () => {
    const { configurator, dataProvider, weth, dai } = testEnv;
    if (JSON.stringify(dai) !== "{}") {
      const inputs: { asset: string; reserveFactor: BigNumberish }[] = [
        {
          asset: weth.address,
          reserveFactor: 1000,
        },
        {
          asset: dai.address,
          reserveFactor: 2000,
        },
      ];

      await configurator.batchConfigReserve(inputs);

      {
        const { reserveFactor } = await dataProvider.getReserveConfigurationData(weth.address);

        expect(reserveFactor).to.be.equal(1000);
      }

      {
        const { reserveFactor } = await dataProvider.getReserveConfigurationData(dai.address);

        expect(reserveFactor).to.be.equal(2000);
      }
    }
  });

  it("Check the onlyPoolAdmin on batchConfigReserve", async () => {
    const { configurator, users, weth } = testEnv;

    const inputs: { asset: string; reserveFactor: BigNumberish }[] = [
      {
        asset: weth.address,
        reserveFactor: 2000,
      },
    ];

    await expect(
      configurator.connect(users[2].signer).batchConfigReserve(inputs),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Reverts when trying to disable the DAI reserve with liquidity on it", async () => {
    const { dai, pool, configurator, deployer } = testEnv;
    if (JSON.stringify(dai) !== "{}") {
      const userAddress = await pool.signer.getAddress();

      await fundWithERC20("DAI", deployer.address, "1000");

      //approve protocol to access depositor wallet
      await approveERC20(testEnv, deployer, "DAI");

      const amountDAItoDeposit = await convertToCurrencyDecimals(deployer, dai, "1000");

      //user 1 deposits 1000 DAI
      await pool.deposit(dai.address, amountDAItoDeposit, userAddress, "0");

      await expect(
        configurator.setActiveFlagOnReserve(dai.address, false),
        LPC_RESERVE_LIQUIDITY_NOT_0
      ).to.be.revertedWith(LPC_RESERVE_LIQUIDITY_NOT_0);
    }
  });

  it("Config setMaxNumberOfReserves valid value", async () => {
    const { configurator, users, pool } = testEnv;
    await configurator.setMaxNumberOfReserves(64);

    const wantVal = await pool.getMaxNumberOfReserves();
    expect(wantVal).to.be.equal(64);
  });

  it("Config setMaxNumberOfReserves invalid value", async () => {
    const { configurator, users, pool } = testEnv;
    await expect(configurator.setMaxNumberOfReserves(2), LPC_INVALID_CONFIGURATION).to.be.revertedWith(
      LPC_INVALID_CONFIGURATION
    );
  });

  it("Config setMaxNumberOfReserves invalid value overflow", async () => {
    const { configurator, users, pool } = testEnv;
    await expect(configurator.setMaxNumberOfReserves(256), LP_INVALID_OVERFLOW_VALUE).to.be.revertedWith(
      LP_INVALID_OVERFLOW_VALUE
    );
  });

  it("Check the onlyAdmin on setMaxNumberOfReserves ", async () => {
    const { configurator, users, pool } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setMaxNumberOfReserves(512),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });
});
