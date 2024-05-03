// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./UniqueUsers.sol";
import "./Subscriptions.sol";

contract SuperUsers {
  UniqueUsers private unique_manager;
  Subscribers private subscriptions_manager;

  mapping(address => bool) private is_super_user_;

  constructor(address _uniqueUsers, address _subscriptions, address[] memory super_users) {
      unique_manager = UniqueUsers(_uniqueUsers);
      subscriptions_manager = Subscribers(_subscriptions);

      for (uint256 i = 0; i < super_users.length; ++i) {
          is_super_user_[super_users[i]] = true;
      }
  }

  function isSuperUser(address user) public view returns (bool) {
      return is_super_user_[user];
  }

  uint256 public constant voting_duration = 2 days;
  mapping(uint256 => Voting) private votings_;
  mapping(uint256 => mapping(address => bool)) private has_voted_;
  uint256 private current_voting_number_ = 0;

  struct Voting {
      address user;
      uint256 participated_users;
      uint256 againstVotes;
      uint256 forVotes;
      uint256 votingStarts;
      bool executed;
      bool is_new_super_added; // if false, then voting's for taking away super user rights
  }

  modifier has5SubsOrSuperUser(address user) {
      if (!isSuperUser(user)) {
          require(subscriptions_manager.getSubscribersAmount(user) >= 5, "You don't have enought subscribers");
      }
      _;
  }

  function setVotingForNewSuperUser(address user) public has5SubsOrSuperUser(msg.sender) {
      require(
          is_super_user_[user] == false,
          "This address's already a super user"
      );
      ++current_voting_number_;

      Voting memory newVoting = Voting(user, 0, 0, 0, block.timestamp, false, true);

      votings_[current_voting_number_] = newVoting;

      unique_manager.addCount(user);
  }

  function setVotingForTakingAwaySuperUserRights(address user) public has5SubsOrSuperUser(msg.sender) {
      require(
          is_super_user_[user] == true,
          "This address's not a super user"
      );
      ++current_voting_number_;

      Voting memory newVoting = Voting(user, 0, 0, 0, block.timestamp, false, false);

      votings_[current_voting_number_] = newVoting;

      unique_manager.addCount(user);
  }

  modifier onlyUnvoted(uint256 voting_number) {
      require(
          has_voted_[voting_number][msg.sender] == false,
          "You've already voted"
      );
      _;
  }

  modifier hasNotFinished(uint256 voting_number) {
      require(
          votings_[voting_number].votingStarts + voting_duration >
              block.timestamp,
          "This voting's already finished"
      );
      _;
  }

  modifier validVoting(uint256 voting_number) {
      require(
          voting_number > 0 && voting_number <= current_voting_number_,
          "Invalid voting number"
      );
      _;
  }

  function voteFor(uint256 voting_number)
      public
      validVoting(voting_number)
      hasNotFinished(voting_number)
      onlyUnvoted(voting_number)
      has5SubsOrSuperUser(msg.sender)
  {
      has_voted_[voting_number][msg.sender] = true;
      votings_[voting_number].forVotes += subscriptions_manager.getSubscribersAmount(msg.sender);
      ++votings_[voting_number].participated_users;
      unique_manager.addCount(msg.sender);
  }

  function voteAgainst(uint256 voting_number)
      public
      validVoting(voting_number)
      hasNotFinished(voting_number)
      onlyUnvoted(voting_number)
      has5SubsOrSuperUser(msg.sender)
  {
      has_voted_[voting_number][msg.sender] = true;
      votings_[voting_number].againstVotes += subscriptions_manager.getSubscribersAmount(msg.sender);
      ++votings_[voting_number].participated_users;
      unique_manager.addCount(msg.sender);
  }

  event BecomeSuperUser(address indexed user_);
  event RemoveSuperUser(address indexed user_);
  event VotingEnded(Voting indexed voting_, bool indexed result);

  function summarizeVoting(uint256 voting_number)
      public
      validVoting(voting_number)
  {
      require(votings_[voting_number].executed == false, "Voting's ended");
      require(
          votings_[voting_number].votingStarts + voting_duration <
              block.timestamp,
          "Voting hasn't finished"
      );
      votings_[voting_number].executed = true;
      if (
          votings_[voting_number].forVotes > votings_[voting_number].againstVotes &&
          ((votings_[voting_number].participated_users) * 100 / unique_manager.getUniqueUsersCnt()) >= 15
      ) {
          is_super_user_[votings_[voting_number].user] = votings_[voting_number].is_new_super_added;
          emit VotingEnded(votings_[voting_number], true);
          if (votings_[voting_number].is_new_super_added) {
              emit BecomeSuperUser(votings_[voting_number].user);
          } else {
              emit RemoveSuperUser(votings_[voting_number].user);
          }
      } else {
          emit VotingEnded(votings_[voting_number], false);
      }
  }
}