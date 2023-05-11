import { task } from "hardhat/config";
import { ConfigNames } from "../../helpers/configuration";
import {
  deployUiPoolDataProvider,
  deployUnlockdProtocolDataProvider,
  deployWalletBalancerProvider,
} from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider } from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";

task("upgrade:deploy-data-provider", "Deploy data provider for full enviroment")
  .addFlag("testUpgrade", "Test upgradeability")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("wallet", "Deploy wallet balancer provider")
  .addFlag("protocol", "Deploy unlockd protocol data provider")
  .addFlag("ui", "Deploy ui data provider")
  .setAction(async ({ testupgrade, wallet, protocol, ui }, DRE) => {
    await DRE.run("set-DRE");

    const addressesProvider = await getLendPoolAddressesProvider();

    // this contract does not support upgrade, just deploy new contract
    const reserveOracle = await addressesProvider.getReserveOracle();

    const nftOracle = await addressesProvider.getNFTOracle();

    if (wallet) {
      const walletBalanceProvider = await deployWalletBalancerProvider(false);
      console.log("WalletBalancerProvider deployed at:", walletBalanceProvider.address);
      await waitForTx(await addressesProvider.setWalletBalanceProvider(walletBalanceProvider.address));
    }

    // this contract is not support upgrade, just deploy new contract
    if (protocol) {
      const unlockdProtocolDataProvider = await deployUnlockdProtocolDataProvider(addressesProvider.address, false);
      console.log("UnlockdProtocolDataProvider deployed at:", unlockdProtocolDataProvider.address);
      await waitForTx(await addressesProvider.setUnlockdDataProvider(unlockdProtocolDataProvider.address));
    }

    // this contract is not support upgrade, just deploy new contract
    if (ui) {
      const uiPoolDataProvider = await deployUiPoolDataProvider(reserveOracle, nftOracle, false);
      console.log("UiPoolDataProvider deployed at:", uiPoolDataProvider.address);
      await waitForTx(await addressesProvider.setUIDataProvider(uiPoolDataProvider.address));
    }
  });
