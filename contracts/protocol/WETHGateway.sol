// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ERC721HolderUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IWETHGateway} from "../interfaces/IWETHGateway.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IUToken} from "../interfaces/IUToken.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";

import {EmergencyTokenRecoveryUpgradeable} from "./EmergencyTokenRecoveryUpgradeable.sol";

contract WETHGateway is IWETHGateway, ERC721HolderUpgradeable, EmergencyTokenRecoveryUpgradeable {
  ILendPoolAddressesProvider internal _addressProvider;

  IWETH internal WETH;

  mapping(address => bool) internal _callerWhitelists;

  uint256 private constant _NOT_ENTERED = 0;
  uint256 private constant _ENTERED = 1;
  uint256 private _status;

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and making it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    // On the first call to nonReentrant, _notEntered will be true
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    // Any calls to nonReentrant after this point will fail
    _status = _ENTERED;

    _;

    // By storing the original value once again, a refund is triggered (see
    // https://eips.ethereum.org/EIPS/eip-2200)
    _status = _NOT_ENTERED;
  }

  /**
   * @dev Sets the WETH address and the LendPoolAddressesProvider address. Infinite approves lend pool.
   * @param weth Address of the Wrapped Ether contract
   **/
  function initialize(address addressProvider, address weth) public initializer {
    __ERC721Holder_init();
    __EmergencyTokenRecovery_init();

    _addressProvider = ILendPoolAddressesProvider(addressProvider);

    WETH = IWETH(weth);

    WETH.approve(address(_getLendPool()), type(uint256).max);
  }

  /**
   * @notice returns the LendPool address
   */
  function _getLendPool() internal view returns (ILendPool) {
    return ILendPool(_addressProvider.getLendPool());
  }

  /**
   * @notice returns the LendPoolLoan address
   */
  function _getLendPoolLoan() internal view returns (ILendPoolLoan) {
    return ILendPoolLoan(_addressProvider.getLendPoolLoan());
  }

  /**
   * @dev approves the lendpool for the given NFT assets
   * @param nftAssets the array of nft assets
   */
  function authorizeLendPoolNFT(address[] calldata nftAssets) external nonReentrant onlyOwner {
    uint256 nftAssetsLength = nftAssets.length;
    for (uint256 i = 0; i < nftAssetsLength; ) {
      IERC721Upgradeable(nftAssets[i]).setApprovalForAll(address(_getLendPool()), true);

      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev authorizes/unauthorizes a list of callers for the whitelist
   * @param callers the array of callers to be authorized
   * @param flag the flag to authorize/unauthorize
   */
  function authorizeCallerWhitelist(address[] calldata callers, bool flag) external nonReentrant onlyOwner {
    uint256 callerLength = callers.length;
    for (uint256 i = 0; i < callerLength; ) {
      _callerWhitelists[callers[i]] = flag;

      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev checks if caller is whitelisted
   * @param caller the caller to check
   */
  function isCallerInWhitelist(address caller) external view returns (bool) {
    return _callerWhitelists[caller];
  }

  /**
   * @dev checks if caller's approved address is valid
   * @param onBehalfOf the address to check approval of the caller
   */
  function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view {
    require(
      (onBehalfOf == _msgSender()) || (_callerWhitelists[_msgSender()] == true),
      Errors.CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST
    );
  }

  /**
   * @inheritdoc IWETHGateway
   */
  function depositETH(address onBehalfOf, uint16 referralCode) external payable override nonReentrant {
    _checkValidCallerAndOnBehalfOf(onBehalfOf);

    ILendPool cachedPool = _getLendPool();

    WETH.deposit{value: msg.value}();
    cachedPool.deposit(address(WETH), msg.value, onBehalfOf, referralCode);
  }

  /**
   * @inheritdoc IWETHGateway
   */
  function withdrawETH(uint256 amount, address to) external override nonReentrant {
    _checkValidCallerAndOnBehalfOf(to);

    ILendPool cachedPool = _getLendPool();
    IUToken uWETH = IUToken(cachedPool.getReserveData(address(WETH)).uTokenAddress);

    uint256 userBalance = uWETH.balanceOf(msg.sender);
    uint256 amountToWithdraw = amount;

    // if amount is equal to uint(-1), the user wants to redeem everything
    if (amount == type(uint256).max) {
      amountToWithdraw = userBalance;
    }

    uWETH.transferFrom(msg.sender, address(this), amountToWithdraw);
    cachedPool.withdraw(address(WETH), amountToWithdraw, address(this));
    WETH.withdraw(amountToWithdraw);
    _safeTransferETH(to, amountToWithdraw);
  }

  /**
   * @inheritdoc IWETHGateway
   */
  function borrowETH(
    uint256 amount,
    address nftAsset,
    uint256 nftTokenId,
    address onBehalfOf,
    uint16 referralCode
  ) external override nonReentrant {
    _checkValidCallerAndOnBehalfOf(onBehalfOf);

    ILendPool cachedPool = _getLendPool();
    ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    if (loanId == 0) {
      IERC721Upgradeable(nftAsset).safeTransferFrom(msg.sender, address(this), nftTokenId);
    }
    cachedPool.borrow(address(WETH), amount, nftAsset, nftTokenId, onBehalfOf, referralCode);
    WETH.withdraw(amount);
    _safeTransferETH(onBehalfOf, amount);
  }

  /**
   * @inheritdoc IWETHGateway
   */
  function repayETH(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount
  ) external payable override nonReentrant returns (uint256, bool) {
    (uint256 repayAmount, bool repayAll) = _repayETH(nftAsset, nftTokenId, amount, 0);

    // refund remaining dust eth
    if (msg.value > repayAmount) {
      _safeTransferETH(msg.sender, msg.value - repayAmount);
    }

    return (repayAmount, repayAll);
  }

  /**
   * @dev repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified).
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
   * @param amount the amount to repay, or uint256(-1) if the user wants to repay everything
   * @param accAmount the accumulated amount
  
   */
  function _repayETH(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount,
    uint256 accAmount
  ) internal returns (uint256, bool) {
    ILendPool cachedPool = _getLendPool();
    ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    require(loanId > 0, "collateral loan id not exist");

    (address reserveAsset, uint256 repayDebtAmount) = cachedPoolLoan.getLoanReserveBorrowAmount(loanId);
    require(reserveAsset == address(WETH), "loan reserve not WETH");

    if (amount < repayDebtAmount) {
      repayDebtAmount = amount;
    }

    require(msg.value >= (accAmount + repayDebtAmount), "msg.value is less than repay amount");

    WETH.deposit{value: repayDebtAmount}();
    (uint256 paybackAmount, bool burn) = cachedPool.repay(nftAsset, nftTokenId, amount);

    return (paybackAmount, burn);
  }

  function auctionETH(address nftAsset, uint256 nftTokenId, address onBehalfOf) external payable override nonReentrant {
    _checkValidCallerAndOnBehalfOf(onBehalfOf);

    ILendPool cachedPool = _getLendPool();
    ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    require(loanId > 0, "collateral loan id not exist");

    DataTypes.LoanData memory loan = cachedPoolLoan.getLoan(loanId);
    require(loan.reserveAsset == address(WETH), "loan reserve not WETH");

    WETH.deposit{value: msg.value}();
    cachedPool.auction(nftAsset, nftTokenId, msg.value, onBehalfOf);
  }

  function redeemETH(
    address nftAsset,
    uint256 nftTokenId,
    uint256 amount,
    uint256 bidFine
  ) external payable override nonReentrant returns (uint256) {
    ILendPool cachedPool = _getLendPool();
    ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    require(loanId > 0, "collateral loan id not exist");

    DataTypes.LoanData memory loan = cachedPoolLoan.getLoan(loanId);
    require(loan.reserveAsset == address(WETH), "loan reserve not WETH");

    require(msg.value >= (amount + bidFine), "msg.value is less than redeem amount");

    WETH.deposit{value: msg.value}();

    uint256 paybackAmount = cachedPool.redeem(nftAsset, nftTokenId, amount, bidFine);

    // refund remaining dust eth
    if (msg.value > paybackAmount) {
      WETH.withdraw(msg.value - paybackAmount);
      _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    return paybackAmount;
  }

  function liquidateETH(address nftAsset, uint256 nftTokenId) external payable override nonReentrant returns (uint256) {
    ILendPool cachedPool = _getLendPool();
    ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    require(loanId > 0, "collateral loan id not exist");

    DataTypes.LoanData memory loan = cachedPoolLoan.getLoan(loanId);
    require(loan.reserveAsset == address(WETH), "loan reserve not WETH");

    if (msg.value > 0) {
      WETH.deposit{value: msg.value}();
    }

    uint256 extraAmount = cachedPool.liquidate(nftAsset, nftTokenId, msg.value);

    if (msg.value > extraAmount) {
      WETH.withdraw(msg.value - extraAmount);
      _safeTransferETH(msg.sender, msg.value - extraAmount);
    }

    return (extraAmount);
  }

  /**
    @dev Executes the buyout for an NFT with a non-healthy position collateral-wise
   * @param nftAsset The address of the underlying NFT used as collateral
   * @param nftTokenId The token ID of the underlying NFT used as collateral
    * @param onBehalfOf The address that will receive the NFT, same as msg.sender if the user
   *   wants to receive them on his own wallet, or a different address if the beneficiary of the NFT
   *   is a different wallet
   **/
  function buyoutETH(address nftAsset, uint256 nftTokenId, address onBehalfOf) external payable override nonReentrant {
    _checkValidCallerAndOnBehalfOf(onBehalfOf);

    ILendPool cachedPool = _getLendPool();
    ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

    uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
    require(loanId > 0, "collateral loan id not exist");

    DataTypes.LoanData memory loan = cachedPoolLoan.getLoan(loanId);
    require(loan.reserveAsset == address(WETH), "loan reserve not WETH");

    if (msg.value > 0) {
      WETH.deposit{value: msg.value}();
    }

    cachedPool.buyout(nftAsset, nftTokenId, msg.value, onBehalfOf);
  }

  /**
   * @dev transfer ETH to an address, revert if it fails.
   * @param to recipient of the transfer
   * @param value the amount to send
   */
  function _safeTransferETH(address to, uint256 value) internal {
    (bool success, ) = to.call{value: value}(new bytes(0));
    require(success, "ETH_TRANSFER_FAILED");
  }

  /**
   * @dev Get WETH address used by WETHGateway
   */
  function getWETHAddress() external view returns (address) {
    return address(WETH);
  }

  /**
   * @dev Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract.
   */
  receive() external payable {
    require(msg.sender == address(WETH), "Receive not allowed");
  }

  /**
   * @dev Revert fallback calls
   */
  fallback() external payable {
    revert("Fallback not allowed");
  }
}
