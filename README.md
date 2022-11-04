# Unlockd Protocol

This repository contains the smart contracts source code and markets configuration for Unlockd Protocol. The repository uses Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Unlockd?

Unlockd is a decentralized non-custodial NFT lending protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized fashion, using NFTs as collaterl.

## Documentation

The documentation of Unlockd Protocol is in the following [Unlockd documentation](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/Documentation.md) link. At the documentation you can learn more about the protocol, see the contract interfaces, integration guides and audits.

For getting the latest contracts addresses, please check the [Deployed contracts](https://docs.unlockddao.xyz/developers/deployed-contracts) page at the documentation to stay up to date.

## Audits
1. [Halborn](link-to-docs).

## Thanks
Unlockd protocol refers to the architecture design and adopts some of the code of [AAVE](https://github.com/aave).
We are very grateful to AAVE for providing us with an excellent DeFi platform.

## Connect with the community

You can join at the [Discord](https://discord.gg/unlockddao) channel or at the [Governance](https://snapshot.org/#/unlockddao.eth) for asking questions about the protocol or talk about Unlockd with other peers.

## Getting Started

## Setup

- install using yarn install

- Create an enviroment file named `.env` and fill the next enviroment variables

```
# Mnemonic, only first address will be used
MNEMONIC=""

# Add Alchemy or Infura RPC Endpoint keys, alchemy takes preference at the config level
RPC_ENDPOINT=""

# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""
ETHERSCAN_NETWORK="" # network in use
```

## Markets configuration

The configurations related with the Unlockd Markets are located at `markets` directory. You can follow the `IUnlockdConfiguration` interface to create new Markets configuration or extend the current Unlockd configuration.

Each market should have his own Market configuration file, and their own set of deployment tasks, using the Unlockd market config and tasks as a reference.

## Test

You can run the full test suite with the following commands:

```
# install dependencies
yarn install

# A new Bash terminal is prompted, connected to the container
npm run test
```

## Deployments

For deploying Unlockd Protocol, you can use the available scripts located at `package.json`. For a complete list, run `npm run` to see all the tasks.

### Prepare
```
# install dependencies
yarn install

# Runing NPM task
# npm run xxx
```

### Localhost dev deployment
```
# In first terminal
npm run hardhat:node

# In second terminal
npm run unlockd:localhost:dev:migration
```

### Localhost full deployment
```
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

### Rinkeby mock deployment (a full deployment may not run because of ERC20 and ERC721 Reserves)
```
# In one terminal
npm run unlockd:goerli:mock:migration
```

## Interact with Unlockd in Mainnet via console

You can interact with Unlockd at Mainnet network using the Hardhat console, in the scenario where the frontend is down or you want to interact directly. You can check the deployed addresses at [deployed-contracts](https://docs.unlockddao.xyz/developers/deployed-contracts).

Run the Hardhat console pointing to the Mainnet network:

```
npx hardhat --network main console
```

At the Hardhat console, you can interact with the protocol:

```
// Load the HRE into helpers to access signers
run("set-DRE")

// Import getters to instance any Unlockd contract
const contractGetters = require('./helpers/contracts-getters');

// Load the first signer
const signer = await contractGetters.getFirstSigner();

// Lend pool instance
const lendPool = await contractGetters.getLendPool("");

// ERC20 token WETH Mainnet instance
const WETH = await contractGetters.getIErc20Detailed("");

// Approve 10 WETH to LendPool address
await WETH.connect(signer).approve(lendPool.address, ethers.utils.parseUnits('10'));

// Deposit 10 WETH
await lendPool.connect(signer).deposit(DAI.address, ethers.utils.parseUnits('10'), await signer.getAddress(), '0');
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
# unlockd-core
