# `sss-token` CLI

> **Command-line interface for the Solana Stablecoin Standard (SSS).**  
> Deploy, manage, and govern stablecoins on Solana — directly from your terminal.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Token Lifecycle](#token-lifecycle)
  - [Token Operations](#token-operations)
  - [Admin & Roles](#admin--roles)
  - [SSS-2 Compliance](#sss-2-compliance)
  - [SSS-2 Transfer Hook](#sss-2-transfer-hook)
- [Global Options](#global-options)
- [Development Setup](#development-setup)
- [Contributing](#contributing)

---

## Overview

`sss-token` is the official CLI for the Solana Stablecoin Standard. It wraps the `@stbr/sss-token` SDK and gives operators a scriptable, composable interface for every lifecycle operation — from deployment to compliance enforcement.

Each command connects directly to the Solana blockchain. No backend server is required.

---

## Features

| Category | Commands |
|---|---|
| **Token Lifecycle** | `create`, `info`, `list`, `use` |
| **Token Operations** | `mint`, `burn`, `freeze`, `thaw` |
| **Admin & Roles** | `pause`, `unpause`, `add-minter`, `remove-minter`, `update-roles`, `propose-transfer`, `accept-transfer` |
| **SSS-2 Compliance** | `compliance blacklist-add`, `blacklist-remove`, `check`, `list`, `seize` |
| **SSS-2 Transfer Hook** | `hook init`, `hook enable`, `hook disable`, `hook status` |

- Active token context — set once with `sss-token use <mint>`, omit `--mint` everywhere else
- Local config persisted at `~/.sss/config.json`
- Spinner feedback and coloured output on every command
- Support for `devnet`, `testnet`, `mainnet`, and `localnet`

---

## Installation

### Global (recommended)

```bash
# From npm (once published)
npm install -g @stbr/sss-cli

# — OR — from source
cd cli
yarn install
yarn build
npm link        # makes `sss-token` available globally
```

### From source (development)

```bash
cd cli
yarn install
yarn dev --help   # runs with ts-node, no build step needed
```

---

## Configuration

The CLI stores token metadata in `~/.sss/config.json`. This file is created automatically on first use.

```jsonc
{
  "activeToken": "<mint-address>",
  "tokens": {
    "<mint-address>": {
      "name": "My USD",
      "symbol": "MUSD",
      "preset": "sss2",
      "network": "devnet",
      "decimals": 6,
      "keypairPath": "/path/to/authority.json",
      "mintAddress": "<mint-address>",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Keypairs** are standard Solana JSON keypairs (array of 64 bytes). The default path is `~/.config/solana/id.json`. Override per-command with `--keypair <path>`.

---

## Usage

### Token Lifecycle

#### `create` — Deploy a new stablecoin

```bash
sss-token create \
  --name "ACME USD" \
  --symbol "AUSD" \
  --uri "https://example.com/meta.json" \
  --preset sss2 \
  --decimals 6 \
  --network devnet \
  --keypair ./authority.json \
  --blacklister <BLACKLISTER_PUBKEY> \   # SSS-2 only
  --seizer <SEIZER_PUBKEY>               # SSS-2 only
```

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--name` | ✅ | — | Token name |
| `--symbol` | ✅ | — | Token symbol |
| `--uri` | ✅ | — | Metadata URI |
| `--preset` | | `sss1` | `sss1`, `sss2`, or `custom` |
| `--decimals` | | `6` | Decimal places |
| `--keypair` | | `~/.config/solana/id.json` | Authority keypair |
| `--network` | | `devnet` | Network to deploy to |
| `--blacklister` | | — | SSS-2: blacklister public key |
| `--seizer` | | — | SSS-2: seizer public key |

After creation, the mint is automatically saved to config and set as the **active token**.

---

#### `info` — Fetch on-chain info

```bash
sss-token info --mint <MINT_ADDRESS> --network devnet
```

Displays: mint address, preset, name, symbol, total supply, paused status, blacklist count (SSS-2).

---

#### `list` — List locally stored tokens

```bash
sss-token list
```

Shows all tokens in `~/.sss/config.json`, with the active token highlighted.

---

#### `use` — Switch active token

```bash
sss-token use <MINT_ADDRESS>
```

Sets the given mint as the active token for all subsequent commands.

---

### Token Operations

#### `mint` — Mint tokens

```bash
sss-token mint <RECIPIENT_ATA> <AMOUNT> \
  --mint <MINT>          # optional if active token is set
  --minter ./minter.json
  --network devnet
```

`AMOUNT` is in **base units** (e.g. `1000000` = 1 MUSD with 6 decimals).

---

#### `burn` — Burn tokens

```bash
sss-token burn <AMOUNT> \
  --source <TOKEN_ACCOUNT>   # defaults to burner's ATA
  --burner ./burner.json
  --network devnet
```

---

#### `freeze` — Freeze a token account

```bash
sss-token freeze <TOKEN_ACCOUNT> --keypair ./authority.json
```

---

#### `thaw` — Thaw (unfreeze) a token account

```bash
sss-token thaw <TOKEN_ACCOUNT> --keypair ./authority.json
```

---

### Admin & Roles

#### `pause` / `unpause` — Halt or resume all minting and burning

```bash
sss-token pause   --keypair ./pauser.json
sss-token unpause --keypair ./pauser.json
```

---

#### `add-minter` / `remove-minter` — Manage minting rights

```bash
# Add with optional quota
sss-token add-minter --minter <PUBKEY> --quota 1000000 --keypair ./authority.json

# Revoke
sss-token remove-minter --minter <PUBKEY> --keypair ./authority.json
```

---

#### `update-roles` — Reassign roles

```bash
sss-token update-roles \
  --new-pauser <PUBKEY> \
  --new-minter-authority <PUBKEY> \
  --new-burner <PUBKEY> \
  --new-blacklister <PUBKEY> \   # SSS-2 only
  --new-seizer <PUBKEY> \        # SSS-2 only
  --keypair ./authority.json
```

All `--new-*` flags are optional; only provided roles are updated.

---

#### `propose-transfer` / `accept-transfer` — Transfer master authority

Two-step handoff to prevent accidental authority loss:

```bash
# Step 1 — current authority proposes the transfer
sss-token propose-transfer --new-authority <NEW_PUBKEY> --keypair ./authority.json

# Step 2 — new authority accepts it
sss-token accept-transfer --keypair ./new-authority.json
```

---

### SSS-2 Compliance

All compliance commands live under the `compliance` subcommand group.

#### `compliance blacklist-add`

```bash
sss-token compliance blacklist-add <WALLET_ADDRESS> \
  --reason "Sanctions screening" \
  --keypair ./blacklister.json
```

#### `compliance blacklist-remove`

```bash
sss-token compliance blacklist-remove <WALLET_ADDRESS> --keypair ./blacklister.json
```

#### `compliance check`

```bash
sss-token compliance check --address <WALLET_ADDRESS>
```

#### `compliance list`

```bash
sss-token compliance list
```

Prints all active blacklist entries with their reason strings.

#### `compliance seize`

Seizes tokens from a frozen account using the permanent delegate authority:

```bash
sss-token compliance seize <SOURCE_ACCOUNT> \
  --to <DESTINATION_ACCOUNT> \
  --amount 500000 \
  --reason "Court order #1234" \
  --keypair ./seizer.json
```

> **Note:** The source account must be frozen first (`sss-token freeze`).

---

### SSS-2 Transfer Hook

Commands to manage the on-chain transfer hook that enforces the blacklist on every token transfer.

#### `hook init`

```bash
sss-token hook init --mint <MINT> --keypair ./authority.json
```

Initializes the hook program and registers extra account metas (two transactions).

#### `hook enable` / `hook disable`

```bash
sss-token hook enable  --mint <MINT> --keypair ./authority.json
sss-token hook disable --mint <MINT> --keypair ./authority.json
```

#### `hook status`

```bash
sss-token hook status --mint <MINT>
```

Shows: mint, authority, enabled state, total transfer count, blocked transfer count.

---

## Global Options

Every command supports these options:

| Flag | Default | Description |
|------|---------|-------------|
| `--mint <pubkey>` | active token | Stablecoin mint address |
| `--keypair <path>` | `~/.config/solana/id.json` | Path to signing keypair JSON |
| `--network <net>` | `devnet` | `devnet` · `testnet` · `mainnet` · `localnet` |

---

## Development Setup

### Prerequisites

- Node.js ≥ 18
- Yarn (`npm install -g yarn`)
- Solana CLI (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)

### Steps

```bash
# 1. Clone the monorepo
git clone https://github.com/solanabr/solana-stablecoin-standard.git
cd sss

# 2. Build the SDK first (the CLI depends on it)
cd sdk
yarn install
yarn build
cd ..

# 3. Install CLI dependencies
cd cli
yarn install

# 4. Run in development mode (no build required)
yarn dev --help

# 5. (Optional) Link globally for testing
yarn build
npm link
sss-token --help
```

### Project Structure

```
cli/
├── src/
│   ├── index.ts          # Entry point & program setup
│   ├── config.ts         # ~/.sss/config.json read/write
│   ├── utils.ts          # Keypair loading, print helpers
│   └── commands/
│       ├── token.ts      # create, info, list, use
│       ├── operations.ts # mint, burn, freeze, thaw
│       ├── admin.ts      # pause, unpause, roles, authority
│       ├── compliance.ts # blacklist & seize
│       └── hook.ts       # transfer hook management
├── package.json
└── tsconfig.json
```

### Useful Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Run with `ts-node` (no compile step) |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn clean` | Remove `dist/` |
| `yarn test` | Run Mocha tests |

---

## Contributing

1. **Fork** the repository and create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes, following the existing code style (TypeScript strict mode, `commander` patterns)
3. Add a new command? Register it in `src/commands/<category>.ts` and export it from `src/commands/index.ts`, then wire it up in `src/index.ts`
4. Run `yarn build` to verify no TypeScript errors
5. Submit a **pull request** with a clear description of the change

### Adding a New Command

```typescript
// src/commands/mycommands.ts
import { Command } from 'commander';

export function registerMyCommand(program: Command): void {
    program
        .command('my-command')
        .description('Does something useful')
        .requiredOption('--foo <value>', 'Some required input')
        .option('--bar', 'Optional flag')
        .action(async (opts) => {
            // Implementation
        });
}
```

Then in `src/index.ts`:
```typescript
import { registerMyCommand } from './commands/mycommands';
// ...
registerMyCommand(program);
```

---

> Built on the [Solana Stablecoin Standard](https://github.com/solanabr/solana-stablecoin-standard) · Powered by `@stbr/sss-token` SDK
