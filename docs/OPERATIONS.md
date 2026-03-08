# SSS Operations Runbook

This document serves as the operator runbook for the Solana Stablecoin Standard (SSS).

## Overview

The SSS provides several ways to perform administrative actions:
1.  **CLI (`sss-token`)**: For terminal-based deployments and automated scripts.
2.  **TUI**: For an interactive dashboard.
3.  **SDK**: For programmatic execution.
4.  **Frontend/Backend API**: For web interfaces.

## Common Operations

### 1. Minting Tokens

Minting increases the total supply and deposits tokens into a recipient's Token Account.
Must be executed by a user holding the `minter` role, and respects configured quotas.

**via CLI:**
```bash
sss-token mint <RECIPIENT_ADDRESS> <AMOUNT> --keypair ./minter.json
```

**via SDK:**
```typescript
await client.mint({
    recipient: recipientPublicKey,
    amount: 1000000, // base units
    minterKp: minterKeypair
});
```

### 2. Freezing / Thawing Accounts

Freezing prevents a specific token account from sending or receiving tokens (SSS-1 and SSS-2).

**via CLI:**
```bash
sss-token freeze <TOKEN_ACCOUNT> --keypair ./authority.json
sss-token thaw <TOKEN_ACCOUNT> --keypair ./authority.json
```

### 3. SSS-2: Blacklisting Addresses

Blacklisting (SSS-2 only) prevents a wallet address from participating in any transfers, enforced via the Transfer Hook program.

**via CLI:**
```bash
sss-token compliance blacklist-add <WALLET_ADDRESS> --reason "Sanctions" --keypair ./blacklister.json
```

### 4. SSS-2: Seizing Assets

Seizure (SSS-2 only) allows authorized personnel to forcefully transfer tokens out of a frozen account (e.g., due to a court order).

**Requirements:** The account *must* be frozen first.

**via CLI:**
```bash
sss-token freeze <TARGET_ACCOUNT> --keypair ./authority.json
sss-token compliance seize <TARGET_ACCOUNT> --to <DESTINATION_ACCOUNT> --amount <AMOUNT> --reason "Court order #1234" --keypair ./seizer.json
```

### 5. Managing Quotas

To add a new minter with a maximum allowed quota:

**via CLI:**
```bash
sss-token add-minter --minter <PUBKEY> --quota 500000000 --keypair ./authority.json
```
