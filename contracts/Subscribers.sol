// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;


contract Subscribers {
  mapping (address => uint256) private subscribers_amount_;
  mapping (address => mapping (address => bool)) private is_already_subscriber_;


  function isAlreadySubscriber(address subscribe_from, address subscribe_to) public view returns(bool){
    return is_already_subscriber_[subscribe_from][subscribe_to];
  }

  function Sub(address subscribe_from, address subscribe_to) private {
    is_already_subscriber_[subscribe_from][subscribe_to] = true;
    subscribers_amount_[subscribe_to] += 1;
  }

  function subscribeOn(address subscribe_from, address subscribe_to) public {
    require(!isAlreadySubscriber(subscribe_from, subscribe_to), "You're already subscribed");
    require(subscribe_from != subscribe_to, "You can't subscribed on yourself!");
    Sub(subscribe_from, subscribe_to);
  }

  function getSubscribersAmount(address target) view public returns(uint256) {
    return subscribers_amount_[target];
  }
}