import { loadFixture, ethers, expect } from "./setup";

describe("DemoSubscribe", function() {
  async function deploy() {
    const [user1, user2] = await ethers.getSigners();

    const demoFactory = await ethers.getContractFactory("DemoSubscribe");
    const subsFactory = await ethers.getContractFactory("Subscribers");

    const subscribers = await subsFactory.deploy();
    await subscribers.waitForDeployment();

    const demo = await demoFactory.deploy(await subscribers.getAddress());
    await demo.waitForDeployment();
    
    return { user1, user2, demo, subscribers }
  }

  it("should be deployed", async function() {
    const { demo, subscribers } = await loadFixture(deploy);

    expect(demo.target).to.be.properAddress;
    expect(subscribers.target).to.be.properAddress;
  });

  it("user2 has 0 subs and user1 is not subscribed on user2", async function() {
    const { user1, user2, demo, subscribers } = await loadFixture(deploy);

    expect(await demo.getSubAmount(user2)).to.eq(0);
    expect(await demo.connect(user1).isAlreadySub(user2)).to.eq(false);
  });

  it("user1 subscribes on user2", async function() {
    const { user1, user2, demo, subscribers } = await loadFixture(deploy);

    const user2_subs_cnt = await demo.getSubAmount(user2);
    await demo.connect(user1).subscribeOn(user2);
    expect(await demo.connect(user1).isAlreadySub(user2)).to.eq(true);
    
    expect(await demo.getSubAmount(user2) - user2_subs_cnt).to.eq(1);
  });
});