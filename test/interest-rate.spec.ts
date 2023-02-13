import BigNumber from "bignumber.js";
import { UPGRADE } from "../hardhat.config";
import { oneRay, PERCENTAGE_FACTOR } from "../helpers/constants";
import { deployInterestRate } from "../helpers/contracts-deployments";
import { rateStrategyStableOne } from "../markets/unlockd/rateStrategies";
import { strategyWETH } from "../markets/unlockd/reservesConfigs";
import { InterestRate, MintableERC20, UToken, WETH9Mocked } from "../types";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Interest rate tests", (testEnv: TestEnv) => {
  let rateInstance: InterestRate;
  let weth: WETH9Mocked;
  let uweth: UToken;

  before(async () => {
    weth = testEnv.weth;
    uweth = testEnv.uWETH;

    const { addressesProvider } = testEnv;

    rateInstance = await deployInterestRate(
      [
        addressesProvider.address,
        rateStrategyStableOne.optimalUtilizationRate,
        rateStrategyStableOne.baseVariableBorrowRate,
        rateStrategyStableOne.variableRateSlope1,
        rateStrategyStableOne.variableRateSlope2,
      ],
      false
    );
  });

  it("Checks rates at 0% utilization rate, empty reserve", async () => {
    const { 0: currentLiquidityRate, 1: currentVariableBorrowRate } = await rateInstance[
      "calculateInterestRates(address,address,uint256,uint256,uint256,uint256)"
    ](weth.address, uweth.address, 0, 0, 0, strategyWETH.reserveFactor);

    expect(currentLiquidityRate.toString()).to.be.equal("0", "Invalid liquidity rate");
    expect(currentVariableBorrowRate.toString()).to.be.equal(
      rateStrategyStableOne.baseVariableBorrowRate,
      "Invalid variable rate"
    );
  });

  it("Checks rates at 80% utilization rate", async () => {
    if (!UPGRADE) {
      const { 0: currentLiquidityRate, 1: currentVariableBorrowRate } = await rateInstance[
        "calculateInterestRates(address,address,uint256,uint256,uint256,uint256)"
      ](weth.address, uweth.address, "200000000000000000", "0", "800000000000000000", strategyWETH.reserveFactor);

      const expectedVariableRate = new BigNumber(rateStrategyStableOne.baseVariableBorrowRate).plus(
        rateStrategyStableOne.variableRateSlope1
      );

      expect(currentLiquidityRate.toString()).to.be.equal(
        expectedVariableRate
          .times(0.8)
          .percentMul(new BigNumber(PERCENTAGE_FACTOR).minus(strategyWETH.reserveFactor))
          .toFixed(0),
        "Invalid liquidity rate"
      );

      expect(currentVariableBorrowRate.toString()).to.be.equal(
        expectedVariableRate.toFixed(0),
        "Invalid variable rate"
      );
    }
  });

  it("Checks rates at 100% utilization rate", async () => {
    if (!UPGRADE) {
      const { 0: currentLiquidityRate, 1: currentVariableBorrowRate } = await rateInstance[
        "calculateInterestRates(address,address,uint256,uint256,uint256,uint256)"
      ](weth.address, uweth.address, "0", "0", "800000000000000000", strategyWETH.reserveFactor);

      const expectedVariableRate = new BigNumber(rateStrategyStableOne.baseVariableBorrowRate)
        .plus(rateStrategyStableOne.variableRateSlope1)
        .plus(rateStrategyStableOne.variableRateSlope2);

      expect(currentLiquidityRate.toString()).to.be.equal(
        expectedVariableRate.percentMul(new BigNumber(PERCENTAGE_FACTOR).minus(strategyWETH.reserveFactor)).toFixed(0),
        "Invalid liquidity rate"
      );

      expect(currentVariableBorrowRate.toString()).to.be.equal(
        expectedVariableRate.toFixed(0),
        "Invalid variable rate"
      );
    }
  });
  it("Checks onlyPoolAdmin in configInterestRate", async () => {
    const { users } = testEnv;

    await expect(
      rateInstance
        .connect(users[5].signer)
        .configInterestRate(
          new BigNumber(0.8).multipliedBy(oneRay).toFixed(),
          new BigNumber(0.2).multipliedBy(oneRay).toFixed(),
          new BigNumber(0.16).multipliedBy(oneRay).toFixed(),
          new BigNumber(2).multipliedBy(oneRay).toFixed()
        )
    ).to.be.revertedWith("Caller not pool admin");
  });
  it("Checksconfig on interest rates", async () => {
    const {} = testEnv;

    await rateInstance.configInterestRate(
      new BigNumber(0.9).multipliedBy(oneRay).toFixed(),
      new BigNumber(0.03).multipliedBy(oneRay).toFixed(),
      new BigNumber(0.04).multipliedBy(oneRay).toFixed(),
      new BigNumber(0.6).multipliedBy(oneRay).toFixed()
    );

    await expect(await rateInstance.OPTIMAL_UTILIZATION_RATE()).to.be.equal(
      new BigNumber(0.9).multipliedBy(oneRay).toFixed()
    );
    await expect(await rateInstance.baseVariableBorrowRate()).to.be.equal(
      new BigNumber(0.03).multipliedBy(oneRay).toFixed()
    );
    await expect(await rateInstance.variableRateSlope1()).to.be.equal(
      new BigNumber(0.04).multipliedBy(oneRay).toFixed()
    );
    await expect(await rateInstance.variableRateSlope2()).to.be.equal(
      new BigNumber(0.6).multipliedBy(oneRay).toFixed()
    );
  });
});
