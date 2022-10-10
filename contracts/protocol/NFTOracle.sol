// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import {INFTOracle} from "../interfaces/INFTOracle.sol";
import {INFTXVaultFactoryV2} from "../interfaces/INFTXVaultFactoryV2.sol";
import {INFTXVault} from "../interfaces/INFTXVault.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";
import {BlockContext} from "../utils/BlockContext.sol";
import {Errors} from "../libraries/helpers/Errors.sol";

contract NFTOracle is INFTOracle, Initializable, OwnableUpgradeable {
  /// @dev When calling getPrice() of a non-minted tokenId it returns '0', shouldn't this revert with an error?
  /// @notice The whenNotPaused modifier is not being used!
  /// @notice INFTOracle.sol is not being used, it is redundant and it hasn't an implementation
  /**
   * @dev Emitted when a collection is added to the oracle
   * @param collection The added collection
   **/
  event CollectionAdded(address indexed collection);
  /**
   * @dev Emitted when a collection is removed from the oracle
   * @param collection The removed collection
   **/
  event CollectionRemoved(address indexed collection);
  /**
   * @dev Emitted when a price is added for an NFT asset
   * @param _collection The NFT collection
   * @param _tokenId The NFT token Id
   **/
  event NFTPriceAdded(address indexed _collection, uint256 _tokenId, uint256 _price);
  /**
   * @dev Emitted when the admin has been updated
   * @param admin The new admin
   **/
  event FeedAdminUpdated(address indexed admin);

  /**
   * @dev Emitted when the pause status is set to a collection
   * @param paused the new pause status
   **/
  event CollectionPaused(bool indexed paused);

  error NotAdmin();
  error NonExistingCollection(address collection);
  error AlreadyExistingCollection();
  error NFTPaused();
  error ArraysLengthInconsistent();
  error PriceIsZero();

  //Map collection address to token ID. Then map token ID with token price
  mapping(address => mapping(uint256 => uint256)) public nftPrices;
  //Keeps track of collections currently supported by the protocol
  mapping(address => bool) public collections;
  //Keeps track of token IDs in a collection
  mapping(address => uint256[]) public collectionTokenIds;

  address public priceFeedAdmin;
  mapping(address => bool) public collectionPaused;

  address public nftxVaultFactory;
  address public sushiswapRouter;

  mapping(address => bool) isPriceManager;

  modifier onlyAdmin() {
    if (_msgSender() != priceFeedAdmin) revert NotAdmin();
    _;
  }

  modifier onlyPriceManager() {
    require(isPriceManager[msg.sender], Errors.CALLER_NOT_PRICE_MANAGER);
    _;
  }


  modifier onlyExistingCollection(address _collection) {
    bool collectionExists = collections[_collection];
    if (!collectionExists) revert NonExistingCollection(_collection);
    _;
  }


  modifier onlyNonExistingCollection(address _collection) {
    bool collectionExists = collections[_collection];
    if (collectionExists) revert AlreadyExistingCollection();
    _;
  }

  modifier whenNotPaused(address _nftContract) {
    _whenNotPaused(_nftContract);
    _;
  }

  /**
   * @dev Function is invoked by the proxy contract when the NFTOracle contract is added to the
   * LendPoolAddressesProvider of the market.
   * @param _admin The admin address
   **/
  function initialize(
    address _admin,
    address _nftxVaultFactory,
    address _sushiswapRouter
  ) public initializer {
    require(
      _admin != address(0) && _nftxVaultFactory != address(0) && _sushiswapRouter != address(0),
      Errors.INVALID_ZERO_ADDRESS
    );
    __Ownable_init();
    priceFeedAdmin = _admin;
    nftxVaultFactory = _nftxVaultFactory;
    sushiswapRouter = _sushiswapRouter;
    isPriceManager[_msgSender()] = true;
  }

  /**
   * @dev checks whether the NFT oracle is paused
   * @param _contract The NFTOracle address
   **/
  function _whenNotPaused(address _contract) internal view {
    bool _paused = collectionPaused[_contract];
    if (_paused) revert NFTPaused();
  }

  /**
  @dev sets the price feed admin of the oracle
  @param _admin the address to become the admin
   */
  function setPriceFeedAdmin(address _admin) external onlyOwner {
    require(_admin != address(0), Errors.INVALID_ZERO_ADDRESS);
    priceFeedAdmin = _admin;
    emit FeedAdminUpdated(_admin);
  }

  /**
  @dev adds multiple collections to the oracle
  @param _collections the array NFT collections to add
   */
  function setCollections(address[] calldata _collections) external onlyOwner {
    uint256 collectionsLength = _collections.length;
    for (uint256 i = 0; i != collectionsLength; ) {
      _addCollection(_collections[i]);
      unchecked {
        ++i;
      }
    }
  }

  /**
  @dev adds a collection to the oracle
  @param _collection the NFT collection to add
   */
  function addCollection(address _collection) external onlyOwner {
    _addCollection(_collection);
  }

  /**
  @dev adds a collection to the oracle
  @param _collection the NFT collection to add
   */
  function _addCollection(address _collection) internal onlyNonExistingCollection(_collection) {
    collections[_collection] = true;
    emit CollectionAdded(_collection);
  }

  /**
  @dev removes a collection from the oracle
  @param _collection the NFT collection to remove
   */
  function removeCollection(address _collection) external onlyOwner {
    _removeCollection(_collection);
  }

  /**
  @dev removes a collection from the oracle
  @param _collection the NFT collection to remove
   */
  function _removeCollection(address _collection) internal onlyExistingCollection(_collection) {
    delete collections[_collection];
    delete collectionTokenIds[_collection];
    emit CollectionRemoved(_collection);
  }

  /**
   * @inheritdoc INFTOracle
   */
  function setNFTPrice(
    address _collection,
    uint256 _tokenId,
    uint256 _price
  ) external override onlyPriceManager {

    _setNFTPrice(_collection, _tokenId, _price);
  }

  /**
   * @inheritdoc INFTOracle
   */
  function setMultipleNFTPrices(
    address[] calldata _collections,
    uint256[] calldata _tokenIds,
    uint256[] calldata _prices
  ) external override onlyAdmin {
    uint256 collectionsLength = _collections.length;
    if (collectionsLength != _tokenIds.length || collectionsLength != _prices.length) revert ArraysLengthInconsistent();
    for (uint256 i = 0; i != collectionsLength; ) {
      _setNFTPrice(_collections[i], _tokenIds[i], _prices[i]);
      unchecked {
        ++i;
      }
    }
  }

  /**
  @dev sets the price for a given NFT 
  @param _collection the NFT collection
  @param _tokenId the NFT token Id
  @param _price the price to set to the token
   */
  function _setNFTPrice(
    address _collection,
    uint256 _tokenId,
    uint256 _price
  ) internal onlyExistingCollection(_collection) whenNotPaused(_collection) {
    if (_price <= 0) revert PriceIsZero();
    nftPrices[_collection][_tokenId] = _price;
    collectionTokenIds[_collection].push(_tokenId);
    emit NFTPriceAdded(_collection, _tokenId, _price);
  }

  /**
   * @inheritdoc INFTOracle
   */
  function getNFTPrice(address _collection, uint256 _tokenId)
    external
    view
    override
    onlyExistingCollection(_collection)
    returns (uint256)
  {
    if (nftPrices[_collection][_tokenId] == 0) revert PriceIsZero();
    return nftPrices[_collection][_tokenId];
  }

  /**
   * @inheritdoc INFTOracle
   */
  function getMultipleNFTPrices(address[] calldata _collections, uint256[] calldata _tokenIds)
    external
    view
    override
    returns (uint256[] memory)
  {
    uint256 collectionsLength = _collections.length;
    if (collectionsLength != _tokenIds.length) revert ArraysLengthInconsistent();

    uint256[] memory _nftPrices = new uint256[](collectionsLength);

    for (uint256 i = 0; i != collectionsLength; ) {
      _nftPrices[i] = this.getNFTPrice(_collections[i], _tokenIds[i]);
      unchecked {
        ++i;
      }
    }

    return _nftPrices;
  }

  /**
   * @inheritdoc INFTOracle
   */
  function setPause(address _collection, bool paused) external override onlyOwner onlyExistingCollection(_collection) {
    collectionPaused[_collection] = paused;
    emit CollectionPaused(paused);

  }

  function setPriceManagerStatus(address newLtvManager, bool val) external onlyOwner {
    isPriceManager[newLtvManager] = val;
  }

  /**
   * @inheritdoc INFTOracle
   */
  function getNFTPriceNFTX(address _collection, uint256 _tokenId)
    external
    view
    override
    onlyExistingCollection(_collection)
    returns (uint256)
  {
    // Get NFTX Vaults for asset
    address[] memory vaultAddresses = INFTXVaultFactoryV2(nftxVaultFactory).vaultsForAsset(_collection);

    uint256[] memory tokenIds = new uint256[](1);
    tokenIds[0] = _tokenId;

    for (uint256 i = 0; i != vaultAddresses.length; ) {
      INFTXVault nftxVault = INFTXVault(vaultAddresses[i]);
      if (nftxVault.allValidNFTs(tokenIds)) {
        // Swap path is NFTX Vault -> WETH
        address[] memory swapPath = new address[](2);
        swapPath[0] = address(nftxVault);
        swapPath[1] = IUniswapV2Router02(sushiswapRouter).WETH();

        // Get the price from sushiswap
        uint256 amountIn = 1**IERC20MetadataUpgradeable(address(nftxVault)).decimals();
        uint256[] memory amounts = IUniswapV2Router02(sushiswapRouter).getAmountsOut(amountIn, swapPath);
        return amounts[1];
      }
      ++i;
    }

    revert PriceIsZero();
  }
}
