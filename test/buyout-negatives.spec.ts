import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { oneEther } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
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

  const {
    LP_AMOUNT_LESS_THAN_DEBT,
    LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE,
    VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD,
    LP_NFT_IS_NOT_USED_AS_COLLATERAL,
    LP_AMOUNT_LESS_THAN_BUYOUT_PRICE,
  } = ProtocolErrors;

  it("Borrower - Borrows WETH", async () => {
    const { users, pool, nftOracle, weth, bayc, configurator, deployer } = testEnv;
    const depositor = users[3];
    const borrower = users[4];

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(depositor, weth, "1000"); //deployer

    await pool.connect(depositor.signer).deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(deployer.address, true);

    type NewType = IConfigNftAsCollateralInput;

    const collData: NewType = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 2820,
      auctionDuration: 2880,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator.connect(deployer.signer).configureNftsAsCollateral([collData]);

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "40");

    await pool
      .connect(borrower.signer)
      .borrow(weth.address, amountBorrow.toString(), bayc.address, "101", borrower.address, "0");

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("Buyer tries to buy with HF above 1", async () => {
    const { users, pool, bayc, nftOracle } = testEnv;
    const buyer = users[2];

    await fundWithERC20("WETH", buyer.address, "1000");
    await approveERC20(testEnv, buyer, "WETH");

    const price = await nftOracle.getNFTPrice(bayc.address, "101");
    const buyoutPrice = price;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // BUYOUT
    // Debt is 40 eth but tries to buyout with 10 eth.
    await expect(pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPrice, buyer.address)).to.be.revertedWith(
      VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("Health Factor goes below 1", async () => {
    const { pool, nftOracle, bayc, deployer } = testEnv;

    await nftOracle.setPriceManagerStatus(deployer.address, true);
    await nftOracle.setNFTPrice(bayc.address, "101", parseEther("50"));

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");
    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("Buyer - tries to buy the NFT with a wrong tokenId", async () => {
    const { users, pool, bayc } = testEnv;
    const buyer = users[2];

    await fundWithERC20("WETH", buyer.address, "1000");
    await approveERC20(testEnv, buyer, "WETH");

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // BUYOUT
    // Debt is 40 eth but tries to buyout with 10 eth.
    const nftDebtData = await pool.getNftDebtData(bayc.address, "101");
    const buyoutPrice = nftDebtData[3].sub(100);

    await expect(pool.connect(buyer.signer).buyout(bayc.address, "0", buyoutPrice, buyer.address)).to.be.revertedWith(
      LP_NFT_IS_NOT_USED_AS_COLLATERAL
    );
  });

  it("Buyer - tries to buy the NFT with a smaller amount than debt", async () => {
    const { users, pool, bayc } = testEnv;
    const buyer = users[2];

    await fundWithERC20("WETH", buyer.address, "1000");
    await approveERC20(testEnv, buyer, "WETH");

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // BUYOUT
    // Debt is 40 eth but tries to buyout with 10 eth.
    const nftDebtData = await pool.getNftDebtData(bayc.address, "101");
    const buyoutPrice = nftDebtData[3].sub(100);

    await expect(pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPrice, buyer.address)).to.be.revertedWith(
      LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE
    );
  });

  it("Buyer - tries to buy the NFT with an amount higher than debt lower then valuation", async () => {
    const { users, pool, bayc, nftOracle } = testEnv;
    const buyer = users[2];

    await fundWithERC20("WETH", buyer.address, "1000");
    await approveERC20(testEnv, buyer, "WETH");

    const price = await nftOracle.getNFTPrice(bayc.address, "101");
    const buyoutPrice = price.sub(100);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // BUYOUT
    // Debt is 40 eth but tries to buyout with 10 eth.
    await expect(pool.connect(buyer.signer).buyout(bayc.address, "101", buyoutPrice, buyer.address)).to.be.revertedWith(
      LP_AMOUNT_DIFFERENT_FROM_REQUIRED_BUYOUT_PRICE
    );
  });
});
