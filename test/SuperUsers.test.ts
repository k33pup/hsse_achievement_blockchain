import { loadFixture, ethers, expect } from "./setup";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SuperUsers", function () {
    async function deploy() {
        const [user1, user2, user3, user4, user5, has6subs_1, has5subs_1, has5subs_2, start_super_user, start_super_user_2, start_super_user_3] = await ethers.getSigners();

        const uniqueUsersFactory = await ethers.getContractFactory("UniqueUsers");
        const subscribersFactory = await ethers.getContractFactory("Subscribers");
        const superUsersFactory = await ethers.getContractFactory("SuperUsers");

        const unique_useres = await uniqueUsersFactory.deploy();
        await unique_useres.waitForDeployment();

        const subscribers = await subscribersFactory.deploy(await unique_useres.getAddress());
        await subscribers.waitForDeployment();

        const super_users = await superUsersFactory.deploy(
            unique_useres.getAddress(),
            subscribers.getAddress(),
            [start_super_user.address, start_super_user_2.address, start_super_user_3.address]
        );

        await unique_useres.addTrustContracts([await subscribers.getAddress(), await super_users.getAddress()]);

        for (let from_ of [user1, user2, user3, user4, user5]) {
            for (let to_ of [has6subs_1, has5subs_1, has5subs_2]) {
                await subscribers.connect(from_).subscribeOn(to_);
            }
        }

        await subscribers.connect(start_super_user).subscribeOn(has6subs_1);
        // now start_super_user counts as unique_user
        // there's 11 unique_users, so voting must have more than one participant

        return { user1, user2, user3, has6subs_1, has5subs_1, has5subs_2, start_super_user, super_users, start_super_user_2, start_super_user_3 }

    }

    it("should be deployed", async function () {
        const { super_users } = await loadFixture(deploy);

        expect(super_users.target).to.be.properAddress;
    })

    it("check super users rights", async function () {
        const { user1, start_super_user, super_users } = await loadFixture(deploy);

        expect(await super_users.connect(user1).isSuperUser(user1)).to.eq(false);
        expect(await super_users.connect(user1).isSuperUser(start_super_user)).to.eq(true);
    })

    it("set votings", async function () {
        const { user1, user2, user3, start_super_user, start_super_user_2, start_super_user_3, has6subs_1, super_users} = await loadFixture(deploy);

        // is able to start voting
        await super_users.connect(start_super_user).setVotingForNewSuperUser(user1);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(user2);
        await expect(super_users.connect(user1).setVotingForNewSuperUser(user3)).to.be.rejectedWith("You don't have enought subscribers");
        await super_users.connect(start_super_user).setVotingForTakingAwaySuperUserRights(start_super_user);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user_2);
        await expect(super_users.connect(user1).setVotingForTakingAwaySuperUserRights(start_super_user_3)).to.be.rejectedWith("You don't have enought subscribers");

        // is able to start voting for this user
        await expect(super_users.connect(has6subs_1).setVotingForNewSuperUser(start_super_user)).to.be.rejectedWith("This address's already a super user");
        await expect(super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(user1)).to.be.rejectedWith("This address's not a super user");
    })

    it("vote for", async function () {
        const { user1, has5subs_1, start_super_user, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await expect(super_users.connect(has5subs_1).voteFor(2)).to.be.rejectedWith("Invalid voting number");
        await expect(super_users.connect(has5subs_1).voteFor(0)).to.be.rejectedWith("Invalid voting number");

        await expect(super_users.connect(user1).voteFor(1)).to.be.rejectedWith("You don't have enought subscribers");
        await super_users.connect(start_super_user).voteFor(1);
        await super_users.connect(has5subs_1).voteFor(1);

        await expect(super_users.connect(has5subs_1).voteFor(1)).to.be.rejectedWith("You've already voted");

        await time.increase(172800);
        await expect(super_users.connect(has6subs_1).voteFor(1)).to.be.rejectedWith("This voting's already finished");
    })

    it("vote against", async function () {
        const { user1, has5subs_1, start_super_user, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await expect(super_users.connect(has5subs_1).voteAgainst(2)).to.be.rejectedWith("Invalid voting number");
        await expect(super_users.connect(has5subs_1).voteAgainst(0)).to.be.rejectedWith("Invalid voting number");

        await expect(super_users.connect(user1).voteAgainst(1)).to.be.rejectedWith("You don't have enought subscribers");
        await super_users.connect(start_super_user).voteAgainst(1);
        await super_users.connect(has5subs_1).voteAgainst(1);

        await expect(super_users.connect(has5subs_1).voteAgainst(1)).to.be.rejectedWith("You've already voted");

        await time.increase(172800);
        await expect(super_users.connect(has6subs_1).voteAgainst(1)).to.be.rejectedWith("This voting's already finished");
    })

    it("summarize voting on time", async function () {
        const { has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await expect(super_users.connect(has6subs_1).summarizeVoting(1)).to.be.rejectedWith("Voting hasn't finished");
        await time.increase(172800);
        await super_users.connect(has6subs_1).summarizeVoting(1);

        await expect(super_users.connect(has6subs_1).summarizeVoting(1)).to.be.rejectedWith("Voting's ended");
    })

    it("summarize positive voting for new super user", async function () {
        const { has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await super_users.connect(has6subs_1).voteFor(1);
        await super_users.connect(has5subs_1).voteFor(1);
        await super_users.connect(has5subs_2).voteAgainst(1);

        await time.increase(172800);
        await super_users.connect(has6subs_1).summarizeVoting(1);

        expect (await super_users.isSuperUser(has6subs_1)).to.eq(true);
    })

    it("summarize negative voting for new super user", async function () {
        const { has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await super_users.connect(has6subs_1).voteFor(1);
        await super_users.connect(has5subs_1).voteAgainst(1);
        await super_users.connect(has5subs_2).voteAgainst(1);

        await time.increase(172800);
        await super_users.connect(has6subs_1).summarizeVoting(1);

        expect (await super_users.isSuperUser(has6subs_1)).to.eq(false);
    })

    it("summarize positive voting for removing super user", async function () {
        const { start_super_user, has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user);

        await super_users.connect(has6subs_1).voteFor(1);
        await super_users.connect(has5subs_1).voteFor(1);
        await super_users.connect(has5subs_2).voteAgainst(1);

        await time.increase(172800);
        await super_users.connect(has6subs_1).summarizeVoting(1);

        expect (await super_users.isSuperUser(start_super_user)).to.eq(false);
    })

    it("summarize negative voting for removing super user", async function () {
        const { start_super_user, has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user);

        await super_users.connect(has6subs_1).voteFor(1);
        await super_users.connect(has5subs_1).voteAgainst(1);
        await super_users.connect(has5subs_2).voteAgainst(1);

        await time.increase(172800);
        await super_users.connect(has6subs_1).summarizeVoting(1);

        expect (await super_users.isSuperUser(start_super_user)).to.eq(true);
    })

    it("summarize voting time expired for new super user", async function() {
        const { has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await super_users.connect(has6subs_1).voteFor(1);
        await super_users.connect(has5subs_1).voteFor(1);
        await super_users.connect(has5subs_2).voteAgainst(1);

        await time.increase(2 * 172800 + 1);
        await expect(super_users.connect(has6subs_1).summarizeVoting(1)).to.be.rejectedWith("It's too late to summarize this voting");
        expect (await super_users.isSuperUser(has6subs_1)).to.eq(false);
        
    })

    it("summarize voting time expired for taking away super user rights", async function() {
        const { start_super_user, has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user);

        await super_users.connect(has6subs_1).voteFor(1);
        await super_users.connect(has5subs_1).voteFor(1);
        await super_users.connect(has5subs_2).voteAgainst(1);

        await time.increase(2 * 172800 + 1);
        await expect(super_users.connect(has6subs_1).summarizeVoting(1)).to.be.rejectedWith("It's too late to summarize this voting");
        expect (await super_users.isSuperUser(start_super_user)).to.eq(true);
        
    })

    it("can't start parallel voting for new super user", async function() {
        const { has5subs_1, has5subs_2, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await expect(super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1)).to.be.rejectedWith("Voting number 1 for this user is in process");

        await time.increase(172800);

        await expect(super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1)).to.be.rejectedWith("Voting number 1 for this user wasn't summurized");
    })

    it("can't start parallel voting for taking away super user rights", async function() {
        const { has5subs_1, has5subs_2, has6subs_1, super_users, start_super_user } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user);

        await expect(super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user)).to.be.rejectedWith("Voting number 1 for this user is in process");

        await time.increase(172800);

        await expect(super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user)).to.be.rejectedWith("Voting number 1 for this user wasn't summurized");
    })

    it("can start parallel voting with expired one for new super user", async function() {
        const {  has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);

        await time.increase(2 * 172800 + 1);
        await super_users.connect(has6subs_1).setVotingForNewSuperUser(has6subs_1);
    })

    it("can start parallel voting with expired one for taking away super user rights", async function() {
        const { start_super_user, has6subs_1, super_users } = await loadFixture(deploy);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user);

        await time.increase(2 * 172800 + 1);
        await super_users.connect(has6subs_1).setVotingForTakingAwaySuperUserRights(start_super_user);
    })
})