//! Prelude: Common imports for the SSS Core program

// Anchor Prelude
pub use anchor_lang::prelude::*;
pub use anchor_spl::{
    token_interface::{Mint, TokenAccount},
    token_2022::{self, Token2022},
    associated_token::AssociatedToken,
};

// Solana Program
pub use anchor_lang::solana_program::{
    program_pack::Pack,
    system_instruction,
};

// Local Modules
pub use crate::constants::*;
pub use crate::errors::SSSError;
pub use crate::state::*;

// Common account types for instructions
pub type ConfigAccount<'info> = Account<'info, StablecoinConfig>;
pub type MintAccount<'info> = Account<'info, Mint>;
pub type TokenAccountInfo<'info> = Account<'info, TokenAccount>;
pub type BlacklistEntryAccount<'info> = Account<'info, BlacklistEntry>;
pub type MinterConfigAccount<'info> = Account<'info, MinterConfig>;
pub type SeizureRecordAccount<'info> = Account<'info, SeizureRecord>;