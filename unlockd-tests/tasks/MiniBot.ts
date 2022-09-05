import { task } from "hardhat/config";


var amounts = [10000]; 
const reserves = ["DAI"];
const userAddresses = ["0x94aBa23b9Bbfe7bb62A9eB8b1215D72b5f6F33a1"];
const nftAssets = ["0x685660C0E5Aa3c06DAddF2e4E0219120a13993Dd"];
const nftNames = ["BAYC"];
const ltv = "4000";
const treshold = "7000";
const bonus = "100";
const redeemDuration = "1";
const auctionDuration = "2";
const redeemFine = "500"
const activeState = "true";
const freezeState = "false";

let i = 0; // wallets; amounts, nfts and userAddresses, reserves
let a = 1; // just counts iterations
let b = 0; // tokenIds

task("minibot:runtests", "Runs a set of configures tests.").setAction(
    async ({}, localBRE) => {
    await localBRE.run("set-DRE");
    while(true) {
        console.log(`\n--------------------------Iteration number ${a}---------------------------\n`)
        if(i == amounts.length)  i = 0;
        console.log(`--------------------------wallet being used ${i+1}--------------------------\n`)

        ///////////////////////////////////////////////////////////////////////////////////////
        // Variables 
        const tokenIds = [803, 804, 805];
        if(b == tokenIds.length)  b = 0;

        ///////////////////////////////////////////////////////////////////////////////////////

        // Minting Reserves to wallet
        console.log("\n----------------------------minting reservers----------------------------\n");
        const mintAmount = amounts[i] * 3;
        console.log("mint/deposit amount: ", mintAmount);
        console.log("user address: ", userAddresses[i].toString());
        await localBRE.run("dev:mint-mock-reserves", {
            amount: mintAmount.toString(), 
            user: userAddresses[i].toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");
        
        // Check if the reserves increased - Balance

        // Deposit 
        console.log("\n-------------------------depositing to reservers-------------------------\n");
        const depositAmount = amounts[i] * 2;
        console.log("reserve: ", reserves[i].toString());
        console.log("deposit amount: ", depositAmount.toString())
        await localBRE.run("lendpool:deposit", {
            amount: depositAmount.toString(), 
            reserve: reserves[i], 
            to: userAddresses[i].toString(), 
            walletnumber: (i).toString()}
        ); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");
        

        // Set the NFT Price
        console.log("\n----------------------------updating NFT price----------------------------\n");
        const nftPrice = amounts[i] * 3;
        console.log("nft price: ", nftPrice);
        console.log("nft address: ", nftAssets[i].toString());
        console.log("nft token id: ", tokenIds[b].toString());
        await localBRE.run("nftoracle:setnftprice", {
            collection: nftAssets[i], 
            tokenid: tokenIds[b].toString(), 
            price: nftPrice.toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // NFT Configuration 
        console.log("\n---------------------------configuring the NFT---------------------------\n");
        console.log("nft address: ", nftAssets[i].toString());
        console.log("nft token id: ", tokenIds[b].toString());
        console.log("ltv: ", ltv);
        console.log("treshold: ", treshold);
        console.log("bonus: ", bonus);
        console.log("redeem duration: ", redeemDuration);
        console.log("auction duration: ", auctionDuration);
        console.log("redeem fine: ", redeemFine);
        console.log("active: ", activeState);
        console.log("freeze: ", freezeState);
        await localBRE.run("configurator:configureNftAsCollateral", {
            asset: nftAssets[i], 
            tokenid: tokenIds[b].toString(),
            ltv: ltv,
            threshold: treshold, 
            bonus: bonus,
            to: userAddresses[i].toString(),
            redeemduration: redeemDuration,
            auctionduration: auctionDuration,
            redeemfine: redeemFine,
            active: activeState,
            freeze: freezeState
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Borrow
        console.log("\n-----------------------------borrowing tokens-----------------------------\n");
        console.log("collection name: ", nftNames[i].toString());
        console.log("collection address: ", nftAssets[i].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("to: ", userAddresses[i].toString());
        console.log("amount: ", amounts[i].toString());
        console.log("reserve: ", reserves[i].toString());
        console.log("wallet: ", (i).toString());
        await localBRE.run("lendpool:borrow", {
            amount: amounts[i].toString(), 
            reserve: reserves[i], 
            collectionname: nftNames[i],
            collection: nftAssets[i],
            tokenid: tokenIds[b].toString(),
            to: userAddresses[i].toString(),
            walletnumber: (i).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Repay a % of the debt
        console.log("\n-----------------------repaying part of the borrow-----------------------\n");
        const repayAmount = amounts[i] / 2;
        console.log("collection address: ", nftAssets[i].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("reserve: ", reserves[i].toString());
        console.log("amount: ", repayAmount.toString());
        console.log("wallet: ", (i).toString());
        await localBRE.run("lendpool:repay", {
            collection: nftAssets[i], 
            tokenid: tokenIds[b].toString(), 
            reserve: reserves[i], 
            amount: repayAmount.toString(),
            walletnumber: (i).toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // 2nd Borrow
        console.log("\n------------------------2nd time borrowing tokens------------------------\n");
        console.log("collection name: ", nftNames[i].toString());
        console.log("collection address: ", nftAssets[i].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("to: ", userAddresses[i].toString());
        console.log("amount: ", amounts[i].toString());
        console.log("reserve: ", reserves[i].toString());
        console.log("wallet: ", (i).toString());
        await localBRE.run("lendpool:borrow", {
            amount: amounts[i].toString(), 
            reserve: reserves[i], 
            collectionname: nftNames[i],
            collection: nftAssets[i],
            tokenid: tokenIds[b].toString(),
            to: userAddresses[i].toString(),
            walletnumber: (i).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // We lower the price to trigger the auction state
        console.log("\n-----------Lowering the NFT Price to trigger the health factor-----------\n");
        const nftPriceV2 = 1;
        console.log("collection address: ", nftAssets[i].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("new nft price: ", nftPrice);
        await localBRE.run("nftoracle:setnftprice", {
            collection: nftAssets[i], 
            tokenid: tokenIds[b].toString(), 
            price: nftPriceV2.toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n"); 

        // amount of time to restart (3m)
        console.log("-------------------waiting 3m and moving to next iteration------------------");
        await delay(180000);

        i++
        a++
        b++;
    }
});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}