# Solana Stablecoin Standard (SSS) Frontend

The SSS provides multiple user-facing web applications to simplify interactions with the stablecoin infrastructure and the blockchain.

## Main Frontend App

- Located in: `frontend/`
- Framework: Next.js + React.
- Purpose: Provides a dashboard to view the token supply, active minters, and perform operations like minting, burning, and compliance (if authorized).

### Operating the Frontend
The frontend uses the `@stbr/sss-token` SDK to construct Solana transactions and send them to the network.

## Oracle Frontend

- Located in: `sss-oracle-frontend/`
- Framework: Next.js.
- Purpose: Interfaces with the Oracle backend service to simulate stablecoin quoting for mint/redeem processes based on integrated price feeds (like Switchboard).

## Running the Frontends

```bash
# In the frontend directory
yarn install
yarn dev

# In the sss-oracle-frontend directory
yarn install
yarn dev
```

---

## Frontend Features & API References

> **Base API URL:** `http://localhost:3000/api/v1`  
> **Oracle Microservice URL:** `http://localhost:3003` (no `/api/v1` prefix)

### 1. Token Operations

> Core stablecoin lifecycle operations: minting, burning, and supply/holder analytics.

#### 1.1 Mint Tokens
- **Screen:** Mint Form
- **Endpoint:** `POST /api/v1/mint`
- **Rate Limit:** 10 requests / 60 seconds
- **Fields:**
  | Field | Type | Description |
  |---|---|---|
  | `recipient` | `string` (base58) | Wallet address to receive the tokens |
  | `amount` | `number` (base units) | e.g., `1_000_000` = 1 USDC (6 decimals) |
  | `minterKeypair` | `string` (base58) | Server-side signing keypair for the minter authority |
- **Success Response:** `{ success: true, txSignature: "5Kz7...xYpQ" }`
- **UI Notes:**
  - Show a link to the transaction on Solana Explorer using `txSignature`.
  - Display a conversion helper (raw units ↔ human-readable amount using token decimals).

---

#### 1.2 Burn Tokens
- **Screen:** Burn Form
- **Endpoint:** `POST /api/v1/burn`
- **Rate Limit:** 10 requests / 60 seconds
- **Fields:**
  | Field | Type | Description |
  |---|---|---|
  | `amount` | `number` (base units) | Amount to burn |
  | `burnerKeypair` | `string` (base58) | Signing keypair with burn authority |
  | `source` *(optional)* | `string` (base58) | Token account to burn from. Defaults to burner ATA. |
- **Success Response:** `{ success: true, txSignature: "3wCX...URH8" }`

---

#### 1.3 Token Supply Dashboard
- **Screen:** Dashboard / Analytics
- **Endpoint:** `GET /api/v1/supply`
- **Response Fields:**
  | Field | Type | Notes |
  |---|---|---|
  | `totalSupply` | `string` | Total tokens currently in circulation |
  | `maxSupply` | `string \| null` | Hard cap if configured |
  | `burnSupply` | `string` | Total tokens ever burned |
  | `decimals` | `number` | e.g., `6` |
- **UI Notes:**
  - Display as stat cards (Total Supply, Max Supply, Total Burned).
  - Auto-convert to human-readable using `decimals`.

---

#### 1.4 Holders Count
- **Screen:** Dashboard / Analytics
- **Endpoint:** `GET /api/v1/holders/count`
- **Response:** `{ count: 1500 }`
- **UI Notes:** Show as a live stat card.

---

#### 1.5 Largest Holders Leaderboard
- **Screen:** Holders Page
- **Endpoint:** `GET /api/v1/holders/largest`
- **Query Params:**
  | Param | Type | Description |
  |---|---|---|
  | `minAmount` *(optional)* | `string` | Filter out accounts below this raw amount |
- **Response:** Array of:
  ```json
  {
    "address": "TokenAccountAddress...",
    "amount": "1000000",
    "decimals": 6,
    "uiAmount": 1,
    "uiAmountString": "1"
  }
  ```
- **UI Notes:** Show a ranked table with address (truncated + copy button), and `uiAmountString`. Add `minAmount` filter input.

---

### 2. Compliance

> Admin-only features requiring Blacklister or Permanent Delegate authority.

#### 2.1 Add to Blacklist
- **Screen:** Compliance Panel → Blacklist Tab
- **Endpoint:** `POST /api/v1/blacklist`
- **Rate Limit:** 10 requests / 60 seconds
- **Fields:**
  | Field | Type | Description |
  |---|---|---|
  | `address` | `string` (base58) | Wallet to blacklist (token account will be frozen) |
  | `reason` | `string` (max 100 chars) | Human-readable reason |
  | `blacklisterKeypair` | `string` (base58) | Authority keypair |
- **UI Notes:** Show a confirmation modal before submitting. Display success status message.

---

#### 2.2 Remove from Blacklist
- **Screen:** Compliance Panel → Blacklist Tab
- **Endpoint:** `DELETE /api/v1/blacklist/:address`
- **Query Params:**
  | Param | Type | Description |
  |---|---|---|
  | `blacklisterKeypair` | `string` | Authority keypair to thaw the account |
- **UI Notes:** Show inline "Remove" button in the blacklist table with a confirmation dialog.

---

#### 2.3 View Active Blacklist
- **Screen:** Compliance Panel → Blacklist Tab
- **Endpoint:** `GET /api/v1/blacklist`
- **Query Params:**
  | Param | Type | Description |
  |---|---|---|
  | `mint` *(optional)* | `string` | Filter entries by mint address |
- **Response:** Array of active blacklist entries.
- **UI Notes:** Paginated table showing address, reason, timestamp, and action buttons.

---

#### 2.4 Check Blacklist Status
- **Screen:** Compliance Panel → Check Address
- **Endpoint:** `GET /api/v1/blacklist/check/:address`
- **Query Params:**
  | Param | Type | Description |
  |---|---|---|
  | `mint` *(optional)* | `string` | Mint context for the check |
- **Response:** `{ blacklisted: true }`
- **UI Notes:** Simple search input. Display a colored badge (green = clean, red = blacklisted).

---

#### 2.5 Seize Tokens
- **Screen:** Compliance Panel → Seize Tab
- **Endpoint:** `POST /api/v1/seize`
- **Rate Limit:** 10 requests / 60 seconds
- **Fields:**
  | Field | Type | Description |
  |---|---|---|
  | `from` | `string` (base58) | Frozen token account to seize from |
  | `to` | `string` (base58) | Destination token account |
  | `amount` | `number` (base units) | Amount to seize |
  | `reason` | `string` (max 200 chars) | Legal / compliance justification |
  | `seizerKeypair` | `string` (base58) | Authority keypair (permanent delegate) |
- **UI Notes:** High-risk action — show a double-confirm modal with typed confirmation (e.g., "type SEIZE to confirm").

---

### 3. Audit Log

> Full history of all administrative on-chain actions.

#### 3.1 View Audit Log
- **Screen:** Audit Log Page
- **Endpoint:** `GET /api/v1/audit-log`
- **Query Params:**
  | Param | Default | Description |
  |---|---|---|
  | `mint` | — | Filter by mint address |
  | `action` | — | `MINT`, `BURN`, `SEIZE`, `FREEZE`, etc. |
  | `actor` | — | Filter by actor wallet address |
  | `page` | `1` | Pagination page number |
  | `pageSize` | `50` (max `200`) | Items per page |
- **UI Notes:**
  - Filterable table with columns: Action, Actor, Mint, Amount, TX Signature, Timestamp.
  - Filter controls for action type (dropdown), actor (text input), mint (text input).
  - Pagination controls.

---

#### 3.2 Export Audit Log (CSV)
- **Screen:** Audit Log Page
- **Endpoint:** `GET /api/v1/audit-log/export`
- **Query Params:**
  | Param | Description |
  |---|---|
  | `mint` *(optional)* | Filter by mint |
  | `action` *(optional)* | Filter by action type |
- **Response:** Downloads `audit-log.csv` directly.
- **UI Notes:** "Export CSV" button that triggers a file download. Pass active filter state as query params.

---

### 4. Webhooks

> Manage event-driven notification subscriptions for on-chain events.

#### 4.1 Register Webhook
- **Screen:** Webhooks Page → Create Form
- **Endpoint:** `POST /api/v1/webhooks`
- **Fields:**
  | Field | Type | Description |
  |---|---|---|
  | `url` | `string` (valid URL) | Endpoint to receive POST events |
  | `events` | `string[]` | e.g., `["Minted", "Burned", "*"]`. Use `"*"` for all. |
  | `secret` | `string` | HMAC-SHA256 signing secret |
  | `active` *(optional)* | `boolean` | Whether webhook is active (default: `true`) |
- **Response:** Created webhook object (status `201`).

---

#### 4.2 List All Webhooks
- **Screen:** Webhooks Page
- **Endpoint:** `GET /api/v1/webhooks`
- **Response:** Array of webhook objects.
- **UI Notes:** Table with URL, subscribed events, active status, and edit/delete actions.

---

#### 4.3 Get Webhook Details
- **Screen:** Webhooks Page → Detail View
- **Endpoint:** `GET /api/v1/webhooks/:id`
- **UI Notes:** Click-through from the list to a detail panel.

---

#### 4.4 Update Webhook
- **Screen:** Webhooks Page → Edit Form
- **Endpoint:** `PUT /api/v1/webhooks/:id`
- **Body:** Partial `CreateWebhookDto` (any subset of `url`, `events`, `secret`, `active`)
- **UI Notes:** Allows pausing a webhook by setting `active: false`. Toggle switch on the list row.

---

#### 4.5 Delete Webhook
- **Screen:** Webhooks Page
- **Endpoint:** `DELETE /api/v1/webhooks/:id`
- **UI Notes:** Delete button with confirmation modal.

---

#### 4.6 Webhook Event Payload Reference
The backend dispatches signed HTTP POST events to registered URLs when on-chain events occur.

**Signed Headers:**
| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-SSS-Event` | Event name, e.g., `Minted` |
| `X-SSS-Signature` | `sha256=<HMAC-SHA256 hash using webhook secret>` |

**Supported Events:** `Minted`, `Burned`, `Seized`, `PausedEvent`

**Example Payload:**
```json
{
  "event": "Minted",
  "data": {
    "mint": "TokenMintX...",
    "recipient": "UserAddrY...",
    "amount": "1000",
    "minter": "AdminAddrZ...",
    "newTotalSupply": "5000000",
    "timestamp": 1690000000
  },
  "txSignature": "4ABC...",
  "timestamp": 1690000005
}
```

---

### 5. Oracle (Separate Microservice)

> Switchboard price feed registry and quote simulation. Base URL: `http://localhost:3003`

#### 5.1 List Price Feeds
- **Screen:** Oracle Page → Feeds Tab
- **Endpoint:** `GET /feeds`
- **Response:** Array of `FeedEntry`:
  ```json
  {
    "symbol": "SOL/USD",
    "feedType": "...",
    "baseCurrency": "SOL",
    "quoteCurrency": "USD",
    "decimals": 9,
    "switchboardFeed": "FeedPubkey..."
  }
  ```
- **UI Notes:** Cards or table showing all registered price feeds.

---

#### 5.2 Register Price Feed
- **Screen:** Oracle Page → Register Feed Form
- **Endpoint:** `POST /feeds/register`
- **Fields:**
  | Field | Type |
  |---|---|
  | `symbol` | `string` (e.g., `SOL/USD`) |
  | `feedType` | `string` |
  | `baseCurrency` | `string` |
  | `quoteCurrency` | `string` |
  | `decimals` | `number` |
  | `switchboardFeed` | `string` (Switchboard feed pubkey) |
- **Response:** `{ success: true, txSig: "..." }` (status `201`)

---

#### 5.3 Get Oracle Config for a Mint
- **Screen:** Oracle Page → Config Tab
- **Endpoint:** `GET /config/:mint`
- **Path Param:** `mint` — Base58 token mint address
- **Response:** `OracleConfig` with thresholds and fee settings.
- **UI Notes:** Display fee info in basis points (bps) and convert where needed (100 bps = 1%).

---

#### 5.4 Initialize Oracle Config
- **Screen:** Oracle Page → Initialize Config Form
- **Endpoint:** `POST /config/initialize`
- **Fields:**
  | Field | Type | Description |
  |---|---|---|
  | `mint` | `string` | Mint address |
  | `feedSymbol` | `string` | e.g., `SOL/USD` |
  | `maxStalenessSecs` | `number` | Max age of price data in seconds |
  | `mintFeeBps` | `number` | Fee in basis points for minting |
  | `redeemFeeBps` | `number` | Fee in basis points for redeeming |
  | `maxConfidenceBps` | `number` | Max allowed price confidence spread |
  | `quoteValiditySecs` | `number` | How long a quote remains valid |
- **Response:** `{ success: true, txSig: "..." }` (status `201`)

---

#### 5.5 Simulate Mint Quote
- **Screen:** Oracle Page → Quote Simulator / Main Dashboard
- **Endpoint:** `GET /quotes/mint/simulate`
- **Description:** Pure math (no RPC), ideal for high-frequency UI price previews.
- **Query Params:**
  | Param | Description |
  |---|---|
  | `usdCents` | Input USD value in cents |
  | `priceScaled` | Scaled price from the feed |
  | `feedType` | Feed type identifier |
  | `mintFeeBps` | Fee in basis points |
  | `cpiMultiplier` *(optional)* | CPI multiplier |
- **Response:** `{ gross: number, fee: number, net: number }` (in token units)
- **UI Notes:** Live preview as the user types. Show breakdown: gross, fee deducted, net received.

---

#### 5.6 Simulate Redeem Quote
- **Screen:** Oracle Page → Quote Simulator / Main Dashboard
- **Endpoint:** `GET /quotes/redeem/simulate`
- **Description:** Pure math, no RPC. Converts token input to USD output.
- **Query Params:**
  | Param | Description |
  |---|---|
  | `tokenAmount` | Input token amount |
  | `priceScaled` | Scaled price from the feed |
  | `feedType` | Feed type identifier |
  | `redeemFeeBps` | Fee in basis points |
  | `cpiMultiplier` *(optional)* | CPI multiplier |
- **Response:** `{ gross: number, fee: number, net: number }` (in USD cents)
- **UI Notes:** Display results as: gross USD, fee deducted, net USD received.

---

### 6. Suggested Frontend Pages / Navigation

| Page | Features |
|---|---|
| **Dashboard** | Supply stats, Holders count, quick Mint/Burn forms |
| **Holders** | Largest holders leaderboard, count, `minAmount` filter |
| **Compliance** | Blacklist management, check address, seize tokens |
| **Audit Log** | Searchable/filterable log table + CSV export |
| **Webhooks** | Create, list, update, delete webhook subscriptions |
| **Oracle** | Price feeds list, oracle config viewer, mint/redeem quote simulator |

---

### 7. Common UX Considerations

- **Keypair Security:** Minter, burner, blacklister, and seizer keypairs are passed as base58-encoded secrets. The frontend must warn users to never expose these in public environments. Consider an admin-only, password-protected interface.
- **TX Links:** All responses that return a `txSignature` should link to `https://solscan.io/tx/<txSignature>` (or Solana Explorer).
- **Decimal Handling:** Always use the `decimals` field from the supply endpoint to convert raw `amount` values to human-readable form.
- **Rate Limiting:** Mutation endpoints (mint, burn, seize, blacklist) are limited to 10 req/min. Disable buttons after submission and show cooldown feedback.
- **Error Handling:** All endpoints may return standard HTTP error responses. Show user-friendly messages for `400` (bad input), `404` (not found), and `429` (rate limit exceeded).
