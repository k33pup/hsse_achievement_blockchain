import { CustomError } from "hardhat/internal/hardhat-network/stack-traces/model";
import { loadFixture, ethers, expect } from "./setup";
import { extendEnvironment } from "hardhat/config";

describe("MyToken", function() {
  async function deploy() {
    
    const [user1] = await ethers.getSigners();

    let users = [];

    for (let i = 0; i < 18; ++i) {
      let wallet = ethers.Wallet.createRandom();
      wallet = wallet.connect(ethers.provider);

      await user1.sendTransaction({to: wallet.address, value: ethers.parseEther("1")});

      users.push(wallet);
    }

    const subsFactory = await ethers.getContractFactory("Subscribers");
    const superFactory = await ethers.getContractFactory("SuperUsers");
    const uniqueFactory = await ethers.getContractFactory("UniqueUsers");
    const tokenFactory = await ethers.getContractFactory("MyToken");
    
    const unique_users = await uniqueFactory.deploy();
    await unique_users.waitForDeployment();

    const subscribers = await subsFactory.deploy(await unique_users.getAddress());
    await subscribers.waitForDeployment();

    const super_users = await superFactory.deploy(
      await unique_users.getAddress(), 
      await subscribers.getAddress(), 
      [user1.address]
    );
    await super_users.waitForDeployment();

    const tokens = await tokenFactory.deploy(
      await subscribers.getAddress(),
      await super_users.getAddress(), 
      await unique_users.getAddress(),
    );
    await tokens.waitForDeployment();

    await unique_users.connect(user1).addTrustContracts([
      await subscribers.getAddress(),
      await super_users.getAddress(),
      await tokens.getAddress(),
    ]);
    
    return { 
      user1, users, unique_users, subscribers, super_users, tokens
    }
  }

  it("should be deployed", async function() {
    const { unique_users, subscribers, super_users, tokens } = await loadFixture(deploy);

    expect(unique_users.target).to.be.properAddress;
    expect(subscribers.target).to.be.properAddress;
    expect(super_users.target).to.be.properAddress;
    expect(tokens.target).to.be.properAddress;
  });

  it("fine to create token from super user", async function() {
    const { user1, tokens } = await loadFixture(deploy);
    await tokens.connect(user1).mint("first nft", "for me", "http://mipt.ru", false, user1.address);
    await expect(await tokens.getOwner(1)).to.eq(user1.address);
  });

  it("fail to create token from other user with 0 subs", async function() {
    const { users, tokens } = await loadFixture(deploy);
    await expect(tokens.connect(users[1]).mint(
      "first nft", "for me", "http://mipt.ru", false, users[1].address)
    ).to.be.rejectedWith("not enough subscriptions to mint!");
  });

  it("fine to create token from other user who has >= 15% subs", async function() {
    const { user1, users, subscribers, tokens } = await loadFixture(deploy);

    await subscribers.connect(user1).subscribeOn(users[3]);
    await subscribers.connect(users[1]).subscribeOn(users[3]);
    await subscribers.connect(users[2]).subscribeOn(user1);
    await subscribers.connect(users[3]).subscribeOn(users[1]);

    await tokens.connect(users[3]).mint("first nft", "for me", "http://mipt.ru", false, users[3].address);
    await expect(await tokens.getOwner(1)).to.eq(users[3].address);
  });

  it("fail to create token from other user with 0 < x < 15% subs", async function() {
    const { users, subscribers, tokens } = await loadFixture(deploy);
    
    for (let i = 0; i < users.length - 1; ++i) {
      await subscribers.connect(users[i]).subscribeOn(users[i + 1]);
    }

    await expect(tokens.connect(users[1]).mint(
      "first nft", "for me", "http://mipt.ru", false, users[1].address)
    ).to.be.revertedWith("not enough subscriptions to mint!");
  });

  it("fine to create token from other user and transfer", async function() {
    const { user1, users, subscribers, tokens } = await loadFixture(deploy);

    await subscribers.connect(user1).subscribeOn(users[3]);
    await subscribers.connect(users[1]).subscribeOn(users[3]);
    await subscribers.connect(users[2]).subscribeOn(user1);
    await subscribers.connect(users[3]).subscribeOn(users[1]);

    await tokens.connect(users[3]).mint("first nft", "for me", "http://mipt.ru", false, users[3].address);
    await tokens.connect(users[3]).transfer(1, users[5]);
    await expect(await tokens.getOwner(1)).to.eq(users[5].address);
  });

  it("fail to transfer token from not the owner", async function() {
    const { user1, users, subscribers, tokens } = await loadFixture(deploy);

    await subscribers.connect(user1).subscribeOn(users[3]);
    await subscribers.connect(users[1]).subscribeOn(users[3]);
    await subscribers.connect(users[2]).subscribeOn(user1);
    await subscribers.connect(users[3]).subscribeOn(users[1]);

    await tokens.connect(users[3]).mint("first nft", "for me", "http://mipt.ru", false, users[3].address);
    await expect(tokens.connect(users[2]).transfer(1, users[5])).to.be.revertedWith("wrong owner of the token!");
  });

  it("fine to create token and burn it", async function() {
    const { user1, users, subscribers, tokens } = await loadFixture(deploy);

    await subscribers.connect(user1).subscribeOn(users[3]);
    await subscribers.connect(users[1]).subscribeOn(users[3]);
    await subscribers.connect(users[2]).subscribeOn(user1);
    await subscribers.connect(users[3]).subscribeOn(users[1]);

    await tokens.connect(users[3]).mint("first nft", "for me", "http://mipt.ru", false, users[3].address);
    await tokens.connect(users[3]).burn(1);
    await expect(await tokens.getOwner(1)).to.eq(ethers.ZeroAddress);
    await expect((await tokens.getAllAchievements(users[3])).length).to.eq(0);
  });

  it("fail to create token and burn 2 times it", async function() {
    const { user1, users, subscribers, tokens } = await loadFixture(deploy);

    await subscribers.connect(user1).subscribeOn(users[3]);
    await subscribers.connect(users[1]).subscribeOn(users[3]);
    await subscribers.connect(users[2]).subscribeOn(user1);
    await subscribers.connect(users[3]).subscribeOn(users[1]);

    await tokens.connect(users[3]).mint("first nft", "for me", "http://mipt.ru", false, users[3].address);
    await tokens.connect(users[3]).burn(1);
    await expect(tokens.connect(users[3]).burn(1)).to.be.revertedWith("wrong owner of the token!");
  });

  it("fail to transfer burned token", async function() {
    const { user1, users, tokens } = await loadFixture(deploy);

    await tokens.connect(user1).mint("first nft", "for me", "http://mipt.ru", false, user1.address);
    await tokens.connect(user1).burn(1);
    await expect(tokens.connect(user1).transfer(1, users[4])).to.be.revertedWith("wrong owner of the token!");
  });

  it("fine to get all user tokens", async function() {
    const { user1, users, tokens } = await loadFixture(deploy);

    await tokens.connect(user1).mint("first nft", "for him 1", "http://mipt.ru", false, users[0].address);
    await tokens.connect(user1).mint("second nft", "for him 2", "http://mipt.ru", false, users[0].address);
    await tokens.connect(user1).mint("third nft", "for him3", "http://mipt.ru", false, users[0].address);
    await tokens.connect(user1).mint("other nft", "for other", "http://mipt.ru", false, users[1].address);
    await expect((await tokens.getAllAchievements(users[0])).length).to.eq(3);
    await expect((await tokens.getAllAchievements(users[0])).at(0)?.at(1)).to.eq("first nft");
    await expect((await tokens.getAllAchievements(users[0])).at(1)?.at(1)).to.eq("second nft");
    await expect((await tokens.getAllAchievements(users[0])).at(2)?.at(1)).to.eq("third nft");
  });
});