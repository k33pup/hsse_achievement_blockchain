import { CustomError } from "hardhat/internal/hardhat-network/stack-traces/model";
import { loadFixture, ethers, expect } from "./setup";

describe("Usernames", function() {
  async function deploy() {
    const [user1, user2, user3] = await ethers.getSigners();

    const usernamesFactory = await ethers.getContractFactory("Usernames");
    
    const usernames = await usernamesFactory.deploy();
    await usernames.waitForDeployment();
    
    return { user1, user2, user3, usernames }
  }

  it("should be deployed", async function() {
    const { usernames } = await loadFixture(deploy);

    expect(usernames.target).to.be.properAddress;
  });

  it("fine to set username", async function() {
    const { user1, usernames } = await loadFixture(deploy);
    await usernames.connect(user1).setUsername("User 1 name");
    await expect(await usernames.getOwner("User 1 name")).to.eq(user1.address);
    await expect(await usernames['hasUsername(address)'](user1.address)).to.eq(true);
    await expect(await usernames['getUsername(address)'](user1.address)).to.eq("User 1 name");
    await expect(await usernames.connect(user1)['getUsername()']()).to.eq("User 1 name");
  });

  it("fail to create 2 same usernames", async function() {
    const { user1, user2, usernames } = await loadFixture(deploy);
    await usernames.connect(user1).setUsername("User 1 name");
    await expect(usernames.connect(user2).setUsername("User 1 name")).to.be.revertedWith("username is already taken!");
  });

  it("fail to set empty username", async function() {
    const { user1, usernames } = await loadFixture(deploy);
    await expect(usernames.connect(user1).setUsername("")).to.be.revertedWith("empty username is not valid!");
  });

  it("fail to delete username having no username", async function() {
    const { user1, usernames } = await loadFixture(deploy);
    await expect(usernames.connect(user1).delUsername()).to.be.revertedWith("you don't have username!");
  });

  it("fine to set same username after previous owner deleted username", async function() {
    const { user1, user2, usernames } = await loadFixture(deploy);
    await usernames.connect(user1).setUsername("User 1 name");
    await usernames.connect(user2).setUsername("User 2 name");
    await usernames.connect(user1).delUsername();
    await usernames.connect(user2).setUsername("User 1 name");
    await expect(await usernames['hasUsername(address)'](user1.address)).to.eq(false);
    await expect(await usernames['hasUsername(address)'](user2.address)).to.eq(true);
    await expect(await usernames.getOwner("User 1 name")).to.eq(user2.address);
    await expect(await usernames.getOwner("User 2 name")).to.eq(ethers.ZeroAddress);
  });
});