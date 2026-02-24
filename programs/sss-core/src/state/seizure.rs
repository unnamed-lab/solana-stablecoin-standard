use anchor_lang::prelude::*;

#[account]
pub struct SeizureRecord {
    pub mint: Pubkey,
    pub seized_from: Pubkey,
    pub seized_to: Pubkey,        // Typically treasury
    pub amount: u64,
    pub reason: String,           // Max 200 chars
    pub executed_by: Pubkey,      // Seizer role
    pub executed_at: i64,
    pub transaction_signature: [u8; 64], // Self-referential audit
    pub bump: u8,
}

impl SeizureRecord {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // seized_from
        32 + // seized_to
        8 + // amount
        4 + 200 + // reason
        32 + // executed_by
        8 + // executed_at
        64 + // transaction_signature
        1; // bump
}
