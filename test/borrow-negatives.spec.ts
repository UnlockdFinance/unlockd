import { TestEnv, makeSuite } from "./helpers/make-suite";
import {
  mintERC20,
  mintERC721,
  approveERC20,
  approveERC721,
  setApprovalForAll,
  deposit,
  borrow,
  withdraw,
  repay,
} from "./helpers/actions";
import { configuration as actionsConfiguration } from "./helpers/actions";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { UnlockdPools, iUnlockdPoolAssets, IReserveParams, ProtocolErrors } from "../helpers/types";
import { increaseTime, timeLatest, waitForTx } from "../helpers/misc-utils";

const { VL_TIMEFRAME_EXCEEDED } = ProtocolErrors;
const { expect } = require("chai");

makeSuite("LendPool: Borrow negative test cases", (testEnv: TestEnv) => {
  let cachedTokenId;

  before("Initializing configuration", async () => {
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <iUnlockdPoolAssets<IReserveParams>>(
      getReservesConfigByPool(UnlockdPools.proto)
    );
  });
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("Users 0 Deposits 100 WETH and user 1 tries to borrow 0 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await mintERC20(testEnv, user0, "WETH", "1000");

    await approveERC20(testEnv, user0, "WETH");

    await deposit(testEnv, user0, "", "WETH", "1000", user0.address, "success", "");

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await mintERC721(testEnv, user1, "BAYC", tokenId);

    await setApprovalForAll(testEnv, user1, "BAYC");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, 8000, 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(
      testEnv,
      user1,
      "WETH",
      "0",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "revert",
      "Amount to borrow needs to be > 0"
    );

    cachedTokenId = tokenId;
  });

  it("User 1 tries to uses NFT as collateral to borrow 100 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user2 = users[2];

    expect(cachedTokenId, "previous test case is faild").to.not.be.undefined;
    const tokenId = cachedTokenId.toString();

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, 8000, 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(testEnv, user2, "WETH", "100", "BAYC", tokenId, user2.address, "", "revert", "NFT needs exist");
  });

  it("User 2 tries to uses user 1 owned NFT as collateral to borrow 10 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user2 = users[2];

    expect(cachedTokenId, "previous test case is faild").to.not.be.undefined;
    const tokenId = cachedTokenId.toString();

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, 8000, 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(testEnv, user2, "WETH", "10", "BAYC", tokenId, user2.address, "", "revert", "NFT needs exist");
  });

  it("User 2 tries to uses non-existent NFT as collateral to borrow 10 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user2 = users[2];

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, 8000, 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(testEnv, user2, "WETH", "10", "BAYC", tokenId, user2.address, "", "revert", "NFT needs exist");
  });

  it("Tries to uses NFT which id exceed max limit as collateral to borrow 10 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user1 = users[1];

    const tokenId = "100001";

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, 8000, 4000, 7000, 100, 1, 2, 25, true, false);

    await borrow(
      testEnv,
      user1,
      "WETH",
      "10",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "revert",
      "NFT token id exceed max limit"
    );
  });

  it("Users 0 Deposits 100 WETH and user 1 tries to borrow but the timestamp exceeds", async () => {
    const { users, pool, bayc, weth, deployer, configurator, nftOracle, dataProvider } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await mintERC20(testEnv, user0, "WETH", "1000");

    await approveERC20(testEnv, user0, "WETH");

    await deposit(testEnv, user0, "", "WETH", "1000", user0.address, "success", "");

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await mintERC721(testEnv, user1, "BAYC", tokenId);

    await setApprovalForAll(testEnv, user1, "BAYC");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    await configurator
      .connect(deployer.signer)
      .configureNftAsCollateral(bayc.address, tokenId, 8000, 4000, 7000, 100, 1, 2, 25, true, false);

    await increaseTime(7200);

    //await configurator.setTimeframe(0);

    const nftTokenIdCfgData = await dataProvider.getNftConfigurationDataByTokenId(bayc.address, "101");
    nftTokenIdCfgData.configTimestamp.sub(1810).toNumber();

    //const timestampIncreased = await timeLatest();

    await expect(
      pool.connect(users[1].signer).borrow(weth.address, "10", bayc.address, tokenId, user1.address, "0")
    ).to.be.revertedWith(VL_TIMEFRAME_EXCEEDED);
  });
});
