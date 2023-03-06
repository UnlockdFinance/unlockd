import { zeroAddress } from "ethereumjs-util";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { createRandomAddress, fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import { ExecutionInfo, IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Reservoir adapter negatives", (testEnv: TestEnv) => {
  before(async () => {
    const { reservoirAdapter, configurator, deployer, nftOracle, loan, reservoirModules } = testEnv;
    const poolAdmin = deployer;
    // Add deployer as LTV Manager
    await configurator.setLtvManagerStatus(deployer.address, true);
    // Add configurator and deployer as Oracle Price Manager
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    await nftOracle.setPriceManagerStatus(deployer.address, true);

    // Add reservoiradapter as market adapter in pool loan
    loan.updateMarketAdapters([reservoirAdapter.address], true);

    // Add deployer as a liquidator
    await reservoirAdapter.connect(poolAdmin.signer).updateLiquidators([deployer.address], true);

    // Add reservoir modules
    await reservoirAdapter.connect(poolAdmin.signer).updateModules(
      reservoirModules.map((mod) => mod.address),
      true
    );
  });
  it("BaseAdapter: check onlyPoolAdmin modifier on updateModules/updateLiquidators (expect revert)", async () => {
    const { reservoirAdapter, users } = testEnv;

    const invalidPoolAdmin = users[1];

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateModules([createRandomAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateLiquidators([createRandomAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");
  });

  it("ReservoirAdapter: check invalidZeroAddress modifier on updateModules/updateLiquidators (expect revert)", async () => {
    const { reservoirAdapter, users } = testEnv;

    const invalidPoolAdmin = users[1];

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateModules([zeroAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");

    await expect(
      reservoirAdapter.connect(invalidPoolAdmin.signer).updateLiquidators([zeroAddress()], true)
    ).to.be.revertedWith("CallerNotPoolAdmin()");
  });
  it("ReservoirAdapter: check onlyReservoirLiquidator modifier (expect revert)", async () => {
    const { reservoirAdapter, users, deployer, bayc } = testEnv;

    const poolAdmin = deployer;
    const liquidator = users[1];
    const invalidLiquidator = users[2];

    const tokenId = (testEnv.tokenIdTracker++).toString();

    const executionInfo: ExecutionInfo = {
      module: await createRandomAddress(),
      data: "0x",
      value: BigNumber.from(0),
    };
    await expect(
      reservoirAdapter.connect(invalidLiquidator.signer).liquidateReservoir(bayc.address, tokenId, executionInfo)
    ).to.be.revertedWith("NotReservoirLiquidator()");
  });

  it("ReservoirAdapter: check liquidation of a non-existing loan", async () => {
    const { reservoirAdapter, bayc, BlurModule } = testEnv;

    const tokenId = (testEnv.tokenIdTracker++).toString();

    const executionInfo: ExecutionInfo = {
      module: BlurModule,
      data: "0x",
      value: BigNumber.from(0),
    };
    await expect(reservoirAdapter.liquidateReservoir(bayc.address, tokenId, executionInfo)).to.be.revertedWith(
      "NftNotUsedAsCollateral()"
    );
  });

  it("ReservoirAdapter: check liquidation of a non-active loan", async () => {
    const { reservoirAdapter, bayc, users, weth, pool, configurator, deployer, nftOracle, BlurModule } = testEnv;
    const depositor = users[1];
    const borrower = users[2];
    const bidder = users[3];
    const tokenId = (testEnv.tokenIdTracker++).toString();

    /*//////////////////////////////////////////////////////////////
                        BORROW PROCESS
    //////////////////////////////////////////////////////////////*/

    //mints WETH to the depositor
    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //deposits WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, parseInt(tokenId));
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //borrows
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("100"), //100 ETH valuation
      ltv: 6000,
      liquidationThreshold: 7500,
      redeemThreshold: 5000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };

    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    // Borrow 40 WETH
    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("40"), bayc.address, tokenId, borrower.address, "0");

    /*//////////////////////////////////////////////////////////////
                        LOWER HEALTH FACTOR AND BID
    //////////////////////////////////////////////////////////////*/
    await nftOracle.setNFTPrice(bayc.address, tokenId, parseEther("50"));

    //mints WETH to the bidder
    await fundWithERC20("WETH", bidder.address, "1000");
    await approveERC20(testEnv, bidder, "WETH");
    await pool.connect(bidder.signer).auction(bayc.address, tokenId, parseEther("50"), bidder.address);

    /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
    //////////////////////////////////////////////////////////////*/

    const executionInfo: ExecutionInfo = {
      module: BlurModule,
      data: "0x",
      value: BigNumber.from(0),
    };
    await expect(reservoirAdapter.liquidateReservoir(bayc.address, tokenId, executionInfo)).to.be.revertedWith(
      "InvalidLoanState()"
    );
  });
  it("ReservoirAdapter: check liquidation of an unactive NFT", async () => {
    const { reservoirAdapter, bayc, pool, nftOracle, weth, deployer, users, configurator, BlurModule } = testEnv;
    const depositor = users[1];
    const borrower = users[2];
    const tokenId = (testEnv.tokenIdTracker++).toString();
    /*//////////////////////////////////////////////////////////////
                        BORROW PROCESS
    //////////////////////////////////////////////////////////////*/

    //mints WETH to the depositor
    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //deposits WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, parseInt(tokenId));
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //borrows
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("100"), //100 ETH valuation
      ltv: 6000,
      liquidationThreshold: 7500,
      redeemThreshold: 5000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };

    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    // Borrow 40 WETH
    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("40"), bayc.address, tokenId, borrower.address, "0");

    /*//////////////////////////////////////////////////////////////
                        LOWER HEALTH 
    //////////////////////////////////////////////////////////////*/
    await nftOracle.setNFTPrice(bayc.address, tokenId, parseEther("50"));

    /*//////////////////////////////////////////////////////////////
                      SET UNACTIVE NFT
    //////////////////////////////////////////////////////////////*/
    await configurator.setActiveFlagOnNftByTokenId([bayc.address], [tokenId], false);

    /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
    //////////////////////////////////////////////////////////////*/

    const executionInfo: ExecutionInfo = {
      module: BlurModule,
      data: "0x",
      value: BigNumber.from(0),
    };
    await expect(reservoirAdapter.liquidateReservoir(bayc.address, tokenId, executionInfo)).to.be.revertedWith(
      "InactiveNft()"
    );
  });
  it("ReservoirAdapter: check liquidation of a healthy loan", async () => {
    const { reservoirAdapter, bayc, pool, weth, deployer, users, configurator, BlurModule } = testEnv;
    const depositor = users[1];
    const borrower = users[2];
    const tokenId = (testEnv.tokenIdTracker++).toString();
    /*//////////////////////////////////////////////////////////////
                        BORROW PROCESS
    //////////////////////////////////////////////////////////////*/

    //mints WETH to the depositor
    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //deposits WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, parseInt(tokenId));
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //borrows
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("100"), //100 ETH valuation
      ltv: 6000,
      liquidationThreshold: 7500,
      redeemThreshold: 5000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };

    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    // Borrow 40 WETH
    await pool
      .connect(borrower.signer)
      .borrow(weth.address, parseEther("40"), bayc.address, tokenId, borrower.address, "0");

    /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
    //////////////////////////////////////////////////////////////*/

    const executionInfo: ExecutionInfo = {
      module: BlurModule,
      data: "0x",
      value: BigNumber.from(0),
    };
    await expect(reservoirAdapter.liquidateReservoir(bayc.address, tokenId, executionInfo)).to.be.revertedWith(
      "LoanIsHealthy()"
    );
  });
});
