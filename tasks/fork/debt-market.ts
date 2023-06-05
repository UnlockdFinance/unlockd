import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_DEBT_MARKET } from "../../helpers/constants";
import { deployDebtMarket } from "../../helpers/contracts-deployments";
import { getDebtMarketProxy, getLendPoolAddressesProvider } from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("fork:deploy-debt-market", "Deploy the debt market contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");

    console.log("Deploying new Debt Market implementation...");
    const debtMarketImpl = await deployDebtMarket(verify);

    const addressesProvider = await getLendPoolAddressesProvider();
    const lendPool = await addressesProvider.getLendPool();

    console.log("Setting Debt Market implementation with address:", debtMarketImpl.address);
    await waitForTx(await addressesProvider.setAddressAsProxy(ADDRESS_ID_DEBT_MARKET, debtMarketImpl.address, []));

    const proxy = await getDebtMarketProxy(await addressesProvider.getAddress(ADDRESS_ID_DEBT_MARKET));
    await insertContractAddressInDb(eContractid.DebtMarket, proxy.address);

    await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_DEBT_MARKET, proxy.address));

    console.log("Adding LendPool as authorized address for Debt Market...");
    await waitForTx(await proxy.setAuthorizedAddress(lendPool, true));
  });
