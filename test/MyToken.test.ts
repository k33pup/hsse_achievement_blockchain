import { CustomError } from "hardhat/internal/hardhat-network/stack-traces/model";
import { loadFixture, ethers, expect } from "./setup";

describe("MyToken", function() {
  async function deploy() {
    const [user1, user2, user3] = await ethers.getSigners();

    const subsFactory = await ethers.getContractFactory("Subscribers");
    const tokenFactory = await ethers.getContractFactory("MyToken");
    
    const subscribers = await subsFactory.deploy();
    await subscribers.waitForDeployment();

    const tokens = await tokenFactory.deploy(await subscribers.getAddress());
    await tokens.waitForDeployment();
    
    return { user1, user2, user3, tokens, subscribers }
  }

  it("fail to create with 0 subscribers", async function() {
    const { user1, user2, user3, tokens, subscribers } = await loadFixture(deploy);

    await expect(tokens.connect(user1).mint("first nft", "http://mipt.ru", user1.address)).to.be.revertedWith("1");
  });

  it("fine to create with 1 subscriber", async function() {
    const { user1, user2, user3, tokens, subscribers } = await loadFixture(deploy);
    await subscribers.connect(user2).subscribeOn(user2.address, user1.address);
    await tokens.connect(user1).mint("first nft", "http://mipt.ru", user2.address);
  });
});