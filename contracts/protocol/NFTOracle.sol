// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {INFTOracle} from "../interfaces/INFTOracle.sol";
import {BlockContext} from "../utils/BlockContext.sol";

contract NFTOracle is INFTOracle, Initializable, OwnableUpgradeable {
  /// @dev When calling getPrice() of a non-minted tokenId it returns '0', shouldn't this revert with an error?
  /// @notice The whenNotPaused modifier is not being used!
  /// @notice INFTOracle.sol is not being used, it is redundant and it hasn't an implementation

  event CollectionAdded(address indexed collection);
  event CollectionRemoved(address indexed collection);
  event NFTPriceAdded(address indexed _collection, uint256 _tokenId, uint256 _price);
  event FeedAdminUpdated(address indexed admin);

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

  modifier onlyAdmin() {
    if (_msgSender() != priceFeedAdmin) revert NotAdmin();
    _;
  }

  modifier onlyExistingCollection(address _collection) {
    bool collectionExists = collections[_collection];
    if (!collectionExists) revert NonExistingCollection(_collection);
    _;
  }

  modifier onlyExistingCollections(address[] memory _collections) {
    for (uint256 i = 0; i < _collections.length; i++) {
      bool collectionExists = collections[_collections[i]];
      if (!collectionExists) revert NonExistingCollection(_collections[i]);
    }
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

  function initialize(address _admin) public initializer {
    __Ownable_init();
    priceFeedAdmin = _admin;
  }

  function _whenNotPaused(address _contract) internal view {
    bool _paused = collectionPaused[_contract];
    if (_paused) revert NFTPaused();
  }

  function setPriceFeedAdmin(address _admin) external onlyOwner {
    priceFeedAdmin = _admin;
    emit FeedAdminUpdated(_admin);
  }

  function setCollections(address[] calldata _collections) external onlyOwner {
    for (uint256 i = 0; i < _collections.length; i++) {
      _addCollection(_collections[i]);
    }
  }

  function addCollection(address _collection) external onlyOwner {
    _addCollection(_collection);
  }

  function _addCollection(address _collection) internal onlyNonExistingCollection(_collection) {
    collections[_collection] = true;
    emit CollectionAdded(_collection);
  }

  function removeCollection(address _collection) external onlyOwner {
    _removeCollection(_collection);
  }

  function _removeCollection(address _collection) internal onlyExistingCollection(_collection) {
    delete collections[_collection];
    delete collectionTokenIds[_collection];
    emit CollectionRemoved(_collection);
  }

  function setNFTPrice(
    address _collection,
    uint256 _tokenId,
    uint256 _price
  ) external override onlyOwner {
    _setNFTPrice(_collection, _tokenId, _price);
  }

  function setMultipleNFTPrices(
    address[] calldata _collections,
    uint256[] calldata _tokenIds,
    uint256[] calldata _prices
  ) external override onlyOwner {
    uint256 collectionsLength = _collections.length;
    if (collectionsLength != _tokenIds.length || collectionsLength != _prices.length) revert ArraysLengthInconsistent();
    for (uint256 i = 0; i < collectionsLength; i++) {
      _setNFTPrice(_collections[i], _tokenIds[i], _prices[i]);
    }
  }

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

  function getNFTPrice(address _collection, uint256 _tokenId)
    external
    view
    override
    onlyExistingCollection(_collection)
    returns (uint256)
  {
    return nftPrices[_collection][_tokenId];
  }

  function getMultipleNFTPrices(address[] calldata _collections, uint256[] calldata _tokenIds)
    external
    view
    override
    onlyExistingCollections(_collections)
    returns (uint256[] memory)
  {
    uint256 collectionsLength = _collections.length;
    if (collectionsLength != _tokenIds.length) revert ArraysLengthInconsistent();
    uint256[] memory _nftPrices = new uint256[](collectionsLength);
    for (uint256 i = 0; i < collectionsLength; i++) {
      _nftPrices[i] = nftPrices[_collections[i]][_tokenIds[i]];
    }
    return _nftPrices;
  }

  function setPause(address _collection, bool paused) external override onlyOwner {
    collectionPaused[_collection] = paused;
  }
}
