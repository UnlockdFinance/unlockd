// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import "./SaleKindInterface.sol";
import {IWyvernExchange} from "../../interfaces/IWyvernExchange.sol";

library WyvernExchange {
  /**
   * @dev https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L81
   */
  /* An ECDSA signature. */
  struct Sig {
    /* v parameter */
    uint8 v;
    /* r parameter */
    bytes32 r;
    /* s parameter */
    bytes32 s;
  }

  /**
   * @dev https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/registry/AuthenticatedProxy.sol#L32
   */
  enum HowToCall {
    Call,
    DelegateCall
  }

  /**
   * @dev https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/contracts/exchange/ExchangeCore.sol
   */

  /* Fee method: protocol fee or split fee. */
  enum FeeMethod {
    ProtocolFee,
    SplitFee
  }

  /* An order on the exchange. */
  struct Order {
    /* Exchange address, intended as a versioning mechanism. */
    address exchange;
    /* Order maker address. */
    address maker;
    /* Order taker address, if specified. */
    address taker;
    /* Maker relayer fee of the order, unused for taker order. */
    uint256 makerRelayerFee;
    /* Taker relayer fee of the order, or maximum taker fee for a taker order. */
    uint256 takerRelayerFee;
    /* Maker protocol fee of the order, unused for taker order. */
    uint256 makerProtocolFee;
    /* Taker protocol fee of the order, or maximum taker fee for a taker order. */
    uint256 takerProtocolFee;
    /* Order fee recipient or zero address for taker order. */
    address feeRecipient;
    /* Fee method (protocol token or split fee). */
    FeeMethod feeMethod;
    /* Side (buy/sell). */
    SaleKindInterface.Side side;
    /* Kind of sale. */
    SaleKindInterface.SaleKind saleKind;
    /* Target. */
    address target;
    /* HowToCall. */
    HowToCall howToCall;
    /* Calldata. */
    bytes bCalldata;
    /* Calldata replacement pattern, or an empty byte array for no replacement. */
    bytes replacementPattern;
    /* Static call target, zero-address for no static call. */
    address staticTarget;
    /* Static call extra data. */
    bytes staticExtradata;
    /* Token used to pay for the order, or the zero-address as a sentinel value for Ether. */
    address paymentToken;
    /* Base price of the order (in paymentTokens). */
    uint256 basePrice;
    /* Auction extra parameter - minimum bid increment for English auctions, starting/ending price difference. */
    uint256 extra;
    /* Listing timestamp. */
    uint256 listingTime;
    /* Expiration timestamp - 0 for no expiry. */
    uint256 expirationTime;
    /* Order salt, used to prevent duplicate hashes. */
    uint256 salt;
  }

  /**
   * @dev Fulfill the Opensea order
   * @param buyOrder buy order
   * @param sellOrder sell order
   * @param _vs v of buy & sell order
   * @param _rssMetadata r, s of buy & sell order
   */
  function fulfillOrder(
    address exchange,
    Order memory buyOrder,
    Order memory sellOrder,
    uint8[2] memory _vs,
    bytes32[5] memory _rssMetadata
  ) internal {
    IWyvernExchange(exchange).atomicMatch_(
      [
        buyOrder.exchange,
        buyOrder.maker,
        buyOrder.taker,
        buyOrder.feeRecipient,
        buyOrder.target,
        buyOrder.staticTarget,
        buyOrder.paymentToken,
        sellOrder.exchange,
        sellOrder.maker,
        sellOrder.taker,
        sellOrder.feeRecipient,
        sellOrder.target,
        sellOrder.staticTarget,
        sellOrder.paymentToken
      ],
      [
        buyOrder.makerRelayerFee,
        buyOrder.takerRelayerFee,
        buyOrder.makerProtocolFee,
        buyOrder.takerProtocolFee,
        buyOrder.basePrice,
        buyOrder.extra,
        buyOrder.listingTime,
        buyOrder.expirationTime,
        buyOrder.salt,
        sellOrder.makerRelayerFee,
        sellOrder.takerRelayerFee,
        sellOrder.makerProtocolFee,
        sellOrder.takerProtocolFee,
        sellOrder.basePrice,
        sellOrder.extra,
        sellOrder.listingTime,
        sellOrder.expirationTime,
        sellOrder.salt
      ],
      [
        uint8(buyOrder.feeMethod),
        uint8(buyOrder.side),
        uint8(buyOrder.saleKind),
        uint8(buyOrder.howToCall),
        uint8(sellOrder.feeMethod),
        uint8(sellOrder.side),
        uint8(sellOrder.saleKind),
        uint8(sellOrder.howToCall)
      ],
      buyOrder.bCalldata,
      sellOrder.bCalldata,
      buyOrder.replacementPattern,
      sellOrder.replacementPattern,
      buyOrder.staticExtradata,
      sellOrder.staticExtradata,
      _vs,
      _rssMetadata
    );
  }
}
