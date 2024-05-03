// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Subscriptions.sol";
import "./SuperUsers.sol";
import "./UniqueUsers.sol";

contract MyToken {

  Subscribers private sub_manager;
  SuperUsers private super_manager;
  UniqueUsers private unique_manager;

  struct Achievement {
    uint256 id;
    string name;
    string description;
    string baseURI;
    bool is_private;
  }  

  constructor(address _sub, address _superUsers, address _uniqueUsers) {
    sub_manager = Subscribers(_sub);
    super_manager = SuperUsers(_superUsers);
    unique_manager = UniqueUsers(_uniqueUsers);
  }

  uint256 private total_token_id_ = 0;
  mapping (uint256 => Achievement) private achievements_;
  mapping (uint256 => address) private owners_;


  modifier isTokenOwner(uint256 token_id_, address candidate_) {
    require(owners_[token_id_] == candidate_, "wrong owner of the token!");
    _;
  }

  modifier enoughSubscribers(address candidate_) {
    if (!super_manager.isSuperUser(candidate_)) {
      require(
        unique_manager.getUniqueUsersCnt() > 0 &&
        sub_manager.getSubscribersAmount(candidate_) * 100 / unique_manager.getUniqueUsersCnt() >= 15, 
        "not enough subscriptions to mint!");
    }
    _;
  }

  modifier validToken(uint256 token_id_) {
    require(token_id_ <= total_token_id_, "invalid token id!");
    _;
  }


  event Minted(address indexed to_, uint256 indexed token_id_);
  event Transfered(address indexed from_, address indexed to_, uint256 indexed token_id_);


  function safeMint(Achievement memory new_achievment, address to_) private {
    achievements_[new_achievment.id] = new_achievment;
    owners_[new_achievment.id] = to_;
    emit Minted(to_, new_achievment.id);
  }

  function safeTransfer(uint256 token_id_, address to_) private {
    owners_[token_id_] = to_;
    emit Transfered(msg.sender, to_, token_id_);
  }

  function mint(string memory name_, string memory description_, 
                string memory baseURI_, bool is_private, address to_) 
      public enoughSubscribers(msg.sender) {
    total_token_id_++;
    Achievement memory new_achievement = Achievement(
      total_token_id_, name_, description_, baseURI_, is_private
    );
    safeMint(new_achievement, to_);
    unique_manager.addCount(msg.sender);
  }

  function transfer(uint256 token_id_, address to_) 
      public validToken(token_id_) isTokenOwner(token_id_, msg.sender) {
    safeTransfer(token_id_, to_);
  }

  function burn(uint256 token_id_) public {
    transfer(token_id_, address(0));
  }

  function getAchievement(uint256 token_id) public view returns(Achievement memory) {
    return achievements_[token_id];
  }

  function isOwner(uint256 token_id, address candidate_) public view returns(bool) {
    return owners_[token_id] == candidate_;
  }

  function isOwner(uint256 token_id) public view returns(bool) {
    return owners_[token_id] == msg.sender;
  }

  function getOwner(uint256 token_id) public view returns(address) {
    return owners_[token_id];
  }

  function getAllAchievements(address account_) public view returns(Achievement[] memory) {
    uint256 cnt = 0;
    for (uint256 i = 0; i <= total_token_id_; i++) {
      if (isOwner(i, account_)) {
        cnt += 1;
      }
    }
    Achievement[] memory result = new Achievement[](cnt);
    uint256 cur_index = 0;
    for (uint256 i = 0; i <= total_token_id_; i++) {
      if (isOwner(i, account_)) {
        result[cur_index] = achievements_[i];
        cur_index++;
      }
    }
    return result;
  } 
}