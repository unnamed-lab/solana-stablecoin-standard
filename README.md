# Solana Stablecoin Standard (SSS)

The **Solana Stablecoin Standard (SSS)** is an enterprise-grade toolkit for deploying, managing, and governing stablecoins natively on the Solana blockchain. 

Built exclusively on the **Token-2022 standard**, SSS provides a modular architecture specifically designed to scale from decentralized algorithmic stablecoins (SSS-1) to strict, institutionally regulated fiat-backed assets (SSS-2).

## Project Structure

SSS is a comprehensive monorepo containing everything needed to run a stablecoin:

- **[`backend/`](./backend)**: A scalable NestJS backend providing a REST API, blockchain indexer, and webhook dispatcher.
- **[`cli/`](./cli)**: The `sss-token` command-line interface for deploying and managing stablecoins from your terminal.
- **[`frontend/`](./frontend)**: A Next.js dashboard for users and operators to view metrics and perform token operations.
- **[`programs/`](./programs)**: Core Anchor smart contracts (`sss-core`, `sss-oracle`, `sss-transfer-hook`).
- **[`sdk/`](./sdk)**: The canonical `@stbr/sss-token` TypeScript SDK for interacting with the blockchain.
- **[`sss-oracle-frontend/`](./sss-oracle-frontend)**: A web UI for simulating quotes and managing oracle price feeds.
- **[`tui/`](./tui)**: An interactive Terminal UI for monitoring supply, compliance, and real-time events.

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

- [**Overview & Architecture**](./docs/README.md) - Understanding the system design and interaction of components.
- [**SDK Reference**](./docs/SDK.md) - Integrating the TypeScript SDK.
- [**Operator Runbook**](./docs/OPERATIONS.md) - Guide for minting, burning, and freezing.
- [**Backend API Reference**](./docs/API.md) - Interacting with the SSS API and Indexer.
- [**Compliance & Regulations**](./docs/COMPLIANCE.md) - Managing Blacklists, Seizures, and KYC.
- [**SSS-1 (Minimal)**](./docs/SSS-1.md) - Lightweight preset overview.
- [**SSS-2 (Regulated)**](./docs/SSS-2.md) - Fully compliant preset overview.
- [**SSS-3 (Governance)**](./docs/SSS-3.md) - Upcoming DAO/Multi-sig standard.
- [**Frontends**](./docs/FRONTEND.md) - Overview of the web applications.

## Quick Start

1. **Install Prerequisites**: Node.js ≥ 18, Rust, Solana CLI, Anchor CLI.
2. **Clone and Install**:
   ```bash
   git clone https://github.com/solanabr/solana-stablecoin-standard.git
   cd sss
   yarn install:each
   ```
3. **Build the Smart Contracts**:
   ```bash
   anchor build
   ```

*(See individual directory READMEs for specific instructions on running each component).*
