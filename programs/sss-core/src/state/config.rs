use anchor_lang::prelude::*;

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum StablecoinPreset {
    SSS1 = 0,
    SSS2 = 1,
    Custom = 2,
}

#[account]
#[derive(Default)]
pub struct StablecoinConfig {
    pub version: u8,                // For future upgrades
    pub name: String,                // Token name
    pub symbol: String,              // Token symbol
    pub uri: String,                 // Metadata URI
    pub decimals: u8,                // Token decimals
    pub preset: StablecoinPreset,    // Enum: SSS1, SSS2, Custom
    
    // Feature flags
    pub enable_permanent_delegate: bool,
    pub enable_transfer_hook: bool,
    pub enable_blacklist: bool,
    pub default_account_frozen: bool,
    pub paused: bool,
    
    // Roles (core authorities)
    pub master_authority: Pubkey,
    pub minter: Option<Pubkey>,
    pub burner: Option<Pubkey>,
    pub pauser: Option<Pubkey>,
    pub blacklister: Option<Pubkey>,  // SSS-2 only
    pub seizer: Option<Pubkey>,       // SSS-2 only
    
    // Mint tracking
    pub total_minted: u64,
    pub total_burned: u64,
    pub supply_cap: Option<u64>,      // Optional max supply
    
    // Timelock configurations
    pub role_delay_seconds: Option<u64>, // Delay for role changes
    
    // PDAs
    pub mint_bump: u8,
    pub config_bump: u8,
    pub delegate_bump: Option<u8>,    // Permanent delegate bump if enabled
    pub hook_bump: Option<u8>,         // Transfer hook bump if enabled
}

impl StablecoinConfig {
    pub const LEN: usize = 8 + // discriminator
        1 + // version
        4 + 32 + // name (String)
        4 + 10 + // symbol (String)
        4 + 128 + // uri (String)
        1 + // decimals
        1 + // preset
        1 + // enable_permanent_delegate
        1 + // enable_transfer_hook
        1 + // enable_blacklist
        1 + // default_account_frozen
        1 + // paused
        32 + // master_authority
        33 + // minter (Option)
        33 + // burner (Option)
        33 + // pauser (Option)
        33 + // blacklister (Option)
        33 + // seizer (Option)
        8 + // total_minted
        8 + // total_burned
        9 + // supply_cap (Option)
        9 + // role_delay_seconds (Option)
        1 + // mint_bump
        1 + // config_bump
        2 + // delegate_bump (Option<u8>)
        2; // hook_bump (Option<u8>)

    pub fn is_sss2_compliant(&self) -> bool {
        self.preset == StablecoinPreset::SSS2 ||
        (self.enable_permanent_delegate && self.enable_transfer_hook && self.enable_blacklist)
    }

    pub fn is_feature_enabled(&self, feature_flag: u8) -> bool {
        match feature_flag {
            0 => self.enable_permanent_delegate,
            1 => self.enable_transfer_hook,
            2 => self.enable_blacklist,
            _ => false,
        }
    }

    pub fn current_supply(&self) -> u64 {
        self.total_minted.saturating_sub(self.total_burned)
    }

    pub fn can_mint(&self, amount: u64) -> bool {
        if let Some(cap) = self.supply_cap {
            self.current_supply().saturating_add(amount) <= cap
        } else {
            true
        }
    }
}