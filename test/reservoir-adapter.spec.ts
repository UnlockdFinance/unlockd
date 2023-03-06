import { parseEther } from "ethers/lib/utils";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fetchAndFilterReservoirBids, fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import "./helpers/utils/math";

const { expect } = require("chai");

makeSuite("Reservoir adapter tests", (testEnv: TestEnv) => {
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
  it("ReservoirAdapter: check liquidation of an NFT ", async () => {
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
                    FETCH BID DATA FOR CURRENT NFT
    //////////////////////////////////////////////////////////////*/
    await fetchAndFilterReservoirBids(bayc.address, tokenId);

    /*//////////////////////////////////////////////////////////////
                      LIQUIDATE RESERVOIR
    //////////////////////////////////////////////////////////////*/

    // const executionInfo: ExecutionInfo = {
    //   module: BlurModule.address,
    //   data: "0x",
    //   value: BigNumber.from(0),
    // };
    // await expect(reservoirAdapter.liquidateReservoir(bayc.address, tokenId, executionInfo)).to.be.revertedWith(
    //   "InactiveNft()"
    // );
  });
});
