// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;


contract Usernames {
  mapping (address => string) private usernames_;
  mapping (string => address) private owners_;

  modifier isUnique(string memory username_) {
    require(getOwner(username_) == address(0), "username is already taken!");
    _;
  }

  modifier validUsername(string memory username_) {
    require(bytes(username_).length != 0, "empty username is not valid!");
    _;
  }

  modifier alreadyHasUsername(address user_) {
    require(bytes(usernames_[user_]).length != 0, "you don't have username!");
    _;
  }

  function hasUsername() public view returns (bool) {
    bytes memory bytestring_ = bytes(usernames_[msg.sender]);
    return bytestring_.length != 0;   
  }

  function hasUsername(address user_) public view returns (bool) {
    bytes memory bytestring_ = bytes(usernames_[user_]);
    return bytestring_.length != 0;   
  }

  function getOwner(string memory username_) public view returns(address) {
    return owners_[username_];
  }

  function getUsername() public view returns (string memory) {
    return usernames_[msg.sender];
  }

  function getUsername(address user_) public view returns (string memory) {
    return usernames_[user_];
  }

  function setUsername(string memory name_) external isUnique(name_) validUsername(name_) {
    if (hasUsername(msg.sender)) {
      owners_[usernames_[msg.sender]] = address(0);
    }
    usernames_[msg.sender] = name_;
    owners_[name_] = msg.sender;
  }

  function delUsername() external alreadyHasUsername(msg.sender) {
    owners_[usernames_[msg.sender]] = address(0);
    usernames_[msg.sender] = "";
  }
}