# 🧪 Tests

This directory contains all automated tests for the SSS smart contract ecosystem, organized by test type.

## Directory Structure

```
tests/
├── unit/                  # Anchor mocha tests — run via `anchor test`
│   ├── sss-core.ts        # SSS-1 & SSS-2 happy-path and edge-case tests
│   ├── sss-oracle.ts      # Pure-TS oracle math simulation tests
│   └── sss-transfer-hook.ts  # Hook init, enable/disable tests
│
├── integration/           # End-to-end preset lifecycle tests
│   ├── sss-1-preset.ts    # SSS-1: create → mint → transfer → freeze
│   ├── sss-2-preset.ts    # SSS-2: create → mint → blacklist → seize
│   └── oracle-integration.ts  # Oracle: PDA derivation, registry, sim edge cases
│
└── Trident.toml           # Trident config — programs loaded for fuzz runs
```

## Running Unit & Integration Tests

All tests run against a local Solana validator started by Anchor:

```bash
# From the workspace root
anchor test
```

> **Tip:** To clone the Switchboard BRL/USD feed for oracle integration tests on localnet:
> ```bash
> solana-test-validator --url devnet --clone BwBLNEuTnqQVhzgx3557szSgz1PEHEvj2RRoPiFWR8YB
> ```
> Then in a separate terminal: `anchor test --skip-local-validator`

## Fuzz Tests

Fuzz tests live in `trident-tests/` (the directory produced by `trident init`). See [`trident-tests/README.md`](../trident-tests/README.md) for instructions.
