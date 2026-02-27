use anchor_lang::prelude::*;

// ═══════════════════════════════════════════════════════════════════════════
// FeedRegistry — Global singleton tracking all registered price feeds
// PDA seed: ["sss-feed-registry"]
// ═══════════════════════════════════════════════════════════════════════════

pub const MAX_FEEDS: usize = 64;

#[account]
pub struct FeedRegistry {
    /// Authority who can register new feeds
    pub authority:    Pubkey,
    /// Current number of registered feeds
    pub feed_count:   u8,
    /// All registered feeds
    pub feeds:        Vec<FeedEntry>,
    /// PDA bump
    pub bump:         u8,
}

impl FeedRegistry {
    pub const LEN: usize = 8   // discriminator
        + 32                    // authority
        + 1                     // feed_count
        + 4                     // vec len prefix
        + (MAX_FEEDS * FeedEntry::LEN)
        + 1                     // bump
        + 16;                   // slack

    pub fn find_feed(&self, symbol: &str) -> Option<&FeedEntry> {
        self.feeds.iter().find(|f| f.symbol == symbol && f.active)
    }
}

/// A single registered price feed entry
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FeedEntry {
    /// Feed symbol, max 12 chars: "BRLUSD", "EURUSD"
    pub symbol:           String,
    /// Switchboard aggregator account address
    pub switchboard_feed: Pubkey,
    /// How to interpret the price value
    pub feed_type:        FeedType,
    /// Base currency code, max 8 chars: "BRL", "EUR"
    pub base_currency:    String,
    /// Quote currency code, max 8 chars: "USD"
    pub quote_currency:   String,
    /// Price decimals from the feed
    pub decimals:         u8,
    /// Whether this feed is currently active
    pub active:           bool,
    /// When was this feed registered
    pub registered_at:    i64,
    /// Who registered it
    pub registered_by:    Pubkey,
}

impl FeedEntry {
    // symbol(4+12) + switchboard_feed(32) + feed_type(1+16+16+1=34 max)
    // + base_currency(4+8) + quote_currency(4+8) + decimals(1)
    // + active(1) + registered_at(8) + registered_by(32)
    pub const LEN: usize = 16 + 32 + 35 + 12 + 12 + 1 + 1 + 8 + 32;

    pub fn matches_feed_key(&self, key: &Pubkey) -> bool {
        self.switchboard_feed == *key
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FeedType — Price interpretation strategy
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum FeedType {
    /// Price = X USD per 1 unit of base currency
    /// EUR/USD = 1.08 → tokens = usd_in / price
    Direct,

    /// Price = X units of base currency per 1 USD
    /// BRL/USD = 5.72 → tokens = usd_in * price
    Inverse,

    /// Purchasing power token adjusted by stored CPI multiplier
    /// tokens = (usd_in / cpi_multiplier) scaled
    CpiIndexed,

    /// Custom scaling: multiply price by (numerator / denominator) then apply base_type
    Custom {
        numerator:   u64,
        denominator: u64,
        /// 0 = Direct after scaling, 1 = Inverse after scaling
        base_type:   u8,
    },
}

// ═══════════════════════════════════════════════════════════════════════════
// OracleConfig — Per-mint oracle configuration
// PDA seed: ["sss-oracle", mint.key()]
// ═══════════════════════════════════════════════════════════════════════════

#[account]
pub struct OracleConfig {
    /// Schema version for future migrations
    pub version:                 u8,
    /// The SSS token mint this oracle prices
    pub mint:                    Pubkey,
    /// Authority that can update config, update CPI, pause/unpause
    pub authority:               Pubkey,
    /// Two-step authority transfer target
    pub pending_authority:       Option<Pubkey>,
    /// Symbol of the registered feed to use (must exist in FeedRegistry)
    pub feed_symbol:             String,
    /// Human-readable description
    pub description:             String,
    /// Maximum seconds since last feed update before price is rejected
    pub max_staleness_secs:      i64,
    /// Mint fee in basis points (100 bps = 1%)
    pub mint_fee_bps:            u16,
    /// Redeem fee in basis points
    pub redeem_fee_bps:          u16,
    /// Max allowed confidence interval as % of price (in bps)
    pub max_confidence_bps:      u16,
    /// Quote validity window in seconds
    pub quote_validity_secs:     i64,
    /// CPI multiplier (fixed-point * 1_000_000). 1.083 = 1_083_000
    pub cpi_multiplier:          u64,
    /// Timestamp of last CPI update
    pub cpi_last_updated:        i64,
    /// Minimum seconds between CPI updates
    pub cpi_min_update_interval: i64,
    /// Source description for CPI data audit trail
    pub cpi_data_source:         String,
    /// Whether minting/redeeming is suspended
    pub paused:                  bool,
    /// Reason for current pause
    pub pause_reason:            String,
    /// Lifetime stats: total USD value minted through oracle
    pub total_minted_usd:        u64,
    /// Lifetime stats: total USD value redeemed through oracle
    pub total_redeemed_usd:      u64,
    /// Lifetime stats: total fees collected in token base units
    pub total_fees_collected:    u64,
    /// Creation timestamp
    pub created_at:              i64,
    /// Last modification timestamp
    pub last_updated_at:         i64,
    /// PDA bump
    pub bump:                    u8,
}

impl OracleConfig {
    pub const LEN: usize = 8   // discriminator
        + 1                     // version
        + 32                    // mint
        + 32                    // authority
        + 1 + 32                // pending_authority (Option<Pubkey>)
        + 4 + 12                // feed_symbol
        + 4 + 100               // description
        + 8                     // max_staleness_secs
        + 2                     // mint_fee_bps
        + 2                     // redeem_fee_bps
        + 2                     // max_confidence_bps
        + 8                     // quote_validity_secs
        + 8                     // cpi_multiplier
        + 8                     // cpi_last_updated
        + 8                     // cpi_min_update_interval
        + 4 + 50                // cpi_data_source
        + 1                     // paused
        + 4 + 100               // pause_reason
        + 8                     // total_minted_usd
        + 8                     // total_redeemed_usd
        + 8                     // total_fees_collected
        + 8                     // created_at
        + 8                     // last_updated_at
        + 1                     // bump
        + 64;                   // slack
}

// ═══════════════════════════════════════════════════════════════════════════
// PendingQuote — On-chain quote, consumed atomically by mint/redeem
// PDA seed: ["sss-quote", mint.key(), requester.key(), nonce_bytes]
// ═══════════════════════════════════════════════════════════════════════════

#[account]
pub struct PendingQuote {
    /// The SSS token mint
    pub mint:             Pubkey,
    /// Who requested the quote
    pub requester:        Pubkey,
    /// Mint or Redeem
    pub direction:        QuoteDirection,
    /// Feed symbol used
    pub feed_symbol:      String,
    /// Input amount (USD cents for mint, token units for redeem)
    pub input_amount:     u64,
    /// Output amount (token units for mint, USD cents for redeem)
    pub output_amount:    u64,
    /// Fee amount in output units
    pub fee_amount:       u64,
    /// Exact price snapshot (fixed-point * 1_000_000)
    pub price_snapshot:   u64,
    /// Unix timestamp after which this quote is invalid
    pub valid_until:      i64,
    /// Minimum acceptable output (slippage protection)
    pub min_output:       u64,
    /// Whether consumed
    pub used:             bool,
    /// Creation timestamp
    pub created_at:       i64,
    /// Caller nonce to prevent PDA collision
    pub nonce:            u64,
    /// PDA bump
    pub bump:             u8,
}

impl PendingQuote {
    pub const LEN: usize = 8   // discriminator
        + 32                    // mint
        + 32                    // requester
        + 1                     // direction
        + (4 + 12)              // feed_symbol
        + 8                     // input_amount
        + 8                     // output_amount
        + 8                     // fee_amount
        + 8                     // price_snapshot
        + 8                     // valid_until
        + 8                     // min_output
        + 1                     // used
        + 8                     // created_at
        + 8                     // nonce
        + 1                     // bump
        + 32;                   // slack

    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.valid_until
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum QuoteDirection {
    Mint,
    Redeem,
}

// ═══════════════════════════════════════════════════════════════════════════
// QuoteResult — Instruction return value (not an account)
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct QuoteResult {
    pub output_amount:  u64,
    pub fee_amount:     u64,
    pub price_used:     u64,
    pub valid_until:    i64,
    pub quote_account:  Pubkey,
}
