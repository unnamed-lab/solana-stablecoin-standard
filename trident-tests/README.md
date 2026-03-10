# 🔬 Trident Fuzz Tests

This directory was initialized by [`trident init`](https://ackee.xyz/trident/docs/latest/) and contains property-based fuzz tests for the SSS on-chain programs.

## Directory Structure

```
trident-tests/
├── Cargo.toml             # Rust workspace for fuzz binaries
├── Trident.toml           # Trident config: program binaries & metrics
│
├── fuzz_0/                # sss-core fuzz target
│   ├── test_fuzz.rs       # Flows: mint, burn, freeze, blacklist, pause/unpause
│   ├── fuzz_accounts.rs   # All account address slots used by fuzz_0
│   └── types.rs           # Auto-generated instruction builders (DO NOT EDIT)
│
├── fuzz_1/                # sss-oracle fuzz target
│   ├── test_fuzz.rs       # Flows: register_feed, initialize_oracle, update_cpi_multiplier
│   └── fuzz_accounts.rs   # Account address slots used by fuzz_1
│
└── fuzz_2/                # sss-core (SSS-3 extensions) fuzz target
    ├── test_fuzz.rs       # Flows: SSS-3 initialize, allowlist, confidential, governance
    └── fuzz_accounts.rs   # Account address slots used by fuzz_2
```

## Prerequisites

Fuzz tests require **Linux or macOS** (honggfuzz does not support Windows natively). Use **WSL2** on Windows.

```bash
# Install Trident CLI (once)
cargo install trident-cli

# Install honggfuzz (once)
cargo install honggfuzz
```

## Running Fuzz Tests

```bash
# From the workspace root

# Fuzz sss-core (mint, burn, freeze, blacklist, pause)
trident fuzz run fuzz_0

# Fuzz sss-oracle (register_feed, initialize_oracle, update_cpi_multiplier)
trident fuzz run fuzz_1

# Fuzz sss-core (SSS-3 extensions: allowlist, confidential, governance)
trident fuzz run fuzz_2
```

Crashes, if found, are saved to `trident-tests/fuzzing/crashes/`.

## Invariants Checked

### fuzz_0 (sss-core)
| Invariant | Description |
|---|---|
| Supply consistency | `total_minted - total_burned` must never go negative |
| Blacklist → frozen | A blacklisted wallet must always have a frozen token account |
| Pause gate | Mint/burn must be rejected while the token is paused |
| Authority only | Unauthorized callers must never succeed on privileged instructions |

### fuzz_1 (sss-oracle)
| Invariant | Description |
|---|---|
| Unique symbols | The registry cannot hold duplicate feed symbols |
| Registry pre-condition | Feeds and oracle configs require an initialized registry |
| Fee bounds | Fees are clamped to [0, 500 bps] before submission |
| CPI multiplier | A zero-value multiplier must be rejected |

### fuzz_2 (sss-core SSS-3 Extensions)
| Invariant | Description |
|---|---|
| Allowlist integrity | Unauthorized accounts cannot be added to allowlist |
| Proposal lifecycle | Valid execute sequence (create -> approve -> execute) does not panic |
| Confidential config | Approve confidential account doesn't panic on normal operation |

## Regenerating types.rs

If program IDLs change, regenerate `types.rs` using:
```bash
trident build    # rebuilds programs and regenerates types
```
