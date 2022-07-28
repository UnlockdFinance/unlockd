import { Contract} from "ethers";
import dotenv from 'dotenv';
//Protocol imports
import debtTokenArtifact from "../../artifacts/contracts/protocol/DebtToken.sol/DebtToken.json";
import interestRateArtifact from "../../artifacts/contracts/protocol/InterestRate.sol/InterestRate.json";
import lendPoolArtifact from "../../artifacts/contracts/protocol/LendPool.sol/LendPool.json";
import lendPoolAddressesProviderArtifact from "../../artifacts/contracts/protocol/LendPoolAddressesProvider.sol/LendPoolAddressesProvider.json";
import lendPoolAddressesProviderRegistryArtifact from "../../artifacts/contracts/protocol/LendPoolAddressesProviderRegistry.sol/LendPoolAddressesProviderRegistry.json";
import lendPoolConfiguratorArtifact from "../../artifacts/contracts/protocol/LendPoolConfigurator.sol/LendPoolConfigurator.json";
import lendPoolLoanArtifact from "../../artifacts/contracts/protocol/LendPoolLoan.sol/LendPoolLoan.json";
import lendPoolStorageArtifact from "../../artifacts/contracts/protocol/LendPoolStorage.sol/LendPoolStorage.json";
import lendPoolStorageExtArtifact from "../../artifacts/contracts/protocol/LendPoolStorageExt.sol/LendPoolStorageExt.json";
import nftOracleArtifact from "../../artifacts/contracts/protocol/NFTOracle.sol/NFTOracle.json";
import punkGatewayArtifact from "../../artifacts/contracts/protocol/PunkGateway.sol/PunkGateway.json";
import reserveOracleArtifact from "../../artifacts/contracts/protocol/ReserveOracle.sol/ReserveOracle.json";
import uTokenArtifact from "../../artifacts/contracts/protocol/UToken.sol/UToken.json";
import wethGatewayArtifact from "../../artifacts/contracts/protocol/WETHGateway.sol/WETHGateway.json";
//Mock imports
import erc20Artifact from "../../artifacts/contracts/mock/MintableERC20.sol/MintableERC20.json";
import erc721Artifact from "../../artifacts/contracts/mock/MintableERC721.sol/MintableERC721.json";
import deployments from "../../deployments/deployed-contracts-rinkeby.json"

dotenv.config();

 

// Protocol
const debtTokenContract = new Contract(deployments.DebtToken.address, debtTokenArtifact.abi);
//const emergencyTokenRecoveryContract = new Contract(deployments.DebtToken.address, addressesProviderArtifact.abi); //not deployed
//const incentivizedERC20Contract = new Contract(deployments.DebtToken.address, addressesProviderArtifact.abi); //not deployed
const interestRateContract = new Contract(deployments.InterestRate.address, interestRateArtifact.abi);
const lendPoolContract = new Contract(deployments.LendPool.address, lendPoolArtifact.abi);
const lendPoolAddressesProviderContract = new Contract(deployments.LendPoolAddressesProvider.address, lendPoolAddressesProviderArtifact.abi);
const lendPoolAddressesProviderRegistryContract = new Contract(deployments.LendPoolAddressesProviderRegistry.address, lendPoolAddressesProviderRegistryArtifact.abi);
const lendPoolConfiguratorContract = new Contract(deployments.LendPoolConfigurator.address, lendPoolConfiguratorArtifact.abi);
const lendPoolLoanContract = new Contract(deployments.LendPoolLoan.address, lendPoolLoanArtifact.abi);
//const lendPoolStorageContract = new Contract(deployments.lendpoo.address, lendPoolLoanArtifact.abi); //not deployed
//const lendPoolStorageExtContract = new Contract(deployments.len.address, lendPoolLoanArtifact.abi); //not deployed
const nftOracleContract = new Contract(deployments.NFTOracle.address, nftOracleArtifact.abi);
const punkGatewayContract = new Contract(deployments.PunkGateway.address, punkGatewayArtifact.abi);
const reserveOracleContract = new Contract(deployments.ReserveOracle.address, reserveOracleArtifact.abi);
const uTokenContract = new Contract(deployments.UToken.address, uTokenArtifact.abi);
const wethGatewayContract = new Contract(deployments.WETHGateway.address, wethGatewayArtifact.abi);


export const Contracts = {
    debtToken: debtTokenContract,
    interestRate: interestRateContract,
    lendPool: lendPoolContract,
    lendPoolAddressesProvider: lendPoolAddressesProviderContract,
    lendPoolAddressesProviderRegistry: lendPoolAddressesProviderRegistryContract,
    lendPoolConfigurator: lendPoolConfiguratorContract,
    lendPoolLoan: lendPoolLoanContract,
    nftOracle: nftOracleContract,
    punkGateway: punkGatewayContract,
    reserveOracle: reserveOracleContract,
    uToken: uTokenContract,
    wethGateway: wethGatewayContract,
}


// Mocks
const daiContract = new Contract(deployments.DAI.address, erc20Artifact.abi);
const usdcContract = new Contract(deployments.USDC.address, erc20Artifact.abi);
const baycContract = new Contract(deployments.BAYC.address, erc721Artifact.abi);
 
export const MockContracts = {
    DAI: daiContract,
    USDC: usdcContract,
    BAYC: baycContract,
}
