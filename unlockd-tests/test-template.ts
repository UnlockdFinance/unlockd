import {lendPoolContract, erc20Contract } from "./constants";
import {getWallet } from "./helpers/config"; 
import deployments from "../deployments/deployed-contracts-rinkeby.json"

const testFunction = async () => {

    const wallet = await getWallet();
    //const al = await erc20Contract.allowance("0x94aBa23b9Bbfe7bb62A9eB8b1215D72b5f6F33a1", "0xE5564C8aAD053fBb83C22C249F8c86d61247117d");
    //console.log(al);
    
    const ap = await erc20Contract.connect(wallet).approve(deployments.LendPool.address, "100000000000000000000000"); // 100k
    await ap.wait();
    console.log(ap);
    
    const dep = await lendPoolContract.connect(wallet).deposit(
        deployments.DAI.address, "100000000000000000000000", "0x94aBa23b9Bbfe7bb62A9eB8b1215D72b5f6F33a1", 0
    );
    await dep.wait();
    console.log(dep);

    const wit = await lendPoolContract.connect(wallet).withdraw(
        deployments.DAI.address, "50000000000000000000000", "0x94aBa23b9Bbfe7bb62A9eB8b1215D72b5f6F33a1"
    );
    await wit.wait();
    console.log(wit);
    
};
testFunction().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  
 