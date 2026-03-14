const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying SkillStreakVault with:", deployer.address);

  const Vault = await ethers.getContractFactory("SkillStreakVault");
  const vault = await Vault.deploy(deployer.address);
  await vault.waitForDeployment();

  console.log("SkillStreakVault deployed to:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});