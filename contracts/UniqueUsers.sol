// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;


contract UniqueUsers {
  uint256 private unique_users_cnt_ = 0;
  mapping (address => bool) private users_active_; 
  mapping (address => bool) private can_call_;
  address private contact_owner_;

  constructor () {
    contact_owner_ = msg.sender;
  }

  modifier Callable(address contract_candidate_) {
    require(
      can_call_[contract_candidate_] || contract_candidate_ == contact_owner_, 
      "not allowed call function from that address!");
    _;
  }

  modifier isOwner(address user_) {
    require(contact_owner_ == user_, "wrong owner of the contract!");
    _;
  }

  function addTrustContracts(address[] memory contracts_) public isOwner(msg.sender) {
    for (uint256 i = 0; i < contracts_.length; ++i) {
      can_call_[contracts_[i]] = true;
    }
  }

  event newUniqueUser(address user_);

  function addCount(address user_) public Callable(msg.sender) {
    if (!users_active_[user_]) {
      ++unique_users_cnt_;
      emit newUniqueUser(user_);
    }
    users_active_[user_] = true;
  }

  function getUniqueUsersCnt() public view returns(uint256) {
    return unique_users_cnt_;
  }

  function canCall(address candidate_) public view returns(bool) {
    return can_call_[candidate_];
  }
}   