import { task } from "hardhat/config";
import { getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

const amounts = [10000, 15000, 20000, 10000, 30000]; // 5
const tokenIds = [100, 101, 102, 103, 104]; // 5 | each user should change the numbers to their own NFT TokenIds. WE ARE ONLY USING BAYC ATM!!!
const reserves = ["DAI", "USDC"];
const reservesAddresses = ["0xd5E378c657668Ff99b5bf34F339382562F679bDA", "0x1f033Ec42c380eB834c640Bb58994e5BC0115DB3"];
const userAddress = "0x94aBa23b9Bbfe7bb62A9eB8b1215D72b5f6F33a1";
const nftAssets = ["0x8691bEd6655b0b7dD47ac524857C79e71E939d5f"];
const nftNames = ["BAYC"];

let i = 0;
let j = 0;
let k = 0;

task("bot:runtests", "Runs a set of configures tests.").setAction(
    async ({}, localBRE) => {
    await localBRE.run("set-DRE");
    while(true) {
        console.log(`------- Iteration number ${i} -------\n`)
        if(i == amounts.length) i = 0

        // Minting Reserves to wallet
        const mintAmount = amounts[i] * 3;
        console.log("mint/deposit amount: ", mintAmount);
        await localBRE.run("dev:mint-mock-reserves", {amount: mintAmount.toString(), user: userAddress});
        console.log("\n-----reserves minted-----\n")
        await delay(10000);

        // Check if the reserves increased - Balance

        // Deposit 
        await localBRE.run("lendpool:deposit", {amount: mintAmount.toString(), reserve: reserves[j], to: userAddress}); 
        console.log("\n-----deposited to reserve-----\n")
        await delay(10000);

        // Set the NFT Price
        const nftPrice = amounts[i] * 3;
        console.log("nft price: ", nftPrice);
        await localBRE.run("nftoracle:setnftprice", {collection: nftAssets[k], tokenid: tokenIds[i].toString(), price: nftPrice.toString()}); 
        console.log("\n-----price added-----\n")
        await delay(10000);

        // NFT Configuration 
        await localBRE.run("configurator:configureNftAsCollateral", {
            asset: nftAssets[k], 
            tokenid: tokenIds[i].toString(),
            ltv: "4000",
            threshold: "7000", 
            bonus: "100",
            to: userAddress,
            redeemduration: "1",
            auctionduration: "2",
            redeemfine: "200",
            active: "true",
            freeze: "false"
        }); 
        console.log("\n-----nft configured-----\n")
        await delay(10000);
        
        // Borrow
        console.log("amount to borrow: ", amounts.toString())
        await localBRE.run("lendpool:borrow", {
            amount: amounts[i].toString(), 
            reserve: reserves[j], 
            collectionname: nftNames[k],
            collection: nftAssets[k],
            tokenid: tokenIds[i].toString(),
            to: userAddress
        });
        console.log("\n-----token borrowed-----\n")
        await delay(10000);

        // Set the NFT Price
        const repayAmount = amounts[i] / 2;
        console.log("repay amount: ", repayAmount);
        await localBRE.run("lendpool:repay", {
            collection: nftAssets[k], 
            tokenid: tokenIds[i].toString(), 
            reserve: reserves[j], 
            amount: repayAmount.toString()
        }); 
        console.log("\n-----amount repayed-----\n")
        await delay(10000);

        // 2nd Borrow
        console.log("amount to do a 2nd borrow: ", amounts.toString())
        await localBRE.run("lendpool:borrow", {
            amount: amounts[i].toString(), 
            reserve: reserves[j], 
            collectionname: nftNames[k],
            collection: nftAssets[k],
            tokenid: tokenIds[i].toString(),
            to: userAddress
        });
        console.log("\n-----token borrowed 2nd time-----\n")
        await delay(10000);

        // Gets the normalized income
        await localBRE.run("lendpool:getReserveNormalizedIncome", {reserve: reservesAddresses[j]}); 
        console.log("\n-----Reserve Normalized Income-----\n")
        await delay(10000);

        // gets the normalized variable debt
        await localBRE.run("lendpool:getReserveNormalizedVariableDebt", {reserve: reservesAddresses[j]}); 
        console.log("\n-----Reserve Normalized Variable Debt-----\n")
        await delay(10000);
        
        // We lower the price to trigger the auction state
        const nftPriceV2 = 1;
        console.log("nft price update: ", nftPrice);
        await localBRE.run("nftoracle:setnftprice", {collection: nftAssets[k], tokenid: tokenIds[i].toString(), price: nftPriceV2.toString()}); 
        console.log("\n-----price added-----\n")
        await delay(10000);

        // Get the amount of debt
        const wallet = await getUserWallet();  
        const debtData = await Functions.LENDPOOL.getDebtData(wallet, nftAssets[k], tokenIds[i]);
        let debt = debtData.totalDebt.toString() / 10**18;;
        // This will fix the decimals for USDC
        if(reserves[j] == "USDC") {
            debt = debtData.totalDebt.toString() / 10**6;
        }
        console.log("Total debt: ", debt.toFixed(0));
        console.log("\n-----total debt-----\n")
        await delay(10000);

        // Auction - 1st Bid
        const bidPrice = debt * 1.3;
        console.log("bidPrice: ", bidPrice);
        console.log(bidPrice);
        await localBRE.run("lendpool:auction", {
            collection: nftAssets[k], 
            tokenid: tokenIds[i].toString(), 
            bidprice: bidPrice.toFixed(0).toString(),
            to: userAddress,
        });
        console.log("\n-----auction bid nº1-----\n")
        await delay(10000);

        // Auction - 2nd Bid
        const bidPriceV2 = debt * 1.5;
        console.log("2nd bidPrice: ", bidPriceV2);
        await localBRE.run("lendpool:auction", {
            collection: nftAssets[k], 
            tokenid: tokenIds[i].toString(), 
            bidprice: bidPriceV2.toFixed(0).toString(),
            to: userAddress,
        });
        console.log("\n-----auction bid nº2-----\n")
        await delay(10000);

        //Redeem the debt
        const reedemAmount = debt * 0.7;
        const bidFine = debt * 0.2;
        console.log("reedemAmount: ", reedemAmount);
        console.log("bidFine: ", bidFine);
        await localBRE.run("lendpool:redeem", {
            collection: nftAssets[k], 
            tokenid: tokenIds[i].toString(), 
            amount: reedemAmount.toFixed(0).toString(),
            bidfine: bidFine.toString()
        });
        console.log("\n-----Redeemed-----\n")
        await delay(10000);

        // fetches the debt 
        const debtDataV2 = await Functions.LENDPOOL.getDebtData(wallet, nftAssets[k], tokenIds[i]);
        let finalDebt = debtDataV2.totalDebt.toString() / 10**18;
        // This will fix the decimals for USDC
        if(reserves[j] == "USDC") {
            finalDebt = debtData.totalDebt.toString() / 10**6;
        }
        console.log("Total debt: ", finalDebt.toFixed(0));
        console.log("\n-----total debt-----\n")
        await delay(10000);

        // Repays total debt and gets the NFT back
        const repayAmountV2 = finalDebt + 1;
        console.log("repay amount: ", repayAmountV2);
        await localBRE.run("lendpool:repay", {
            collection: nftAssets[k], 
            tokenid: tokenIds[i].toString(), 
            reserve: reserves[j], 
            amount: repayAmountV2.toFixed(0).toString()
        }); 
        console.log("\n-----final amount repayed-----\n")
        await delay(10000);

        // Gets the normalized income
        await localBRE.run("lendpool:getReserveNormalizedIncome", {reserve: reservesAddresses[j]}); 
        console.log("\n-----Reserve Normalized Income-----\n")
        await delay(10000);

        // gets the normalized variable debt
        await localBRE.run("lendpool:getReserveNormalizedVariableDebt", {reserve: reservesAddresses[j]}); 
        console.log("\n-----Reserve Normalized Variable Debt-----\n")
        await delay(10000);
        // amount of time to restart (3m)
        await delay(180000);
        i++
        j = 1 - j;
    }
});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// getBalance if < 150 ETH stops   


