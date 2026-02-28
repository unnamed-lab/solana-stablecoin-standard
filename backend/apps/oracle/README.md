# SSS Oracle Backend

This directory contains the NestJS microservice responsible for interacting with the **SSS Oracle** on-chain program via the `@stbr/sss-token` SDK.

---

## 🏗️ Architecture Overview

The `oracle` application abstract the complexity of on-chain operations (like registering price feeds or simulating quotes) behind a clean, RESTful API.

### Key Components

1. **`OracleSdkService`**: 
   Initializes the `OracleModule` from the `@stbr/sss-token` SDK. Connects to the Solana network defined in `.env` and sets up the foundational RPC connection to interact with the `sss-oracle` program.

2. **Feeds API (`/feeds`)**:
   Manages the global Feed Registry on-chain. The Feed Registry maps string symbols (like `BRLUSD`) to actual Switchboard V2 Aggregator accounts.
   - `GET /feeds`: Returns all registered feeds currently stored on-chain.
   - `POST /feeds/register`: Registers a new Switchboard feed into the on-chain registry.

3. **Config API (`/config`)**:
   Manages Oracle configurations specific to a stablecoin mint.
   - `POST /config/initialize`: Creates the `OracleConfig` PDA for a mint, defining parameters like mint fees, redeem fees, max confidence intervals, and staleness thresholds.
   - `GET /config/:mint`: Fetches the active configuration parameters for the specified token mint.

4. **Quotes API (`/quotes`)**:
   Simulates exact mint and redeem quotes based on live, on-chain Switchboard data.
   - `GET /quotes/mint/simulate`: Quotes how many tokens a user receives for a given USD input.
   - `GET /quotes/redeem/simulate`: Quotes how much USD a user receives when burning a specific amount of tokens.

---

## 🧪 How to Test the Oracle Backend

### Step 1: Initialize the Local Registry

Before adding feeds or configuring mints, the global `FeedRegistry` must be initialized on your local Solana validation node.

To do this, run the provided initiation script from the `backend` folder:
```bash
cd backend
npx ts-node scripts/init-oracle.ts
```
*(This script will airdrop SOL to the `ADMIN_WALLET`, find the Registry PDA, and call the on-chain `initializeRegistry` instruction).*

### Step 2: Start the Oracle Microservice

Start the NestJS Oracle backend in development mode:
```bash
cd backend
npm run start:oracle:dev
```
The server will boot up and be accessible at `http://localhost:3003`.

### Step 3: Swagger UI Testing

Interact with the Oracle backend via the Swagger UI at **[http://localhost:3003/docs](http://localhost:3003/docs)**.

1. **Register a Price Feed**: (`POST /feeds/register`) Provide a payload to register a feed.
2. **Initialize Oracle Config**: (`POST /config/initialize`) Provide a payload to set up parameters for your test token mint.
3. **Simulate a Quote**: (`GET /quotes/mint/simulate`) Provide `usdAmount` and `mintAddress` to simulate a mint.

---

## 🔍 Understanding Switchboard Feeds

When calling `POST /feeds/register`, you must provide a `switchboardFeed` parameter:

```json
{
  "symbol": "BRLUSD",
  "feedType": "inverse",
  "baseCurrency": "BRL",
  "quoteCurrency": "USD",
  "decimals": 8,
  "switchboardFeed": "GvpepA4CQSRCBzAGt2cARL5A92zP2KqSt2K12fX5S2E"
}
```

### What is a Switchboard Aggregator?

The `switchboardFeed` is the Public Key (address) of an on-chain **Switchboard V2 Aggregator** account. The `sss-oracle` program reads the raw price data directly from this account when evaluating mint and redeem quotes.

### How to get a Switchboard Feed Address for Testing

1. **For Devnet Testing:**
   You can find valid, publicly updated Switchboard aggregator addresses for Devnet directly on the Switchboard Explorer.
   - Go to: [Switchboard Devnet Explorer](https://app.switchboard.xyz/solana/devnet)
   - Search for the pair you want (e.g., "BRL / USD").
   - Find the "Aggregator" or "Feed" address in the UI (it will look like a standard Solana base58 PublicKey).
   - *Example recognized Devnet feeds:*
     - SOL/USD: `GvpepA4CQSRCBzAGt2cARL5A92zP2KqSt2K12fX5S2E`

2. **For Localnet (`solana-test-validator`) Testing:**
   By default, your local network starts completely empty. A public devnet feed address *will not exist* on your local machine, leading to a `FeedNotReadyError`. You have two options:
   
   **Option A: Clone a Devnet Feed to Localnet**
   When starting your local validator, you can "clone" the state of a specific Switchboard feed from devnet into your local environment:
   ```bash
   solana-test-validator --url devnet --clone GvpepA4CQSRCBzAGt2cARL5A92zP2KqSt2K12fX5S2E
   ```
   *(Note: The cloned price will be static; it will not update locally).*
   
   **Option B: Create a Mock Feed Locally**
   You can use the Switchboard Typescript SDK to spin up a mock Oracle queue and create a dummy feed locally. This is generally handled in advanced integration test setups.

3. **For Mainnet Production:**
   When deploying to Mainnet, you must use official, funded Switchboard feeds. You can browse official feeds at [app.switchboard.xyz](https://app.switchboard.xyz/solana/mainnet). You must ensure the feed is funded to continue updating reliably.
