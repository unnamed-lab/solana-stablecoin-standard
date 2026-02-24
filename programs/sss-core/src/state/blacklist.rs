use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Blacklist {
    pub authority: Pubkey,           // The blacklister authority
    pub mint: Pubkey,                 // Associated mint
    pub count: u32,                    // Number of blacklisted addresses
    pub bump: u8,
    // Note: Actual blacklisted addresses are stored in a separate PDA
    // This is to avoid hitting account size limits
}

#[account]
#[derive(Default)]
pub struct BlacklistEntry {
    pub address: Pubkey,              // Blacklisted address
    pub reason: String,                // Reason for blacklisting (max 64 chars)
    pub blacklisted_at: i64,           // Timestamp
    pub blacklisted_by: Pubkey,        // Authority that added to blacklist
    pub metadata_uri: Option<String>,   // Optional link to additional metadata
    pub bump: u8,
}

impl BlacklistEntry {
    pub const MAX_REASON_LEN: usize = 64;
    pub const LEN: usize = 8 + // discriminator
        32 + // address
        4 + MAX_REASON_LEN + // reason
        8 + // blacklisted_at
        32 + // blacklisted_by
        4 + 128 + // metadata_uri (Option<String>)
        1; // bump
}

#[account]
#[derive(Default)]
pub struct BlacklistAudit {
    pub mint: Pubkey,
    pub total_adds: u64,
    pub total_removes: u64,
    pub last_update: i64,
}