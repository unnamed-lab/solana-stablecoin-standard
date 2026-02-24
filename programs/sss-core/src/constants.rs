use solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;

// PDA Seeds
pub const CONFIG_SEED: &[u8] = b"stablecoin_config";
pub const MINT_SEED: &[u8] = b"stablecoin_mint";
pub const BLACKLIST_SEED: &[u8] = b"blacklist";
pub const PERMANENT_DELEGATE_SEED: &[u8] = b"permanent_delegate";
pub const TRANSFER_HOOK_SEED: &[u8] = b"transfer_hook";

// Default Values
pub const DEFAULT_DECIMALS: u8 = 6;
pub const MAX_NAME_LENGTH: usize = 32;
pub const MAX_SYMBOL_LENGTH: usize = 10;
pub const MAX_URI_LENGTH: usize = 128;
pub const MAX_BLACKLIST_SIZE: usize = 1000; // Maximum addresses in blacklist

// System Accounts
pub const SYSTEM_PROGRAM_ID: Pubkey = solana_program::system_program::ID;
pub const TOKEN_2022_PROGRAM_ID: Pubkey = anchor_spl::token_2022::ID;
pub const ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey = anchor_spl::associated_token::ID;

// Role Constants
pub const MASTER_AUTHORITY_ROLE: &str = "master";
pub const MINTER_ROLE: &str = "minter";
pub const BURNER_ROLE: &str = "burner";
pub const PAUSER_ROLE: &str = "pauser";
pub const BLACKLISTER_ROLE: &str = "blacklister";
pub const SEIZER_ROLE: &str = "seizer";

// Time Constants (in seconds)
pub const ONE_DAY: i64 = 86400;
pub const ONE_WEEK: i64 = 604800;
pub const ONE_MONTH: i64 = 2592000;

// Quota Limits
pub const MAX_MINT_QUOTA: u64 = 1_000_000_000_000_000; // 1B tokens with 6 decimals
pub const MAX_BURN_QUOTA: u64 = 1_000_000_000_000_000;

// Feature Flags Bitmask (for efficient storage)
pub const FEATURE_PERMANENT_DELEGATE: u8 = 1 << 0;
pub const FEATURE_TRANSFER_HOOK: u8 = 1 << 1;
pub const FEATURE_BLACKLIST: u8 = 1 << 2;
pub const FEATURE_FREEZE: u8 = 1 << 3;
pub const FEATURE_PAUSE: u8 = 1 << 4;
pub const FEATURE_CONFIDENTIAL_TRANSFERS: u8 = 1 << 5; // For SSS-3

// Preset Feature Combinations
pub const SSS1_FEATURES: u8 = FEATURE_FREEZE | FEATURE_PAUSE;
pub const SSS2_FEATURES: u8 = SSS1_FEATURES | FEATURE_PERMANENT_DELEGATE | FEATURE_TRANSFER_HOOK | FEATURE_BLACKLIST;

// Account Sizes
pub const STABLECOIN_CONFIG_SIZE: usize = 8 + // discriminator
    1 + // version
    4 + MAX_NAME_LENGTH + // String name
    4 + MAX_SYMBOL_LENGTH + // String symbol
    4 + MAX_URI_LENGTH + // String uri
    1 + // decimals
    1 + // preset (enum)
    1 + // enable_permanent_delegate
    1 + // enable_transfer_hook
    1 + // default_account_frozen
    1 + // paused
    32 + // master_authority
    33 + // minter (Option<Pubkey>)
    33 + // burner (Option<Pubkey>)
    33 + // pauser (Option<Pubkey>)
    33 + // blacklister (Option<Pubkey>)
    33 + // seizer (Option<Pubkey>)
    8 + // total_minted
    8 + // total_burned
    1; // bump

// Error Messages
pub const ERR_MSG_UNAUTHORIZED: &str = "Unauthorized access";
pub const ERR_MSG_FEATURE_DISABLED: &str = "Feature is not enabled for this stablecoin";
pub const ERR_MSG_ALREADY_INITIALIZED: &str = "Already initialized";
pub const ERR_MSG_NOT_INITIALIZED: &str = "Not initialized";
pub const ERR_MSG_INVALID_AMOUNT: &str = "Invalid amount";
pub const ERR_MSG_INSUFFICIENT_BALANCE: &str = "Insufficient balance";
pub const ERR_MSG_ACCOUNT_FROZEN: &str = "Account is frozen";
pub const ERR_MSG_ACCOUNT_BLACKLISTED: &str = "Account is blacklisted";
pub const ERR_MSG_PAUSED: &str = "Token operations are paused";