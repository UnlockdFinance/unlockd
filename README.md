<p align="center" style="margin-bottom:32px">
  <a href="https://unlockd.finance">
    <img alt="Unlockd logo" src="https://miro.medium.com/max/660/1*YEp9mC_4sVUuFpBzatz3dQ.png" width="auto" height="92px" />
  </a>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="figma"/>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript"/>   
    <img src="https://img.shields.io/badge/Solidity-e6e6e6?style=for-the-badge&logo=solidity&logoColor=black" alt="solidity"/>  
    <img src="https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" alt="google-cloud"/>

[![](https://dcbadge.vercel.app/api/server/unlockd)](https://discord.gg/unlockd)

</p>

<p align="center">
Unlockd is a decentralized non-custodial NFT lending protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized fashion, using NFTs as collaterl.
</p>

<p align="center">
This repository contains the smart contracts source code and markets configuration for Unlockd Protocol. The repository uses Hardhat as development enviroment for compilation, testing and deployment tasks.
</p>
<br/>

> **🙇‍♂️ Thanks**
> Unlockd protocol refers to the architecture design and adopts some of the code of [AAVE](https://github.com/aave).
> We are very grateful to AAVE for providing us with an excellent DeFi platform.

You can join at the [Discord](https://discord.gg/unlockd) channel or at the [Governance](https://snapshot.org/#/unlockddao.eth) for asking questions about the protocol or talk about Unlockd with other peers.

# 🗂️ Index

- [Documentation](#-documentation)
- [Setup](#-setup)
- [Test](#-test)
- [Tasks](#tasks)
- [Deployment](#-deployment)
- [Audit](#%EF%B8%8F-audits)

# 📝 Documentation

The documentation of Unlockd Protocol is in the following [Unlockd documentation](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/Documentation.md) link. At the documentation you can learn more about the protocol, see the contract interfaces, integration guides and audits.

For getting the latest contracts addresses, please check the [Deployed contracts](https://docs.unlockddao.xyz/developers/deployed-contracts) page at the documentation to stay up to date.

# 👁️ Audits

1. [Halborn](link-to-docs).

# 🎬 Setup

- Install

```bash
yarn install
```

- Create an enviroment file named `.env` and fill the next enviroment variables

```bash
# Mnemonic, only first address will be used
MNEMONIC=""

# Add Alchemy or Infura RPC Endpoint keys,
RPC_ENDPOINT=""

# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""
ETHERSCAN_NETWORK="" # network in use
```

# 🧪 Test

You can run the full test suite with the following commands:

```bash
npm run test
```

## Markets configuration

The configurations related with the Unlockd Markets are located at `markets` directory. You can follow the `IUnlockdConfiguration` interface to create new Markets configuration or extend the current Unlockd configuration.

Each market should have his own Market configuration file, and their own set of deployment tasks, using the Unlockd market config and tasks as a reference.

# ✅ Tasks

| First Header                     | Second Header                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| run-env                          | Installs dependencies without verbose logging                                                                               |
| hardhat                          | Executes hardhat command                                                                                                    |
| hardhat:node                     | Starts a Hardhat Network node                                                                                               |
| hardhat:localhost                | Executes hardhat command, setting network to `localhost`                                                                    |
| hardhat:goerli                   | Executes hardhat command, setting network to `goerli`                                                                       |
| hardhat:main                     | Executes hardhat command, setting network to `main`                                                                         |
| size                             | Logs size of current contracts                                                                                              |
| compile                          | Compiles the contracts                                                                                                      |
| test                             | Runs all tests in `./test/`, setting network to `Hardhat` network                                                           |
| test:localhost                   | Runs all tests in `./test/`, setting network to `localhost` network                                                         |
| test:file                        | Allows to test for a specific file. The file can be specified in the command line setting it to be equal to `TEST_FILE` var |
| dev:update-abis                  | Fetches abis from latest contracts data in `./artifacts` and sets them to `./abis` folder                                   |
| prettier:abis                    | Standarizes the abis code style in `./abis` folder                                                                          |
| prettier:check                   | Checks the code style in the project                                                                                        |
| prettier:write                   | Standarizes the code style in the project                                                                                   |
| ci:clean                         | Runs a hardhat clean and removes all temporal and autogenerated files and folders                                           |
| unlockd:hardhat:dev:migration    | Deploys the Unlockd protocol development environment in the hardhat network                                                 |
| unlockd:localhost:dev:migration  | Deploys the Unlockd protocol development environment in localhost                                                           |
| unlockd:goerli:mock:migration    | Deploys mock environment in Goerli testnet                                                                                  |
| unlockd:localhost:full:migration | Deploys the full Unlockd protocol in localhost                                                                              |
| unlockd:goerli:full:migration    | Deploys the full Unlockd protocol in Goerli testnet                                                                         |
| unlockd:fork:full:migration      | Deploys the full Unlockd protocol in the forked network of choice, set at the environment variables                         |
| unlockd:main:full:migration      | Deploys the full Unlockd protocol in Ethereum mainnet                                                                       |
| goerli:verify                    | Verifies in Etherscan all contracts deployed in Goerli                                                                      |
| goerli:verify:reserves           | Verifies in Etherscan all reserves contracts deployed in Goerli testnet                                                     |
| goerli:print-contracts           | Prints all current deployed contracts in Goerli testnet                                                                     |
| goerli:print-config              | Content Cell                                                                                                                |
| main:verify                      | Verifies in Etherscan all reserves contracts deployed in Ethereum mainnet                                                   |
| main:verify:reserves             | Content Cell                                                                                                                |
| main:print-contracts             | Content Cell                                                                                                                |
| main:print-config                | Content Cell                                                                                                                |
| prepublishOnly                   | Content Cell                                                                                                                |

# 🚀 Deployments

For deploying Unlockd Protocol, you can use the available scripts located at `package.json`. For a complete list, run `npm run` to see all the tasks.

### Prepare

```bash
# install dependencies
yarn install

# Runing NPM task
# npm run xxx
```

### Localhost dev deployment

```bash
# In first terminal
npm run hardhat:node

# In second terminal
npm run unlockd:localhost:dev:migration
```

### Localhost full deployment

```bash
# In first terminal
npm run hardhat:node

# In second terminal
npx hardhat --network localhost "dev:deploy-mock-reserves"
# then update pool config reserve address

npx hardhat --network localhost "dev:deploy-mock-nfts"
# then update pool config nft address

npx hardhat --network localhost "dev:deploy-mock-aggregators" --pool Unlockd
# then update pool config reserve aggregators address

npx hardhat --network localhost "dev:deploy-mock-unft-registry" --pool Unlockd
# then update pool config unft registry address

npx hardhat --network localhost "dev:deploy-mock-unft-tokens" --pool Unlockd
```

### Goerli mock deployment (a full deployment may not run because of ERC20 and ERC721 Reserves)

```bash
# In one terminal
npm run unlockd:goerli:mock:migration
```

## Interact with Unlockd in Mainnet via console

You can interact with Unlockd at Mainnet network using the Hardhat console, in the scenario where the frontend is down or you want to interact directly. You can check the deployed addresses at [deployed-contracts](https://docs.unlockddao.xyz/developers/deployed-contracts).

Run the Hardhat console pointing to the Mainnet network:

```bash
npx hardhat --network main console
```

At the Hardhat console, you can interact with the protocol:

```javascript
// Load the HRE into helpers to access signers
run("set-DRE");

// Import getters to instance any Unlockd contract
const contractGetters = require("./helpers/contracts-getters");

// Load the first signer
const signer = await contractGetters.getFirstSigner();

// Lend pool instance
const lendPool = await contractGetters.getLendPool("");

// ERC20 token WETH Mainnet instance
const WETH = await contractGetters.getIErc20Detailed("");

// Approve 10 WETH to LendPool address
await WETH.connect(signer).approve(lendPool.address, ethers.utils.parseUnits("10"));

// Deposit 10 WETH
await lendPool.connect(signer).deposit(DAI.address, ethers.utils.parseUnits("10"), await signer.getAddress(), "0");
```

## Tools

This project integrates other tools commonly used alongside Hardhat in the ecosystem.

It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat tests:interestRate:variableRateSlope1
npx hardhat tests:interestRate:variableRateSlope2
npx hardhat tests:interestRate:baseVariableBorrowRate
npx hardhat lendpool:deposit
npx hardhat lendpool:withdraw
npx hardhat lendpool:borrow
npx hardhat lendpool:getcollateraldata
npx hardhat lendpool:getdebtdata
npx hardhat lendpool:redeem
npx hardhat lendpool:repay
npx hardhat reserveoracle:getassetprice
npx hardhat tests:provider:getMarketId
npx hardhat tests:provider:getLendPoolLiquidator
npx hardhat tests:provider:setLendPoolLiquidator
npx hardhat nftoracle:getnftprice
npx hardhat nftoracle:setnftprice
npx hardhat nftoracle:getoracleowner
npx hardhat lendpoolloan:getloanidtracker
npx hardhat lendpoolloan:getloan
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Goerli.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Goerli node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network goerli scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
