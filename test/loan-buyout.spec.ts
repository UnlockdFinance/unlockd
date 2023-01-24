import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getEmergencyAdminSigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { advanceTimeAndBlock, fundWithERC20, fundWithERC721, increaseTime, waitForTx } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: buyout test cases", (testEnv) => {
  before("Before liquidation: set config", () => {
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });
  });

  after("After liquidation: reset config", () => {
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
  });

  it("User 2 buyout price is correct", async () => {
    const { users, pool, nftOracle, reserveOracle, weth, bayc, configurator, deployer } = testEnv;
    const user2 = users[2];
    const depositor = users[3];
    const borrower = users[4];
    const liquidator = users[5];
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(deployer, weth, "1000");

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    const price = await convertToCurrencyDecimals(deployer, weth, "1000");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    type NewType = IConfigNftAsCollateralInput;

    const collData: NewType = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 100,
      auctionDuration: 200,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);
    const loanData = await pool.getNftCollateralData(bayc.address, "101", weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(loanData.availableBorrowsInETH.toString()).div(wethPrice.toString()).multipliedBy(0.2).toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", borrower.address, "0");

    // Drops HF below 1
    const baycPrice = await nftOracle.getNFTPrice(bayc.address, "101");
    await nftOracle.setNFTPrice(bayc.address, 101, new BigNumber(baycPrice.toString()).multipliedBy(0.5).toFixed(0));

    //mints WETH to the liquidator
    await fundWithERC20("WETH", liquidator.address, "1000");
    await approveERC20(testEnv, liquidator, "WETH");

    const nftPrice = await nftOracle.getNFTPrice(bayc.address, "101");

    // NFT not supporting liquidations on sudoswap / NFTX
    await configurator.connect(deployer.signer).setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await waitForTx(await configurator.connect(deployer.signer).setIsMarketSupported(bayc.address, 0, false));
    await waitForTx(await configurator.connect(deployer.signer).setIsMarketSupported(bayc.address, 1, false));
    const buyoutPriceOk = new BigNumber(nftPrice.toString()).toFixed(0);
    await waitForTx(await pool.connect(user2.signer).buyOut(bayc.address, "101", buyoutPriceOk, user2.address));
  });
});
