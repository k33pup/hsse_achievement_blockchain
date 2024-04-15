// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Subscribers.sol";

contract DemoSubscribe {

  Subscribers sub;

  constructor(address _sub) {
    sub = Subscribers(_sub);
  }

  function getSubAmount(address _from) public view returns(uint) {
    return sub.getSubscribersAmount(_from);
  }

  function isAlreadySub(address _from) public view returns(bool) {
    return sub.isAlreadySubscriber(msg.sender, _from);
  }

  function subscribeOn(address _to) public {
    sub.subscribeOn(msg.sender, _to);
  }
}