# Solana Stablecoin Standard (SSS) SDK

The `@stbr/sss-token` SDK provides the canonical TypeScript interface to interact with the SSS smart contracts on the Solana blockchain.

## Features

- **Object-Oriented Client**: Interact via a clean interface (`SolanaStablecoin`).
- **Complete Lifecycle Support**: Deploy new stablecoins, assign roles, mint/burn, and manage compliance.
- **Pre-configured Standards**: Deploy using pre-defined SSS-1 (Minimal) or SSS-2 (Compliant) templates.

## Installation

```bash
yarn install
```

## Usage Example

```typescript
import {
  SolanaStablecoin,
  StablecoinPreset,
  SolanaNetwork,
} from "@stbr/sss-token";
import { Connection, Keypair } from "@solana/web3.js";

const authority = Keypair.generate(); // Your keypair

// Deploy a compliant SSS-2 stablecoin
const { txSig, mintAddress } = await SolanaStablecoin.create(
  {
    name: "My USD",
    symbol: "MUSD",
    uri: "https://example.com/meta.json",
    decimals: 6,
    preset: StablecoinPreset.SSS_2,
    authority,
    blacklister: authority.publicKey,
    seizer: authority.publicKey,
  },
  SolanaNetwork.DEVNET
);

console.log("Deployed Mint:", mintAddress.toBase58());

// Load and interact
const sdk = await SolanaStablecoin.load(SolanaNetwork.DEVNET, mintAddress);
const info = await sdk.getInfo();
console.log(info.name, info.totalSupply);
```

For full documentation, see [`docs/SDK.md`](../../docs/SDK.md).

## Building

```bash
yarn build
```
