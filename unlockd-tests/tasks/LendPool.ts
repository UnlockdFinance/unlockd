import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet, getUserWallet, getWalletByNumber } from "../helpers/config"; 
import {  Contracts, MockContracts } from "../helpers/constants";
import { parseUnits } from "@ethersproject/units";

// Get Nft Reserve data 
task("lendpool:liquidateNFTX", "Liquidates the NFT on NFTx Vault")
  .addParam("nftaddress", "The asset address")
  .addParam("nfttokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, nfttokenid, walletnumber }) => {
    const wallet = await getOwnerWallet(); 
    const tx = await Functions.LENDPOOL.liquidateNFTX(wallet, nftaddress, nfttokenid).then(v => v.toString());
    console.log(tx);
  }
);

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

task("lendpool:getNftAssetConfig", "Get the NFT Data from the lendpool reserves")
  .addParam("nftaddress", "The asset address")
  .addParam("nfttokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, nfttokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.LENDPOOL.getNftAssetConfig(wallet, nftaddress, nfttokenid);
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
.addParam("walletnumber", "the wallet number in ur .env from 2 to 5 otherwise it's default userWallet")
.setAction( async ({amount, reserve, to, walletnumber}) => {
    const wallet = await getWalletByNumber(walletnumber);  
    let tokenContract;
    reserve == 'USDC' ? 
        amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString())
    reserve == 'WETH' ? 
        tokenContract = "0xc778417E063141139Fce010982780140Aa0cD5Ab" : tokenContract = MockContracts[reserve];
    
    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount)  
    await Functions.LENDPOOL.deposit(wallet, tokenContract.address, amount, to);
}); 

//Withdrawing funds from the pool
task("lendpool:withdraw", "User 0 Withdraws {amount} {reserve} from the reserves")
.addParam("amount", "Amount to withdraw") 
.addParam("reserve", "The reserve")  //must be set to 'DAI' or 'USDC'
.addParam("to", "Who will reveive the withdrawal")
.addParam("walletnumber", "the wallet number in ur .env from 2 to 5 otherwise it's default userWallet")
.setAction( async ({amount, reserve, to, walletnumber}) => {
    const wallet = await getWalletByNumber(walletnumber);  
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
.addParam("walletnumber", "the wallet number in ur .env from 2 to 5 otherwise it's default userWallet")
.addParam("nftconfigfee", "the gas cost of configuring the nft")
.setAction( async ({reserve, amount, collectionname, collection, tokenid, to, walletnumber, nftconfigfee}) => {
    const wallet = await getWalletByNumber(walletnumber); 
    const tokenContract = MockContracts[reserve];
    
    reserve == 'USDC' ? 
        amount = await parseUnits(amount.toString(), 6)  :   amount = await parseUnits(amount.toString()) 
    reserve == 'USDC' ? 
        nftconfigfee = await parseUnits(nftconfigfee.toString(), 6)  :   nftconfigfee = await parseUnits(nftconfigfee.toString()) 

    const nftContract = MockContracts[collectionname];
    const isApprovedForAll = await Functions.NFTS.isApprovedNft(wallet, nftContract, to, Contracts.lendPool.address);
    if(isApprovedForAll == false) {
        await Functions.NFTS.setApproveForAllNft(wallet, nftContract, Contracts.lendPool.address, true);
    }

    await Functions.LENDPOOL.borrow(wallet, tokenContract.address, amount, collection, tokenid, to, nftconfigfee);
}); 

// Get collateral data
task("lendpool:getcollateraldata", "Returns collateral data")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.addParam("reserve", "reserve") //must be set to 'DAI' or 'USDC'
.setAction( async ({collection, tokenid, reserve}) => {
    const wallet = await getUserWallet();  
    const collateralData = await Functions.LENDPOOL.getCollateralData(wallet, collection, tokenid, reserve).then(v=> v.toString());
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
.addParam("walletnumber", "the wallet number in ur .env from 2 to 5 otherwise it's default userWallet")   
.setAction( async ({collection, tokenid, amount, bidfine, walletnumber}) => {
    const wallet = await getWalletByNumber(walletnumber); 
    const loanId = await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, collection, tokenid);
    const loanData = await Functions.LENDPOOL_LOAN.getLoan(wallet, loanId);
    const reserveAddress = loanData.reserveAsset;
    
    let tokenContract;
    
    reserveAddress == MockContracts['DAI'].address ?
       tokenContract = MockContracts['DAI'] : tokenContract = MockContracts['USDC'];
    
    reserveAddress == MockContracts['DAI'].address ?
    amount = await parseUnits(amount.toString()) : amount = await parseUnits(amount.toString(), 6);
    
    reserveAddress == MockContracts['DAI'].address ?
    bidfine = await parseUnits(bidfine.toString()) : bidfine = await parseUnits(amount.toString(), 6);

    await Functions.RESERVES.approve(wallet, tokenContract, Contracts.lendPool.address, amount+bidfine)   
    await Functions.LENDPOOL.redeem(wallet, collection, tokenid, amount, bidfine);
    
});  

//Repay loan 
task("lendpool:repay", "Repays a loan")
.addParam("collection", "NFT collection address") 
.addParam("tokenid", "nft token id")  
.addParam("reserve", "reserve") 
.addParam("amount", "Amount to repay") 
.addParam("walletnumber", "the wallet number in ur .env from 2 to 5 otherwise it's default userWallet") 
.setAction( async ({collection, tokenid, reserve, amount, walletnumber}) => {
    const wallet = await getWalletByNumber(walletnumber);  
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
.addParam("walletnumber", "the wallet number in ur .env from 2 to 5 otherwise it's default userWallet")   
.setAction( async ({collection, tokenid, bidprice, to, walletnumber}) => {
    const wallet = await getWalletByNumber(walletnumber);   
    const loanId = await Functions.LENDPOOL_LOAN.getCollateralLoanId(wallet, collection, tokenid);
    const loanData = await Functions.LENDPOOL_LOAN.getLoan(wallet, loanId);
    const reserveAddress = loanData.reserveAsset;
    let tokenContract;
    
    reserveAddress == MockContracts['DAI'].address ?
       tokenContract = MockContracts['DAI'] :tokenContract = MockContracts['USDC'];
    
    reserveAddress == MockContracts['DAI'].address ?
        bidprice = await parseUnits(bidprice.toString()) :bidprice = await parseUnits(bidprice.toString(), 6);
    
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

//Get liquidation fee percentage
task("lendpool:getReserveNormalizedIncome", "normalized income normalized income of the reserve")
.addParam("reserve", "NFT collection address") 
.setAction( async ({reserve}) => {
    const wallet = await getUserWallet();  
    const tx = await Functions.LENDPOOL.getReserveNormalizedIncome(wallet, reserve);
    let value: number;
    reserve == MockContracts['DAI'].address ?
    value = tx.toString() / 10**18 :value = tx.toString() / 10**6;
    console.log(value.toString())
});

// Get liquidation fee percentage
task("lendpool:getReserveNormalizedVariableDebt", "normalized variable debt per unit of asset")
.addParam("reserve", "NFT collection address") 
.setAction( async ({reserve}) => {
    const wallet = await getUserWallet();  
    const tx = await Functions.LENDPOOL.getReserveNormalizedVariableDebt(wallet, reserve);
    let value: number;
    reserve == MockContracts['DAI'].address ?
    value = tx.toString() / 10**18 :value = tx.toString() / 10**6;
    console.log(value.toString())
});

// The reserve addresses
task("lendpool:getReservesList", "Get liquidation fee percentage")
.setAction( async () => {
    const wallet = await getUserWallet();  
    const fee = await Functions.LENDPOOL.getReservesList(wallet);
    console.log(fee.toString())
}); 

// Gets the reserve configuration parameters
task("lendpool:getReserveConfiguration", "Gets the ERC20 reserve configuration")
.addParam("reserve", "ERC20 Reserve address") 
.setAction( async ({reserve}) => {
    const wallet = await getUserWallet();  
    const tx = await Functions.LENDPOOL.getReserveConfiguration(wallet, reserve);
    console.log(tx.toString())
});