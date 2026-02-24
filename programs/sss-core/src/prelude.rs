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
pub use crate::errors::SSSError;
pub use crate::state::*;

// Re-export commonly used types
pub type Result<T> = std::result::Result<T, error::Error>;

// Common account types for instructions
pub type ConfigAccount<'info> = Account<'info, StablecoinConfig>;
pub type MintAccount<'info> = Account<'info, Mint>;
pub type TokenAccountInfo<'info> = Account<'info, TokenAccount>;
pub type BlacklistEntryAccount<'info> = Account<'info, BlacklistEntry>;
pub type MinterConfigAccount<'info> = Account<'info, MinterConfig>;
pub type SeizureRecordAccount<'info> = Account<'info, SeizureRecord>;