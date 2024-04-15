// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Subscribers.sol";

contract MyToken {

  Subscribers private sub_manager;

  struct Achievement {
    uint256 id;
    string name;
    string baseURI;
  }

  constructor(address _sub) {
    sub_manager = Subscribers(_sub);
  }

  uint256 private total_token_id_ = 0;
  mapping (uint256 => Achievement) private achievements_;
  mapping (uint256 => address) private owners_;

  function safeMint(Achievement memory new_achievment, address to_) private {
    achievements_[new_achievment.id] = new_achievment;
    owners_[new_achievment.id] = to_;
  }

  function safeTransfer(uint256 token_id_, address to_) private {
    owners_[token_id_] = to_;
  }

  function mint(string memory name_, string memory baseURI_, address to_) public {
    require(sub_manager.getSubscribersAmount(msg.sender) > 0, "1");
    total_token_id_++;
    Achievement memory new_achievement = Achievement(
      total_token_id_, name_, baseURI_
    );
    safeMint(new_achievement, to_);
  }

  function transfer(uint256 token_id_, address to_) public {
    require(token_id_ <= total_token_id_, "invalid token id!");
    require(owners_[token_id_] == msg.sender, "you are not the owener of token!");
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
