# SSS Oracle Integration Module

> **Separate program.** The oracle module is a standalone Anchor program that provides live pricing for non-USD stablecoins built on SSS-1 or SSS-2. The token itself is unchanged — the oracle is a pricing layer that sits in front of minting and redemption.

---

## Why This Exists

Token-2022 and the SSS standard make USD stablecoins easy. But the world holds wealth in BRL, EUR, JPY, and dozens of other currencies. A Brazilian issuer building a BRLUSD stablecoin needs to know: "when a user deposits $100 USD, how many BRLUSD tokens do they receive?" The answer changes every second as FX rates move. That's what this module solves.

The oracle module also supports **CPI-indexed tokens** — stablecoins that maintain purchasing power rather than pegging to a currency. These are uniquely valuable in high-inflation economies.

---

## Architecture

### Three-Layer Separation

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: SSS Token (SSS-1 or SSS-2)                       │
│  Unchanged. Knows nothing about prices.                     │
│  mint/burn controlled by config PDA authority               │
└──────────────────────────┬──────────────────────────────────┘
                           │ CPI call (mint_with_oracle)
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 2: sss-oracle Program                                │
│  Reads Switchboard feeds, calculates amounts, enforces      │
│  slippage, stores quotes on-chain, CPIs to sss-core         │
└──────────────────────────┬──────────────────────────────────┘
                           │ reads aggregator account
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 1: Switchboard Feeds                                 │
│  Decentralized price oracles. Multiple data providers.      │
│  BRL/USD, EUR/USD, JPY/USD, custom feeds                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Accounts

| Account | PDA Seeds | Purpose |
|---------|-----------|---------|
| **FeedRegistry** | `["sss-feed-registry"]` | Global singleton listing all registered price feeds. One per deployment. |
| **OracleConfig** | `["sss-oracle", mint]` | Per-mint oracle configuration: feed, fees, staleness, CPI multiplier. |
| **PendingQuote** | `["sss-quote", mint, requester, nonce]` | On-chain quote for atomic execution. Prevents front-running. |

---

## Feed Types

### `Direct` — Currencies worth MORE than USD

**Examples:** EUR, GBP, CHF, AUD

The Switchboard feed returns "X USD per 1 unit of base currency".

```
EUR/USD feed = 1.08
User deposits $108 USD
Tokens = 108 / 1.08 = 100 EURUSD tokens
```

### `Inverse` — Currencies worth LESS than USD

**Examples:** BRL, JPY, MXN, INR

The Switchboard feed returns "X units of base currency per 1 USD".

```
BRL/USD feed = 5.72
User deposits $100 USD
Tokens = 100 × 5.72 = 572 BRLUSD tokens
```

### `CpiIndexed` — Purchasing Power Tokens

**Examples:** BRLCPI (IPCA-indexed), USCPI (CPI-U indexed)

Each token represents a unit of purchasing power from a base date. Early holders benefit as inflation rises — the token redeems for more USD over time without rebasing.

```
Base date: January 2024, CPI multiplier = 1.000
Current:   February 2026, CPI multiplier = 1.083 (+8.3% inflation)

User deposits $108.30 USD → 100 BRLCPI tokens
Later (2027), CPI multiplier = 1.150
User redeems 100 BRLCPI tokens → $115 USD (purchasing power preserved)
```

**Trust assumption:** CPI multiplier is updated monthly by the oracle authority using official government data (IBGE for BRL, BLS for USA). This is a centralized step — documented as such.

### `Custom` — Exotic Pegs

Applies a `(numerator, denominator)` scaling factor before delegating to Direct or Inverse. Supports arbitrary pegs without program redeployment.

---

## Instructions

| Instruction | Purpose | Signer |
|-------------|---------|--------|
| `initialize_registry` | Create global feed registry (one-time) | Admin |
| `register_feed` | Add a Switchboard feed to registry | Admin |
| `initialize_oracle` | Create per-mint oracle config | Mint authority |
| `get_mint_quote` | USD → tokens quote (stores PendingQuote on-chain) | Any user |
| `get_redeem_quote` | Tokens → USD quote | Any user |
| `mint_with_oracle` | Execute a stored quote atomically | Quote requester |
| `update_cpi_multiplier` | Monthly CPI update (CpiIndexed only) | Admin |
| `pause_oracle` / `unpause_oracle` | Emergency stop | Admin |
| `propose_authority_transfer` | Two-step authority handoff | Current authority |
| `accept_authority_transfer` | Complete authority handoff | New authority |

---

## Full Mint Flow

```
1. User calls get_mint_quote(input_amount: 10_000, min_output: 570_000_000, nonce: N)
   └─ Program reads BRL/USD feed: 5.72
   └─ Calculates: 572 BRLUSD gross, fee 1.716 BRLUSD (0.3%), net 570.284
   └─ Stores PendingQuote on-chain (valid 60s)
   └─ Returns QuoteResult { output_amount, fee_amount, price_used, valid_until }

2. User reviews quote in UI (rate, fee, net amount are shown)

3. User calls mint_with_oracle() within 60 seconds
   └─ Program loads PendingQuote
   └─ Checks: not expired, not used, output >= min_output
   └─ Updates oracle stats (total_minted_usd, total_fees_collected)
   └─ Emits OracleMint event
   └─ Closes PendingQuote account (refunds rent to user)
```

---

## Slippage Protection

Three layers prevent users from being harmed by price movement:

| Layer | Mechanism | Where |
|-------|-----------|-------|
| **min_output** | User sets a floor when requesting the quote. If price has moved too much, quote itself fails. | `get_mint_quote` |
| **Quote expiry** | PendingQuote has a `valid_until` timestamp (default 60s). Stale quotes are rejected. | `mint_with_oracle` |
| **Confidence interval** | If Switchboard's confidence (std deviation) exceeds `max_confidence_bps` as % of price, minting is blocked during extreme volatility. | `get_mint_quote` |

---

## Adding New Non-USD Pegs

Adding a new currency requires two steps — no program redeployment needed.

### Step 1 — Register the Feed

```typescript
import { OracleModule, FeedType, SolanaNetwork } from '@stbr/sss-token';

const oracle = new OracleModule(SolanaNetwork.DEVNET);

await oracle.registerFeed(authority, programId, {
  symbol:          'JPYUSD',
  feedType:        FeedType.Inverse,
  baseCurrency:    'JPY',
  quoteCurrency:   'USD',
  decimals:        8,
  switchboardFeed: new PublicKey('<switchboard-jpy-usd-feed>'),
});
```

### Step 2 — Initialize Oracle for Your Mint

```typescript
await oracle.initializeOracle(authority, programId, {
  mint:                  jpyMintAddress,
  feedSymbol:            'JPYUSD',
  description:           'Japanese Yen Stablecoin — 1 JPYUSD = 1 JPY',
  maxStalenessSecs:      120,
  mintFeeBps:            30,
  redeemFeeBps:          30,
  maxConfidenceBps:      50,
  quoteValiditySecs:     60,
  cpiMultiplier:         1_000_000,
  cpiMinUpdateInterval:  0,
  cpiDataSource:         '',
});
```

---

## SDK — Local Price Simulation

The SDK `simulateMintQuote()` method replicates on-chain math in pure JavaScript. Use it for live UI previews on every keystroke — zero RPC calls.

```typescript
const oracle = new OracleModule(SolanaNetwork.DEVNET);

const preview = oracle.simulateMintQuote(
  10_000,       // $100 in cents
  5_720_000,    // BRL/USD = 5.72 * PRICE_SCALE
  FeedType.Inverse,
  30,           // 0.3% fee
);

console.log(`≈ ${preview.net / 1e6} BRLUSD tokens`);
// ≈ 570.284 BRLUSD tokens
```

---

## Known Switchboard Feed Addresses

| Symbol | Network | Address | Type |
|--------|---------|---------|------|
| BRLUSD | Devnet | `8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb` | Inverse |
| EURUSD | Devnet | `9VADNiXpGFhQaMGV8dfXBnmhbX2LHVW3FRGpYMH4vW8q` | Direct |

For mainnet feeds, see [Switchboard's feed explorer](https://app.switchboard.xyz).

---

## Security Considerations

| Attack | Mitigation |
|--------|------------|
| **Stale price** | `max_staleness_secs` rejects prices older than threshold |
| **Confidence manipulation** | `max_confidence_bps` blocks minting during extreme volatility |
| **Front-running** | Atomic `mint_with_oracle` + `min_output` slippage floor |
| **Quote replay** | `close = requester` on PendingQuote — account is closed on consumption |
| **CPI manipulation** | `cpi_min_update_interval` enforces minimum time between updates; multisig recommended |

---

## Trust Model

| Component | Trust Level | Notes |
|-----------|-------------|-------|
| Switchboard feed | Decentralized | Multiple independent data providers |
| Mint/redeem pricing | Trustless on-chain | Math executed in program, verifiable |
| CPI multiplier updates | Admin-trusted | Multisig + timelock recommended for production |
| Quote expiry | Trustless on-chain | Enforced by program |
| Slippage protection | User-controlled | Set `min_output` at quote request time |

---

## Switchboard Integration Note

The oracle program reads Switchboard V2 aggregator accounts via **raw byte deserialization** rather than importing the `switchboard-solana` crate. This avoids an `anchor-lang` version conflict (Switchboard requires `^0.30.1`, this project uses `0.32.1`). The deserialization reads the `SwitchboardDecimal` mantissa/scale at known offsets in the aggregator account data layout.
