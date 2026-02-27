use anchor_lang::prelude::*;

/// Emitted when a new oracle config is initialized for a mint
#[event]
pub struct OracleInitialized {
    pub mint:             Pubkey,
    pub authority:        Pubkey,
    pub feed_symbol:      String,
    pub mint_fee_bps:     u16,
    pub redeem_fee_bps:   u16,
    pub timestamp:        i64,
}

/// Emitted when a new price feed is registered globally
#[event]
pub struct FeedRegistered {
    pub symbol:           String,
    pub switchboard_feed: Pubkey,
    pub feed_type:        String,
    pub base_currency:    String,
    pub quote_currency:   String,
    pub registered_by:    Pubkey,
    pub timestamp:        i64,
}

/// Emitted every time a quote is requested
#[event]
pub struct QuoteGenerated {
    pub quote_id:         Pubkey,
    pub mint:             Pubkey,
    pub feed_symbol:      String,
    pub direction:        String,
    pub input_amount:     u64,
    pub output_amount:    u64,
    pub fee_amount:       u64,
    pub price_used:       u64,
    pub valid_until:      i64,
    pub timestamp:        i64,
}

/// Emitted on a successful oracle-priced mint execution
#[event]
pub struct OracleMint {
    pub mint:             Pubkey,
    pub recipient:        Pubkey,
    pub usd_amount:       u64,
    pub token_amount:     u64,
    pub fee_amount:       u64,
    pub price_used:       u64,
    pub feed_symbol:      String,
    pub timestamp:        i64,
}

/// Emitted on a successful oracle-priced redemption
#[event]
pub struct OracleRedeem {
    pub mint:             Pubkey,
    pub redeemer:         Pubkey,
    pub token_amount:     u64,
    pub usd_amount:       u64,
    pub fee_amount:       u64,
    pub price_used:       u64,
    pub feed_symbol:      String,
    pub timestamp:        i64,
}

/// Emitted when CPI multiplier is updated
#[event]
pub struct CpiMultiplierUpdated {
    pub mint:             Pubkey,
    pub old_multiplier:   u64,
    pub new_multiplier:   u64,
    pub reference_month:  String,
    pub data_source:      String,
    pub updated_by:       Pubkey,
    pub timestamp:        i64,
}

/// Emitted when oracle is paused/unpaused
#[event]
pub struct OraclePaused {
    pub mint:             Pubkey,
    pub paused:           bool,
    pub reason:           String,
    pub by:               Pubkey,
    pub timestamp:        i64,
}

/// Emitted when oracle authority transfer is proposed
#[event]
pub struct AuthorityTransferProposed {
    pub mint:             Pubkey,
    pub current:          Pubkey,
    pub proposed:         Pubkey,
    pub timestamp:        i64,
}

/// Emitted when oracle authority transfer is accepted
#[event]
pub struct AuthorityTransferred {
    pub mint:             Pubkey,
    pub from:             Pubkey,
    pub to:               Pubkey,
    pub timestamp:        i64,
}
