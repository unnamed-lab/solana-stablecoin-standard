//! Prelude: Common imports for the SSS Core program

// Anchor Prelude
pub use anchor_lang::prelude::*;
pub use anchor_spl::{
    token_2022::{self, Token2022, Mint, TokenAccount},
    associated_token::AssociatedToken,
};

// Solana Program
pub use solana_program::{
    program_pack::Pack,
    system_instruction,
    sysvar::Sysvar,
};

// Local Modules
pub use crate::constants::*;
pub use crate::errors::StablecoinError;
pub use crate::state::*;
pub use crate::utils::*;
pub use crate::compliance::*;

// Re-export commonly used types
pub type Result<T> = std::result::Result<T, error::Error>;

// Common account types for instructions
pub type ConfigAccount<'info> = Account<'info, StablecoinConfig>;
pub type MintAccount<'info> = Account<'info, Mint>;
pub type TokenAccountInfo<'info> = Account<'info, TokenAccount>;
pub type BlacklistAccount<'info> = Account<'info, Blacklist>;
pub type BlacklistEntryAccount<'info> = Account<'info, BlacklistEntry>;

// PDA Seeds as constants for easy access
pub const PDA_SEEDS: &[&[u8]] = &[
    CONFIG_SEED,
    BLACKLIST_SEED,
    PERMANENT_DELEGATE_SEED,
    TRANSFER_HOOK_SEED,
];

// Feature flag helper
pub trait FeatureGated {
    fn require_feature(&self, flag: bool, error: StablecoinError) -> Result<()>;
}

impl FeatureGated for StablecoinConfig {
    fn require_feature(&self, enabled: bool, error: StablecoinError) -> Result<()> {
        if !enabled {
            return Err(error.into());
        }
        Ok(())
    }
}

// Role validation macro
#[macro_export]
macro_rules! require_role {
    ($config:expr, $authority:expr, $role:ident) => {
        require!(
            $config.$role == Some($authority) || $config.master_authority == $authority,
            StablecoinError::$role
        );
    };
}

// Feature validation macro
#[macro_export]
macro_rules! require_feature {
    ($config:expr, $feature:ident) => {
        require!(
            $config.$feature,
            StablecoinError::concat_idents!(FeatureNotEnabled_, $feature)
        );
    };
}

// Common constants for testing
#[cfg(test)]
pub mod test_constants {
    use super::*;
    
    pub fn test_mint() -> Pubkey {
        Pubkey::new_unique()
    }
    
    pub fn test_authority() -> Pubkey {
        Pubkey::new_unique()
    }
    
    pub fn test_config() -> StablecoinConfig {
        StablecoinConfig {
            version: 1,
            name: "Test Stablecoin".to_string(),
            symbol: "TUSD".to_string(),
            uri: "https://example.com".to_string(),
            decimals: 6,
            preset: StablecoinPreset::SSS2,
            enable_permanent_delegate: true,
            enable_transfer_hook: true,
            enable_blacklist: true,
            default_account_frozen: false,
            paused: false,
            master_authority: test_authority(),
            minter: Some(test_authority()),
            burner: Some(test_authority()),
            pauser: Some(test_authority()),
            blacklister: Some(test_authority()),
            seizer: Some(test_authority()),
            total_minted: 0,
            total_burned: 0,
            supply_cap: None,
            role_delay_seconds: None,
            mint_bump: 255,
            config_bump: 255,
            delegate_bump: Some(255),
            hook_bump: Some(255),
        }
    }
}