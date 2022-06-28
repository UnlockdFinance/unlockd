# Unlockd protocol 1.0.0 specification

## Table of contents
1.  [Unlockd Protocol](#unlockd-protocol)
1.  [Architecture](#architecture)
1.  [Contracts](#contracts)
    1.  [NFT Oracle](#nftoracle)
1.  [Contract Interactions](#contract-interactions)  
TO DO: Add important use cases
1.  [Events](#events)  
1.  [Miscellaneous](#miscellaneous)  
# Unlockd Protocol
Unlockd is a decentralized non-custodial peer-to-pool based NFT liquidity protocol that enables NFT owners to unlock the full potential of their assets. Thanks to Unlockd's [single NFT appraisal-based model](#nft-oracle), borrowers can deposit their NFT as collateral and borrow high LTV loans, while lenders can earn yields by providing liquidity.  
The following document links the key functionalities and use cases on the protocol, and enables the reader to fully understand how Unlockd works under the hood.
# Architecture
The Unlockd protocol modularizes the contract pipeline through `proxy` contracts

# Contracts
## LendPool (LendPool.sol)
The LendPool contract holds the main interactions with the protocol. It allows users to deposit and withdraw assets from the reserves, borrow, repay a borrowed amount on a specific reserve and liquidate a non-healthy position (health factor < 1). It also configures and initializes the reserves and NFTs, and provides users with some useful getters to fetch relevant protocol data.  
### View methods
#### getReserveConfiguration()
```
function getReserveConfiguration(address asset) external view override returns (DataTypes.ReserveConfigurationMap memory)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the reserve |

Returns
Type          |  Description        |
------------- |    ------------- |
DataTypes.ReserveConfigurationMap      | The configuration of the reserve |

This function returns the configuration of the reserve.
It should:
1. Return the ReserveConfigurationMap for the requested reserve
#### getNftConfiguration()
```
function getNftConfiguration(address asset) external view override returns (DataTypes.NftConfigurationMap memory)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the asset of the NFT |

Returns
Type          |  Description        |
------------- |    ------------- |
DataTypes.NftConfigurationMap      | The configuration of the NFT |

This function returns the configuration of the NFT.
It should:
1. Return the NftConfigurationMap for the requested reserve
#### getReserveNormalizedIncome()
```
function getReserveNormalizedIncome(address asset) external view override returns (uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the reserve |

Returns
Type          |  Description        |
------------- |    ------------- |
uint256      | The reserve's normalized income |

This function returns the reserve's normalized income.
It should:
1. Return the uint256 value of the reserve's normalized income
#### getReserveNormalizedVariableDebt()
```
function getReserveNormalizedVariableDebt(address asset) external view override returns (uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the reserve |

Returns
Type          |  Description        |
------------- |    ------------- |
uint256      | The reserve's normalized variable debt |

This function returns the reserve's normalized  variable debt.
It should:
1. Return the uint256 value of the reserve's normalized variable debt
#### getReserveData()
```
function getReserveData(address asset) external view override returns (DataTypes.ReserveData memory)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the reserve |

Returns:
Type          |  Description        |
------------- |    ------------- |
DataTypes.ReserveData      | The state of the reserve |

This function returns the state and configuration of the reserve
It should:
1. Return the ReserveData for the requested asset of the reserve
2. Return an empty struct if the requested asset does not exist in the protocol
#### getNftData()
```
function getNftData(address asset) external view override returns (DataTypes.NftData memory)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the NFT |

Returns:
Type          |  Description        |
------------- |    ------------- |
DataTypes.NftData memory      | The state and configuration of the nft |

This function returns the state and configuration of the NFT
It should:
1. Return the NftData for the requested NFT
2. Return an empty struct if the requested NFT does not exist in the protocol
#### getNftCollateralData()
```
function getNftCollateralData(
    address nftAsset,
    uint256 nftTokenId,
    address reserveAsset
  )
    external
    view
    override
    returns (
      uint256 totalCollateralInETH,
      uint256 totalCollateralInReserve,
      uint256 availableBorrowsInETH,
      uint256 availableBorrowsInReserve,
      uint256 ltv,
      uint256 liquidationThreshold,
      uint256 liquidationBonus
    )
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the NFT |
| nftTokenId         | uint256       | The token ID of the NFT |
| reserveAsset         | address       | The address of the Reserve |

Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The total collateral in ETH of the NFT |
uint256      | The total collateral in Reserve of the NFT |
uint256      | The borrowing power in ETH of the NFT |
uint256      | The borrowing power in Reserve of the NFT |
uint256      | The loan to value of the user |
uint256      | The liquidation threshold of the NFT |
uint256      | The liquidation bonus of the NFT |

This function returns the loan data of the NFT
It should:
1. Return the total collateral in ETH of the NFT
2. Return the total collateral in Reserve of the NFT
3. Return the borrowing power in ETH of the NFT
4. Return the borrowing power in Reserve of the NFT
5. Return the loan to value of the user
6. Return the liquidation threshold of the NFT
7. Return the liquidation bonus of the NFT
#### getNftDebtData()
```
function getNftDebtData(address nftAsset, uint256 nftTokenId)
    external
    view
    override
    returns (
      uint256 loanId,
      address reserveAsset,
      uint256 totalCollateral,
      uint256 totalDebt,
      uint256 availableBorrows,
      uint256 healthFactor
    )
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the NFT |
| nftTokenId         | uint256       | The token ID of the NFT |

Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The loan id of the NFT |
uint256      | The address of the Reserve |
uint256      | The total power of the NFT |
uint256      | The total debt of the NFT |
uint256      | The borrowing power left of the NFT |
uint256      | The current health factor of the NFT |

This function returns the debt data of the NFT
It should:
1. Return the loan id of the NFT
2. Return the address of the Reserve
3. Return the total power of the NFT
4. Return the total debt of the NFT
5. Return the borrowing power left of the NFT
6. Return the current health factor of the NFT
7. Return 0 on all return variables if the loan ID obtained of the NFT is equal to 0
#### getNftAuctionData()
```
function getNftAuctionData(address nftAsset, uint256 nftTokenId)
    external
    view
    override
    returns (
      uint256 loanId,
      address bidderAddress,
      uint256 bidPrice,
      uint256 bidBorrowAmount,
      uint256 bidFine
    )
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the NFT |
| nftTokenId         | uint256       | The token ID of the NFT |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The loan id of the NFT |
address      | The highest bidder address of the loan |
uint256      | The highest bid price in Reserve of the loan |
uint256      | The borrow amount in Reserve of the loan |
uint256      | The penalty fine of the loan|

This function returns the auction data of the NFT
It should:
1. Return the loan id of the NFT 
2. Return the highest bidder address of the loan
3. Return the highest bid price in Reserve of the loan
4. Return the borrow amount in Reserve of the loan
5. Return the penalty fine of the loan
6. Return 0 on all uint256 return variables and the 0 address in the highest bidder address if the loan ID obtained of the NFT is equal to 0
#### getNftLiquidatePrice()
```
function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId)
    external
    view
    override
    returns (uint256 liquidatePrice, uint256 paybackAmount)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the NFT asset |
| nftTokenId         | address       | The token ID of the NFT |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The liquidate price for the NFT |
uint256      | The payback amount |

This function returns the liquidate price for an NFT
It should:
1. Return the liquidate price for requested NFT
2. Return the payback amount
#### getReservesList()
```
function getReservesList() external view override returns (address[] memory)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address[]     | The list of active reserves |
This function returns the current active reserves
It should:
1. Return a list containing the addresses of the current active reserves
#### getNftsList()
```
function getNftsList() external view override returns (address[] memory)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address[]     | The list of active NFTs |
This function returns the current active NFTs
It should:
1. Return a list containing the addresses of the current initialized NFT collections
#### paused()
```
function paused() external view override returns (bool)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
bool     | The state of the lendpool |
This function returns the current state (active/inactive) of the LendPool
It should:
1. Return true if the LendPool is active, or false if theLendPool is inactive
#### getAddressesProvider()
```
function getAddressesProvider() external view override returns (ILendPoolAddressesProvider)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
ILendPoolAddressesProvider     | The address provider for this contract |
This function returns the cached LendPoolAddressesProvider connected to this contract
It should:
1. Return the ILendPoolAddressesProvider connected to the Lend Pool
#### getMaxNumberOfReserves()
```
 function getMaxNumberOfReserves() public view override returns (uint256)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256     | The max number of reserves |
This function returns the maximum number of reserves supported to be listed in this LendPool
It should:
1. Return the maximum number of reserves
#### getMaxNumberOfNfts()
```
 function getMaxNumberOfNfts() public view override returns (uint256) 
```
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256     | The max number of NFTs |
This function returns the maximum number of NFTs supported to be listed in this LendPool
It should:
1. Return the maximum number of NFTs










## NFT Oracle
The NFTOracle contract’s purpose is to hold the prices of all the NFT assets in the Unlockd protocol. It acts as a database and allows other components from the protocol to interact with it and  fetch price information for single or multiple assets. Contracts in the protocol such as [UiPoolDataProvider](#uipooldataprovider) or [GenericLogic](#genericlogic) reference the prices in this oracle. The NFT Oracle contract is responsible for: 

1.  Storing price data of all the NFTs supported by the Unlockd protocol (for both single and multiple NFTs)
2.  Allowing other contracts in the protocol to fetch prices for NFTs
2.  Updating price data of the NFTs supported by the Unlockd protocol

### NFT Oracle methods
- Set Collections: adds multiple collections to the protocol
```
function setCollections(address[] calldata _collections) external onlyOwner
```
- Add Collection: Adds a single collection to the protocol
```
function addCollection(address _collection) external onlyOwner
```
- Set NFT Price: Sets the price for a single NFT
```
function setNFTPrice(
    address _collection,
    uint256 _tokenId,
    uint256 _price
  ) external override onlyOwner
```
- Set multiple prices: Sets the price for multiple NFTs
```
function setMultipleNFTPrices(
    address[] calldata _collections,
    uint256[] calldata _tokenIds,
    uint256[] calldata _prices
  ) external override onlyOwner
```
- Get NFT price: Fetches the price for a single NFT
```
function getNFTPrice(
    address _collection, 
    uint256 _tokenId
    ) external view override onlyExistingCollection(_collection)
    returns (uint256)
```
- Get multiple prices: Fetches prices for multiple NFTs
```
function getMultipleNFTPrices(
    address[] calldata _collections, 
    uint256[] calldata _tokenIds
    ) external view override onlyExistingCollections(_collections)
    returns (uint256[] memory)
```
# Contract interactions
The diagrams provided below demonstrate interactions between various Unlockd smart contracts that make up the protocol. 
TO DO: Create protocol diagrams

...

# Deployment process
1. Delete the ./deployments/deployed-contracts-rinkeby.json file
2. Open ./markets/common.ts and ./markets/index.ts
3. On common.ts: 
    1. PoolAdmin: add first address, and a second one in the EmergencyAdmin
    1. ProxyAdminPool and ProxyAdminFund: add undefined
    1. UNFTRegistry: empty
    1. ProviderRegistry: empty
    1. ProviderRegistryOwner: add first account
    1. ReserveOracle and NFTOracle: empty
    1. ReserveAggregators: empty
    1. ReserveAssets: empty
    1. NftsAssets: empty
    1. Wrappednativetoken: empty
    1. CryptoPunksMarket: empty
    1. WrappedPunkToken: empty
    1. ReserveFactorTreasuryAddress: add your secondary address
    1. IncentivesController: add your first address
4. Open index.ts:  
    1.  ReserveAssets: empty
    1.  NftsAssets: empty
5. Clean the environment:
```
npm run ci:clean
```
6. Compile the project:
```
npm run compile
```
7. Deploy the mock aggregator contracts:
```
npx hardhat dev:deploy-all-mock-aggregators --pool Unlockd --network rinkeby
```
8. Open commons.ts file:  
    1. Get the deployed addresses for DAI, USDC and USD, and add them in the ReserveAggregators 
    1. Get the WETH address obtained in the deploying, and add it to WrappedNativeToken
9. Deploy the mock reserves:
```
npx hardhat dev:deploy-mock-reserves --network rinkeby
```
10. Open the index.ts file  
    1. Get the deployed addresses for USDC, DAI, Aand WETH and add them to the ReserveAssets in the index.ts file
11. Deploy the mock NFTs:
```
npx hardhat dev:deploy-mock-nfts --network rinkeby
``` 
  1. Replace the cryptopunksmarket in the commons.ts file
  1. Replace the WrappedPunk address in the commons.ts file (don't confuse with WPunks)
  1. Replace the rest of the mock contract addresses in the index.ts file

12. Deploy the UNFT registry
```
npx hardhat dev:deploy-mock-unft-registry --pool Unlockd --network rinkeby
```

  1. Add the deployed UNFTRegistry contract to the UNFTRegistry on the commons.ts file 

13. Deploy the mock UNFT tokens
```
npx hardhat dev:deploy-mock-unft-tokens --pool Unlockd --network rinkeby
```
(Note: the deployed addresses should not be copied to any file)

14. Deploy the proxy admin:
```
npx hardhat full:deploy-proxy-admin --pool Unlockd --network rinkeby
```
  1. Add the ProxyAdminPool and ProxyAdminFund to the commons.ts file 

15. Deploy the address provider:

```
npx hardhat dev:deploy-address-provider --pool Unlockd --network rinkeby
```
  1. Copy the LendPoolAddressesProviderRegistry and add it to ProviderRegistry on the commonts.ts file
16. Deploy the lend pool:
```
npx hardhat dev:deploy-lend-pool --pool Unlockd --network rinkeby
```
(note: don't add any of these addresses to the files)  
17. Deploy the reserve oracle:
```
npx hardhat dev:deploy-oracle-reserve --pool Unlockd --network rinkeby
```  
18. Deploy the NFT Oracle
```
npx hardhat dev:deploy-oracle-nft --pool Unlockd --network rinkeby
```  
19. Deploy the WETH gateway
```
npx hardhat full:deploy-weth-gateway --pool Unlockd --network rinkeby
```
(note: if it does not work, change the weth-gateway.ts file, remove the undefined in line 49 and set wethGatewayAddress to theawait clause. If it fails again, change the const initEncodedData in line 40 like:
```
 const initEncodedData = '0x';
````
After that, change the initEncodedData again to the previous value (the wethGatewayImpl.interface.encodeFuntionData)).  
20. Deploy the Punk Gateway:
```
npx hardhat full:deploy-punk-gateway --pool Unlockd --network rinkeby
```
21. Initialize the lend pool:
```
npx hardhat dev:initialize-lend-pool --pool Unlockd --network rinkeby
```
(note: this step fails due to bad authorization of the WETH gateway.)
22. Deploy the unlockd collector
```
npx hardhat full:deploy-unlockd-collector --pool Unlockd --network rinkeby
```
23. To check the deployed contracts run:
```
npx hardhat contracts --network rinkeby
```
24. Open the console
```
npx hardhat --network main console
```
25. Interact with the contracts:
```
const contractGetters = require('./helpers/contracts-getters');
const contractDeployments = require('./helpers/contracts-deployments');
const configuration = require('./helpers/configuration');
const types = require('./helpers/types');
const poolConfig = configuration.loadPoolConfig("Unlockd");

const signer = await contractGetters.getFirstSigner();
//Add the address to your lend pool
const lendPool = await contractGetters.getLendPool("here goes the address");
```