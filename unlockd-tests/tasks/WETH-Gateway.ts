import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet, getUserWallet, getWalletByNumber } from "../helpers/config";
import { Contracts, MockContracts } from "../helpers/constants";
import { INFTXVaultFactory } from "../../types/INFTXVaultFactory";

task("wethgateway:depositETH", "Deposits raw ETH")
  .addParam("amount", "The amount in WEI")
  .addParam("to", "The on behalf of")
  .addParam("walletnumber", "The wallet in the env file")
  .setAction(async ({ amount, to, walletnumber }) => {
    const wallet = await getWalletByNumber(walletnumber);
    //amount must be in WEI!!
    const utokenContract = MockContracts["uWETH"];
    await Functions.RESERVES.approve(
      wallet,
      utokenContract,
      Contracts.wethGateway.address,
      "99999999999999999999999999999999999999"
    );
    console.log("approved utoken");
    await Functions.WETH_GATEWAY.depositETH(wallet, amount, to);
  });

task("wethgateway:withdrawETH", "Withdraws raw ETH")
  .addParam("amount", "The amount in WEI")
  .addParam("to", "The on behalf of")
  .addParam("walletnumber", "The wallet in the env file")
  .setAction(async ({ amount, to, walletnumber }) => {
    const wallet = await getWalletByNumber(walletnumber);
    const tokenContract = MockContracts["uWETH"];

    console.log(wallet.address);
    //amount must be in WEI!!
    await Functions.WETH_GATEWAY.withdrawETH(wallet, amount, to);
  });
