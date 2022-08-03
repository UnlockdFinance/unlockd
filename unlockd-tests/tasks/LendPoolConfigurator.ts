import { task } from "hardhat/config";
import { Functions } from "../helpers/protocolFunctions";
import { getOwnerWallet } from "../helpers/config"; 
 
/** 
 * This file will use the LendPoolConfigurator 
 * for full reference check the ILendPoolConfigurator.sol
*/
task("configurator:setActiveFlagOnNft", "Activates or Deactivates the reserves")
.addParam("assets", "NFT addresses") 
.addParam("state", "A boolean, True for Active; False for Deactive") 
.setAction( async ({assets, state }) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.setActiveFlagOnNft(wallet, [assets], state)
    console.log(tx);
}); 

task("configurator:configureNftAsCollateral", 
"configure the ltv, liquidationThreshold, liquidationBonus for a reserve asset.")
.addParam("assets", "The new Market Id string/name") 
.addParam("ltv", "Loan to value, value") 
.addParam("threshold", "Liquidation treshold value") 
.addParam("bonus", "Liquidation bonus value") 
.setAction( async ({assets, ltv, threshold, bonus}) => {
    const wallet = await getOwnerWallet();  

    const tx = await Functions.LENDPOOLCONFIGURATOR.configureNftAsCollateral(wallet, [assets], ltv, threshold, bonus)
    console.log(tx);
}); 