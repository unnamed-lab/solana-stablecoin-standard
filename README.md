# Solana Stablecoin Standard (SSS)

The **Solana Stablecoin Standard (SSS)** is an enterprise-grade toolkit for deploying, managing, and governing stablecoins natively on the Solana blockchain. 

Built exclusively on the **Token-2022 standard**, SSS provides a modular architecture specifically designed to scale from decentralized algorithmic stablecoins (SSS-1) to strict, institutionally regulated fiat-backed assets (SSS-2).

## Core Programs

The standard consists of two deeply interconnected Anchor programs:

1. **`sss-core`**: The state machine. Manages mint authority, role separation, minting quotas, pauses, permanent delegates (seizures), and blacklist registries.
2. **`sss-transfer-hook`**: The compliance engine. Operates as a Token-2022 Transfer Hook to intercept and validate every transaction against the on-chain blacklist registries managed by `sss-core`.

## Documentation

Dive deep into the SSS architecture and compliance models in this directory:

* [Architecture Overview](./docs/ARCHITECTURE.md) - Understanding the PDAs, CPIs, and program interactions.
* [Compliance & Regulations](./docs/COMPLIANCE.md) - How SSS handles Blacklists, Seizures, and KYC workflows.
* [SSS-1 (Standard) Preset](./docs/SSS-1.md) - Utilizing the standard token flows without strict compliance overhead.
* [SSS-2 (Regulated) Preset](./docs/SSS-2.md) - Unlocking dynamic Transfer Hooks and Permanent Delegates.

## Building and Testing

Ensure you have the latest Rust, Solana, and Anchor CLI tools installed.
If you experience `cross-crate` or `Cargo` network timeouts in WSL during compilation, you may need to update your Solana `platform-tools` or install via `cargo-build-sbf --install-only`.

```bash
# Build the programs
anchor build

# Or directly with Cargo SBF
cargo build-sbf
```
