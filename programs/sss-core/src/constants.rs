// Default Values
pub const MAX_NAME_LENGTH: usize = 32;
pub const MAX_SYMBOL_LENGTH: usize = 10;
pub const MAX_URI_LENGTH: usize = 200;
pub const MAX_REASON_LENGTH: usize = 100;

// System Accounts
pub const SYSTEM_PROGRAM_ID: anchor_lang::prelude::Pubkey = solana_program::system_program::ID;
pub const TOKEN_2022_PROGRAM_ID: anchor_lang::prelude::Pubkey = anchor_spl::token_2022::ID;
pub const ASSOCIATED_TOKEN_PROGRAM_ID: anchor_lang::prelude::Pubkey = anchor_spl::associated_token::ID;

// Time Constants (in seconds)
pub const ONE_DAY: i64 = 86400;
pub const ONE_WEEK: i64 = 604800;
pub const ONE_MONTH: i64 = 2592000;