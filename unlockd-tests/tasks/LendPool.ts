import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getUserWallet } from "../helpers/config"; 
import {  Contracts, MockContracts } from "../helpers/constants";
import { parseUnits } from "@ethersproject/units";

// Get Nft Reserve data 
task("lendpool:getNftsList", "Gets the list of NFTs in the reserves")
.setAction( async () => {
    const wallet = await getUserWallet();  

    const tx = await Functions.LENDPOOL.getNftsList(wallet)
    console.log(JSON.stringify(tx));
}); 

task("lendpool:getNftData", "Get the NFT Data from the lendpool reserves")
  .addParam("nftaddress", "The asset address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftData(wallet, nftaddress).then(v => v.toString());
    console.log(tx);
  }
);

// Get NFT configuration data 
task("lendpool:getNftConfiguration", "Get the NFT Struct with the configuration")
  .addParam("nftaddress", "The asset address")
  .setAction(async ({ nftaddress }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftConfiguration(wallet, nftaddress).then(v => v.toString());
    console.log(tx);
  }
);

//Deposit funds to the pool
task("lendpool:deposit", "User 0 Deposits {amount} {reserve} in an empty reserve")
.addParam("amount", "Reserve amount") 
.addParam("reserve", "The reserve")  //must be set to 'DAI' or 'USDC'
.addParam("to", "Who will receive the interest bearing tokens")
.setAction( async ({amount, reserve, to}) => {
    const wallet = await getUserWallet();  
    const tokenContract = MockContracts[reserve];
    reserve == 'USDC' ? 
        amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString())
  
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount)  
    await Functions.LENDPOOL.deposit(wallet, tokenContract.address, amount, to);
   
}); 
//Withdrawing funds from the pool
task("lendpool:withdraw", "User 0 Withdraws {amount} {reserve} from the reserves")
.addParam("amount", "Amount to withdraw") 
.addParam("reserve", "The reserve")  //must be set to 'DAI' or 'USDC'
.addParam("to", "Who will reveive the withdrawal")
.setAction( async ({amount, reserve, to}) => {
    const wallet = await getUserWallet();  
    const tokenContract = MockContracts[reserve];
    reserve == 'USDC' ? 
        amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString())    
    
    await Functions.LENDPOOL.withdraw(wallet, tokenContract.address, amount, to);
    
}); 
//Borrowing 
task("lendpool:borrow", "User 0 Withdraws {amount} {reserve} from the reserves")
.addParam("reserve", "reserve asset to borrow") 
.addParam("amount", "amount to borrow")  
.addParam("collectionname", "NFT name")
.addParam("collection", "NFT collection")
.addParam("tokenid", "the NFT token ID")
.addParam("to", "Who will reveive the borrowed amount")
.setAction( async ({reserve, amount, collectionname, collection, tokenid, to}) => {
    const wallet = await getUserWallet();  
    const tokenContract = MockContracts[reserve];
    reserve == 'USDC' ? 
        amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString())  
    const nftContract = MockContracts[collectionname];
    await Functions.NFTS.approve(wallet, nftContract, Contracts.lendPool.address, tokenid);
    await Functions.LENDPOOL.borrow(wallet, tokenContract.address, amount, collection, tokenid, to);
   
}); 
// Get collateral data
task("lendpool:getcollateraldata", "Returns collateral data")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.addParam("reserve", "reserve") //must be set to 'DAI' or 'USDC'
.setAction( async ({collection, tokenid, reserve}) => {
    const wallet = await getUserWallet();  
    const collateralData = await Functions.LENDPOOL.getCollateralData(wallet, collection, tokenid, reserve);
    console.log(collateralData);
});   
// Get debt data
task("lendpool:getdebtdata", "Returns debt data")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.setAction( async ({collection, tokenid}) => {
    const wallet = await getUserWallet();  
    const debtData = await Functions.LENDPOOL.getDebtData(wallet, collection, tokenid);
    console.log("Debt data: ");
    console.log("Loan ID: ", debtData.loanId.toString());
    console.log("Reserve asset: ", debtData.reserveAsset);
    console.log("Total collateral: ", debtData.totalCollateral.toString() / 10**18);
    console.log("Total debt: ", debtData.totalDebt.toString() / 10**18);
    console.log("Available borrows: ", debtData.availableBorrows.toString() / 10**18);
    console.log("Health Factor: ", debtData.healthFactor.toString() / 10**18);
});  
//Get NFT data
task("lendpool:getnftdata", "Returns the NFT data")
.addParam("collection", "NFT collection address") 
.setAction( async ({collection}) => {
    const wallet = await getUserWallet();  
    const nftData = await Functions.LENDPOOL.getNftData(wallet, collection);
    console.log(nftData);
});  
//Redeem 
task("lendpool:redeem", "Redeems a loan")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.addParam("amount", "Amount to redeem")   
.addParam("bidfine", "Amount to redeem")   
.setAction( async ({collection, tokenid, amount, bidfine}) => {
    const wallet = await getUserWallet(); 
   
    amount = await parseUnits(amount.toString())    
    bidfine = await parseUnits(bidfine.toString())  
    console.log(bidfine.toString());  
    const loanId = await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, collection, tokenid);
    console.log(loanId.toString());
    const loanData = await Functions.LENDPOOL_LOAN.getLoan(wallet, loanId);
    const reserveAddress = loanData.reserveAsset;
    let tokenContract;
    reserveAddress == MockContracts['DAI'].address ?
       tokenContract = MockContracts['DAI'] :tokenContract = MockContracts['USDC'];

    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount+bidfine)   
    await Functions.LENDPOOL.redeem(wallet, collection, tokenid, amount, bidfine);
    
});  

//Repay loan 
task("lendpool:repay", "Repays a loan")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.addParam("reserve", "reserve")  //must be set to 'DAI' or 'USDC'
.addParam("amount", "Amount to repay")  
.setAction( async ({collection, tokenid, reserve, amount}) => {
    const wallet = await getUserWallet();  
    reserve == 'USDC' ? 
        amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString())
    
    const tokenContract = MockContracts[reserve];
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount)  
    await Functions.LENDPOOL.repay(wallet, collection, tokenid, amount);
    
});  

//Get liquidation fee percentage
task("lendpool:getliquidatefee", "Get liquidation fee percentage")
.setAction( async () => {
    const wallet = await getUserWallet();  
    const fee = await Functions.LENDPOOL.getLiquidateFeePercentage(wallet);
    console.log(fee.toString())
}); 

//Get liquidation fee percentage
task("lendpool:getnftliquidateprice", "Get liquidation price for an asset")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.setAction( async ({collection, tokenid}) => {
    const wallet = await getUserWallet();  
    const price = await Functions.LENDPOOL.getNftLiquidatePrice(wallet, collection, tokenid);
    console.log(price.toString())
});   

//Auction loan 
task("lendpool:auction", "Auctions a loan")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.addParam("bidprice", "The bid price")  
.addParam("to", "Receiver")  
.setAction( async ({collection, tokenid, bidprice, to}) => {
    const wallet = await getUserWallet();  
    bidprice = await parseUnits(bidprice.toString())
    //Get loan data to fetch reserve asset

    const loanId = await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, collection, tokenid);
    console.log(loanId.toString());
    const loanData = await Functions.LENDPOOL_LOAN.getLoan(wallet, loanId);
    const reserveAddress = loanData.reserveAsset;
    let tokenContract;
    reserveAddress == MockContracts['DAI'].address ?
       tokenContract = MockContracts['DAI'] :tokenContract = MockContracts['USDC'];
    
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, bidprice)  
    await Functions.LENDPOOL.auction(wallet, collection, tokenid, bidprice, to); 
    
}); 

//Get NFT auction data
task("lendpool:getnftauctiondata", "Get liquidation price for an asset")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.setAction( async ({collection, tokenid}) => {
    const wallet = await getUserWallet();  
    const data = await Functions.LENDPOOL.getNftAuctionData(wallet, collection, tokenid);
    console.log("Loan id: ", data.loanId.toString());
    console.log("Bidder address: ", data.bidderAddress.toString());
    console.log("Bid price: ", data.bidPrice.toString());
    console.log("Bid borrow amount: ", data.bidBorrowAmount.toString());
    console.log("Bid fine: ", data.bidFine.toString());
}); 
