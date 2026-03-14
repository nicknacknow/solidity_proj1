# Getting set up from scratch

This guide is written for someone who has never used Ethereum, doesn't have a wallet, and just wants to start learning Solidity locally without any real money involved.

---

## What you need right now

You need nothing more than what you already have. You do not need a wallet, you do not need ETH, and you do not need to touch the `.env` file yet. Local development is completely free and self-contained.

---

## What the two terminals are actually doing

**Terminal 1 — `npm run node`**

This starts a fake blockchain that lives only on your computer. It is called the Hardhat Network. When you start it, Hardhat creates 20 fake test accounts and gives each one 10,000 fake ETH to play with. The addresses and private keys are printed in that terminal output.

This is not real money. These accounts are deterministic — every developer running Hardhat gets the exact same accounts and the exact same fake ETH. The blockchain disappears the moment you stop the terminal.

**Terminal 2 — `npm run deploy:local`**

This compiled the `SkillStreakVault.sol` contract into bytecode and sent it to your local fake blockchain. The address it printed (something like `0x5FbDB2315...`) is where the contract now lives. Think of a contract address like a street address — it is where you go to talk to that contract.

Once this command finished, the contract is sitting on the local chain, waiting for someone to call its functions.

---

## What a wallet is (and when you actually need one)

A wallet is software that holds a private key. The private key proves you own an address. Your address is your identity on the blockchain.

For local development, Hardhat creates wallets for you automatically. You will never type a private key or install anything to run the contract locally.

You only need a wallet when you want to:

- Deploy to a public testnet like Sepolia (free, fake ETH from a faucet)
- Use MetaMask in a browser to click around the contract visually
- Eventually deploy to mainnet (real ETH, real money — much later)

---

## Playing with the contract right now

The easiest way to see the contract in action is to run the interact script:

```bash
npm run interact
```

This script creates a vault, does two check-ins, claims the stake back, then creates a second vault and lets the deadline expire so it gets forfeited. It prints what happens at each step. No wallet, no real ETH needed.

---

## Understanding what the interact script shows you

Each step maps to a concept in the Solidity contract:

| What the script does | What it teaches |
|---|---|
| Creates a vault with ETH | `payable` functions, `msg.value`, struct creation |
| Calls `checkIn` twice | state machine transitions, `block.timestamp` |
| Calls `claim` | ETH transfer back to owner, `Completed` status |
| Fast-forwards time | how Hardhat manipulates block time in tests |
| `forfeitExpiredVault` | funds moving to the community pool |
| Reads `communityPoolBalance` | view functions, reading contract state |

---

## When you're ready for a public testnet

A testnet is a real public blockchain but with ETH that has no monetary value. Sepolia is the standard Ethereum testnet. You can get free testnet ETH from a faucet.

### Step 1: Install MetaMask

Go to the MetaMask website and install the browser extension. When it asks you to create a wallet, write down the seed phrase on paper and keep it somewhere safe. This is just a learning wallet — don't use it for real money.

### Step 2: Add the Sepolia network to MetaMask

MetaMask includes Sepolia by default. Just switch to it in the network dropdown at the top of MetaMask.

### Step 3: Get free testnet ETH

Go to one of these faucets and paste your MetaMask address:

- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucets.chain.link/sepolia

They give you 0.1–0.5 Sepolia ETH for free. It is only usable on Sepolia and is worthless.

### Step 4: Fill in the `.env` file

Copy the example file:

```bash
copy .env.example .env
```

Then fill in two values:

**`SEPOLIA_RPC_URL`** — You need a free RPC endpoint. Sign up at https://dashboard.alchemy.com, create an app, choose Ethereum Sepolia, and copy the HTTPS URL. It looks like `https://eth-sepolia.g.alchemy.com/v2/your-key`.

**`PRIVATE_KEY`** — In MetaMask, click the three dots next to your account, go to Account Details, then Export Private Key. Copy the 64-character hex string (without the `0x` prefix) in to `.env`.

Never share your private key. Never commit the `.env` file. It is already in `.gitignore` so git will ignore it automatically.

### Step 5: Deploy to Sepolia

```bash
npm run deploy:sepolia
```

After a few seconds it will print the real contract address. You can paste it into https://sepolia.etherscan.io to see the transaction publicly.

---

## Common questions

**Do I need to restart the node after deploying?**

No. The node keeps running. You can deploy multiple times without restarting it. Each deployment creates a new contract at a new address.

**What happens if I stop the node terminal?**

The local fake blockchain disappears. All deployed contracts and transactions are gone. When you restart the node with `npm run node` everything starts fresh. This is normal — re-run `npm run deploy:local` after restarting.

**Why does the interact script use fake time travel?**

Hardhat can fast-forward `block.timestamp` artificially. This lets you simulate a 7-day deadline in milliseconds without waiting. On a real network you cannot do this.

**What is the `.env` file for?**

It stores secrets (your private key and the RPC URL) outside of your code so they are never accidentally committed to git. It is only needed for testnet or mainnet deployments.

**What is an ABI?**

When Hardhat compiles your contract it produces two things: bytecode (what gets deployed to the chain) and an ABI (Application Binary Interface). The ABI is a JSON description of every function and event. Frontend apps and scripts use the ABI to know what functions exist and how to call them.

---

## What to do next

1. Run `npm run interact` and read each line of output.
2. Open `scripts/interact.js` and match each call to the function in `contracts/SkillStreakVault.sol`.
3. Change the stake amount, number of check-ins, or duration in the interact script and run it again.
4. When you feel comfortable, try building one of the extensions from the README.
