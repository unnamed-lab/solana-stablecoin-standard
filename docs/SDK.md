# Solana Stablecoin Standard — SDK Reference

The `@stbr/sss-token` SDK provides a high-level TypeScript interface for interacting with the **sss-core** and **sss-transfer-hook** Solana programs.

---

## Installation

```bash
# From the project root
cd sdk && yarn install && yarn build
```

The build step fetches the latest IDLs from `target/idl/` and compiles TypeScript.

---

## Quick Start

```ts
import {
  SolanaStablecoin,
  StablecoinPreset,
  SolanaNetwork,
} from "@stbr/sss-token";
import { Keypair } from "@solana/web3.js";

// 1. Create a new stablecoin
const authority = Keypair.generate();
const txSig = await SolanaStablecoin.create(
  {
    name: "My USD",
    symbol: "MUSD",
    uri: "https://example.com/metadata.json",
    decimals: 6,
    preset: StablecoinPreset.SSS_2,
    authority,
    blacklister: authority.publicKey,
    seizer: authority.publicKey,
  },
  SolanaNetwork.DEVNET
);

// 2. Load an existing stablecoin
const sdk = await SolanaStablecoin.load(SolanaNetwork.DEVNET, mintPubkey);

// 3. Interact
const info = await sdk.getInfo();
console.log(info.name, info.totalSupply);
```

---

## Presets

| Preset | Transfer Hook | Permanent Delegate | Default Frozen | Compliance |
|--------|:---:|:---:|:---:|:---:|
| **SSS-1** | ✗ | ✗ | ✗ | ✗ |
| **SSS-2** | ✓ | ✓ | ✓ | ✓ |
| **CUSTOM** | configurable | configurable | configurable | configurable |

- **SSS-1** — Lightweight token: mint, burn, pause, freeze/thaw. No compliance features.
- **SSS-2** — Full regulatory compliance: adds blacklisting, asset seizure, and transfer hook enforcement.
- **CUSTOM** — Starts with SSS-1 defaults; override individual extensions via `config.extensions`.

---

## Core API — `SolanaStablecoin`

### Static Methods

#### `SolanaStablecoin.create(config, network?)`

Deploy a brand-new stablecoin. Initialises the mint, creates the `StablecoinConfig` PDA, and configures Token-2022 extensions per the chosen preset.

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `CreateStablecoinConfig` | Token name, symbol, decimals, preset, authority keypair, roles |
| `network` | `SolanaNetwork` | Target cluster (default: `DEVNET`) |

**Returns:** `Promise<string>` — transaction signature.

---

#### `SolanaStablecoin.load(network?, mint)`

Load an existing stablecoin by its mint address. Reads on-chain config to determine preset.

| Parameter | Type | Description |
|-----------|------|-------------|
| `network` | `SolanaNetwork` | Cluster (default: `DEVNET`) |
| `mint` | `PublicKey` | SPL Token-2022 mint address |

**Returns:** `Promise<SolanaStablecoin>` — SDK instance.

---

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `connection` | `Connection` | Active Solana RPC connection |
| `mintAddress` | `PublicKey` | Token mint address |
| `config` | `PublicKey` | `StablecoinConfig` PDA |
| `preset` | `StablecoinPreset` | Preset used at creation |
| `compliance` | `ComplianceModule` | Blacklist & seizure (SSS-2 only) |
| `transferHook` | `TransferHookModule` | Transfer hook management (SSS-2 only) |

> **Note:** Accessing `compliance` or `transferHook` on an SSS-1 or CUSTOM instance throws an error.

---

### Token Lifecycle

#### `mint(params: MintParams)`

Mint new tokens to a destination token account. The minter must be authorised via `addMinter()`.

```ts
await sdk.mint({
  recipient: userAta,
  amount: 1_000_000,
  minter: minterKeypair,
});
```

#### `burn(params: BurnParams)`

Burn tokens from a token account. If `source` is omitted, the burner's ATA is used.

```ts
await sdk.burn({
  amount: 500_000,
  burner: holderKeypair,
});
```

---

### Access Control

#### `freeze(authority, account)`

Freeze a token account, preventing all outgoing transfers.

#### `thaw(authority, account)`

Unfreeze a previously frozen token account.

#### `pause(pauser)`

Pause the entire stablecoin — blocks all minting and burning.

#### `unpause(pauser)`

Resume normal operations after a pause.

---

### Minter Management

#### `addMinter(authority, minter, quota?)`

Authorise a new minter with an optional per-period quota.

```ts
await sdk.addMinter(authority, minterPubkey, { amount: 1_000_000 });
```

#### `removeMinter(authority, minter)`

Revoke minting rights from a minter.

---

### Role Management

#### `updateRoles(authority, update: RoleUpdateParams)`

Update one or more role assignments. Only specified roles are changed.

```ts
await sdk.updateRoles(authority, {
  newPauser: newPauserPubkey,
  newBlacklister: newBlacklisterPubkey,
});
```

#### `proposeAuthorityTransfer(authority, newAuthority)`

Propose a two-step master authority transfer.

#### `acceptAuthorityTransfer(pendingAuthority)`

Accept a pending authority transfer. Must be called by the proposed new authority.

```ts
// Step 1: Current authority proposes
await sdk.proposeAuthorityTransfer(currentAuthority, newPubkey);

// Step 2: New authority accepts
await sdk.acceptAuthorityTransfer(newAuthorityKeypair);
```

---

### Read-Only Queries

#### `getInfo(): Promise<StablecoinInfo>`

Fetch name, symbol, supply, paused status, and blacklist count.

#### `getTotalSupply(): Promise<number>`

Get the current total supply in base units.

#### `isPaused(): Promise<boolean>`

Check whether the stablecoin is paused.

---

## Compliance Module — `ComplianceModule`

> Available on **SSS-2** instances only. Accessed via `sdk.compliance`.

### `blacklistAdd(authority, { address, reason })`

Blacklist a wallet address. The target's token account is automatically frozen.

```ts
await sdk.compliance.blacklistAdd(authority, {
  address: suspiciousWallet,
  reason: "Suspicious activity",
});
```

### `blacklistRemove(authority, address)`

Remove a wallet from the blacklist and thaw its token account.

### `isBlacklisted(address): Promise<boolean>`

Check if an address is actively blacklisted.

### `getBlacklist(): Promise<BlacklistEntry[]>`

Fetch all active blacklist entries for this mint.

### `seize(authority, from, to, amount, reason)`

Forcibly transfer tokens from a **frozen** account. Requires permanent delegate.

```ts
// 1. Freeze the source account
await sdk.freeze(authority, sourceAta);

// 2. Seize tokens to treasury
await sdk.compliance.seize(
  authority,
  sourceAta,
  treasuryAta,
  10_000,
  "Court order #1234"
);
```

---

## Transfer Hook Module — `TransferHookModule`

> Available on **SSS-2** instances only. Accessed via `sdk.transferHook`.

The transfer hook intercepts every Token-2022 transfer and enforces blacklist checks on both sender and recipient.

### Setup (one-time)

```ts
// 1. Initialize the hook config
await sdk.transferHook.initializeHook(payer, authority, true);

// 2. Register extra account metas for Token-2022
await sdk.transferHook.initializeExtraAccountMetaList(payer, authority);
```

### `initializeHook(payer, authority, defaultEnabled?)`

Create the on-chain `HookConfig` PDA. `defaultEnabled` controls whether the hook starts active (default: `true`).

### `initializeExtraAccountMetaList(payer, authority)`

Register the extra accounts that Token-2022 automatically resolves during hook execution (hook config, blacklist PDAs, sss-core program ID).

### `enableHook(authority)` / `disableHook(authority)`

Toggle the hook on/off without removing it. When disabled, transfers proceed without blacklist checks.

```ts
await sdk.transferHook.disableHook(authority); // temporarily disable
await sdk.transferHook.enableHook(authority);  // re-enable
```

### `getHookConfig(): Promise<HookConfigInfo>`

Read the hook's current state.

```ts
const config = await sdk.transferHook.getHookConfig();
console.log(config.enabled);        // true
console.log(config.transferCount);   // 42
console.log(config.blockedCount);    // 3
```

---

## Types Reference

### Enums

| Enum | Values | Description |
|------|--------|-------------|
| `StablecoinPreset` | `SSS_1`, `SSS_2`, `CUSTOM` | Preset configuration profiles |
| `SolanaNetwork` | `DEVNET`, `MAINNET`, `TESTNET`, `LOCALNET` | Target Solana cluster |

### Key Interfaces

| Interface | Purpose |
|-----------|---------|
| `CreateStablecoinConfig` | Input for `SolanaStablecoin.create()` |
| `MintParams` | Input for `sdk.mint()` |
| `BurnParams` | Input for `sdk.burn()` |
| `RoleUpdateParams` | Input for `sdk.updateRoles()` |
| `MinterQuota` | Minting quota for `sdk.addMinter()` |
| `StablecoinInfo` | Return type of `sdk.getInfo()` |
| `HookConfigInfo` | Return type of `sdk.transferHook.getHookConfig()` |
| `BlacklistParams` | Input for compliance blacklist operations |

---

## Error Handling

All SDK errors extend `SSSBaseError` and carry an optional `code` field matching the on-chain Anchor error code.

### Catching Errors

```ts
import { SSSBaseError, parseProgramError, PausedError } from "@stbr/sss-token";

try {
  await sdk.mint(params);
} catch (err) {
  const parsed = parseProgramError(err);
  if (parsed instanceof PausedError) {
    console.log("Token is paused, try again later");
  } else if (parsed instanceof SSSBaseError) {
    console.error(`SSS error [${parsed.code}]: ${parsed.message}`);
  }
}
```

### `parseProgramError(err): Error`

Converts a raw Anchor/RPC error into the matching typed SDK error class. Returns the original error if no match is found.

### sss-core Errors

| Error Class | Code | Message |
|-------------|:----:|---------|
| **Access Control** |||
| `NotMasterAuthorityError` | 6000 | Signer is not the master authority |
| `NotMinterError` | 6001 | Signer is not authorized to mint |
| `NotBurnerError` | 6002 | Signer is not authorized to burn |
| `NotBlacklisterError` | 6003 | Signer is not the blacklister |
| `NotSeizerError` | 6004 | Signer is not the seizer |
| `NotPauserError` | 6005 | Signer is not the pauser |
| **Feature Gating** |||
| `ComplianceNotEnabledError` | 6006 | Compliance module not enabled |
| `PermanentDelegateNotEnabledError` | 6007 | Permanent delegate not enabled |
| `HookNotRegisteredError` | 6008 | Transfer hook not registered |
| **State Guards** |||
| `PausedError` | 6009 | Stablecoin is paused |
| `NotPausedError` | 6010 | Stablecoin is not paused |
| `AlreadyBlacklistedError` | 6011 | Address is already blacklisted |
| `NotBlacklistedError` | 6012 | Address is not blacklisted |
| `InvalidBlacklistTargetError` | 6013 | Cannot blacklist the zero address |
| `AccountNotFrozenError` | 6014 | Cannot seize from a non-frozen account |
| **Quota** |||
| `QuotaExceededError` | 6015 | Mint amount exceeds per-period quota |
| `MinterInactiveError` | 6016 | Minter is inactive |
| `MinterAlreadyExistsError` | 6017 | Minter config already exists |
| **Authority Transfer** |||
| `NoPendingTransferError` | 6018 | No pending authority transfer |
| `NotPendingAuthorityError` | 6019 | Signer is not the pending authority |
| **Validation** |||
| `NameTooLongError` | 6020 | Name exceeds 32 characters |
| `SymbolTooLongError` | 6021 | Symbol exceeds 10 characters |
| `ZeroAmountError` | 6022 | Amount must be greater than zero |
| `SupplyOverflowError` | 6023 | Overflow in supply calculation |

### sss-transfer-hook Errors

| Error Class | Code | Message |
|-------------|:----:|---------|
| `SenderBlacklistedError` | 6100 | Sender is blacklisted |
| `RecipientBlacklistedError` | 6101 | Recipient is blacklisted |
| `HookDisabledError` | 6102 | Transfer hook is disabled |
| `InvalidMintError` | 6103 | Invalid mint for this hook |
| `InvalidAuthorityError` | 6104 | Invalid authority |

### SDK-Only Errors

| Error Class | Message |
|-------------|---------|
| `TransferHookNotAvailableError` | Transfer hook module is only available on SSS-2 |
| `AccountNotFoundError` | Account not found: `{account}` |
| `InvalidNetworkError` | Invalid or unsupported network: `{network}` |

---

## Testing

Tests are run via Anchor's test framework against a local validator:

```bash
# From the project root
anchor test
```

Test files:
- `tests/sss-core.ts` — Core SDK tests (SSS-1 + SSS-2 presets, role management, authority transfer)
- `tests/sss-transfer-hook.ts` — Transfer hook module tests
