import { task } from "hardhat/config";
import { ConfigNames, getWrappedNativeTokenAddress, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_WETH, ADDRESS_ID_WETH_GATEWAY } from "../../helpers/constants";
import { deployUnlockdUpgradeableProxy, deployWETHGateway } from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";
import { UnlockdUpgradeableProxy, WETHGateway } from "../../types";

task(`full:deploy-weth-gateway`, `Deploys the WETHGateway contract`)
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("verify", `Verify contract via Etherscan API.`)
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");

    if (!DRE.network.config.chainId) {
      throw new Error("INVALID_CHAIN_ID");
    }

    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    console.log(proxyAdmin.address);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    console.log(proxyAdminOwnerAddress);
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);

    const weth = await getWrappedNativeTokenAddress(poolConfig);

    const wethGatewayImpl = await deployWETHGateway(verify);

    const initEncodedData = wethGatewayImpl.interface.encodeFunctionData("initialize", [
      addressesProvider.address,
      weth,
    ]);
    //const initEncodedData = "0x";

    let wethGateWay: WETHGateway;
    let wethGatewayProxy: UnlockdUpgradeableProxy;

    const wethGatewayAddress = undefined;
    //const wethGatewayAddress = await addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY);

    if (wethGatewayAddress != undefined && notFalsyOrZeroAddress(wethGatewayAddress)) {
      console.log("Upgrading exist WETHGateway proxy to new implementation...");

      await insertContractAddressInDb(eContractid.WETHGateway, wethGatewayAddress);
      wethGatewayProxy = await getUnlockdUpgradeableProxy(wethGatewayAddress);

      // only proxy admin can do upgrading
      await waitForTx(
        await proxyAdmin.connect(proxyAdminOwnerSigner).upgrade(wethGatewayProxy.address, wethGatewayImpl.address)
      );

      wethGateWay = await getWETHGateway(wethGatewayProxy.address);
    } else {
      const wethGatewayProxy = await deployUnlockdUpgradeableProxy(
        eContractid.WETHGateway,
        proxyAdmin.address,
        wethGatewayImpl.address,
        initEncodedData,
        verify
      );

      wethGateWay = await getWETHGateway(wethGatewayProxy.address);
    }
    await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_WETH_GATEWAY, wethGateWay.address));
    await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_WETH, weth));
  });

task("full:wethgateway-authorize-caller-whitelist", "Initialize gateway configuration.")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("caller", "Address of whitelist")
  .addParam("flag", "Flag of whitelist, 0-1")
  .setAction(async ({ pool, caller, flag }, localBRE) => {
    await localBRE.run("set-DRE");
    const network = <eNetwork>localBRE.network.name;
    const poolConfig = loadPoolConfig(pool);

    const wethGateway = await getWETHGateway();

    console.log("WETHGateway:", wethGateway.address);
    await waitForTx(await wethGateway.authorizeCallerWhitelist([caller], flag));
  });
