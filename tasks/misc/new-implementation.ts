import BigNumber from "bignumber.js";
import { BytesLike } from "ethers";
import { task } from "hardhat/config";
import {
  ConfigNames,
  getCryptoPunksMarketAddress,
  getWrappedNativeTokenAddress,
  getWrappedPunkTokenAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import { ADDRESS_ID_PUNK_GATEWAY, ADDRESS_ID_WETH_GATEWAY, oneRay } from "../../helpers/constants";
import {
  deployConfiguratorLibraries,
  deployGenericDebtToken,
  deployInterestRate,
  deployLendPool,
  deployLendPoolConfigurator,
  deployLendPoolLibraries,
  deployLendPoolLoan,
  deployNFTOracle,
  deployPunkGateway,
  deployRepayAndTransferHelper,
  deployReserveOracle,
  deployUiPoolDataProvider,
  deployUnlockdCollector,
  deployUnlockdProtocolDataProvider,
  deployWalletBalancerProvider,
  deployWETHGateway,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { getEthersSignerByAddress, insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("dev:deploy-new-implementation", "Deploy new implementation")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("contract", "Contract name")
  .addFlag("upgrade", "Upgrade contract")
  .setAction(async ({ verify, pool, contract, upgrade }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProviderRaw = await getLendPoolAddressesProvider();
    const providerOwnerSigner = await getEthersSignerByAddress(await addressesProviderRaw.owner());
    const addressesProvider = addressesProviderRaw.connect(providerOwnerSigner);

    if (contract == "LendPool") {
      await deployLendPoolLibraries(verify);

      const lendPoolImpl = await deployLendPool(verify);
      console.log("LendPool implementation address:", lendPoolImpl.address);

      if (upgrade) {
        await waitForTx(await addressesProvider.setLendPoolImpl(lendPoolImpl.address, []));
      }

      await insertContractAddressInDb(eContractid.LendPool, await addressesProvider.getLendPool());
    }

    if (contract == "LendPoolConfigurator") {
      await deployConfiguratorLibraries(verify);

      const lendPoolCfgImpl = await deployLendPoolConfigurator(verify);
      console.log("LendPoolConfigurator implementation address:", lendPoolCfgImpl.address);

      if (upgrade) {
        await waitForTx(await addressesProvider.setLendPoolConfiguratorImpl(lendPoolCfgImpl.address, []));
      }
      await insertContractAddressInDb(
        eContractid.LendPoolConfigurator,
        await addressesProvider.getLendPoolConfigurator()
      );
    }

    if (contract == "LendPoolLoan") {
      const lendPoolLoanImpl = await deployLendPoolLoan(verify);
      console.log("LendPoolLoan implementation address:", lendPoolLoanImpl.address);

      if (upgrade) {
        await waitForTx(await addressesProvider.setLendPoolLoanImpl(lendPoolLoanImpl.address, []));
      }
      await insertContractAddressInDb(eContractid.LendPoolLoan, await addressesProvider.getLendPoolLoan());
    }

    if (contract == "ReserveOracle") {
      const reserveOracleImpl = await deployReserveOracle(verify);
      console.log("ReserveOracle implementation address:", reserveOracleImpl.address);

      const proxyAddress = await addressesProvider.getReserveOracle();
      await insertContractAddressInDb(eContractid.ReserveOracle, proxyAddress);

      if (upgrade) {
        await DRE.run("dev:upgrade-implementation", {
          pool: pool,
          contract,
          proxy: proxyAddress,
          impl: reserveOracleImpl.address,
        });
      }
    }

    if (contract == "NFTOracle") {
      const nftOracleImpl = await deployNFTOracle(verify);
      console.log("NFTOracle implementation address:", nftOracleImpl.address);

      const proxyAddress = await addressesProvider.getNFTOracle();
      await insertContractAddressInDb(eContractid.NFTOracle, proxyAddress);

      if (upgrade) {
        await DRE.run("dev:upgrade-implementation", {
          pool: pool,
          contract,
          proxy: proxyAddress,
          impl: nftOracleImpl.address,
        });
      }
    }

    if (contract == "WETHGateway") {
      const wethAddress = await getWrappedNativeTokenAddress(poolConfig);
      console.log("WETH.address", wethAddress);

      const wethGatewayImpl = await deployWETHGateway(verify);
      console.log("WETHGateway implementation address:", wethGatewayImpl.address);

      const proxyAddress = await addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY);
      await insertContractAddressInDb(eContractid.WETHGateway, proxyAddress);

      if (upgrade) {
        await DRE.run("dev:upgrade-implementation", {
          pool: pool,
          contract,
          proxy: proxyAddress,
          impl: wethGatewayImpl.address,
        });
      }
    }

    if (contract == "PunkGateway") {
      const wethGateWay = await getWETHGateway();
      console.log("WETHGateway.address", wethGateWay.address);

      const punkAddress = await getCryptoPunksMarketAddress(poolConfig);
      console.log("CryptoPunksMarket.address", punkAddress);

      const wpunkAddress = await getWrappedPunkTokenAddress(poolConfig, punkAddress);
      console.log("WPUNKS.address", wpunkAddress);

      const punkGatewayImpl = await deployPunkGateway(verify);
      console.log("PunkGateway implementation address:", punkGatewayImpl.address);

      const proxyAddress = await addressesProvider.getAddress(ADDRESS_ID_PUNK_GATEWAY);
      await insertContractAddressInDb(eContractid.PunkGateway, proxyAddress);

      if (upgrade) {
        await DRE.run("dev:upgrade-implementation", {
          pool: pool,
          contract,
          proxy: proxyAddress,
          impl: punkGatewayImpl.address,
        });
      }
    }

    if (contract == "UnlockdProtocolDataProvider") {
      const contractImpl = await deployUnlockdProtocolDataProvider(addressesProvider.address, verify);
      console.log("UnlockdProtocolDataProvider implementation address:", contractImpl.address);

      if (upgrade) {
        await waitForTx(await addressesProvider.setUnlockdDataProvider(contractImpl.address));
      }
    }

    if (contract == "UiPoolDataProvider") {
      const contractImpl = await deployUiPoolDataProvider(
        await addressesProvider.getReserveOracle(),
        await addressesProvider.getNFTOracle(),
        verify
      );
      console.log("UiPoolDataProvider implementation address:", contractImpl.address);

      if (upgrade) {
        await waitForTx(await addressesProvider.setUIDataProvider(contractImpl.address));
      }
    }

    if (contract == "WalletBalancerProvider") {
      const contractImpl = await deployWalletBalancerProvider(verify);
      console.log("WalletBalancerProvider implementation address:", contractImpl.address);

      if (upgrade) {
        await waitForTx(await addressesProvider.setWalletBalanceProvider(contractImpl.address));
      }
    }

    if (contract == "UnlockdCollector") {
      const contractImpl = await deployUnlockdCollector([], verify);
      console.log("UnlockdCollector implementation address:", contractImpl.address);
    }

    if (contract == "RepayAndTransferHelper") {
      const contractImpl = await deployRepayAndTransferHelper(addressesProvider.address, verify);
      console.log("RepayAndTransferHelper implementation address:", contractImpl.address);
    }
  });

task("dev:deploy-new-interest-rate", "Deploy new interest rate implementation")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProviderRaw = await getLendPoolAddressesProvider();
    const providerOwnerSigner = await getEthersSignerByAddress(await addressesProviderRaw.owner());
    const addressesProvider = addressesProviderRaw.connect(providerOwnerSigner);

    const optimalUtilizationRate = new BigNumber(0.8).multipliedBy(oneRay).toFixed();
    const baseVariableBorrowRate = new BigNumber(0.2).multipliedBy(oneRay).toFixed();
    const variableRateSlope1 = new BigNumber(0.16).multipliedBy(oneRay).toFixed();
    const variableRateSlope2 = new BigNumber(2).multipliedBy(oneRay).toFixed();

    const rateInstance = await deployInterestRate(
      [
        addressesProvider.address,
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
      ],
      verify
    );
    console.log("InterestRate implementation address:", rateInstance.address);
  });

task("dev:upgrade-implementation", "Update implementation to address provider")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam("contract", "Contract name")
  .addParam("proxy", "Contract proxy address")
  .addParam("impl", "Contract implementation address")
  .setAction(async ({ pool, contract, proxy, impl }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);

    const unlockdProxy = await getUnlockdUpgradeableProxy(proxy);

    const proxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminPool);
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(proxyAdminOwnerAddress);
    console.log("ProxyAdmin:", proxyAdmin.address, "Owner:", proxyAdminOwnerAddress);

    // only proxy admin can do upgrading
    await waitForTx(await proxyAdmin.connect(proxyAdminOwnerSigner).upgrade(unlockdProxy.address, impl));

    await insertContractAddressInDb(eContractid[contract], proxy);
  });

task("dev:upgrade-all-debtokens", "Update implementation to debt token")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam("pool", `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProviderRaw = await getLendPoolAddressesProvider();
    const poolAdminAddress = await addressesProviderRaw.getPoolAdmin();
    const poolAdminSigner = await getEthersSignerByAddress(poolAdminAddress);
    console.log(addressesProviderRaw.address, poolAdminAddress);

    const lendPoolConfigurator = await getLendPoolConfiguratorProxy(
      await addressesProviderRaw.getLendPoolConfigurator()
    );
    const protocolDataProvider = await getUnlockdProtocolDataProvider(
      await addressesProviderRaw.getUnlockdDataProvider()
    );

    const debtTokenImpl = await deployGenericDebtToken(verify);
    console.log("DebtToken implementation:", debtTokenImpl.address);

    const inputs: {
      asset: string;
      implementation: string;
      encodedCallData: BytesLike;
    }[] = [];

    const allReserves = await protocolDataProvider.getAllReservesTokenDatas();
    for (const reserve of allReserves) {
      console.log("Reserve Tokens:", reserve.tokenSymbol, reserve.tokenAddress, reserve.debtTokenAddress);
      const input: {
        asset: string;
        implementation: string;
        encodedCallData: BytesLike;
      } = {
        asset: reserve.tokenAddress,
        implementation: debtTokenImpl.address,
        encodedCallData: [],
      };
      inputs.push(input);
    }

    await waitForTx(await lendPoolConfigurator.connect(poolAdminSigner).updateDebtToken(inputs));
  });