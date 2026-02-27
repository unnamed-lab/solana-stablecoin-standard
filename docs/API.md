# Solana Stablecoin Standard API Documentation

The SSS API provides a comprehensive suite of RESTful endpoints to manage token operations, compliance constraints, audit logs, and webhooks. The base path for all endpoints is `/api/v1`.

## Token Endpoints

### `POST /api/v1/mint`
Mint new stablecoins to a specified recipient.
- **Body:** `MintDto` (requires amount and recipient)
- **Response `200`:** `{"success": true, "txSignature": "string"}`

### `POST /api/v1/burn`
Burn stablecoins from an account.
- **Body:** `BurnDto` (requires amount)
- **Response `200`:** `{"success": true, "txSignature": "string"}`

### `GET /api/v1/supply`
Retrieve current supply metrics.
- **Response `200`:** `{"totalSupply": "string", "maxSupply": "string" | null, "burnSupply": "string", "decimals": number}`

### `GET /api/v1/holders/count`
Retrieve historical token holders count.
- **Response `200`:** `{"count": number}`

### `GET /api/v1/holders/largest`
Retrieve a descending list of the largest token holders.
- **Query `minAmount` (optional):** Filter accounts with less than this amount.
- **Response `200`:** Array of `{"address": "string", "amount": "string", "decimals": number, "uiAmount": number, "uiAmountString": "string"}`

---

## Compliance Endpoints
*These endpoints require specific administrative authority (e.g., Blacklister, Permanent Delegate).*

### `POST /api/v1/blacklist`
Add a wallet to the token blacklist, proactively freezing their token account.
- **Body:** `BlacklistDto` (requires address, reason)
- **Response `200`:** Status message confirming the addition.

### `DELETE /api/v1/blacklist/:address`
Remove a wallet from the blacklist and thaw their token account.
- **Query `blacklisterKeypair`:** The necessary keypair/auth to perform the thaw.
- **Response `200`:** Status message confirming the removal.

### `GET /api/v1/blacklist`
List all active blacklisted addresses.
- **Query `mint` (optional):** Filter by specific mint.
- **Response `200`:** Array of active blacklist entries.

### `GET /api/v1/blacklist/check/:address`
Check whether a given wallet address is currently blacklisted.
- **Query `mint` (optional):** Provide the mint context.
- **Response `200`:** `{"blacklisted": boolean}`

### `POST /api/v1/seize`
Seize tokens from a frozen (blacklisted) account and send them to a recovery account.
- **Body:** `SeizeDto` (requires source address, destination address, amount, reason)
- **Response `200`:** Tokens seized successfully.

---

## Audit Endpoints

### `GET /api/v1/audit-log`
Retrieve a paginated, searchable history of all administrative token actions.
- **Query Parameters:** `mint`, `action` (e.g., MINT, BURN, SEIZE, FREEZE), `actor`, `page`, `pageSize`.
- **Response `200`:** Paginated audit log objects.

### `GET /api/v1/audit-log/export`
Export the audit log history as a downloadable CSV.
- **Query Parameters:** `mint`, `action`.
- **Response `200`:** Returns a raw generic CSV file attachment.

---

## Webhook Endpoints
*Manage destinations where the Indexer will dispatch immediate event notifications.*

### `POST /api/v1/webhooks`
Register a new webhook subscription.
- **Body:** `CreateWebhookDto` (requires URL, secret, subscribed events array)
- **Response `201`:** Webhook Details.

### `GET /api/v1/webhooks`
List all active webhooks for the application.
- **Response `200`:** Array of webhooks.

### `GET /api/v1/webhooks/:id`
Fetch a specific webhook's details constraint.
- **Response `200`:** Webhook object.

### `PUT /api/v1/webhooks/:id`
Update an existing webhook configuration (e.g., update subscribed events or pause it).
- **Body:** Partial `CreateWebhookDto`
- **Response `200`:** Updated Webhook object.

### `DELETE /api/v1/webhooks/:id`
Remove a webhook subscription entirely.
- **Response `200`:** Deletion confirmation.

---

## Webhook Event Payload Protocol
When the **Indexer** detects a relevant on-chain event (such as `Minted`, `Burned`, `Seized`, `PausedEvent`), a signed HTTP POST request is triggered to the registered webhook URL.

**Headers:**
- `Content-Type`: `application/json`
- `X-SSS-Event`: Name of the event (e.g., `Minted`)
- `X-SSS-Signature`: Calculated HMAC-SHA256 hash using the configured webhook secret. `sha256=<HASH>`

**Payload Example:**
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

## Oracle Endpoints
*Exposed by the standalone `oracle` microservice (default port 3003). The base path for these endpoints is `/` (no version prefix).*

### `GET /feeds`
List all registered active Switchboard price feeds.
- **Response `200`:** Array of `FeedEntry` objects containing `symbol`, `feedType`, `baseCurrency`, `quoteCurrency`, `decimals`, and `switchboardFeed`.

### `POST /feeds/register`
Register a new Switchboard feed to the Oracle program's global registry.
- **Body:** `RegisterFeedDto` (requires `symbol`, `feedType`, `baseCurrency`, `quoteCurrency`, `decimals`, `switchboardFeed`)
- **Response `201`:** `{"success": true, "txSig": "string"}`

### `GET /config/:mint`
Fetch the stored Oracle configuration for a specific SSS stablecoin mint.
- **Path Parameter `mint`:** Base58 string of the mint address.
- **Response `200`:** `OracleConfig` details including thresholds and fees.

### `POST /config/initialize`
Initialize a new oracle configuration for a specific mint.
- **Body:** `InitializeConfigDto` (requires `mint`, `feedSymbol`, `maxStalenessSecs`, `mintFeeBps`, `redeemFeeBps`, `maxConfidenceBps`, `quoteValiditySecs`)
- **Response `201`:** `{"success": true, "txSig": "string"}`

### `GET /quotes/mint/simulate`
Simulate a mint quote (USD input → Token output). This executes purely in mathematics and makes no RPC calls, making it ideal for high-frequency UI previews.
- **Query Parameters:** `usdCents`, `priceScaled`, `feedType`, `mintFeeBps`, `cpiMultiplier` (optional).
- **Response `200`:** `{"gross": number, "fee": number, "net": number}` (Results in token units)

### `GET /quotes/redeem/simulate`
Simulate a redeem quote (Token input → USD output).
- **Query Parameters:** `tokenAmount`, `priceScaled`, `feedType`, `redeemFeeBps`, `cpiMultiplier` (optional).
- **Response `200`:** `{"gross": number, "fee": number, "net": number}` (Results in USD cents)

