use anchor_lang::prelude::*;

#[account]
pub struct MinterConfig {
    pub mint: Pubkey,             // Which stablecoin this belongs to
    pub minter: Pubkey,           // The minter's public key
    pub is_active: bool,
    
    // -- Quota --
    pub quota_per_period: u64,    // Max mintable per period (0 = unlimited)
    pub period_seconds: i64,      // Period length (e.g., 86400 for daily)
    pub minted_this_period: u64,  // Resets when period expires
    pub period_start: i64,        // Unix timestamp of current period start
    
    // -- Lifetime stats --
    pub total_minted: u64,
    pub mint_count: u64,
    
    pub created_at: i64,
    pub bump: u8,
}

impl MinterConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // minter
        1 +  // is_active
        8 +  // quota_per_period
        8 +  // period_seconds
        8 +  // minted_this_period
        8 +  // period_start
        8 +  // total_minted
        8 +  // mint_count
        8 +  // created_at
        1;   // bump
}