# Solana Stablecoin Standard (SSS) Programs

This directory contains the core smart contracts for the Solana Stablecoin Standard project, developed using the Anchor framework.

## Structure

- **`sss-core`**: The main SSS token program implementing features like minting, burning, freezing, seizing, and role management. Provides the baseline requirements for both SSS-1 and SSS-2 compliances.
- **`sss-oracle`**: An oracle integration program to simulate quotes or fetch external data (e.g. Switchboard prices).
- **`sss-transfer-hook`**: A Token2022 Transfer Hook program enforcing compliance rules (such as blocking transfers for blacklisted wallets).

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI tools](https://docs.solanalabs.com/cli/install)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)

## Building the Programs

Navigate to the project root and run:

```bash
anchor build
```

## Testing

```bash
anchor test
```
