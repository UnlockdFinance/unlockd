import { BytesLike } from "@ethersproject/bytes";
import { expect } from "chai";
import { getDebtToken, getDeploySigner, getLendPoolLoanProxy } from "../helpers/contracts-getters";
import { ProtocolErrors } from "../helpers/types";
import { DebtToken, DebtTokenFactory, LendPoolLoan, LendPoolLoanFactory, UToken, UTokenFactory } from "../types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("Upgradeability", (testEnv: TestEnv) => {
  const { CALLER_NOT_POOL_ADMIN } = ProtocolErrors;
  let debtWeth: DebtToken;
  let newUTokenInstance: UToken;
  let newDebtTokenInstance: DebtToken;
  let newLoanInstance: LendPoolLoan;

  before("deploying instances", async () => {
    const allReserveTokens = await testEnv.dataProvider.getAllReservesTokenDatas();
    const debtWethAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "WETH")?.debtTokenAddress;
    debtWeth = await getDebtToken(debtWethAddress);

    newUTokenInstance = await new UTokenFactory(await getDeploySigner()).deploy();
    newDebtTokenInstance = await new DebtTokenFactory(await getDeploySigner()).deploy();

    newLoanInstance = await new LendPoolLoanFactory(await getDeploySigner()).deploy();
  });

  it("Tries to update the WETH UToken implementation with a different address than the configuator", async () => {
    const { weth, configurator, users, mockIncentivesController } = testEnv;

    const updateUTokenInputParams: {
      asset: string;
      implementation: string;
      encodedCallData: BytesLike;
    }[] = [
      {
        asset: weth.address,
        implementation: newUTokenInstance.address,
        encodedCallData: [],
      },
    ];
    await expect(configurator.connect(users[1].signer).updateUToken(updateUTokenInputParams)).to.be.revertedWith(
      CALLER_NOT_POOL_ADMIN
    );
  });

  it("Upgrades the WETH UToken implementation ", async () => {
    const { weth, configurator, dataProvider } = testEnv;

    const { uTokenAddress } = await dataProvider.getReserveTokenData(weth.address);

    const updateUTokenInputParams: {
      asset: string;
      implementation: string;
      encodedCallData: BytesLike;
    }[] = [
      {
        asset: weth.address,
        implementation: newUTokenInstance.address,
        encodedCallData: [],
      },
    ];
    await configurator.updateUToken(updateUTokenInputParams);

    const checkImpl = await configurator.getTokenImplementation(uTokenAddress);
    expect(checkImpl).to.be.eq(newUTokenInstance.address, "Invalid token implementation");
  });

  it("Tries to update the weth DebtToken implementation with a different address than the configuator", async () => {
    const { weth, configurator, users } = testEnv;

    const updateDebtTokenInputParams: {
      asset: string;
      implementation: string;
      encodedCallData: BytesLike;
    }[] = [
      {
        asset: weth.address,
        implementation: newUTokenInstance.address,
        encodedCallData: [],
      },
    ];
    await expect(configurator.connect(users[1].signer).updateDebtToken(updateDebtTokenInputParams)).to.be.revertedWith(
      CALLER_NOT_POOL_ADMIN
    );
  });

  it("Upgrades the weth DebtToken implementation ", async () => {
    const { weth, configurator, dataProvider } = testEnv;

    const { debtTokenAddress } = await dataProvider.getReserveTokenData(weth.address);

    const updateDebtTokenInputParams: {
      asset: string;
      implementation: string;
      encodedCallData: BytesLike;
    }[] = [
      {
        asset: weth.address,
        implementation: newDebtTokenInstance.address,
        encodedCallData: [],
      },
    ];
    await configurator.updateDebtToken(updateDebtTokenInputParams);

    const checkImpl = await configurator.getTokenImplementation(debtTokenAddress);
    expect(checkImpl).to.be.eq(newDebtTokenInstance.address, "Invalid token implementation");
  });

  it("Tries to update the LendPoolLoan implementation with a different address than the address provider", async () => {
    const { addressesProvider, users } = testEnv;

    await expect(
      addressesProvider.connect(users[1].signer).setLendPoolLoanImpl(newLoanInstance.address, [])
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Upgrades the LendPoolLoan implementation ", async () => {
    const { addressesProvider } = testEnv;

    const loanProxyAddressBefore = await addressesProvider.getLendPoolLoan();
    const loanProxyBefore = await getLendPoolLoanProxy(loanProxyAddressBefore);

    await addressesProvider.setLendPoolLoanImpl(newLoanInstance.address, []);

    const loanProxyAddressAfter = await addressesProvider.getLendPoolLoan();
    const loanProxyAfter = await getLendPoolLoanProxy(loanProxyAddressAfter);

    const checkImpl = await addressesProvider.getImplementation(loanProxyAddressBefore);

    expect(loanProxyAddressAfter).to.be.eq(loanProxyAddressBefore, "Invalid addresses provider");
    expect(checkImpl).to.be.eq(newLoanInstance.address, "Invalid loan implementation");
  });
});
