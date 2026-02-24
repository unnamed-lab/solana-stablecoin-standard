use anchor_lang::prelude::*;

#[account]
pub struct HookConfig {
    pub mint: Pubkey,               // Which mint this hook serves
    pub sss_core_program: Pubkey,   // Authorized reference for PDA derivation
    pub authority: Pubkey,          // hook_authority from sss-core config
    pub enabled: bool,              // Kill switch without unregistering
    pub transfer_count: u64,        // Total transfers processed
    pub blocked_count: u64,         // Total transfers blocked
    pub bump: u8,
}

impl HookConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // sss_core_program
        32 + // authority
        1 + // enabled
        8 + // transfer_count
        8 + // blocked_count
        1; // bump
}
