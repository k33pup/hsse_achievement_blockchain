import { CustomError } from "hardhat/internal/hardhat-network/stack-traces/model";
import { loadFixture, ethers, expect } from "./setup";

describe("UniqueUsers", function() {
  async function deploy() {
    const [user1, user2, user3] = await ethers.getSigners();

    const uniqueFactory = await ethers.getContractFactory("UniqueUsers");
    
    const unique_users = await uniqueFactory.deploy();
    await unique_users.waitForDeployment();
    
    return { user1, user2, user3, unique_users }
  }

  it("should be deployed", async function() {
    const { unique_users } = await loadFixture(deploy);

    expect(unique_users.target).to.be.properAddress;
  });

  it("fine to call addCount from owner", async function() {
    const { user1, user2, unique_users } = await loadFixture(deploy);
    await expect(unique_users.deploymentTransaction()?.from).to.eq(user1.address);
    await unique_users.connect(user1).addCount(user1.address);
    await expect(await unique_users.getUniqueUsersCnt()).to.eq(1);
    await expect(await unique_users.canCall(user1.address)).to.eq(true);
  });

  it("fail to call addCount from others", async function() {
    const {user1, user2, unique_users} = await loadFixture(deploy);
    await expect(unique_users.connect(user2).addCount(user2.address)).to.be.revertedWith("not allowed call function from that address!");
  });

  it("fine to add new trust address from owner", async function() {
    const { user1, user2, unique_users } = await loadFixture(deploy);
    await unique_users.connect(user1).addTrustContracts([user2.address]);
    await unique_users.connect(user1).addCount(user1.address);
    await unique_users.connect(user2).addCount(user2.address);
    await expect(await unique_users.getUniqueUsersCnt()).to.eq(2);
  });

  it("fail to add new trust address from others", async function() {
    const {user1, user2, unique_users} = await loadFixture(deploy);
    await expect(unique_users.connect(user2).addTrustContracts([user2.address])).to.be.revertedWith("wrong owner of the contract!");
  });

  it("fine to show some activity", async function() {
    const { user1, user2, user3, unique_users } = await loadFixture(deploy);
    await expect(await unique_users.getUniqueUsersCnt()).to.eq(0);

    await unique_users.connect(user1).addCount(user3.address);
    await unique_users.connect(user1).addCount(user3.address);
    await unique_users.connect(user1).addCount(user2.address);

    await expect(await unique_users.getUniqueUsersCnt()).to.eq(2);
    await unique_users.connect(user1).addTrustContracts([user2.address]);

    await unique_users.connect(user2).addCount(user2.address);
    await unique_users.connect(user2).addCount(user1.address);

    await expect(await unique_users.getUniqueUsersCnt()).to.eq(3);

  });
});