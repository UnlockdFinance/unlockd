import { parseUnits } from "@ethersproject/units";
import { task } from "hardhat/config";
import { getOwnerWallet, getUserWallet } from "../helpers/config";
import { Contracts, MockContracts } from "../helpers/constants";
import { Functions } from "../helpers/protocolFunctions";

task("lendpool:triggerUserCollateral", "Triggers the NFT Configuration ConfigureNFTAsCollateral")
  .addParam("nftaddress", "The asset address")
  .addParam("tokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.triggerUserCollateral(wallet, nftaddress, tokenid);
    await tx.wait();
    console.log(tx);
  });

task("lendpool:getTimeframe", "Gets the list of NFTs in the reserves").setAction(async () => {
  const wallet = await getUserWallet();

  const tx = await Functions.LENDPOOL.getTimeframe(wallet);
  await tx.wait();
  console.log(tx);
});

task("lendpool:getConfigFee", "Gets the list of NFTs in the reserves").setAction(async () => {
  const wallet = await getUserWallet();

  const tx = await Functions.LENDPOOL.getConfigFee(wallet);
  await tx.wait();
  console.log(tx);
});

task("lendpool:getNftConfigByTokenId", "Get the NFT Configuration")
  .addParam("nftaddress", "The asset address")
  .addParam("tokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftConfigByTokenId(wallet, nftaddress, tokenid);
    await tx.wait();
    console.log(tx);
  });

task("lendpool:liquidate", "Get the NFT Configuration")
  .addParam("nftaddress", "The asset address")
  .addParam("tokenid", "The tokenId of the asset")
  .addParam("amount", "The tokenId of the asset")
  .setAction(async ({ nftaddress, tokenid, amount }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.liquidate(wallet, nftaddress, tokenid, amount);
    console.log(await tx);
  });

// Get Nft Reserve data
task("lendpool:liquidateNFTX", "Liquidates the NFT on NFTx Vault")
  .addParam("nftaddress", "The asset address")
  .addParam("tokenid", "The tokenId of the asset")
  .addParam("reserve", "The reserve Name ex: WETH")
  .setAction(async ({ nftaddress, tokenid, reserve }) => {
    const wallet = await getOwnerWallet();
    const amount = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    const tokenContract = MockContracts[reserve];
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount);
    console.log("approved");
    const tx = await Functions.LENDPOOL.liquidateNFTX(wallet, nftaddress, tokenid);
    await tx.wait();
    console.log(tx);
  });

task("lendpool:getNftsList", "Gets the list of NFTs in the reserves").setAction(async () => {
  const wallet = await getUserWallet();

  const tx = await Functions.LENDPOOL.getNftsList(wallet);
  await tx.wait();
  console.log(tx);
});

task("lendpool:getNftData", "Get the NFT Data from the lendpool reserves")
  .addParam("nftaddress", "The asset address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftData(wallet, nftaddress).then((v) => v.toString());
    await tx.wait();
    console.log(tx);
  });

task("lendpool:getNftAssetConfig", "Get the NFT Data from the lendpool reserves")
  .addParam("nftasset", "The asset address")
  .addParam("tokenid", "The tokenId of the asset")
  .setAction(async ({ nftasset, tokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftAssetConfig(wallet, nftasset, tokenid);
    await tx.wait();
    console.log(tx);
  });

// Get NFT configuration data
task("lendpool:getNftConfiguration", "Get the NFT Struct with the configuration")
  .addParam("nftaddress", "The asset address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftConfiguration(wallet, nftaddress).then((v) => v.toString());
    await tx.wait();
    console.log(tx);
  });

//Deposit funds to the pool
task("lendpool:deposit", "User Deposits {amount} {reserve} in an empty reserve")
  .addParam("amount", "Reserve amount in WEI")
  .addParam("reserve", "The reserve") //must be set to 'DAI' or 'USDC' or 'WETH'
  .addParam("to", "Who will receive the interest bearing tokens")
  .setAction(async ({ amount, reserve, to }) => {
    const wallet = await getUserWallet();
    const tokenContract = MockContracts[reserve];
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount);
    const tx = await Functions.LENDPOOL.deposit(wallet, tokenContract.address, amount, to);
    await tx.wait();
    console.log(tx);
  });

//Withdrawing funds from the pool
task("lendpool:withdraw", "User Withdraws {amount} {reserve} from the reserves")
  .addParam("amount", "Amount to withdraw")
  .addParam("reserve", "The reserve") //must be set to 'DAI' or 'USDC' or 'WETH'
  .addParam("to", "Who will reveive the withdrawal")
  .setAction(async ({ amount, reserve, to }) => {
    const wallet = await getUserWallet();
    const tokenContract = MockContracts[reserve];
    const tx = await Functions.LENDPOOL.withdraw(wallet, tokenContract.address, amount, to);
    await tx.wait();
    console.log(tx);
  });

//Borrowing
task("lendpool:borrow", "User Borrows {amount} {reserve} from the reserves")
  .addParam("reserve", "reserve asset to borrow")
  .addParam("amount", "amount to borrow in WEI")
  .addParam("collectionname", "NFT name")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "the NFT token ID")
  .addParam("to", "Who will reveive the borrowed amount")
  .setAction(async ({ reserve, amount, collectionname, nftaddress, tokenid, to }) => {
    const wallet = await getUserWallet();
    const tokenContract = MockContracts[reserve];
    const nftContract = MockContracts[collectionname];
    const isApprovedForAll = await Functions.NFTS.isApprovedNft(wallet, nftContract, to, Contracts.lendPool.address);
    if (isApprovedForAll == false) {
      await Functions.NFTS.setApproveForAllNft(wallet, nftContract, Contracts.lendPool.address, true);
    }
    const tx = await Functions.LENDPOOL.borrow(wallet, tokenContract.address, amount, nftaddress, tokenid, to);
    await tx.wait();
    console.log(tx);
  });

// Get collateral data
task("lendpool:getcollateraldata", "Returns collateral data")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "nft token id")
  .addParam("reserve", "reserve") //must be set to 'DAI' or 'USDC'
  .setAction(async ({ nftaddress, tokenid, reserve }) => {
    const wallet = await getUserWallet();
    const collateralData = await Functions.LENDPOOL.getCollateralData(wallet, nftaddress, tokenid, reserve).then((v) =>
      v.toString()
    );
    console.log(collateralData);
  });

// Get debt data
task("lendpool:getdebtdata", "Returns debt data")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "nft token id")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const debtData = await Functions.LENDPOOL.getDebtData(wallet, nftaddress, tokenid);
    console.log("Debt data: ");
    console.log("Loan ID: ", debtData.loanId.toString());
    console.log("Reserve asset: ", debtData.reserveAsset);
    console.log("Total collateral: ", debtData.totalCollateral.toString() / 10 ** 18);
    console.log("Total debt: ", debtData.totalDebt.toString() / 10 ** 18);
    console.log("Available borrows: ", debtData.availableBorrows.toString() / 10 ** 18);
    console.log("Health Factor: ", debtData.healthFactor.toString() / 10 ** 18);
  });

//Get NFT data
task("lendpool:getnftdata", "Returns the NFT data")
  .addParam("nftaddress", "NFT address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const nftData = await Functions.LENDPOOL.getNftData(wallet, nftaddress);
    console.log(nftData);
  });

//Redeem
task("lendpool:redeem", "Redeems a loan")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "nft token id")
  .addParam("amount", "Amount to redeem in WEI")
  .addParam("bidfine", "Amount to redeem")
  .setAction(async ({ nftaddress, tokenid, amount, bidfine }) => {
    const wallet = await getUserWallet();
    //const loanId = await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, nftaddress, tokenid);
    //const loanData = await Functions.LENDPOOL_LOAN.getLoan(wallet, loanId);
    //const reserveAddress = loanData.reserveAsset;
    const tokenContract = MockContracts["WETH"];

    // reserveAddress == MockContracts['DAI'].address ?
    //    tokenContract = MockContracts['DAI'] : tokenContract = MockContracts['USDC'];

    // reserveAddress == MockContracts['DAI'].address ?
    // amount = await parseUnits(amount.toString()) : amount = await parseUnits(amount.toString(), 6);

    // reserveAddress == MockContracts['DAI'].address ?
    // bidfine = await parseUnits(bidfine.toString()) : bidfine = await parseUnits(amount.toString(), 6);

    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount.add(bidfine));
    await Functions.LENDPOOL.redeem(wallet, nftaddress, tokenid, amount, bidfine);
  });

//Repay loan
task("lendpool:repay", "Repays a loan")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "nft token id")
  .addParam("reserve", "reserve")
  .addParam("amount", "Amount to repay in WEI")
  .setAction(async ({ nftaddress, tokenid, reserve, amount }) => {
    const wallet = await getUserWallet();
    // reserve == 'USDC' ?
    //     amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString())

    const tokenContract = MockContracts[reserve];
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount);
    await Functions.LENDPOOL.repay(wallet, nftaddress, tokenid, amount);
  });

//Get liquidation fee percentage
task("lendpool:getliquidatefee", "Get liquidation fee percentage").setAction(async () => {
  const wallet = await getUserWallet();
  const fee = await Functions.LENDPOOL.getLiquidateFeePercentage(wallet);
  console.log(fee.toString());
});

//Get liquidation fee percentage
task("lendpool:getnftliquidateprice", "Get liquidation price for an asset")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "nft token id")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const price = await Functions.LENDPOOL.getNftLiquidatePrice(wallet, nftaddress, tokenid);
    console.log(price.toString());
  });

//Auction loan
task("lendpool:auction", "Auctions a loan")
  .addParam("collection", "NFT collection address")
  .addParam("tokenid", "nft token id")
  .addParam("bidprice", "The bid price in WEI")
  .addParam("to", "Receiver")
  .setAction(async ({ nftaddress, tokenid, bidprice, to }) => {
    const wallet = await getUserWallet();
    //const loanId = await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, nftaddress, tokenid);
    //const loanData = await Functions.LENDPOOL_LOAN.getLoan(wallet, loanId);
    //const reserveAddress = loanData.reserveAsset;
    const tokenContract = MockContracts["WETH"];

    // reserveAddress == MockContracts['DAI'].address ?
    //    tokenContract = MockContracts['DAI'] :tokenContract = MockContracts['USDC'];

    // reserveAddress == MockContracts['DAI'].address ?
    //     bidprice = await parseUnits(bidprice.toString()) :bidprice = await parseUnits(bidprice.toString(), 6);

    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, bidprice);
    await Functions.LENDPOOL.auction(wallet, nftaddress, tokenid, bidprice, to);
  });

//Get NFT auction data
task("lendpool:getnftauctiondata", "Get liquidation price for an asset")
  .addParam("nftaddress", "NFT address")
  .addParam("tokenid", "nft token id")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const data = await Functions.LENDPOOL.getNftAuctionData(wallet, nftaddress, tokenid);
    console.log("Loan id: ", data.loanId.toString());
    console.log("Bidder address: ", data.bidderAddress.toString());
    console.log("Bid price: ", data.bidPrice.toString());
    console.log("Bid borrow amount: ", data.bidBorrowAmount.toString());
    console.log("Bid fine: ", data.bidFine.toString());
  });

//Get liquidation fee percentage
task("lendpool:getReserveNormalizedIncome", "normalized income normalized income of the reserve")
  .addParam("reserve", "Reserve address")
  .setAction(async ({ reserve }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getReserveNormalizedIncome(wallet, reserve);
    let value: number;
    reserve == MockContracts["DAI"].address ? (value = tx.toString() / 10 ** 18) : (value = tx.toString() / 10 ** 6);
    console.log(value.toString());
  });

// Get liquidation fee percentage
task("lendpool:getReserveNormalizedVariableDebt", "normalized variable debt per unit of asset")
  .addParam("reserve", "Reserve address")
  .setAction(async ({ reserve }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getReserveNormalizedVariableDebt(wallet, reserve);
    let value: number;
    reserve == MockContracts["DAI"].address ? (value = tx.toString() / 10 ** 18) : (value = tx.toString() / 10 ** 6);
    console.log(value.toString());
  });

// The reserve addresses
task("lendpool:getReservesList", "Get liquidation fee percentage").setAction(async () => {
  const wallet = await getUserWallet();
  const fee = await Functions.LENDPOOL.getReservesList(wallet);
  console.log(fee.toString());
});

// Gets the reserve configuration parameters
task("lendpool:getReserveConfiguration", "Gets the ERC20 reserve configuration")
  .addParam("reserve", "ERC20 Reserve address")
  .setAction(async ({ reserve }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getReserveConfiguration(wallet, reserve);
    console.log(tx.toString());
  });
