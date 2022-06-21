import { TestEnv, makeSuite } from "./helpers/make-suite";

const { expect } = require("chai");
import { ethers } from "hardhat";
import { MockNFTOracle, NFTOracle } from "../types";

/*
  >> I've had to comment all the old tests out as they
     were using the old contract functions and thus 
     giving errors all the time.
*/

makeSuite("NFTOracle: General functioning", (testEnv: TestEnv) => {
  before(async () => {});

  it("Set Admin correctly", async () => {
    const { mockNftOracle, users } = testEnv;
    const admin = await mockNftOracle.priceFeedAdmin();
    await mockNftOracle.setPriceFeedAdmin(users[0].address);
    expect(await mockNftOracle.priceFeedAdmin()).eq(users[0].address);
    await mockNftOracle.setPriceFeedAdmin(admin);
    expect(await mockNftOracle.priceFeedAdmin()).eq(admin);
  });

  it("Should set and get the mocknft price at 1000", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);
  });

  it("Add Multi Assets", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;

    await mockNftOracle.addCollection(collection1);
    await mockNftOracle.addCollection(collection2);

    await mockNftOracle.setMultipleNFTPrices([collection1, collection2], [1, 1], [100, 200]);

    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(100);
    expect(await mockNftOracle.getNFTPrice(collection2, 1)).to.be.eq(200);
  });
});

/// REVERT TEST:

makeSuite("NFTOracle: Reverting Errors", (testEnv: TestEnv) => {
  before(async () => {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
  });

  it("Should be reverted as NFTOracle is already initialized", async () => {
    const { mockNftOracle, users } = testEnv;
    const admin = await mockNftOracle.priceFeedAdmin();
    await expect(mockNftOracle.initialize(admin)).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should be reverted as price is 0", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;

    //await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    await expect(mockNftOracle.getNFTPrice(collectionMock, 2)).to.be.reverted; // With("PriceIsZero()")
  });

  it("Should be reverted as the collection has been deleted", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);

    await mockNftOracle.removeCollection(collectionMock);
    await expect(mockNftOracle.getNFTPrice(collectionMock, 1)).to.be.reverted; //With(`NonExistingCollection("${collectionMock}")`)
  });

  it("Should be reverted as contract is paused", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);

    await mockNftOracle.setPause(collectionMock, true);
    await expect(mockNftOracle.setNFTPrice(collectionMock, 1, 1000)).to.be.reverted; // With("NFTPaused()")
  });
});

/// TEST PAUSE: ///

makeSuite("NFTOracle: Test Pause", (testEnv: TestEnv) => {
  before(async () => {});

  it("test pause", async () => {
    const { mockNftOracle, users } = testEnv;
    await mockNftOracle.addCollection(users[0].address);
    await mockNftOracle.addCollection(users[1].address);
    await mockNftOracle.addCollection(users[2].address);
    await mockNftOracle.setNFTPrice(users[0].address, 1, 400);

    await mockNftOracle.setPause(users[0].address, true);

    await expect(mockNftOracle.setNFTPrice(users[0].address, 1, 410)).to.be.reverted; //With("NFTPaused()")

    await mockNftOracle.setNFTPrice(users[2].address, 1, 400);
    await mockNftOracle.setPause(users[0].address, false);
    await mockNftOracle.setNFTPrice(users[1].address, 1, 410);
  });
});

// OLD TESTS:

// makeSuite("NFTOracle", (testEnv: TestEnv) => {
//   before(async () => {});

//   it("NFTOracle: GetAssetPrice After Remove The Asset", async () => {
//     const { mockNftOracle, users } = testEnv;
//     await mockNftOracle.addCollection(users[0].address);
//     const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//     await mockNftOracle.setAssetData(users[0].address, 400);
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(30));
//     await mockNftOracle.setAssetData(users[0].address, 410);
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(45));
//     await mockNftOracle.setAssetData(users[0].address, 420);

//     await mockNftOracle.removeCollection(users[0].address);
//     await expect(mockNftOracle.getAssetPrice(users[0].address)).to.be.revertedWith("key not existed");
//     await expect(mockNftOracle.getLatestTimestamp(users[0].address)).to.be.revertedWith("key not existed");
//   });

//   it("NFTOracle: Round Id Can Be The Same", async () => {
//     const { mockNftOracle, users } = testEnv;
//     const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//     await mockNftOracle.addCollection(users[0].address);
//     await mockNftOracle.setAssetData(users[0].address, 400);
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(30));
//     await mockNftOracle.setAssetData(users[0].address, 400);
//     //await expectEvent.inTransaction(r.tx, nftOracleInstance, "SetAssetData")
//     await mockNftOracle.removeCollection(users[0].address);
//   });

//   it("NFTOracle: force error, get data with no price feed data", async () => {
//     const { mockNftOracle, users } = testEnv;
//     await mockNftOracle.addCollection(users[0].address);

//     expect(await mockNftOracle.getPriceFeedLength(users[0].address)).to.equal("0");
//     expect(await mockNftOracle.getLatestTimestamp(users[0].address)).to.equal("0");
//     await expect(mockNftOracle.getAssetPrice(users[0].address)).to.be.revertedWith("no price data");
//     await expect(mockNftOracle.getPreviousPrice(users[0].address, 0)).to.be.revertedWith("Not enough history");
//     await expect(mockNftOracle.getPreviousTimestamp(users[0].address, 0)).to.be.revertedWith("Not enough history");
//     await mockNftOracle.removeCollection(users[0].address);
//   });

//   it("NFTOracle: force error, asset should be set first", async () => {
//     // await expectRevert(
//     //     nftOracleInstance.setAssetData(addr1.address, 400, 1444004415, 100),
//     //     "key not existed",
//     // )
//     const { mockNftOracle, users } = testEnv;
//     const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//     await expect(mockNftOracle.setAssetData(users[0].address, 400)).to.be.revertedWith("key not existed");
//     await mockNftOracle.mock_setBlockTimestamp(currentTime);
//   });

//   it("NFTOracle: force error, timestamp should be larger", async () => {
//     const { mockNftOracle, users } = testEnv;
//     const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//     await mockNftOracle.addCollection(users[0].address);
//     await mockNftOracle.setAssetData(users[0].address, 400);
//     // await expectRevert(
//     //     await nftOracleInstance.setAssetData(addr1.address, 400, 1444004400, 100),
//     //     "incorrect timestamp",
//     // )
//     await expect(mockNftOracle.setAssetData(users[0].address, 400)).to.be.revertedWith("incorrect timestamp");
//     await mockNftOracle.removeCollection(users[0].address);
//     await mockNftOracle.mock_setBlockTimestamp(currentTime);
//   });

//   it("NFTOracle: force error, timestamp can't be the same", async () => {
//     const { mockNftOracle, users } = testEnv;
//     await mockNftOracle.addCollection(users[0].address);
//     const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//     await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//     await mockNftOracle.setAssetData(users[0].address, 400);
//     // await expectRevert(
//     //     await nftOracleInstance.setAssetData(addr1.address, 400, 1444004415, 101),
//     //     "incorrect timestamp",
//     // )
//     await expect(mockNftOracle.setAssetData(users[0].address, 400)).to.be.revertedWith("incorrect timestamp");
//     await mockNftOracle.removeCollection(users[0].address);
//     await mockNftOracle.mock_setBlockTimestamp(currentTime);
//   });

//   makeSuite("NFTOracle-TWAP", () => {
//     let basestamp;
//     before(async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.addCollection(users[0].address);
//       const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//       basestamp = currentTime;
//       await mockNftOracle.setTwapInterval(45);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//       await mockNftOracle.setAssetData(users[0].address, 4000000000000000);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(30));
//       await mockNftOracle.setAssetData(users[0].address, 4050000000000000);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(45));
//       await mockNftOracle.setAssetData(users[0].address, 4100000000000000);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(60));
//     });
//     after(async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.removeCollection(users[0].address);
//       await mockNftOracle.mock_setBlockTimestamp(basestamp);
//     });
//     it("twap price", async () => {
//       const { mockNftOracle, users } = testEnv;
//       // (15*4050000000000000+15*4000000000000000)/45 = 4025000000000000
//       const price = await mockNftOracle.getAssetPrice(users[0].address);
//       expect(price).to.equal("4025000000000000");
//       await mockNftOracle.setAssetData(users[0].address, 4100000000000000);
//       const price1 = await mockNftOracle.getAssetPrice(users[0].address);
//       // (15*4100000000000000+15*4050000000000000+15*4000000000000000)/45 = 4025000000000000
//       expect(price1).to.equal("4050000000000000");
//     });

//     it("asking interval more than asset has", async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.setTwapInterval(46);
//       // (15*4100000000000000+15*4050000000000000+15*4000000000000000)/45 = 405
//       const price = await mockNftOracle.getAssetPrice(users[0].address);
//       expect(price).to.equal("4050000000000000");
//     });

//     it("asking interval less than asset has", async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.removeCollection(users[0].address);
//       await mockNftOracle.setTwapInterval(44);
//       await mockNftOracle.addCollection(users[0].address);
//       const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//       basestamp = currentTime;
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//       await mockNftOracle.setAssetData(users[0].address, 4000000000000000);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(30));
//       await mockNftOracle.setAssetData(users[0].address, 4050000000000000);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(45));
//       await mockNftOracle.setAssetData(users[0].address, 4100000000000000);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(60));
//       await mockNftOracle.setAssetData(users[0].address, 4100000000000000);
//       // (15*4100000000000000+15*4050000000000000+14*4000000000000000)/44 = 4051136363636363
//       const price = await mockNftOracle.getAssetPrice(users[0].address);
//       expect(price).to.equal("4051136363636363");
//       await mockNftOracle.removeCollection(users[0].address);
//     });

//   makeSuite("NFTOracle: getPreviousPrice/getPreviousTimestamp", () => {
//     let baseTimestamp;
//     before(async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.addCollection(users[0].address);
//       const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//       baseTimestamp = currentTime;
//       await mockNftOracle.setAssetData(users[0].address, 400);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//       await mockNftOracle.setAssetData(users[0].address, 410);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(30));
//       await mockNftOracle.setAssetData(users[0].address, 420);
//     });
//     after(async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.removeCollection(users[0].address);
//     });

//     it("get previous price (latest)", async () => {
//       const { mockNftOracle, users } = testEnv;
//       const price = await mockNftOracle.getPreviousPrice(users[0].address, 0);
//       expect(price).to.equal("420");
//       const timestamp = await mockNftOracle.getPreviousTimestamp(users[0].address, 0);
//       expect(timestamp).to.equal(baseTimestamp.add(30)).toString();

//       const price1 = await mockNftOracle.getPreviousPrice(users[0].address, 1);
//       expect(price1).to.equal("410");
//       const timestamp1 = await mockNftOracle.getPreviousTimestamp(users[0].address, 1);
//       expect(timestamp1).to.equal(baseTimestamp.add(15)).toString();
//     });

//     it("get previous price", async () => {
//       const { mockNftOracle, users } = testEnv;
//       const price = await mockNftOracle.getPreviousPrice(users[0].address, 2);
//       expect(price).to.equal("400");
//       const timestamp = await mockNftOracle.getPreviousTimestamp(users[0].address, 2);
//       expect(timestamp).to.equal(baseTimestamp).toString();
//     });

//     it("get latest round id", async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.addCollection(users[3].address);
//       const id = await mockNftOracle.getLatestRoundId(users[0].address);
//       expect(id).to.equal("2");
//       const id1 = await mockNftOracle.getLatestRoundId(users[3].address);
//       expect(id1).to.equal("0");
//       const id2 = await mockNftOracle.getLatestRoundId(users[2].address);
//       expect(id2).to.equal("0");
//       const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//       baseTimestamp = currentTime;
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(5));
//       await mockNftOracle.setAssetData(users[3].address, 400);
//       const id3 = await mockNftOracle.getLatestRoundId(users[3].address);
//       expect(id3).to.equal("0");
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(10));
//       await mockNftOracle.setAssetData(users[3].address, 400);
//       const id4 = await mockNftOracle.getLatestRoundId(users[3].address);
//       expect(id4).to.equal("1");
//     });

//     it("force error, get previous price", async () => {
//       const { mockNftOracle, users } = testEnv;
//       await expect(mockNftOracle.getPreviousPrice(users[0].address, 3)).to.be.revertedWith("Not enough history");
//       await expect(mockNftOracle.getPreviousTimestamp(users[0].address, 3)).to.be.revertedWith("Not enough history");
//     });
//   });

//   makeSuite("NFTOracle: Data validity check", () => {
//     before(async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.setDataValidityParameters("200000000000000000", "100000000000000000", 10, 5);
//     });
//     after(async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.setDataValidityParameters("20000000000000000000", "10000000000000000000", 1, 1);
//     });
//     it("price > maxPriceDeviation", async () => {
//       const { mockNftOracle, users } = testEnv;
//       await mockNftOracle.addCollection(users[0].address);
//       const currentTime = await mockNftOracle.mock_getCurrentTimestamp();
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(15));
//       await mockNftOracle.setAssetData(users[0].address, 400);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(30));
//       await expect(mockNftOracle.setAssetData(users[0].address, 481)).to.be.revertedWith(
//         "NFTOracle: invalid price data"
//       );
//       await mockNftOracle.setAssetData(users[0].address, 480);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(39));
//       await expect(mockNftOracle.setAssetData(users[0].address, 530)).to.be.revertedWith(
//         "NFTOracle: invalid price data"
//       );
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(45));
//       await mockNftOracle.setAssetData(users[0].address, 530);
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(49));
//       await expect(mockNftOracle.setAssetData(users[0].address, 531)).to.be.revertedWith(
//         "NFTOracle: invalid price data"
//       );
//       await mockNftOracle.mock_setBlockTimestamp(currentTime.add(60));
//       await mockNftOracle.setAssetData(users[0].address, 531);
//       await mockNftOracle.removeCollection(users[0].address);
//     });

//     it("set data validity parameters", async () => {
//       const { mockNftOracle, users } = testEnv;
//       const maxPriceDeviation = await mockNftOracle.maxPriceDeviation();
//       const maxPriceDeviationWithTime = await mockNftOracle.maxPriceDeviationWithTime();
//       const timeIntervalWithPrice = await mockNftOracle.timeIntervalWithPrice();
//       const minimumUpdateTime = await mockNftOracle.minUpdateTime();
//       expect(maxPriceDeviation).to.equal("200000000000000000");
//       expect(maxPriceDeviationWithTime).to.equal("100000000000000000");
//       expect(timeIntervalWithPrice).to.equal("10");
//       expect(minimumUpdateTime).to.equal("5");

//       await mockNftOracle.setDataValidityParameters("150000000000000000", "60000000000000000", 3600, 600);
//       const maxPriceDeviation2 = await mockNftOracle.maxPriceDeviation();
//       const maxPriceDeviationWithTime2 = await mockNftOracle.maxPriceDeviationWithTime();
//       const timeIntervalWithPrice2 = await mockNftOracle.timeIntervalWithPrice();
//       const minimumUpdateTime2 = await mockNftOracle.minUpdateTime();
//       expect(maxPriceDeviation2).to.equal("150000000000000000");
//       expect(maxPriceDeviationWithTime2).to.equal("60000000000000000");
//       expect(timeIntervalWithPrice2).to.equal("3600");
//       expect(minimumUpdateTime2).to.equal("600");
//       await mockNftOracle.setDataValidityParameters("200000000000000000", "100000000000000000", 10, 5);
//     });
//   });
