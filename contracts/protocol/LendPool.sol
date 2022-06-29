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

### State Changing Functions
#### initialize()
```
function initialize(ILendPoolAddressesProvider provider) public initializer
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | ILendPoolAddressesProvider       | The address of the addresses provider |  
This function initializes the proxy contract.
It should:  
1. Set the max number of reserves to 32
2. Set the max number of NFTs to 256
3. Set the addresses provider to the address passed as parameter
#### deposit()
```
function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external override nonReentrant whenNotPaused
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset to deposit |
| amount         | uint256       | The amount to be deposited |
| onBehalfOf         | address       | The address that will receive the uTokens, same as msg.sender if the user wants to receive them on his own wallet, or a different address if the beneficiary of bTokens is a different wallet |
| referralCode         | uint16       | Code used to register the integrator originating the operation, for potential rewards. |
This function deposits an `amount` of underlying asset into a reserve, receiving uTokens in return.
It should:  
1. Execute the deposit of the amount of underlying asset into a reserve
2. Return uTokens to the depositor if the deposit is succesful
#### withdraw()
```
function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external override nonReentrant whenNotPaused returns (uint256)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset to withdraw |
| amount         | uint256       | The underlying amount to be withdrawn |
| to         | address       | The address that will receive the underlying, same as msg.sender if the user wants to receive it on his own wallet, or a different address if the beneficiary of bTokens is a different wallet |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256     | The final amount withdrawn |
This function withdraws an `amount` of underlying asset from the reserve, burning the equivalent uTokens owned in return.
It should:  
1. Execute the withdraw of the amount of underlying asset 
2. Allow the supply logic to validate and execute the withdrawal
3. Return the final amount withdrawn
#### borrow()
```
function borrow(
    address asset,
    uint256 amount,
    address nftAsset,
    uint256 nftTokenId,
    address onBehalfOf,
    uint16 referralCode
  ) external override nonReentrant whenNotPaused
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset to borrow |
| amount         | uint256       | The amount to be borrowed |
| nftAsset         | address       | The address of the underlying nft used as collateral |
| nftTokenId         | uint256       | The token ID of the underlying nft used as collateral |
| onBehalfOf         | address       | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral |
| referralCode         | uint16       | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man |
This function allows users to borrow a specific `amount` of the reserve underlying asset.
It should: 
1. Allow a user to borrow an amount of tokens from the reserve
2. Deposit an NFT asset as collateral
3. Allow the borrow logic to validate the borrow
#### batchBorrow()
```
function batchBorrow(
    address[] calldata assets,
    uint256[] calldata amounts,
    address[] calldata nftAssets,
    uint256[] calldata nftTokenIds,
    address onBehalfOf,
    uint16 referralCode
  ) external override nonReentrant whenNotPaused
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The array of addresses of the underlying assets to borrow |
| amounts         | uint256[]       | The array of amounts from each reserve to be borrowed |
| nftAssets         | address[]       | The array of addresses of the underlying nfts used as collateral |
| nftTokenIds         | uint256[]       | The array of token IDs of the underlying nfts used as collateral |
| onBehalfOf         | address       | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral |
| referralCode         | uint16       | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man |
This function allows users to borrow multiple `amounts` of the reserves underlying assets, adding several NFTs as collateral.
It should: 
1. Allow a user to borrow from multiple reserves 
2. Deposit multiple NFT assets as collateral
3. Allow the borrow logic to validate the batch borrow
#### repay()
```
function repay(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external override nonReentrant whenNotPaused returns (uint256, bool)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the underlying NFT used as collateral |
| nftTokenId         | uint256       | The token ID of the underlying NFT used as collateral |
| amount         | uint256       | The amount to repay |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256     | The repay amount |
bool     | The updated status of the repayment |
This function repays a borrowed `amount` on a specific reserve, burning the equivalent loan owned.
It should:
1. Allow a user to repay a borrowed amount
2. Allow the borrow logic to validate and execute the repayment
3. Return the paid amount and the update status
#### batchRepay()
```
function batchRepay(
    address[] calldata nftAssets,
    uint256[] calldata nftTokenIds,
    uint256[] calldata amounts
  ) external override nonReentrant whenNotPaused returns (uint256[] memory, bool[] memory)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAssets         | address[]       | The array of addresses of the underlying assets to repay |
| nftTokenIds         | uint256[]       | The array of token IDs of the underlying assets to repay |
| amounts         | uint256[]       | The array of amounts to repay for each asset |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256[]     | The repaid amount |
bool[]     | The updated status of each of the repayments |
This function repays several borrowed `amounts` on multiple reserves, burning the equivalent loans owned.
It should:
1. Allow a user to repay multiple borrowed amounts
2. Allow the borrow logic to validate and execute the repayments
3. Return the paid amounts and the update status for each NFT
#### auction()
```
function auction(
    address nftAsset,
    uint256 nftTokenId,
    uint256 bidPrice,
    address onBehalfOf
  ) external override nonReentrant whenNotPaused
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the underlying NFT used as collateral |
| nftTokenId         | uint256      | The token ID of the underlying NFT used as collateral |
| bidPrice         | uint256       | The bid price of the bidder want to buy underlying NFT |
| onBehalfOf         | uint256       | Address of the user who will get the underlying NFT, same as msg.sender if the user wants to receive them on his own wallet, or a different address if the beneficiary of NFT is a different wallet |
This function allows the auction a non-healthy position collateral-wise
It should:
1. Allow a bidder to buy collateral asset of the user getting liquidated
2. Allow liquidate logic to validate and execute the bidding
#### redeem()
```
function redeem(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount,
    uint256 bidFine
  ) external override nonReentrant whenNotPaused returns (uint256)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the underlying NFT used as collateral |
| nftTokenId         | uint256      | The token ID of the underlying NFT used as collateral |
| amount         | uint256       | The amount to repay the debt |
| bidFine         | uint256       | The amount of bid fine |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256     | The penalty fine of the loan |
This function allows the redeem of a NFT loan which state is in Auction
It should:
1. Allow a user to redeem an auctioned NFT loan
2. Allow the liquidate logic to validate and execute the bidding
3. Return the penalty fine
#### liquidate()
```
function liquidate(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external override nonReentrant whenNotPaused returns (uint256)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the underlying NFT to be liquidated |
| nftTokenId         | uint256      | The token ID of the underlying NFT to be liquidated |
| amount         | uint256       | The amount to pay for the collateral |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256     | The extra debt amount |
This function should liquidate a non-healthy position collateral-wise
It should:
1. Allow the caller (liquidator) buy collateral asset of the user getting liquidated, and receive the collateral asset
2. Allow the liquidate logic to validate and execute the liquidation
#### onERC721Received()
```
function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external pure override returns (bytes4)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| operator         | address       | The address which called `safeTransferFrom` function |
| from         | address      | The address which previously owned the token |
| tokenId         | uint256       | The NFT ID which is being transferred |
| data         | bytes       | Additional data with no specified format |
Returns:
Type          |  Description        |
------------- |    ------------- |
bytes4     | The function signature |
This function should handle the receipt of an NFT
It should:
1. Allow receiving an NFT
#### finalizeTransfer()
```
function finalizeTransfer(
    address asset,
    address from,
    address to,
    uint256 amount,
    uint256 balanceFromBefore,
    uint256 balanceToBefore
  ) external view override whenNotPaused
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the uToken |
| from         | address       | The user from which the uToken are transferred |
| to         | address       | The user receiving the uTokens |
| amount         | uint256       | The amount being transferred/withdrawn |
| balanceFromBefore         | uint256       | The uToken balance of the `from` user before the transfer |
| balanceToBefore         | uint256       | The uToken balance of the `to` user before the transfer |

This function validates and finalizes an uToken transfer
It should:
1. Only be callable by the overlying uToken of the `asset`
2. Allow the valitadion logic to validate the transfer
#### setPause()
```
function setPause(bool val) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| val         | bool       | The bool value to pause/unpause the pool |
This function pauses/unpauses the pool
It should:
1. Pause the pool if the `val` parameter is true
1. Unpause the pool if the `val` parameter is false
#### setMaxNumberOfReserves()
```
function setMaxNumberOfReserves(uint256 val) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| val         | uint256       | The number to set the max number of reserves |
This function sets a maximum number of reserves
It should:
1. Set the maximum number of reserves of the protocol to the specified `val` parameter value
#### setMaxNumberOfNfts()
```
function setMaxNumberOfNfts(uint256 val) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| val         | uint256       | The number to set the max number of NFTs |
This function sets a maximum number of NFTs
It should:
1. Set the maximum number of NFTs of the protocol to the specified `val` parameter value
#### initReserve()
```
function initReserve(
    address asset,
    address uTokenAddress,
    address debtTokenAddress,
    address interestRateAddress
  ) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the reserve |
| uTokenAddress         | address       | The address of the uToken that will be assigned to the reserve |
| debtTokenAddress         | address       | The address of the debtToken that will be assigned to the reserve |
| interestRateAddress         | address       | The address of the interest rate strategy contract |
This function initializes a reserve, activating it, assigning an uToken and nft loan and an interest rate strategy
It should:
1. Initialize the reserve
2. Activate the reserve
3. Assign a uToken, NFT loan and an interest rate strategy
4. Add the reserve to the list of reserves of the protocol
#### initNft()
```
function initNft(address asset, address uNftAddress) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the NFT |
| uNftAddress         | address       | The address of the uNFT that will be assigned to the NFT |
This function initializes an NFT, activating it, assigning an uNftAsset, an NFT loan and an interest rate strategy
It should:
1. Initialize the NFT
2. Activate the NFT
3. Assign a uNFTToken, NFT loan and an interest rate strategy
4. Add the NFT to the list of NFT contracts of the protocol
#### setReserveInterestRateAddress()
```
function setReserveInterestRateAddress(address asset, address rateAddress)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying asset of the reserve |
| rateAddress         | address       | The address of the interest rate strategy contract |
This function updates the address of the interest rate strategy contract
It should:
1. Update the address of the interest rate strategy contract to the `rateAddress`address parameter
#### setNftConfiguration()
```
function setNftConfiguration(address asset, uint256 configuration) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the NFT asset |
| configuration         | address       | The new configuration bitmap |
This function sets the configuration bitmap of the NFT as a whole
It should:
1. Update the NFT `asset` configuration bitmap to the specified `configuration`parameter
#### setNftMaxSupplyAndTokenId()
```
function setNftMaxSupplyAndTokenId(
    address asset,
    uint256 maxSupply,
    uint256 maxTokenId
  ) external override onlyLendPoolConfigurator
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the NFT asset |
| maxSupply         | uint256       | The max supply value |
| maxTokenId         | uint256       | The max token ID value |
This function sets a max supply and max token ID for an asset
It should:
1. Update the asset's max supply to `maxSupply`parameter
2. Update the asset's max token ID to `maxTokenId`parameter
### Internal Functions
#### _addReserveToList()
```
function _addReserveToList(address asset) internal
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the reserve asset |
This function adds a reserve to the protocol's list of reserves
It should:
1. Add the `asset` to the list of reserves
2. Only be called by the `initReserve()` function
#### _addNftToList()
```
function _addNftToList(address asset) internal
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the NFT asset |
This function adds an NFT to the protocol's list of NFTs
It should:
1. Add the `asset` to the list of NFTs
2. Only be called by the `initNFT()` function
#### _verifyCallResult()
```
function _verifyCallResult(
    bool success,
    bytes memory returndata,
    string memory errorMessage
  ) internal pure returns (bytes memory)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| success         | bool       | The address of the NFT asset |
| returnData         | bytes       | The return data|
| errorMessage         | string       | An error message |
This function verifies that a low level call to smart-contract was successful
It should:
1. Verify a low-level call
2. Return the return data if `success` is true
3. Look for a revert reason if the `success`parameter is false













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