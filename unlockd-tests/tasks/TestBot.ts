import { task } from "hardhat/config";
import { getWalletByNumber } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";
import { increaseTime } from "../../helpers/misc-utils";
import { ONE_DAY } from "../../helpers/constants";

// The idea of this bot is to generate transactions on the test network in order
// to check if the code is working, if numbers are ok and above all if subgraph and risk framework
// are working properly.
// the user addresses are random from a wallet just to improve simulation

var amounts = [10000, 15000, 20000, 10000, 30000]; 
const reserves = ["DAI", "USDC"];
const reservesAddresses = ["0xba8E26A7ea78c628331baFD32eB0C77047F2cBCa", "0x103a065B2c676123dF6EdDbf41e06d361Dd15905"];
const userAddresses = [
    "0x94aBa23b9Bbfe7bb62A9eB8b1215D72b5f6F33a1",
    "0x429796dAc057E7C15724196367007F1e9Cff82F9",
    "0xb9C0467b04224a7940D198EE1C8578Aa18fcfCA6",
    "0xa2440E27b00f59520c473652b16786B18639518E",
    "0xAf441B4b092ef6c932957E19876940a72EdEE702"
];
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

let tokenIds;
let i = 0; // wallets; amounts, nfts and userAddresses 
let j = 0; // reserves
let k = 0; // nfts
let a = 1; // just counts iterations
let b = 0; // tokenIds

task("bot:runtests", "Runs a set of configures tests.").setAction(
    async ({}, localBRE) => {
    await localBRE.run("set-DRE");
    while(true) {
        console.log(`\n--------------------------Iteration number ${a}---------------------------\n`)
        if(i == amounts.length)  i = 0;
        console.log(`--------------------------wallet being used ${i+1}--------------------------\n`)

        ///////////////////////////////////////////////////////////////////////////////////////
        // Variables 
        var n = i + 1; // for user wallet numbers
        switch (n) { // each user should change the numbers to their own NFT TokenIds. WE ARE ONLY USING BAYC ATM!!! each number is a dif wallet
            case 1:
                tokenIds = [230, 201, 202, 203, 204];
                break;
            case 2:
                tokenIds = [205, 206, 207, 208, 209];
                break;
            case 3:
                tokenIds = [210, 211, 212, 213, 214];
                break;
            case 4:
                tokenIds = [215, 216, 217, 218, 219];
                break;
            case 5:
                tokenIds = [220, 221, 222, 223, 224];
                break;
        }
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
        console.log("reserve: ", reserves[j].toString());
        console.log("deposit amount: ", depositAmount.toString())
        await localBRE.run("lendpool:deposit", {
            amount: depositAmount.toString(), 
            reserve: reserves[j], 
            to: userAddresses[i].toString(), 
            walletnumber: (n).toString()}
        ); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");
        

        // Set the NFT Price
        console.log("\n----------------------------updating NFT price----------------------------\n");
        const nftPrice = amounts[i] * 3;
        console.log("nft price: ", nftPrice);
        console.log("nft address: ", nftAssets[k].toString());
        console.log("nft token id: ", tokenIds[b].toString());
        await localBRE.run("nftoracle:setnftprice", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            price: nftPrice.toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // NFT Configuration 
        console.log("\n---------------------------configuring the NFT---------------------------\n");
        console.log("nft address: ", nftAssets[k].toString());
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
            asset: nftAssets[k], 
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
        console.log("collection name: ", nftNames[k].toString());
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("to: ", userAddresses[i].toString());
        console.log("amount: ", amounts[i].toString());
        console.log("reserve: ", reserves[j].toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:borrow", {
            amount: amounts[i].toString(), 
            reserve: reserves[j], 
            collectionname: nftNames[k],
            collection: nftAssets[k],
            tokenid: tokenIds[b].toString(),
            to: userAddresses[i].toString(),
            walletnumber: (n).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Repay a % of the debt
        console.log("\n-----------------------repaying part of the borrow-----------------------\n");
        const repayAmount = amounts[i] / 2;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("reserve: ", reserves[j].toString());
        console.log("amount: ", repayAmount.toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:repay", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            reserve: reserves[j], 
            amount: repayAmount.toString(),
            walletnumber: (n).toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // 2nd Borrow
        console.log("\n------------------------2nd time borrowing tokens------------------------\n");
        console.log("collection name: ", nftNames[k].toString());
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("to: ", userAddresses[i].toString());
        console.log("amount: ", amounts[i].toString());
        console.log("reserve: ", reserves[j].toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:borrow", {
            amount: amounts[i].toString(), 
            reserve: reserves[j], 
            collectionname: nftNames[k],
            collection: nftAssets[k],
            tokenid: tokenIds[b].toString(),
            to: userAddresses[i].toString(),
            walletnumber: (n).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Gets the normalized income
        console.log("\n---------------------Getting Normalized Income Amount---------------------\n");
        console.log("reserve address: ", reservesAddresses[j].toString())
        await localBRE.run("lendpool:getReserveNormalizedIncome", {reserve: reservesAddresses[j]}); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // gets the normalized variable debt
        console.log("\n-----Getting Normalized Variable Debt Amount-----\n");
        console.log("reserve address: ", reservesAddresses[j].toString())
        await localBRE.run("lendpool:getReserveNormalizedVariableDebt", {reserve: reservesAddresses[j]}); 
        await delay(10000);
        console.log("\n-------------------------------------------------------------------------\n");
        
        // We lower the price to trigger the auction state
        console.log("\n-----------Lowering the NFT Price to trigger the health factor-----------\n");
        const nftPriceV2 = 1;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("new nft price: ", nftPrice);
        await localBRE.run("nftoracle:setnftprice", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            price: nftPriceV2.toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n"); 

        // Get the amount of debt
        console.log("\n---------------------------Getting the NFT Debt---------------------------\n");
        const wallet = await getWalletByNumber(n);
        const debtData = await Functions.LENDPOOL.getDebtData(wallet, nftAssets[k], tokenIds[b]);
        let debt = debtData.totalDebt.toString() / 10**18;;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("wallet: ", (n).toString());
        console.log("amount: ", debt.toString());
        // This will fix the decimals for USDC
        if(reserves[j] == "USDC") {
            debt = debtData.totalDebt.toString() / 10**6;
        }
        console.log("Total debt: ", debt.toFixed(0));
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Auction - 1st Bid
        console.log("\n------------------------1st Auction being created------------------------\n");
        const bidPrice = debt * 1.3;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("to: ", userAddresses[i].toString());
        console.log("bid amount: ", bidPrice.toFixed(0).toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:auction", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            bidprice: bidPrice.toFixed(0).toString(),
            to: userAddresses[i].toString(),
            walletnumber: (n).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Auction - 2nd Bid
        console.log("\n-----------------------2nd Auction being created-------------------------\n");
        const bidPriceV2 = debt * 1.5;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("to: ", userAddresses[i].toString());
        console.log("2nd bid amount: ", bidPriceV2.toFixed(0).toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:auction", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            bidprice: bidPriceV2.toFixed(0).toString(),
            to: userAddresses[i].toString(),
            walletnumber: (n).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        //Redeem the debt
        console.log("\n--------------------------------Redeeming--------------------------------\n");
        const reedemAmount = debt * 0.7;
        const bidFine = debt * 0.1;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("amount: ", reedemAmount.toFixed(0).toString());
        console.log("bid fine: ", bidFine.toFixed(0).toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:redeem", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            amount: reedemAmount.toFixed(0).toString(),
            bidfine: bidFine.toFixed(0).toString(),
            walletnumber: (n).toString()
        });
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // fetches the debt
        console.log("\n------------------Getting the NFT Debt for the 2nd time------------------\n");
        const debtDataV2 = await Functions.LENDPOOL.getDebtData(wallet, nftAssets[k], tokenIds[b]);
        let finalDebt = debtDataV2.totalDebt.toString() / 10**18;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("wallet: ", (n).toString());
        console.log("amount: ", finalDebt.toString());
        // This will fix the decimals for USDC
        if(reserves[j] == "USDC") {
            finalDebt = debtData.totalDebt.toString() / 10**6;
        }
        console.log("Total debt: ", finalDebt.toFixed(0));
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Repays total debt and gets the NFT back
        console.log("\n-----------------------repaying total borrow amount-----------------------\n");
        const repayAmountV2 = finalDebt + 1;
        console.log("collection address: ", nftAssets[k].toString());
        console.log("token id: ", tokenIds[b].toString());
        console.log("reserve: ", reserves[j].toString());
        console.log("amount: ", repayAmountV2.toString());
        console.log("wallet: ", (n).toString());
        await localBRE.run("lendpool:repay", {
            collection: nftAssets[k], 
            tokenid: tokenIds[b].toString(), 
            reserve: reserves[j], 
            amount: repayAmountV2.toFixed(0).toString(),
            walletnumber: (n).toString()
        }); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // Gets the normalized income
        console.log("\n--------------------Getting Normalized Income Amount---------------------\n");
        console.log("reserve address: ", reservesAddresses[j].toString())
        await localBRE.run("lendpool:getReserveNormalizedIncome", {reserve: reservesAddresses[j]}); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");

        // gets the normalized variable debt
        console.log("\n-----------------Getting Normalized Variable Debt Amount-----------------\n");
        console.log("reserve address: ", reservesAddresses[j].toString())
        await localBRE.run("lendpool:getReserveNormalizedVariableDebt", {reserve: reservesAddresses[j]}); 
        await delay(20000);
        console.log("\n-------------------------------------------------------------------------\n");
        
        // amount of time to restart (3m)
        console.log("-------------------waiting 3m and moving to next iteration------------------");
        await delay(180000);

        i++
        j = 1 - j;
        a++
        if(i == 4) b++;
    }
});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// getBalance if < 150 ETH stops   


