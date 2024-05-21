import { loadFixture, ethers, expect } from "./setup";

describe("Subscribers", function() {
  async function deploy() {
    const [from_, to_] = await ethers.getSigners();

    const uniqueUsersFactory = await ethers.getContractFactory("UniqueUsers");
    const subscribersFactory = await ethers.getContractFactory("Subscribers");
    
    const unique_useres = await uniqueUsersFactory.deploy();
    await unique_useres.waitForDeployment();

    const subscribers = await subscribersFactory.deploy(await unique_useres.getAddress());
    await subscribers.waitForDeployment();

    await unique_useres.addTrustContracts([await subscribers.getAddress()]);
    
    return { from_, to_, subscribers }
  }

  it("should be deployed", async function() {
    const { subscribers } = await loadFixture(deploy);

    expect(subscribers.target).to.be.properAddress;
  });


  it("Before subscription", async function() {
    const { from_, to_, subscribers } = await loadFixture(deploy);
    expect (await subscribers.connect(from_)['isAlreadySubscriber(address)'](to_)).to.eq(false);
    expect (await subscribers.connect(from_).getSubscribersAmount(to_)).to.eq(0);
  });

  it("Can't subscribe/unsubscribe on yourself", async function () {
    const { from_, to_, subscribers } = await loadFixture(deploy);
    await expect(subscribers.connect(to_).subscribeOn(to_)).to.be.rejectedWith("You can't subscribe on yourself!");
    await expect(subscribers.connect(to_).unsubscribeFrom(to_)).to.be.rejectedWith("You can't unsubscribe from yourself!");
  });

  it("Can't subscribe twice", async function() {
    const { from_, to_, subscribers } = await loadFixture(deploy);
    await subscribers.connect(from_).subscribeOn(to_);
    await expect(subscribers.connect(from_).subscribeOn(to_)).to.be.rejectedWith("You're already subscribed");
  })

  it("Can't unsubscribe from not subscried on user", async function() {
    const { from_, to_, subscribers } = await loadFixture(deploy);
    await expect(subscribers.connect(from_).unsubscribeFrom(to_)).to.be.rejectedWith("You haven't been subscribed");
  })

  it("After subscription", async function() {
    const { from_, to_, subscribers } = await loadFixture(deploy);
    await subscribers.connect(from_).subscribeOn(to_);
    expect (await subscribers.connect(from_)['isAlreadySubscriber(address)'](to_)).to.eq(true);
    expect (await subscribers.connect(from_).getSubscribersAmount(to_)).to.eq(1);
  });

  it("After unsubscribe", async function() {
    const { from_, to_, subscribers } = await loadFixture(deploy);
    await subscribers.connect(from_).subscribeOn(to_);
    await subscribers.connect(from_).unsubscribeFrom(to_);
    expect (await subscribers.connect(from_)['isAlreadySubscriber(address)'](to_)).to.eq(false);
    expect (await subscribers.connect(from_).getSubscribersAmount(to_)).to.eq(0);
  })
})
