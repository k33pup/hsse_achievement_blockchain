# HSSE Achievement project, blockchain part

This project demonstrates blockchain entities and some tests written using hardhat.

* MyToken contract is the simple adaptation of NFT. You can mint your achievements, transfer and burn them.  
* Subscribers contract is the manager of subscriptions between users. You can subscribe and unsubscribe from user.  
* SuperUsers contract is the manager of superusers who can mint tokens without special conditions, plus starting decentralized voting for adding/removing superuser rights.  
* Usernames contract is the matcher between addresses and usernames.  
* UniqueUsers contract is the activity supervisor who has a count of active users of the App.  

## Deployment order:
1. Usernames
2. UniqueUsers
3. Subscribers
4. SuperUsers
5. UniqueUsers.addTrusContracts([Subscribers, SuperUsers])
6. MyToken
7. UniqueUsers.addTrusContracts([MyToken])

## Test coverage:
![image](https://github.com/k33pup/hsse_achievement_blockchain/assets/74131544/6136d73b-b72d-45a6-b257-c5ccc999dda0)
