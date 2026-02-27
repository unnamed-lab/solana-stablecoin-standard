# Solana Stablecoin Standard (SSS) Backend

This repository contains the backend infrastructure for the Solana Stablecoin Standard (SSS) project. Built with NestJS, it offers a robust, scalable, and modular suite of applications to interact with the SSS Solana smart contracts, index on-chain events, and deliver real-time webhook notifications.

## Architecture & Apps

The backend is structured as a monorepo consisting of three primary applications:

### 1. API Application (`api`)
The core REST API serving external clients and dashboards. 
- **Token Management:** Minting and burning of stablecoins, and fetching token statistics (supply, largest holders).
- **Compliance:** Managing blacklisted addresses and executing token seizures using permanent delegates.
- **Audit Logs:** Providing a queryable and exportable history of all administrative actions (minting, burning, freezing, seizing, etc.).
- **Webhooks Config:** Managing subscriptions for real-time notifications on various on-chain events.

### 2. Indexer Application (`indexer`)
A background service responsible for listening to Solana blockchain events emitted by the SSS core smart contract (`7H7fqqjASpTDCgYwDpp8EatKM4sSMwxaYvbhf6s3ThqM`). 
- **Event Parsing:** Listens for events like `Minted`, `Burned`, `Blacklisted`, `Seized`, `AccountFrozenEvent`, and more.
- **Database Persistence:** Stores parsed events into a PostgreSQL database using Prisma, offering a reliable, queryable off-chain state.
- **Queueing:** Pushes detected events into a Redis-backed Bull queue (`webhook-queue`) to trigger asynchronous delivery.

### 3. Webhook Application (`webhook`)
A dedicated worker service that processes the `webhook-queue` populated by the Indexer.
- **Payload Construction:** Builds structured, timestamped JSON payloads containing the event details and original transaction signatures.
- **Security:** Secures outgoing HTTP POST requests with an HMAC-SHA256 signature calculated against a unique integration secret.
- **Reliability:** Handles failed deliveries with exponential backoff and retries to ensure eventual delivery to external subscribers.

### 4. Oracle Application (`oracle`)
A specialized REST API service that wraps the `@stbr/sss-token` SDK for interaction with the SSS Oracle Anchor program.
- **Pricing Simulations:** Provides pure-math REST endpoints to simulate `mint` and `redeem` quotes instantly without RPC latency (ideal for frontend pricing UIs).
- **Feed Management:** List active Switchboard price feeds and fetch Oracle configurations specific to a given SSS stablecoin mint.

## Project Setup

The applications are built using [NestJS](https://nestjs.com/) and require a local PostgreSQL database and Redis instance (e.g., via Docker Compose).

```bash
# Install dependencies
$ yarn install
```

## Running the Applications

Each application can be run independently using the Nest CLI or standard npm scripts:

```bash
# Run API service
$ yarn start api --watch

# Run Indexer service
$ yarn start indexer --watch

# Run Webhook processor
$ yarn start webhook --watch

# Run Oracle service (defaults to PORT 3003)
$ yarn start oracle --watch
```

## Environment Variables

A `.env` file is required. Key variables include:
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string for Bull queues.
- `RPC_URL`: Solana RPC endpoint (e.g., `https://api.devnet.solana.com`).
- `WS_URL`: Solana WebSocket endpoint.
- `SSS_CORE_PROGRAM_ID`: The Program ID of the SSS core smart contract.

## API Documentation

For full details on the REST endpoints provided by the API application, please see the [API Documentation](../../docs/API.md).

## Included Scripts

The `backend/scripts` directory provides CLI utilities to streamline development and deployment tasks for the SSS project.

### 1. Deploy Stablecoin Script
Deploys a test stablecoin to a local Solana network (or devnet) using the `@stbr/sss-token` SDK.
- Mints the SSS Token with preset `SSS_2` features (blacklist, seize, freeze).
- Automatically adds the authority as a minter with a 1,000,000,000 quota to allow for immediate API testing.
- Outputs the base58 secret key necessary for backend `.env` variables and API authorization headers.

**Prerequisites:**
You need a `solana-test-validator` running locally and your Anchor smart contracts deployed (`anchor build && anchor deploy`).

**Usage:**
```bash
$ npx ts-node scripts/deploy-stablecoin.ts
```

### 2. Base58 Keypair Generator
Utility script to help convert existing Solana JSON keypair files into Base58 secret strings, which are required for backend API authentication (e.g. `minterKeypair`, `blacklisterKeypair`).

**Usage:**
```bash
# Generate a completely new Base58 keypair
$ npx ts-node scripts/generate-b58-keypair.ts

# Convert an existing Solana JSON wallet file to Base58
$ npx ts-node scripts/generate-b58-keypair.ts /path/to/keypair.json
```
