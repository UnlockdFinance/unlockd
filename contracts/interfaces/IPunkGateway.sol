// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {OrderTypes} from "../libraries/looksrare/OrderTypes.sol";
import {WyvernExchange} from "../libraries/wyvernexchange/WyvernExchange.sol";

interface IPunkGateway {
  /**
   * @dev Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
   * already deposited enough collateral
   * - E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
   *   and lock collateral asset in contract
   * @param reserveAsset The address of the underlying asset to borrow
   * @param amount The amount to be borrowed
   * @param punkIndex The index of the CryptoPunk used as collateral
   * @param onBehalfOf Address of the user who will receive the loan. Should be the address of the borrower itself
   * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
   * if he has been given credit delegation allowance
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   *   0 if the action is executed directly by the user, without any middle-man
   **/
  function borrow(
    address reserveAsset,
    uint256 amount,
    uint256 punkIndex,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  /**
   * @dev Allows users to borrow a specific `amount` of multiple reserve underlying assets, provided that the borrower
   * already deposited enough collateral
   * @param reserveAssets The array of addresses of the underlying assets to borrow
   * @param amounts The array of amounts to be borrowed
   * @param punkIndexs The array of indexes of the CryptoPunks used as collateral
   * @param onBehalfOf Address of the user who will receive the loan. Should be the address of the borrower itself
   * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
   * if he has been given credit delegation allowance
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   *   0 if the action is executed directly by the user, without any middle-man
   **/
  function batchBorrow(
    address[] calldata reserveAssets,
    uint256[] calldata amounts,
    uint256[] calldata punkIndexs,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  /**
   * @notice Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned
   * - E.g. User repays 100 USDC, burning loan and receives collateral asset
   * @param punkIndex The index of the CryptoPunk used as collateral
   * @param amount The amount to repay
   * @return The final amount repaid, loan is burned or not
   **/
  function repay(uint256 punkIndex, uint256 amount) external returns (uint256, bool);

  /**
   * @notice Repays multiple borrowed `amounts` on multiple punks, burning the equivalent loan owned for each one
   * @param punkIndexs The array of indexs of the CryptoPunks used as collateral
   * @param amounts The array of amounts to repay
   * @return The final amount repaid, loan is burned or not
   **/
  function batchRepay(uint256[] calldata punkIndexs, uint256[] calldata amounts)
    external
    returns (uint256[] memory, bool[] memory);

  /**
   * @notice auction a unhealth punk loan with ERC20 reserve
   * @param punkIndex The index of the CryptoPunk used as collateral
   **/
  function auction(uint256 punkIndex) external;

  /**
   * @notice redeem a unhealth punk loan with ERC20 reserve
   * @param punkIndex The index of the CryptoPunk used as collateral
   * @param amount The amount to repay the debt
   * @param bidFine The amount of bid fine
   **/
  function redeem(
    uint256 punkIndex,
    uint256 amount,
    uint256 bidFine
  ) external returns (uint256);

  /**
   * @notice liquidate a unhealth punk loan on LooksRare
   * @param punkIndex The index of the CryptoPunk used as collteral
   **/
  function liquidateLooksRare(
    uint256 punkIndex,
    OrderTypes.TakerOrder calldata takerAsk,
    OrderTypes.MakerOrder calldata makerBid
  ) external returns (uint256);

  /**
   * @notice liquidate a unhealth punk loan on Opensea
   * @param punkIndex The index of the CryptoPunk used as collteral
   **/
  function liquidateOpensea(
    uint256 punkIndex,
    WyvernExchange.Order calldata buyOrder,
    WyvernExchange.Order calldata sellOrder,
    uint8[2] calldata _vs,
    bytes32[5] calldata _rssMetadata
  ) external returns (uint256);

  /**
   * @notice liquidate a unhealth punk loan on NFTX
   * @param punkIndex The index of the CryptoPunk used as collteral
   **/
  function liquidateNFTX(uint256 punkIndex) external returns (uint256);

  /**
   * @dev Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
   * already deposited enough collateral
   * - E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
   *   and lock collateral asset in contract
   * @param amount The amount to be borrowed
   * @param punkIndex The index of the CryptoPunk to deposit
   * @param onBehalfOf Address of the user who will receive the loan. Should be the address of the borrower itself
   * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
   * if he has been given credit delegation allowance
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   *   0 if the action is executed directly by the user, without any middle-man
   **/
  function borrowETH(
    uint256 amount,
    uint256 punkIndex,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  /**
   * @dev Allows users to borrow multiple `amounts` of multiple reserve underlying assets, provided that the borrower
   * already deposited enough collateral
   * @param amounts The array of amounts to be borrowed
   * @param punkIndexs The array of indexs of the CryptoPunks to deposit
   * @param onBehalfOf Address of the user who will receive the loan. Should be the address of the borrower itself
   * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
   * if he has been given credit delegation allowance
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   *   0 if the action is executed directly by the user, without any middle-man
   **/
  function batchBorrowETH(
    uint256[] calldata amounts,
    uint256[] calldata punkIndexs,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  /**
   * @notice Repays a borrowed `amount` on a specific punk with native ETH
   * - E.g. User repays 100 ETH, burning loan and receives collateral asset
   * @param punkIndex The index of the CryptoPunk to repay
   * @param amount The amount to repay
   * @return The final amount repaid, loan is burned or not
   **/
  function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool);

  /**
   * @notice Repays multiple borrowed `amounts` on multiple punks with native ETH
   * @param punkIndexs The indexs of the CryptoPunks to repay
   * @param amounts The amounts to repay
   * @return The final amounts repaid, loan is burned or not
   **/
  function batchRepayETH(uint256[] calldata punkIndexs, uint256[] calldata amounts)
    external
    payable
    returns (uint256[] memory, bool[] memory);

  /**
   * @notice liquidate a unhealth punk loan with native ETH
   * @param punkIndex The index of the CryptoPunk to repay
   * @param amount The amount to repay the debt
   * @param bidFine The amount of bid fine
   **/
  function redeemETH(
    uint256 punkIndex,
    uint256 amount,
    uint256 bidFine
  ) external payable returns (uint256);
}
