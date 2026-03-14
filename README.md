# Skill Streak Vault

Skill Streak Vault is a Solidity learning project built around a simple idea: lock ETH behind a learning streak. You create a vault, commit to a number of check-ins before a deadline, and reclaim your stake only if you complete the streak. If you fail, the stake moves into a community pool.

This project is designed to be learned in layers across a day or a week. The starting code is intentionally small, but it already includes:

- a real smart contract
- automated tests
- a deploy script
- a roadmap for extending the project

## Why this project is worth building

It teaches the parts of Solidity that actually matter in early projects:

- structs and enums
- mappings and ids
- payable functions
- time-based logic with `block.timestamp`
- custom errors
- events for off-chain indexing
- state machine design
- test-driven iteration

It also gives you an idea that can grow well beyond the starter version. By the end of the week you could turn this into a mini dApp with a frontend, streak history, NFT badges, or group accountability.

## Project structure

- `contracts/SkillStreakVault.sol`: the main contract
- `test/SkillStreakVault.js`: local tests using Hardhat + Chai
- `scripts/deploy.js`: deployment script
- `hardhat.config.js`: compiler and network config

## Setup

### 1. Install prerequisites

- Install Node.js LTS from the official Node.js website.
- In this folder, run `npm install`.

### 2. Run the local checks

- Compile: `npm run compile`
- Test: `npm test`

### 3. Start a local chain and deploy

In terminal 1:

```bash
npm run node
```

In terminal 2:

```bash
npm run deploy:local
```

### 4. Optional: prepare testnet deployment

- Copy `.env.example` to `.env`
- Fill in `SEPOLIA_RPC_URL`
- Fill in `PRIVATE_KEY`
- Deploy with `npm run deploy:sepolia`

Never use a wallet with real funds for learning deployments.

## How the starter contract works

Each vault has:

- an owner
- a stake amount in ETH
- a target number of check-ins
- a deadline
- a last check-in timestamp
- a status

The basic lifecycle is:

1. Create a vault with ETH.
2. Call `checkIn` over time.
3. If you reach the target check-ins, the vault becomes `Completed`.
4. The owner calls `claim` to get the stake back.
5. If the deadline passes first, anyone can call `forfeitExpiredVault` and move the funds into the community pool.

## Learn it in one day

### Morning: understand the contract

Read `contracts/SkillStreakVault.sol` and identify:

- why `Vault` is a struct
- why `VaultStatus` is an enum
- why `createVault` is `payable`
- why the contract uses events and custom errors

### Midday: understand the tests

Read `test/SkillStreakVault.js` and map each test back to a rule in the contract.

Focus on:

- fixture deployment
- time travel with Hardhat helpers
- asserting events
- asserting reverts

### Afternoon: make one small change

Good first modifications:

- add a maximum number of active vaults per user
- add a `cancelVault` function before the first check-in
- store a short learning goal string hash with each vault

### Evening: deploy locally and interact

After local deployment, open the Hardhat console or write a short script to:

- create a vault
- check in once
- read it back with `getVaultSummary`

## Learn it over a week

### Day 1

Run the project and understand every state change.

### Day 2

Add view helpers, such as `getVaultStatusLabel` or `canCheckInNow`.

### Day 3

Add per-user vault tracking with a mapping like `mapping(address => uint256[])`.

### Day 4

Add a better failure rule. Example: split forfeited funds between the community pool and a nominated accountability partner.

### Day 5

Add NFT badges for completed streaks using OpenZeppelin ERC-721.

### Day 6

Build a minimal frontend with React or Next.js to create vaults and check in.

### Day 7

Deploy to a testnet, write a project summary, and decide whether to keep extending it.

## Suggested upgrades

If you want the next meaningful steps, build in this order:

1. Add per-user vault indexing.
2. Add a goal metadata hash or IPFS CID.
3. Add streak tiers and badges.
4. Add partner payouts on failure.
5. Add a frontend.

## What to pay attention to while learning

- how contract state is modeled
- where reentrancy risk would appear in ETH transfers
- how tests document intended behavior
- why time logic can be tricky on-chain
- what should be immutable, constant, storage, or memory

## Next contract ideas if you outgrow this one

- a collaborative study circle treasury
- a proof-of-practice badge minter
- an on-chain reading challenge with weekly windows

This repo is already enough to start coding immediately. The right workflow is: run tests, make one change, add one test, repeat.