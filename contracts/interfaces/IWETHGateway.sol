// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {OrderTypes} from "../libraries/looksrare/OrderTypes.sol";
import {WyvernExchange} from "../libraries/wyvernexchange/WyvernExchange.sol";

interface IWETHGateway {
  /**
   * @dev deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (uTokens)
   * is minted.
   * @param onBehalfOf address of the user who will receive the uTokens representing the deposit
   * @param referralCode integrators are assigned a referral code and can potentially receive rewards.
   **/
  function depositETH(address onBehalfOf, uint16 referralCode) external payable;

  /**
   * @dev withdraws the WETH _reserves of msg.sender.
   * @param amount amount of bWETH to withdraw and receive native ETH
   * @param to address of the user who will receive native ETH
   */
  function withdrawETH(uint256 amount, address to) external;

  /**
   * @dev borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`.
   * @param amount the amount of ETH to borrow
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param onBehalfOf Address of the user who will receive the loan. Should be the address of the borrower itself
   * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
   * if he has been given credit delegation allowance
   * @param referralCode integrators are assigned a referral code and can potentially receive rewards
   */
  function borrowETH(
    uint256 amount,
    address nftAsset,
    uint256 nftTokenId,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  function batchBorrowETH(
    uint256[] calldata amounts,
    address[] calldata nftAssets,
    uint256[] calldata nftTokenIds,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  /**
   * @dev repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified).
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param amount the amount to repay, or uint256(-1) if the user wants to repay everything
   */
  function repayETH(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external payable returns (uint256, bool);

  function batchRepayETH(
    address[] calldata nftAssets,
    uint256[] calldata nftTokenIds,
    uint256[] calldata amounts
  ) external payable returns (uint256[] memory, bool[] memory);

  /**
   * @dev auction a borrow on the WETH reserve
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   */
  function auction(address nftAsset, uint256 nftTokenId) external;

  /**
   * @dev redeems a borrow on the WETH reserve
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param amount The amount to repay the debt
   */
  function redeemETH(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external payable returns (uint256);

  /**
   * @dev liquidates a borrow on the WETH reserve on LooksRare
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   */
  function liquidateLooksRare(
    address nftAsset,
    uint256 nftTokenId,
    OrderTypes.TakerOrder calldata takerAsk,
    OrderTypes.MakerOrder calldata makerBid
  ) external returns (uint256);

  /**
   * @dev liquidates a borrow on the WETH reserve on Opensea
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   */
  function liquidateOpensea(
    address nftAsset,
    uint256 nftTokenId,
    uint256 priceInEth
  ) external returns (uint256);

  /**
   * @dev liquidates a borrow on the WETH reserve on NFTX
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   */
  function liquidateNFTX(address nftAsset, uint256 nftTokenId) external returns (uint256);
}
