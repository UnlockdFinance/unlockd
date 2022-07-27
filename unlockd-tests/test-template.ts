import { Functions } from "./helpers/protocolFunctions";
import { getUserWallet } from "./helpers/config";
import { MockContracts, Contracts } from "./helpers/constants";
import { parseUnits } from "@ethersproject/units";
const testFunction = async () => {
  const wallet = await getUserWallet();
  await Functions.LENDPOOL.deposit(
    wallet,
    MockContracts.DAI.address,
    parseUnits("1.0"),
    "0x1a470e9916f3dFF8E268A69A39fa2E9F7B954927"
  );
};
testFunction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
