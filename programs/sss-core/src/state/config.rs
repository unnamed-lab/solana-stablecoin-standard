use anchor_lang::prelude::*;

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum StablecoinPreset {
    SSS1 = 0,
    SSS2 = 1,
    Custom = 2,
}

#[account]
pub struct StablecoinConfig {
    // -- Identity --
    pub version: u8,                    // Schema version for future migrations
    pub preset: StablecoinPreset,       // SSS1, SSS2, or Custom
    pub mint: Pubkey,                   // The Token-2022 mint address
    
    // -- Metadata --
    pub name: String,                   // Max 32 chars
    pub symbol: String,                 // Max 10 chars
    pub uri: String,                    // Max 200 chars — points to off-chain JSON
    pub decimals: u8,                   // Typically 6 (USDC standard)
    
    // -- Feature Flags (immutable after init) --
    pub enable_permanent_delegate: bool,
    pub enable_transfer_hook: bool,
    pub default_account_frozen: bool,   // New accounts start frozen (SSS-2)
    
    // -- Roles --
    pub master_authority: Pubkey,       // God key — can reassign all roles
    pub pending_master_authority: Option<Pubkey>, // 2-step transfer pattern
    pub pauser: Pubkey,
    pub minter_authority: Pubkey,       // Can add/remove individual minters
    pub burner: Pubkey,
    pub blacklister: Option<Pubkey>,    // SSS-2 only
    pub seizer: Option<Pubkey>,         // SSS-2 only
    pub hook_authority: Option<Pubkey>, // Can update hook program (SSS-2)
    
    // -- State --
    pub paused: bool,
    pub total_supply: u64,              // Tracked manually for fast reads
    pub total_minted_all_time: u64,     // Audit metric
    pub total_burned_all_time: u64,     // Audit metric
    pub blacklist_count: u32,           // SSS-2: number of blacklisted addresses
    
    // -- Transfer Hook --
    pub hook_program_id: Option<Pubkey>, // SSS-2: registered hook program
    
    // -- Timestamps --
    pub created_at: i64,
    pub last_updated_at: i64,
    
    // -- PDA --
    pub bump: u8,
}

impl StablecoinConfig {
    pub const LEN: usize = 8 + // discriminator
        1 + // version
        1 + // preset
        32 + // mint
        4 + 32 + // name
        4 + 10 + // symbol
        4 + 200 + // uri
        1 + // decimals
        1 + // enable_permanent_delegate
        1 + // enable_transfer_hook
        1 + // default_account_frozen
        32 + // master_authority
        33 + // pending_master_authority
        32 + // pauser
        32 + // minter_authority
        32 + // burner
        33 + // blacklister
        33 + // seizer
        33 + // hook_authority
        1 + // paused
        8 + // total_supply
        8 + // total_minted_all_time
        8 + // total_burned_all_time
        4 + // blacklist_count
        33 + // hook_program_id
        8 + // created_at
        8 + // last_updated_at
        1 + // bump
        32; // Slack space
}