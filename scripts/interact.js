/**
 * interact.js
 *
 * Deploys a fresh SkillStreakVault and walks through the full lifecycle:
 *   1. Create a vault (lock ETH behind a streak goal)
 *   2. Check in twice, waiting the required spacing
 *   3. Claim the stake back after completing the streak
 *   4. Create a second vault, let the deadline expire, and forfeit it
 *   5. Withdraw the forfeited funds from the community pool
 *
 * Run with:  npm run interact
 * The node must already be running: npm run node
 */

const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

function fmt(wei) {
  return ethers.formatEther(wei) + " ETH";
}

async function balanceOf(address) {
  return ethers.provider.getBalance(address);
}

async function main() {
  const [deployer, learner] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Deploying SkillStreakVault...");
  console.log("=".repeat(60));
  console.log(`  Deployer / pool receiver : ${deployer.address}`);
  console.log(`  Learner  / vault creator : ${learner.address}`);

  const Vault = await ethers.getContractFactory("SkillStreakVault");
  const vault = await Vault.deploy(deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`  Contract deployed to     : ${vaultAddress}`);
  console.log();

  // ─────────────────────────────────────────────
  // SCENARIO 1: successful streak → claim
  // ─────────────────────────────────────────────
  console.log("─".repeat(60));
  console.log("Scenario 1: Complete a streak and claim the stake back");
  console.log("─".repeat(60));

  const stake = ethers.parseEther("1.0");
  const targets = 2;
  const duration = 7 * DAY;

  const learnerBalanceBefore = await balanceOf(learner.address);

  let tx = await vault.connect(learner).createVault(targets, duration, { value: stake });
  let receipt = await tx.wait();
  console.log(`\n[createVault]`);
  console.log(`  Locked    : ${fmt(stake)}`);
  console.log(`  Goal      : ${targets} check-ins within 7 days`);
  console.log(`  Vault ID  : 0`);
  console.log(`  Gas used  : ${receipt.gasUsed}`);

  // First check-in
  tx = await vault.connect(learner).checkIn(0);
  receipt = await tx.wait();
  console.log(`\n[checkIn #1]`);
  console.log("  Recorded. Vault status: Active (1/2 check-ins)");
  console.log(`  Gas used : ${receipt.gasUsed}`);

  // Fast-forward 21 hours so the spacing requirement passes
  await time.increase(21 * HOUR);
  console.log("\n[Time travel] → fast-forwarded 21 hours");

  // Second check-in — this completes the streak
  tx = await vault.connect(learner).checkIn(0);
  receipt = await tx.wait();
  console.log(`\n[checkIn #2]`);
  console.log("  Streak complete! Vault status changed to: Completed");
  console.log(`  Gas used : ${receipt.gasUsed}`);

  // Claim the stake back
  tx = await vault.connect(learner).claim(0);
  receipt = await tx.wait();
  console.log(`\n[claim]`);
  console.log(`  ${fmt(stake)} returned to learner`);
  console.log(`  Gas used : ${receipt.gasUsed}`);

  const learnerBalanceAfter = await balanceOf(learner.address);
  // Net change is slightly negative due to gas costs
  console.log(`\n  Learner balance before  : ${fmt(learnerBalanceBefore)}`);
  console.log(`  Learner balance after   : ${fmt(learnerBalanceAfter)}`);
  console.log(`  Net change (gas eaten)  : ${fmt(learnerBalanceAfter - learnerBalanceBefore)}`);

  const completedVault = await vault.getVaultSummary(0);
  console.log(`\n  Final vault status code : ${completedVault.status} (2 = Claimed)`);

  // ─────────────────────────────────────────────
  // SCENARIO 2: missed deadline → forfeit
  // ─────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Scenario 2: Miss the deadline and lose the stake");
  console.log("─".repeat(60));

  const forfeitStake = ethers.parseEther("0.5");
  const shortDuration = 3 * DAY;

  tx = await vault.connect(learner).createVault(5, shortDuration, { value: forfeitStake });
  receipt = await tx.wait();
  console.log(`\n[createVault]`);
  console.log(`  Locked    : ${fmt(forfeitStake)}`);
  console.log(`  Goal      : 5 check-ins within 3 days`);
  console.log(`  Vault ID  : 1`);

  // Only one check-in before forgetting
  tx = await vault.connect(learner).checkIn(1);
  await tx.wait();
  console.log("\n[checkIn #1] recorded — then life gets in the way...");

  // Jump past the deadline
  await time.increase(shortDuration + 1);
  console.log("\n[Time travel] → fast-forwarded 3 days + 1 second (deadline has passed)");

  // Anyone can call forfeitExpiredVault — here the deployer does it
  tx = await vault.connect(deployer).forfeitExpiredVault(1);
  receipt = await tx.wait();
  console.log(`\n[forfeitExpiredVault]`);
  console.log(`  ${fmt(forfeitStake)} moved to the community pool`);

  const poolBalance = await vault.communityPoolBalance();
  console.log(`  Community pool balance : ${fmt(poolBalance)}`);

  const forfeitedVault = await vault.getVaultSummary(1);
  console.log(`  Final vault status code : ${forfeitedVault.status} (3 = Forfeited)`);

  // Pool receiver withdraws the forfeited funds
  const deployerBalanceBefore = await balanceOf(deployer.address);
  tx = await vault.connect(deployer).withdrawCommunityPool();
  await tx.wait();
  const deployerBalanceAfter = await balanceOf(deployer.address);

  console.log(`\n[withdrawCommunityPool]`);
  console.log(`  Deployer balance before : ${fmt(deployerBalanceBefore)}`);
  console.log(`  Deployer balance after  : ${fmt(deployerBalanceAfter)}`);
  console.log(`  Net gain (minus gas)    : ${fmt(deployerBalanceAfter - deployerBalanceBefore)}`);

  console.log("\n" + "=".repeat(60));
  console.log("Done. Both scenarios completed successfully.");
  console.log("=".repeat(60));
  console.log(`\nExplore the contract functions in contracts/SkillStreakVault.sol`);
  console.log(`Try changing the stake, targets, or duration values above and re-run.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
