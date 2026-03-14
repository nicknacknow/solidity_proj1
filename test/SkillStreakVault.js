const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("SkillStreakVault", function () {
  async function deployFixture() {
    const [deployer, learner, outsider] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("SkillStreakVault");
    const vault = await Vault.deploy(deployer.address);
    await vault.waitForDeployment();

    return { vault, deployer, learner, outsider };
  }

  it("creates a vault with valid parameters", async function () {
    const { vault, learner } = await loadFixture(deployFixture);
    const stake = ethers.parseEther("0.1");
    const duration = 7 * 24 * 60 * 60;

    await expect(
      vault.connect(learner).createVault(4, duration, { value: stake })
    ).to.emit(vault, "VaultCreated").withArgs(0, learner.address, stake, 4, anyValue);

    const savedVault = await vault.vaults(0);
    expect(savedVault.owner).to.equal(learner.address);
    expect(savedVault.stakeAmount).to.equal(stake);
    expect(savedVault.targetCheckIns).to.equal(4);
  });

  it("enforces spacing between check-ins", async function () {
    const { vault, learner } = await loadFixture(deployFixture);
    const duration = 7 * 24 * 60 * 60;

    await vault.connect(learner).createVault(2, duration, { value: ethers.parseEther("0.1") });
    await vault.connect(learner).checkIn(0);

    await expect(vault.connect(learner).checkIn(0)).to.be.revertedWithCustomError(vault, "CheckInTooSoon");

    await time.increase(20 * 60 * 60);
    await vault.connect(learner).checkIn(0);

    const savedVault = await vault.vaults(0);
    expect(savedVault.completedCheckIns).to.equal(2);
    expect(savedVault.status).to.equal(1);
  });

  it("lets the owner claim after completing the streak", async function () {
    const { vault, learner } = await loadFixture(deployFixture);
    const stake = ethers.parseEther("1");
    const duration = 5 * 24 * 60 * 60;

    await vault.connect(learner).createVault(2, duration, { value: stake });
    await vault.connect(learner).checkIn(0);
    await time.increase(20 * 60 * 60);
    await vault.connect(learner).checkIn(0);

    await expect(() => vault.connect(learner).claim(0)).to.changeEtherBalance(learner, stake);

    const savedVault = await vault.vaults(0);
    expect(savedVault.status).to.equal(2);
    expect(savedVault.stakeAmount).to.equal(0);
  });

  it("forfeits expired incomplete vaults to the community pool", async function () {
    const { vault, deployer, learner } = await loadFixture(deployFixture);
    const stake = ethers.parseEther("0.25");
    const duration = 3 * 24 * 60 * 60;

    await vault.connect(learner).createVault(3, duration, { value: stake });
    await vault.connect(learner).checkIn(0);
    await time.increase(duration + 1);

    await expect(vault.connect(deployer).forfeitExpiredVault(0))
      .to.emit(vault, "VaultForfeited")
      .withArgs(0, learner.address, stake);

    expect(await vault.communityPoolBalance()).to.equal(stake);
  });

  it("allows the pool receiver to withdraw forfeited funds", async function () {
    const { vault, deployer, learner, outsider } = await loadFixture(deployFixture);
    const stake = ethers.parseEther("0.5");
    const duration = 3 * 24 * 60 * 60;

    await vault.connect(learner).createVault(5, duration, { value: stake });
    await time.increase(duration + 1);
    await vault.connect(outsider).forfeitExpiredVault(0);

    await expect(() => vault.connect(deployer).withdrawCommunityPool()).to.changeEtherBalance(deployer, stake);
    await expect(vault.connect(outsider).withdrawCommunityPool()).to.be.revertedWithCustomError(vault, "NotVaultOwner");
  });
});