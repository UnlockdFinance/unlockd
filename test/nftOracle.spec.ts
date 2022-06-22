import { TestEnv, makeSuite } from "./helpers/make-suite";
const { expect } = require("chai");
import { ethers } from "hardhat";
import { MockNFTOracle, NFTOracle } from "../types";

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

  it("Add 2 Multi Assets", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;

    await mockNftOracle.addCollection(collection1);
    await mockNftOracle.addCollection(collection2);

    await mockNftOracle.setMultipleNFTPrices([collection1, collection2], [1, 1], [100, 200]);

    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(100);
    expect(await mockNftOracle.getNFTPrice(collection2, 1)).to.be.eq(200);
  });

  it("Add 3 Multi Assets", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;
    const collection3 = users[3].address;

    // await mockNftOracle.addCollection(collection1);
    // await mockNftOracle.addCollection(collection2);
    await mockNftOracle.addCollection(collection3);

    await mockNftOracle.setMultipleNFTPrices([collection1, collection2, collection3], [1, 1, 1], [100, 200, 300]);

    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(100);
    expect(await mockNftOracle.getNFTPrice(collection2, 1)).to.be.eq(200);
    expect(await mockNftOracle.getNFTPrice(collection3, 1)).to.be.eq(300);
  });

  it("Price updates", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;

    await mockNftOracle.setNFTPrice(collection1, 1, 150);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(150);

    await mockNftOracle.setNFTPrice(collection1, 1, 200);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(200);
  });
});

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

  it("Should be reverted as it is a non-existing collection", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection2 = users[2].address;
    await expect(mockNftOracle.getNFTPrice(collection2, 1)).to.be.revertedWith(
      `NonExistingCollection("${collection2}")`
    );
  });

  it("Should be reverted as price is 0", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await expect(mockNftOracle.getNFTPrice(collectionMock, 2)).to.be.revertedWith("PriceIsZero()");
  });

  it("Should be reverted as the collection has been deleted", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);

    await mockNftOracle.removeCollection(collectionMock);
    await expect(mockNftOracle.getNFTPrice(collectionMock, 1)).to.be.revertedWith(
      `NonExistingCollection("${collectionMock}")`
    );
  });

  it("Should be reverted as contract is paused", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);

    await mockNftOracle.setPause(collectionMock, true);
    await expect(mockNftOracle.setNFTPrice(collectionMock, 1, 1000)).to.be.revertedWith("NFTPaused()");
  });

  it("Should be reverted as array lengths aren't matching (2 vs 3)", async function () {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;
    const collection3 = users[3].address;

    await mockNftOracle.addCollection(collection1);
    await mockNftOracle.addCollection(collection2);
    await mockNftOracle.addCollection(collection3);

    await expect(
      mockNftOracle.setMultipleNFTPrices([collection1, collection2, collection3], [1, 1], [100, 200, 300])
    ).to.be.revertedWith("ArraysLengthInconsistent()");
  });
});

/// TEST PAUSE: ///

makeSuite("NFTOracle: Test Pause", (testEnv: TestEnv) => {
  before(async () => {});

  it("Should revert as collection is paused", async () => {
    const { mockNftOracle, users } = testEnv;
    await mockNftOracle.addCollection(users[0].address);
    await mockNftOracle.addCollection(users[1].address);
    await mockNftOracle.addCollection(users[2].address);
    await mockNftOracle.setNFTPrice(users[0].address, 1, 400);

    await mockNftOracle.setPause(users[0].address, true);

    await expect(mockNftOracle.setNFTPrice(users[0].address, 1, 410)).to.be.revertedWith("NFTPaused()");

    await mockNftOracle.setNFTPrice(users[2].address, 1, 400);
    await mockNftOracle.setPause(users[0].address, false);
    await mockNftOracle.setNFTPrice(users[1].address, 1, 410);
  });
});
