use anchor_lang::prelude::*;

#[account]
pub struct BlacklistEntry {
    pub mint: Pubkey,             // Which stablecoin
    pub address: Pubkey,          // The blocked address
    pub reason: String,           // Max 100 chars — "OFAC match", "Court order"
    pub added_by: Pubkey,         // Who added it (blacklister role)
    pub added_at: i64,
    pub removed: bool,            // Soft delete for audit trail
    pub removed_by: Option<Pubkey>,
    pub removed_at: Option<i64>,
    pub bump: u8,
}

impl BlacklistEntry {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // address
        4 + 100 + // reason
        32 + // added_by
        8 + // added_at
        1 + // removed
        33 + // removed_by
        9 + // removed_at
        1; // bump
}