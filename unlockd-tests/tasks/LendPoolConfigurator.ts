import { task } from "hardhat/config";
import { getMnemonicEmergencyWallet, getOwnerWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

/**
 * This file will use the LendPoolConfigurator
 * for full reference check the ILendPoolConfigurator.sol
 */
task("configurator:setTimeframe", "Set the config fee for the User to pay when TriggerUser is called")
  .addParam("newtimeframe", "Set the configFee")
  .setAction(async ({ newtimeframe }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setTimeframe(wallet, newtimeframe);
    console.log(tx);
  });

task("configurator:setConfigFee", "Set the config fee for the User to pay when TriggerUser is called")
  .addParam("configfee", "Set the configFee")
  .setAction(async ({ configfee }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setConfigFee(wallet, configfee);
    console.log(tx);
  });

task("configurator:setAllowToSellNFTX", "Enables or disables borrowing on each reserve")
  .addParam("nftaddress", "NFT address")
  .addParam("val", "A boolean, true to enable ; false to disable")
  .setAction(async ({ nftaddress, val }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setAllowToSellNFTX(wallet, nftaddress, val);
    console.log(tx);
  });

task("configurator:setBorrowingFlagOnReserve", "Enables or disables borrowing on each reserve")
  .addParam("asset", "Reserve addresses")
  .addParam("flag", "A boolean, true to enable ; false to disable")
  .setAction(async ({ asset, flag }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setBorrowingFlagOnReserve(wallet, asset, flag);
    console.log(tx);
  });

task("configurator:setActiveFlagOnReserve", "Activates or deactivates each reserve")
  .addParam("asset", "Reserve addresse")
  .addParam("flag", "A boolean, true for Active; false for not active")
  .setAction(async ({ asset, flag }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setActiveFlagOnReserve(wallet, asset, flag);
    console.log(tx);
  });

task("configurator:setFreezeFlagOnReserve", "Freezes or unfreezes each reserve")
  .addParam("asset", "Reserve address")
  .addParam("flag", "A boolean, true for freeze; false for unfreeze")
  .setAction(async ({ asset, flag }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setFreezeFlagOnReserve(wallet, asset, flag);
    console.log(tx);
  });

task("configurator:setReserveFactor", "Updates the reserve factor of a reserve")
  .addParam("asset", "Reserve address")
  .addParam("factor", "The new reserve factor of the reserve")
  .setAction(async ({ asset, factor }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setReserveFactor(wallet, asset, factor);
    console.log(tx);
  });

task("configurator:setReserveInterestRateAddress", "Sets the interest rate strategy of a reserve")
  .addParam("assets", "Reserve address")
  .addParam("rateaddress", "the new address of the interest strategy contract")
  .setAction(async ({ assets, rateaddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setReserveInterestRateAddress(wallet, [assets], rateaddress);
    console.log(tx);
  });

task("configurator:setActiveFlagOnNft", "Activates or Deactivates the reserves")
  .addParam("nftaddress", "NFT address")
  .addParam("flag", "A boolean, True for Active; False for not active")
  .setAction(async ({ nftaddress, flag }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setActiveFlagOnNft(wallet, nftaddress, flag);
    console.log(tx);
  });

task("configurator:setFreezeFlagOnNft", "Freezes or unfreezes each NFT")
  .addParam("nftaddress", "NFT address")
  .addParam("flag", "A boolean, true for freeze; false for unfreeze")
  .setAction(async ({ nftaddress, flag }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setFreezeFlagOnNft(wallet, [nftaddress], flag);
    console.log(tx);
  });

task(
  "configurator:configureNftAsCollateral",
  "configure the ltv, liquidationThreshold, liquidationBonus for a reserve asset."
)
  .addParam("nftaddress", "the address of the underlying NFT address")
  .addParam("tokenid", "the tokenId of the underlying NFT address")
  .addParam("newprice", "The actual price of the NFT")
  .addParam("ltv", "The loan to value of the asset when used as NFT")
  .addParam(
    "threshold",
    "The threshold at which loans using this asset as collateral will be considered undercollateralized"
  )
  .addParam(
    "bonus",
    "The bonus liquidators receive to liquidate this asset. The values is always below 100%. A value of 5% means the liquidator will receive a 5% bonus"
  )
  .addParam("redeemduration", "the address of the underlying NFT address")
  .addParam("auctionduration", "the tokenId of the underlying NFT address")
  .addParam("redeemfine", "The loan to value of the asset when used as NFT")
  .addParam("active", "if the nft asset is active or not (BOOL true or false)")
  .addParam("freeze", "if the nft asset is frozen or not (BOOL true or false)")
  .setAction(
    async ({
      nftaddress,
      tokenid,
      newprice,
      ltv,
      threshold,
      bonus,
      redeemduration,
      auctionduration,
      redeemfine,
      active,
      freeze,
    }) => {
      const wallet = await getOwnerWallet();
      const tx = await Functions.LENDPOOLCONFIGURATOR.configureNftAsCollateral(
        wallet,
        nftaddress,
        tokenid,
        newprice,
        ltv,
        threshold,
        bonus,
        redeemduration,
        auctionduration,
        redeemfine,
        active,
        freeze
      );

      console.log("nft configured: ", tx);
    }
  );

task("configurator:configureNftAsAuction", "Configures the NFT auction parameters")
  .addParam("nftaddress", "The address of the underlying NFT address")
  .addParam("tokenid", "The tokenId of the underlying asset")
  .addParam("redeemduration", "The max duration for the redeem")
  .addParam("auctionduration", "The auction duration")
  .addParam("redeemfine", "The fine for the redeem")
  .setAction(async ({ nftaddress, tokenid, redeemduration, auctionduration, redeemfine }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.configureNftAsAuction(
      wallet,
      nftaddress,
      tokenid,
      redeemduration,
      auctionduration,
      redeemfine
    );

    console.log(tx);
  });

task("configurator:setNftRedeemThreshold", "Activates or Deactivates the reserves")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "NFT tokenid")
  .addParam("redeemthreshold", "The threshold for the redeem")
  .setAction(async ({ nftaddress, tokenid, redeemthreshold }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setNftRedeemThreshold(wallet, nftaddress, tokenid, redeemthreshold);
    console.log(tx);
  });

task("configurator:setNftMinBidFine", "Freezes or unfreezes each NFT")
  .addParam("nftaddress", "NFT address")
  .addParam("minbidfine", "The minimum bid fine value")
  .setAction(async ({ nftaddress, minbidfine }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setNftMinBidFine(wallet, [nftaddress], minbidfine);
    console.log(tx);
  });

task("configurator:setNftMaxSupplyAndTokenId", "Configures the NFT auction parameters")
  .addParam("nftaddress", "he address of the underlying NFT address")
  .addParam("maxsupply", "The max duration for the redeem")
  .addParam("maxtokenId", "The auction duration")
  .setAction(async ({ nftaddress, maxsupply, maxtokenId }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setNftMaxSupplyAndTokenId(
      wallet,
      [nftaddress],
      maxsupply,
      maxtokenId
    );

    console.log(tx);
  });

task("configurator:setMaxNumberOfReserves", "sets the max amount of reserves | 32 as limit")
  .addParam("newval", "the new value to set as the max reserves")
  .setAction(async ({ newval }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setMaxNumberOfReserves(wallet, newval);
    console.log(tx);
  });

task("configurator:setMaxNumberOfNfts", "sets the max amount of NFTs | 256 as limit")
  .addParam("newval", "the new value to set as the max NFTs")
  .setAction(async ({ newval }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setMaxNumberOfNfts(wallet, newval);
    console.log(tx);
  });

task("configurator:setLiquidationFeePercentage", "sets the liquidation fee percentage")
  .addParam("newval", "the new value to set as the max fee percentage")
  .setAction(async ({ newval }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setLiquidationFeePercentage(wallet, newval);
    console.log(tx);
  });

task("configurator:setPoolPause", "pauses or unpauses all the actions of the protocol, including uToken transfers")
  .addFlag("val", "true if protocol needs to be paused, false otherwise")
  .setAction(async ({ val }) => {
    const wallet = await getMnemonicEmergencyWallet();
    const tx = await Functions.LENDPOOLCONFIGURATOR.setPoolPause(wallet, val);
    console.log(tx);
  });

task("configurator:setLtvManagerStatus", "adds an address as LTV Manager")
  .addParam("newltvmanager", "the address to add as LTV Manager")
  .addParam("val", "true as ltvManager")
  .setAction(async ({ newltvmanager, val }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.setLtvManagerStatus(wallet, newltvmanager, val);
    console.log(tx);
  });

task(
  "configurator:getTokenImplementation",
  "pauses or unpauses all the actions of the protocol, including uToken transfers"
)
  .addParam("proxyaddress", "true if protocol needs to be paused, false otherwise")
  .setAction(async ({ proxyaddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLCONFIGURATOR.getTokenImplementation(wallet, proxyaddress);
    console.log(tx);
  });
