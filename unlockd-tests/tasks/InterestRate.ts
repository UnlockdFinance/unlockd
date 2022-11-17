import { task } from "hardhat/config";
import { getOwnerWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

task("tests:interestRate:variableRateSlope1", "User gets variableRateSlope1 rate").setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.INTERESTRATE.variableRateSlope1(wallet);
  await tx.wait();
  console.log(tx);
});

task("tests:interestRate:variableRateSlope2", "User gets variableRateSlope2 rate").setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.INTERESTRATE.variableRateSlope2(wallet);
  await tx.wait();
  console.log(tx);
});

task("tests:interestRate:baseVariableBorrowRate", "User gets baseVariableBorrowRate rate").setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.INTERESTRATE.baseVariableBorrowRate(wallet);
  await tx.wait();
  console.log(tx);
});
