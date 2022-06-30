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

## LendPoolAddressesProvider (LendPoolAddressesProvider.sol)
The LendPool Addresses Provider contract is the main registry of addresses part of or connected to the protocol, including permissioned roles. It also acts as a factory of proxies and admin of those, so with right to change its implementations. It is owned by the Unlockd governance
### View methods
#### getMarketId()
```
function getMarketId() external view override returns (string memory)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
string      | The market id|

This function returns the id of the Unlockd market to which this contracts points to
It should:
1. Return the market ID
#### getAddress()
```
function getAddress(bytes32 id) public view override returns (address)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| id         | bytes32       | The id of the address to fetch |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The requested address|

This function returns an address by id
It should:
1. Return the address mapped to the `id` passed as parameter
#### getLendPool()
```
function getLendPool() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The lendpool proxy address|

This function returns the address of the LendPool proxy
It should:
1. Return the LendPool proxy address
#### getLendPoolConfigurator()
```
function getLendPoolConfigurator() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The lendpool configurator proxy address|

This function returns the address of the LendPoolConfigurator proxy
It should:
1. Return the LendPoolConfigurator address
#### getPoolAdmin()
```
function getPoolAdmin() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The lendpool admin address|

This function returns the address of the LendPool admin
It should:
1. Return the LendPool admin address
#### getEmergencyAdmin()
```
function getEmergencyAdmin() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The emergency admin address|

This function returns the address of the emergency admin
It should:
1. Return the emergency admin address
#### getReserveOracle()
```
function getReserveOracle() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The reserve oracle address|

This function returns the address of the reserve oracle contract
It should:
1. Return the reserve oracle address
#### getNFTOracle()
```
function getNFTOracle() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The NFT oracle address|

This function returns the address of the NFT oracle contract
It should:
1. Return the NFT oracle address
#### getLendPoolLoan()
```
function getLendPoolLoan() external view override returns (address) 
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The LendPool loan address|

This function returns the address of the LendPool loan contract
It should:
1. Return the LendPool loan address
#### getUNFTRegistry()
```
function getUNFTRegistry() external view override returns (address) 
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The UNFT registry address|

This function returns the address of the UNFT registry contract
It should:
1. Return the UNFT registry address
#### getIncentivesController()
```
function getIncentivesController() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The Incentives Controller address|

This function returns the address of the Incentives Controller contract
It should:
1. Return the Incentives Controller address
#### getUIDataProvider()
```
function getUIDataProvider() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The UIDataProvider address|

This function returns the address of the UIDataProvider contract
It should:
1. Return the UIDataProvider address
#### getUnlockdDataProvider()
```
function getUnlockdDataProvider() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The UnlockdDataProvider address|

This function returns the address of the UnlockdDataProvider contract
It should:
1. Return the UnlockdDataProvider address
#### getWalletBalanceProvider()
```
function getWalletBalanceProvider() external view override returns (address)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The WalletBalanceProvider address|

This function returns the address of the WalletBalanceProvider contract
It should:
1. Return the WalletBalanceProvider address
#### getImplementation()
```
function getImplementation(address proxyAddress) external view onlyOwner returns (address)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| proxyAddress         | address       | The address of the proxy contract|
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The address of the implementation contract|

This function returns the address of the implementation contract that the `proxyAddress`is currrently pointing to
It should:
1. Return the implementation contract address
### State Changing Functions
#### setMarketId()
```
function setMarketId(string memory marketId) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| marketId         | string       | The market ID |  
This function allows to set the market which this LendPoolAddressesProvider represents
It should:  
1. Set the market ID to the `marketId`parameter
#### setAddressAsProxy()
```
function setAddressAsProxy(
    bytes32 id,
    address implementationAddress,
    bytes memory encodedCallData
  ) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| id         | bytes32       | The id of the registered proxy| 
| implementationAddress         | address       | The address of the implementation contract |  
| encodedCallData         | bytes       | The calldata to be called |  
This is a general function to update the implementation of a proxy registered with certain `id`. If there is no proxy registered, it will instantiate one and set as implementation the `implementationAddress`
It should:  
1. Update the implementation of the proxied contract calling `_updateImpl()`
2. Call the calldata if the length of `encodedCallData`is greater than 0
#### setAddress()
```
function setAddress(bytes32 id, address newAddress) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| id         | bytes32       | The id of the contract| 
| newAddress         | address       | The new address to be set |  

This function sets an address for an id replacing the address saved in the addresses map
It should:  
1. Update the addresses map, mapping the `id`to `newAddress`
#### setLendPoolImpl()
```
function setLendPoolImpl(address pool, bytes memory encodedCallData) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| pool         | address       | The new LendPool address| 
| encodedCallData         | bytes       | The calldata to be called |  

This function updates the implementation of the LendPool, or creates the proxy setting the new `pool` implementation on the first time calling it
It should:  
1. Update the Lendpool implementation to the specified by `pool`
2. Call the calldata if the length of `encodedCallData`is greater than 0
#### setLendPoolConfiguratorImpl()
```
function setLendPoolConfiguratorImpl(address configurator, bytes memory encodedCallData) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| configurator         | address       | The new LendPoolConfigurator address| 
| encodedCallData         | bytes       | The calldata to be called |  

This function updates the implementation of the LendPoolConfigurator, or creates the proxy setting the new `configurator` implementation on the first time calling it
It should:  
1. Update the LendpoolConfigurator implementation to the specified by `configurator`
2. Call the calldata if the length of `encodedCallData`is greater than 0
#### setPoolAdmin()
```
function setPoolAdmin(address admin) external override onlyOwner 
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| admin         | address       | The new pool admin address|

This function updates the pool admin address
It should:  
1. Update the PoolAdmin address to `admin`
#### setEmergencyAdmin()
```
function setEmergencyAdmin(address emergencyAdmin) external override onlyOwner 
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| emergencyAdmin         | address       | The new pool emergency admin address|

This function updates the pool emergency admin address
It should:  
1. Update the EmergencyAdmin address to `emergencyAdmin`
#### setReserveOracle()
```
function setReserveOracle(address reserveOracle) external override onlyOwner 
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| reserveOracle         | address       | The new reserve oracle contract address|

This function updates the reserve oracle contract address
It should:  
1. Update the ReserveOracle contract address to `reserveOracle`
#### setNFTOracle()
```
 function setNFTOracle(address nftOracle) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftOracle         | address       | The new NFT oracle contract address|

This function updates the NFT oracle contract address
It should:  
1. Update the NFTOracle contract address to `nftOracle`
#### setLendPoolLoanImpl()
```
function setLendPoolLoanImpl(address loanAddress, bytes memory encodedCallData) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanAddress         | address       | The LendPool loan contract address|
| encodedCallData     | bytes       | The calldata to be called |

This function updates the LendPool loan contract address
It should:  
1. Update the LendPoolLoan contract address to `loanAddress`
2. Call the calldata if the length of `encodedCallData`is greater than 0
#### setUNFTRegistry()
```
function setUNFTRegistry(address factory) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| factory         | address       | The UNFT registry contract address|

This function updates the UNFT registry contract address
It should:  
1. Update the UNFTRegistry contract address to `factory`
#### setIncentivesController()
```
function setIncentivesController(address controller) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| controller         | address       | The Incentives Controller contract address|

This function updates the Incentives Controller contract address
It should:  
1. Update the IncentivesController contract address to `controller`
#### setUIDataProvider()
```
function setUIDataProvider(address provider) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | address       | The UIDataProvider contract address|

This function updates the UIDataProvider contract address
It should:  
1. Update the UIDataProvider contract address to `provider`
#### setUnlockdDataProvider()
```
function setUnlockdDataProvider(address provider) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | address       | The UnlockdDataProvider contract address|

This function updates the UnlockdDataProvider contract address
It should:  
1. Update the UnlockdDataProvider contract address to `provider`
#### setWalletBalanceProvider()
```
function setWalletBalanceProvider(address provider) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | address       | The WalletBalanceProvider contract address|

This function updates the WalletBalanceProvider contract address
It should:  
1. Update the WalletBalanceProvider contract address to `provider`
### Internal Functions
#### _updateImpl()
```
function _updateImpl(bytes32 id, address newAddress) internal
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| id         | bytes32       | The id of the proxy to be updated|
| newAddress         | address       | The new implementation address|
This function updates the implementation of a specific proxied component of the protocol
It should:  
1. Create the proxy setting `newAdress` as implementation and calls the initialize() function on the proxy if there is no proxy registered in the given `id`
2. Update the implementation to `newAddress` and call the encoded method function via upgradeToAndCall() in the proxy if there is already a proxy registered in the given `id`
#### _setMarketId()
```
function _setMarketId(string memory marketId) internal
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| marketId         | string       | The id of the market|
This function allows to internally set the market which this LendPoolAddressesProvider represents
It should:  
1. Set the market ID to the `marketId` parameter
2. Only be called by the constructor and `setMarkedId()`
## LendPoolAddressesProviderRegistry (LendPoolAddressesProviderRegistry.sol)
The LendPool Addresses Provider Registry contract is the main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets. It is used for indexing purposes of Unlockd protocol's markets. The id assigned to a LendPoolAddressesProvider refers to the market it is connected with, for example with `1` for the Unlockd main market and `2` for the next created
### View methods
#### getAddressesProvidersList()
```
function getAddressesProvidersList() external view override returns (address[] memory)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address[]      | The list of addresses provider|

This function returns the list of registered addresses provider
It should:
1. Return the list of addresses provider, potentially containing address(0) elements
#### getAddressesProviderIdByAddress()
```
function getAddressesProviderIdByAddress(address addressesProvider) external view override returns (uint256)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The id of the LendPoolAddressesProvider|

This function returns the id on a registered LendPoolAddressesProvider
It should:
1. Return the id on a registered LendPoolAddressesProvider
2. Return 0 if the LendPoolAddressesProvider is not registered
### State Changing Functions
#### registerAddressesProvider()
```
function registerAddressesProvider(address provider, uint256 id) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | address       | The address of the new LendPoolAddressesProvider|
| id         | uint256       | The id for the new LendPoolAddressesProvider, referring to the market it belongs to |
This function registers an addresses provider
It should:  
1. Register the `provider` address with an `id` as reference to the market it belongs to
#### unregisterAddressesProvider()
```
function unregisterAddressesProvider(address provider) external override onlyOwner
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | address       | The address of the LendPoolAddressesProvider|
This function removes a LendPoolAddressesProvider from the list of registered addresses provider
It should:  
1. Remove a LendPoolAddressesProvider from the list of registered AddressesProviders
### Internal Functions
#### _addToAddressesProvidersList()
```
function _addToAddressesProvidersList(address provider) internal
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| provider         | address       | The address of the LendPoolAddressesProvider|
This function adds an addresses provider to the protocol's addresses providers list
It should:  
1. Add a LendPoolAddressProvider to the addresses providers list
2. Only be called by the `registerAddressesProvider()` function

## LendPoolConfigurator (LendPoolConfigurator.sol)
The LendPoolConfigurator contract implements the basic configuration methods in order to be able to ineract with the Unlockd protocol.
### View methods
#### getTokenImplementation()
```
function getTokenImplementation(address proxyAddress) external view onlyPoolAdmin returns (address)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| proxyAddress         | address       | The address of the proxy contract |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The address of the token implementation contract |

This function returns the address of the token implementation contract that the `proxyAddress`is currrently pointing to
It should:
1. Return the token implementation contract address
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
1. Set the LendPoolConfigurator addresses provider address to `provider`parameter address
#### batchInitReserve()
```
function batchInitReserve(ConfigTypes.InitReserveInput[] calldata input) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| input         | ConfigTypes.InitReserveInput[]       | The input array with data to initialize each reserve |  
This function initializes reserves in batch
It should:  
1. Initialize an array of reserves
#### batchInitNft()
```
function batchInitNft(ConfigTypes.InitNftInput[] calldata input) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| input         | ConfigTypes.InitNftInput[]       | The input array with data to initialize each NFT |  
This function initializes NFTs in batch
It should:  
1. Initialize an array of NFTs 
#### updateUToken()
```
function updateUToken(ConfigTypes.UpdateUTokenInput[] calldata inputs) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| inputs         | ConfigTypes.UpdateUTokenInput[]       | The inputs array with data to update each UToken |  
This function updates UTokens in batch
It should:  
1.  Update the uToken implementation for each reserve
#### updateDebtToken()
```
function updateDebtToken(ConfigTypes.UpdateDebtTokenInput[] calldata inputs) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| inputs         | ConfigTypes.UpdateDebtTokenInput[]       | The inputs array with data to update each debt token |  
This function updates the debt tokens in batch
It should:  
1.  Update the debt token implementation for each reserve
#### setBorrowingFlagOnReserve()
```
function setBorrowingFlagOnReserve(address[] calldata assets, bool flag) external onlyPoolAdmin 
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying asset of the reserve |
| flag         | bool      | The borrowing flag to set to the reserve |  
This function updates the borrowing flag to each reserve, enabling or disabling borrowing for each one of the reserves
It should:  
1.  Enable borrowing for each reserve if `flag` is equal to true
2.  Disable borrowing for each reserve if `flag` is equal to false
#### setActiveFlagOnReserve()
```
function setActiveFlagOnReserve(address[] calldata assets, bool flag) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying asset of the reserve |
| flag         | bool      | The active flag to set to the reserve |  
This function updates the active flag to each reserve, enabling or disabling each one of the reserves
It should:  
1.  Activate  each reserve if `flag` is equal to true
2.  Deactivate each reserve if `flag` is equal to false
#### setFreezeFlagOnReserve()
```
function setFreezeFlagOnReserve(address[] calldata assets, bool flag) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying asset of the reserve |
| flag         | bool      | The freeze flag to set to the reserve |  
This function updates the freeze flag to each reserve, freezing or unfreezing each one of the reserves
It should:  
1.  Freeze  each reserve if `flag` is equal to true 
2.  Unfreeze each reserve if `flag` is equal to false
#### setReserveFactor()
```
function setReserveFactor(address[] calldata assets, uint256 reserveFactor) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying asset of the reserve |
| reserveFactor         | uint256      | The new reserve factor of the reserve  |  
This function updates the reserve factor of a reserve
It should:  
1.  Update the reserve factor for each reserve, setting the new factor to `reserveFactor`
#### setReserveInterestRateAddress()
```
function setReserveInterestRateAddress(address[] calldata assets, address rateAddress) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The addresses of the underlying asset of the reserve |
| rateAddress         | uint256      | The new address of the interest strategy contract  |  
This function sets the interest rate strategy of a reserve
It should:  
1.  Set the interest rate strategy for each reserve, setting the new rate strategy to the  `rateAddress` contract
1.  Update the reserve factor for each reserve, setting the new factor to `reserveFactor`
#### batchConfigReserve()
```
function batchConfigReserve(ConfigReserveInput[] calldata inputs) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| inputs         | ConfigReserveInput[]       | the input array with data to configure each reserve |

This function configures reserves in batch
It should:  
1.  Set the reserve configuration for each reserve to the `inputs` data
#### setActiveFlagOnNft()
```
function setActiveFlagOnNft(address[] calldata assets, bool flag) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT asset |
| flag         | bool      | The active flag to set to the NFT |  
This function updates the active flag to each NFT, enabling or disabling each one of the NFTs
It should:  
1.  Activate  each NFT if `flag` is equal to true
2.  Deactivate each NFT if `flag` is equal to false
#### setFreezeFlagOnNft()
```
function setFreezeFlagOnNft(address[] calldata assets, bool flag) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT asset |
| flag         | bool      | The active flag to set to the NFT |  
This function updates the freeze flag to each reserve, freezing or unfreezing each one of the NFTs
It should:  
1.  Freeze  each NFT if `flag` is equal to true 
2.  Unfreeze each NFT if `flag` is equal to false
#### setFreezeFlagOnNft()
```
function setFreezeFlagOnNft(address[] calldata assets, bool flag) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT asset |
| flag         | bool      | The active flag to set to the NFT |  
This function updates the freeze flag to each reserve, freezing or unfreezing each one of the NFTs
It should:  
1.  Freeze  each NFT if `flag` is equal to true 
2.  Unfreeze each NFT if `flag` is equal to false
#### configureNftAsCollateral()
```
function configureNftAsCollateral(
    address[] calldata assets,
    uint256 ltv,
    uint256 liquidationThreshold,
    uint256 liquidationBonus
  ) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying asset of the reserve |
| ltv         | uint256      | The loan to value of the asset when used as NFT |  
| liquidationThreshold         | uint256      | The threshold at which loans using this asset as collateral will be considered undercollateralized |  
| liquidationBonus         | uint256      | The bonus liquidators receive to liquidate this asset. The values is always below 100%. A value of 5% means the liquidator will receive a 5% bonus |  
This function configures the NFT collateralization parameters
It should:  
1.  Change the NFT configuration to set the collateralization parameters
2.  Revert if the `ltv` is lower than or equal to the `liquidationThreshold`
#### configureNftAsAuction()
```
function configureNftAsAuction(
    address[] calldata assets,
    uint256 redeemDuration,
    uint256 auctionDuration,
    uint256 redeemFine
  ) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT assets |
| redeemDuration         | uint256      | The max duration for the redeem |  
| auctionDuration         | uint256      | The auction duration |  
| redeemFine         | uint256      | The fine for the redeem |  
This function configures the NFT auction parameters
It should:  
1.  Add the configuration to each of the `assets`
2.  Revert if the `redeemDuration` is lower than the `auctionDuration`
#### setNftRedeemThreshold()
```
function setNftRedeemThreshold(address[] calldata assets, uint256 redeemThreshold) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT ssets |
| redeemThreshold         | uint256      | The threshold for the redeem |  

This function configures the redeem threshold
It should:  
1.  Set the redeem threshold for the underlying `assets` to the `redeemThreshold`value
#### setNftMinBidFine()
```
function setNftMinBidFine(address[] calldata assets, uint256 minBidFine) external onlyPoolAdmin 
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT assets |
| minBidFine         | uint256      | The minimum bid fine value |  

This function configures the minimum bid fine
It should:  
1.  Set the minimum bid fine for the underlying `assets` to the `minBidFine` value
#### setNftMaxSupplyAndTokenId()
```
function setNftMaxSupplyAndTokenId(
    address[] calldata assets,
    uint256 maxSupply,
    uint256 maxTokenId
  ) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| assets         | address[]       | The address of the underlying NFT assets |
| maxSupply         | uint256      | The max supply value |  
| maxTokenId         | uint256      | The max token ID value |  
This function configures the maximum supply and token Id for the underlying NFT assets
It should:  
1.  Set the maximum supply for the underlying NFT `assets` to the `maxSupply` value
2.  Set the maximum tokenc Id for the underlying NFT `assets` to the `maxTokenId` value
#### batchConfigNft()
```
function batchConfigNft(ConfigNftInput[] calldata inputs) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| inputs         | ConfigNftInput[]       | The input array with data to configure each NFT |

This function configures NFTs in batch
It should:  
1.  Set the NFT configuration for each NFT asset to the `inputs` data
#### setMaxNumberOfReserves()
```
function setMaxNumberOfReserves(uint256 newVal) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| newVal         | uint256       | The value to set as the max reserves |

This function sets the max amount of reserves
It should:  
1.  Set the max number of reserves in the protocol to the `newVal`parameter
2.  Revert if `newVal`is lower than the previous max reserves amount in the protocol
#### setMaxNumberOfNfts()
```
function setMaxNumberOfNfts(uint256 newVal) external onlyPoolAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| newVal         | uint256       | The value to set as the max NFTs |

This function sets the max amount of NFTs
It should:  
1.  Set the max number of NFTs in the protocol to the `newVal`parameter
2.  Revert if `newVal`is lower than the previous max NFTs amount in the protocol
#### setPoolPause()
```
function setPoolPause(bool val) external onlyEmergencyAdmin
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| val         | bool       | The boolean to set the pause status |

This function pauses or unpauses all the actions of the protocol, including uToken transfers
It should:  
1.  Pause the protocol actions if `val` is true
2.  Unpause the protocol actions if `val` is true
## Internal Functions
#### _checkReserveNoLiquidity()
```
function _checkReserveNoLiquidity(address asset) internal view
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying reserve asset |
This function checks the liquidity of reserves
It should:
1. Revert if there is liquidity on the reserve
#### _checkNftNoLiquidity()
```
function _checkNftNoLiquidity(address asset) internal view
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| asset         | address       | The address of the underlying NFT asset |
This function checks the liquidity of the NFT
It should:
1. Revert if the collateral amount for the asset is not 0
#### _getLendPool()
```
function _getLendPool() internal view returns (ILendPool)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The lendpool address |

This function returns the LendPool address stored in the addresses provider
It should:
1. Return the LendPool address stored in the addresses provider
#### _getLendPool()
```
function _getLendPoolLoan() internal view returns (ILendPoolLoan)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The lendpool loan address |

This function returns the LendPoolLoan address stored in the addresses provider
It should:
1. Return the LendPoolLoan address stored in the addresses provider
#### _getUNFTRegistry()
```
  function _getUNFTRegistry() internal view returns (IUNFTRegistry)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The UNFT registry address |

This function returns the UNFTRegistry address stored in the addresses provider
It should:
1. Return the UNFTRegistry address stored in the addresses provider
## LendPoolLoan (LendPoolLoan.sol)
The LendPoolLoan contract implements the basic loan actions (such as creating, updating, repaying, auctioning, or liquidating a loan). It also implements useful loan getters.
### View methods
#### borrowerOf()
```
  function borrowerOf(uint256 loanId) external view override returns (address)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanId         | uint256       | The loan ID |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The loan borrower |

This function returns the borrower of a specific loan
It should:
1. Return the corresponding borrower to the loan with ID `loanId` 
#### getCollateralLoanId()
```
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view override returns (uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the underlying NFT asset |
| nftTokenId         | uint256       | The id of the underlying NFT asset |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The corresponding token loan |

This function returns the loan corresponding to a specific NFT 
It should:
1. Return the loan corresponding to a specific NFT
#### getLoan()
```
function getLoan(uint256 loanId) external view override returns (DataTypes.LoanData memory loanData)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanId         | uint256       | The loan ID |
Returns:
Type          |  Description        |
------------- |    ------------- |
DataTypes.LoanData      | The data for the requested loan |

This function returns the data for a specific loan
It should:
1. Return the data for the loan with a loan ID equal to `loanId`
#### getLoanCollateralAndReserve()
```
function getLoanCollateralAndReserve(uint256 loanId)
    external
    view
    override
    returns (
      address nftAsset,
      uint256 nftTokenId,
      address reserveAsset,
      uint256 scaledAmount
    )
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanId         | uint256       | The loan ID |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The underlying NFT asset address |
uint256      | The token Id for the NFT |
address      | The underlying reserve address |
uint256      | The loan scaled amount |
This function returns the corresponding collateral and reserve for a requested loan
It should:
1. Return the collateral and reserve corresponding for the loan with loan Id equal to `loanId``
#### getLoanCollateralAndReserve()
```
function getLoanReserveBorrowAmount(uint256 loanId) external view override returns (address, uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanId         | uint256       | The loan ID |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The reserve asset address |
uint256      | The loan borrowed amount |
This function returns the corresponding reserve address and borrowed amount for a requested loan
It should:
1. Return the reserve address and borrowed amount for the loan with loan Id equal to `loanId`
#### getLoanReserveBorrowScaledAmount()
```
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view override returns (address, uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanId         | uint256       | The loan ID |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The reserve asset address |
uint256      | The scaled loan borrowed amount |
This function returns the corresponding reserve address and the __scaled__ borrowed amount for a requested loan
It should:
1. Return the reserve address and __scaled__ borrowed amount for the loan with loan Id equal to `loanId`
#### getLoanHighestBid()
```
function getLoanHighestBid(uint256 loanId) external view override returns (address, uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| loanId         | uint256       | The loan ID |
Returns:
Type          |  Description        |
------------- |    ------------- |
address      | The reserve asset address |
uint256      | The bid price |
This function returns the corresponding reserve address and bid price for a requested loan
It should:
1. Return the reserve address and bid price for the loan with loan Id equal to `loanId`
#### getNftCollateralAmount()
```
function getNftCollateralAmount(address nftAsset) external view override returns (uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The underlying NFT asset |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The total collateral |
This function returns the total collateral amount for an NFT asset
It should:
1. Return the the total collateral amount for the requested `nftAsset`
#### getUserNftCollateralAmount()
```
function getUserNftCollateralAmount(address user, address nftAsset) external view override returns (uint256)
```
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| user         | address       | The user address|
| nftAsset         | address       | The underlying NFT asset |
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The total collateral for the user|
This function returns the total collateral amount for an NFT asset and a specific user
It should:
1. Return the the total collateral amount for the requested `nftAsset` and the specified `user`
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
1. Initialize the proxy contract
2. Avoid having a loan ID equal to 0
#### initNft()
```
function initNft(address nftAsset, address uNftAddress) external override onlyLendPool
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| nftAsset         | address       | The address of the underlying NFT |  
| uNftAddress         | address       | The address of the uNFT |  
This function sets approval for the uNFTs with the nft asset as the caller
It should:  
1. Assing full approval rights for the `uNftAddress` asset, having the `nftAsset`address as the caller
#### createLoan()
```
 function createLoan(
    address initiator,
    address onBehalfOf,
    address nftAsset,
    uint256 nftTokenId,
    address uNftAddress,
    address reserveAsset,
    uint256 amount,
    uint256 borrowIndex
  ) external override onlyLendPool returns (uint256)
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| initiator         | address       | The address of the user initiating the borrow |  
| onBehalfOf         | address       | The address receiving the loan |  
| nftAsset         | address       | The address of the underlying NFT |  
| nftTokenId         | uint256       | The token ID of the uNFT |  
| uNftAddress         | address       | The address of the underlying uNFT |  
| reserveAsset         | address       | The address of the underlying reserve asset |  
| amount         | uint256       | The loan amount |  
| borrowIndex         | uint256       | The index to get the scaled loan amount |  
Returns:
Type          |  Description        |
------------- |    ------------- |
uint256      | The loan ID |
This function creates and stores a loan object with some params
It should:  
1. Create and store a LoanData object with the information specified as parameter
2. Transfer underlying `nftAsset` to the lendpool
3. Mint uNFT to `onBehalfOf`
4. Update the user collateral
5. Update the NFT total collateral
#### updateLoan()
```
 function updateLoan(
    address initiator,
    uint256 loanId,
    uint256 amountAdded,
    uint256 amountTaken,
    uint256 borrowIndex
  ) external override onlyLendPool
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| initiator         | address       | The address of the user updating the loan |  
| loanId         | uint256       | The loan ID |  
| amountAdded         | uint256       | The amount added to the loan |  
| amountTaken         | uint256       | The amount taken from the loan | 
| borrowIndex         | uint256       | The index to get the scaled loan amount |  
This function updates the given loan with the specified params
It should:  
1. Get a scaled loan amount if the `amountAdded` or the `amountTaken` is greater than 0
2. Revert if the specified loan with `loanId`is inactive
3. Update the loan status with the specified params
#### repayLoan()
```
 function repayLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 amount,
    uint256 borrowIndex
  ) external override onlyLendPool
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| initiator         | address       | The address of the user repaying the loan |  
| loanId         | uint256       | The loan ID |  
| uNftAddress         | address       | The uNFT address |  
| amount         | uint256       | The amount to repay the loan | 
| borrowIndex         | uint256       | The index to get the scaled loan amount |  
This function repays the given loan with the specified params
It should:  
1. Revert if the specified loan with `loanId`is inactive
2. Set the loan state to repaid
3. Burn the uNFT
4. Transfer the collateralized NFT to the user
#### auctionLoan()
```
 function auctionLoan(
    address initiator,
    uint256 loanId,
    address onBehalfOf,
    uint256 bidPrice,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external override onlyLendPool
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| initiator         | address       | The address of the user initiating the auction |  
| loanId         | uint256       | The loan getting auctioned |  
| onBehalfOf         | address       | The address possessing the loan |  
| bidPrice         | uint256       | The bid price | 
| borrowAmount         | uint256       | The borrow amount |  
| borrowIndex         | uint256       | The index to get the scaled loan amount |  
This function allows to auction the given loan
It should:  
1. Revert if the specified loan with `loanId`is inactive
2. Update the auction status with the specified parameters
#### redeemLoan()
```
 function redeemLoan(
    address initiator,
    uint256 loanId,
    uint256 amountTaken,
    uint256 borrowIndex
  ) external override onlyLendPool
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| initiator         | address       | The address of the user initiating the redeem |  
| loanId         | uint256       | The loan getting redeemed |  
| amountTaken         | uint256       | The amount to redeem |  
| borrowIndex         | uint256       | The index to get the scaled loan amount |  
This function allows to redeem the given loan with some params
It should:  
1. Revert if the specified loan with `loanId`is inactive
2. Revert if the `amountTaken` is invalid
3. Redeem the loan and reset its status
#### liquidateLoan()
```
 function liquidateLoan(
    address initiator,
    uint256 loanId,
    address uNftAddress,
    uint256 borrowAmount,
    uint256 borrowIndex
  ) external override onlyLendPool
```  
| Parameter name| Type          |  Description        |
| ------------- | ------------- |    ------------- |
| initiator         | address       | The liquidator |  
| loanId         | uint256       | The loan getting liquidated |  
| uNftAddress         | address       | The uNFT address |  
| borrowAmount         | uint256       | The amount to liquidate |  
| borrowIndex         | uint256       | The index to get the scaled loan amount |  
This function allows a user to liquidate a loan
It should:  
1. Revert if the specified loan with `loanId`is inactive
2. Burn the uNFT with `uNftAddress`
3. Transfer the underlying NFT asset to user
### Internal Functions
#### _getLendPool()
```
function _getLendPool() internal view returns (ILendPool)
```
Returns:
Type          |  Description        |
------------- |    ------------- |
ILendPool     | The protocol lend pool  |

This function returns the lend pool given from the addresses provider
It should:
1. Return the protocol's LendPool 














































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