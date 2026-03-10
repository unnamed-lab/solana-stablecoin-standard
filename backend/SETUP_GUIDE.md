# 🛠️ SSS Development Environment Setup Guide

This guide provides step-by-step instructions for configuring your local development environment for the **Solana Stablecoin Standard (SSS)** backend API and Oracle service.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- [Node.js & Yarn](https://yarnpkg.com/getting-started/install)
- [Docker](https://www.docker.com/products/docker-desktop) (for PostgreSQL & Redis)

---

## 🚀 Step 1: Initialize Local Ledger

Start a local Solana validator with the necessary accounts and programs. If you have an existing test-ledger, you can point to it.

```powershell
# In the root directory
solana-test-validator --ledger ./test-ledger --reset
```

> [!TIP]
> Use `--clone <ADDRESS>` to pull specific devnet accounts (like Switchboard feeds) into your local ledger for testing.

---

## 🔑 Step 2: Keypair Setup & Conversion

The backend requires keypairs in **Base58** format for administrative actions (minting, burning, etc.).

### Create or Convert JSON keypairs
Most Solana CLI wallets are stored as JSON arrays. You can use the utility to convert existing keys or **generate and save** new ones if the file doesn't exist:

```bash
cd backend
# Convert or create admin keypair (it will create the directory if missing)
npx tsx scripts/generate-b58-keypair.ts ../test-keys/admin.json

# Convert or create burner/minter keypairs
npx tsx scripts/generate-b58-keypair.ts ../test-keys/minter.json
```

> [!NOTE]
> Using `npx tsx` is recommended for local development as it's faster and requires less configuration than `ts-node`.

**Output Example:**
```text
Path not found. Creating directory and generating new keypair at: .../test-keys/admin.json
✅ Generated and saved NEW Keypair.
Public Key (Base58): 7H7f...
Secret Key (Base58): 4R3W...  <-- Use this for .env and API requests
```

---

## 🪙 Step 3: Generate & Deploy Stablecoin

Deploy your test stablecoin and automatically configure the initial minter quota.

1. Ensure the Anchor programs are built and deployed:
   ```bash
   anchor build && anchor deploy
   ```

2. Run the deployment script:
   ```bash
   cd backend
   npx ts-node scripts/deploy-stablecoin.ts
   ```

3. **Capture the output:** The script will print a `MINT_ADDRESS` and an `Authority Secret (base58)`. Save these for the next step.

---

## 🔮 Step 4: Oracle Initialization

The Oracle service requires a global registry and specific configurations for your mint.

1. **Initialize Global Feed Registry:**
   ```bash
   cd backend
   npx ts-node scripts/init-oracle.ts
   ```

2. **Register a Price Feed (via API):**
   Once the Oracle backend is running (see Step 5), use the Swagger UI to register a feed:
   - **Endpoint:** `POST /feeds/register`
   - **Sample Payload (SOL/USD on Devnet):**
     ```json
     {
       "symbol": "SOLUSD",
       "feedType": "direct",
       "baseCurrency": "SOL",
       "quoteCurrency": "USD",
       "decimals": 8,
       "switchboardFeed": "GvpepA4CQSRCBzAGt2cARL5A92zP2KqSt2K12fX5S2E"
     }
     ```

3. **Initialize Mint Config (via API):**
   - **Endpoint:** `POST /config/initialize`
   - Set fee parameters and link your `MINT_ADDRESS`.

---

## ⚙️ Step 5: Backend Configuration (.env)

Configure your `backend/.env` file with the values obtained in previous steps.

```env
# Database & Redis
DATABASE_URL=postgresql://sss:changeme@localhost:5432/sss_token
REDIS_HOST=localhost
REDIS_PORT=6379

# Solana
RPC_URL=http://localhost:8899
WS_URL=ws://localhost:8900
SOLANA_NETWORK=localnet

# Program IDs (Find these in Anchor.toml)
SSS_CORE_PROGRAM_ID=7H7f...
ORACLE_PROGRAM_ID=Brj7...

# Your Mint
MINT_ADDRESS=... (from Step 3)
```

---

## 跑 Running the Services

```bash
# Start Docker infrastructure
cd backend
docker-compose up -d

# Run Prisma migrations
npx prisma migrate dev

# Start Services
yarn start api --watch    # Port 3000
yarn start oracle --watch # Port 3003
```

---

## ✅ Verification

| Service | Check |
| :--- | :--- |
| **Main API** | Visit [http://localhost:3000/docs](http://localhost:3000/docs) |
| **Oracle API** | Visit [http://localhost:3003/docs](http://localhost:3003/docs) |
| **Minting** | `POST /api/v1/mint` with your Base58 minter key |
| **Quotes** | `GET /quotes/mint/simulate?amount=100&mint=...` |

---

> [!IMPORTANT]
> Always ensure your local validator is running before starting the backend services, as they attempt to connect to the RPC on startup.
