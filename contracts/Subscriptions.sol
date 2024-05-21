// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./UniqueUsers.sol";

contract Subscribers {
    mapping(address => uint256) private subscribers_amount_;
    mapping(address => mapping(address => bool)) private is_already_subscriber_;
    UniqueUsers private unique_manager;

    constructor(address _uniqueUsers) {
        unique_manager = UniqueUsers(_uniqueUsers);
    }

    function isAlreadySubscriber(address from_, address to_)
        public
        view
        returns (bool)
    {
        return is_already_subscriber_[from_][to_];
    }

    function isAlreadySubscriber(address to_) public view returns (bool) {
        return is_already_subscriber_[msg.sender][to_];
    }

    event Sub(address indexed from_, address indexed to_);
    event UnSub(address indexed from_, address indexed to_);

    function safeSub(address from_, address to_) private {
        is_already_subscriber_[from_][to_] = true;
        ++subscribers_amount_[to_];
        unique_manager.addCount(from_);
        unique_manager.addCount(to_);
        emit Sub(from_, to_);
    }

    function safeUnsub(address from_, address to_) private {
        is_already_subscriber_[from_][to_] = false;
        --subscribers_amount_[to_];
        emit UnSub(from_, to_);
    }

    function subscribeOn(address to_) public {
        require(msg.sender != to_, "You can't subscribe on yourself!");
        require(
            !isAlreadySubscriber(msg.sender, to_),
            "You're already subscribed"
        );
        safeSub(msg.sender, to_);
    }

    function unsubscribeFrom(address from_) public {
        require(msg.sender != from_, "You can't unsubscribe from yourself!");
        require(
            isAlreadySubscriber(msg.sender, from_),
            "You haven't been subscribed"
        );
        safeUnsub(msg.sender, from_);
    }

    function getSubscribersAmount(address target_)
        public
        view
        returns (uint256)
    {
        return subscribers_amount_[target_];
    }
}
