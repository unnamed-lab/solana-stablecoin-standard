use anchor_lang::prelude::*;

#[error_code]
pub enum StablecoinError {
    // Initialization Errors (0-99)
    #[msg("Already initialized")]
    AlreadyInitialized,
    #[msg("Not initialized")]
    NotInitialized,
    #[msg("Invalid preset")]
    InvalidPreset,
    #[msg("Invalid name length")]
    InvalidNameLength,
    #[msg("Invalid symbol length")]
    InvalidSymbolLength,
    #[msg("Invalid decimals")]
    InvalidDecimals,

    // Authorization Errors (100-199)
    #[msg("Unauthorized: Master authority required")]
    UnauthorizedMaster,
    #[msg("Unauthorized: Minter role required")]
    UnauthorizedMinter,
    #[msg("Unauthorized: Burner role required")]
    UnauthorizedBurner,
    #[msg("Unauthorized: Pauser role required")]
    UnauthorizedPauser,
    #[msg("Unauthorized: Blacklister role required")]
    UnauthorizedBlacklister,
    #[msg("Unauthorized: Seizer role required")]
    UnauthorizedSeizer,

    // Feature Errors (200-299)
    #[msg("Feature not enabled: Permanent delegate")]
    PermanentDelegateNotEnabled,
    #[msg("Feature not enabled: Transfer hook")]
    TransferHookNotEnabled,
    #[msg("Feature not enabled: Blacklist")]
    BlacklistNotEnabled,
    #[msg("Feature not enabled: Confidential transfers")]
    ConfidentialTransfersNotEnabled,

    // Operation Errors (300-399)
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid amount: must be greater than 0")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Mint quota exceeded")]
    MintQuotaExceeded,
    #[msg("Burn quota exceeded")]
    BurnQuotaExceeded,
    #[msg("Supply cap exceeded")]
    SupplyCapExceeded,

    // Account State Errors (400-499)
    #[msg("Account is frozen")]
    AccountFrozen,
    #[msg("Account is not frozen")]
    AccountNotFrozen,
    #[msg("Account is blacklisted")]
    AccountBlacklisted,
    #[msg("Account is not blacklisted")]
    AccountNotBlacklisted,
    #[msg("Default account frozen: cannot create account")]
    DefaultAccountFrozen,
    #[msg("Token operations are paused")]
    Paused,
    #[msg("Token operations are not paused")]
    NotPaused,

    // Blacklist Errors (500-599)
    #[msg("Blacklist is full")]
    BlacklistFull,
    #[msg("Address already blacklisted")]
    AlreadyBlacklisted,
    #[msg("Address not blacklisted")]
    NotBlacklisted,
    #[msg("Cannot blacklist mint authority")]
    CannotBlacklistMintAuthority,
    #[msg("Cannot blacklist self")]
    CannotBlacklistSelf,

    // Seize Errors (600-699)
    #[msg("Cannot seize from non-blacklisted account")]
    SeizeRequiresBlacklist,
    #[msg("Cannot seize: account must be frozen first")]
    SeizeRequiresFrozen,
    #[msg("Invalid treasury account")]
    InvalidTreasury,

    // Transfer Hook Errors (700-799)
    #[msg("Transfer hook: sender blacklisted")]
    TransferHookSenderBlacklisted,
    #[msg("Transfer hook: recipient blacklisted")]
    TransferHookRecipientBlacklisted,
    #[msg("Transfer hook: paused")]
    TransferHookPaused,

    // Configuration Errors (800-899)
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Invalid configuration")]
    InvalidConfiguration,

    // Quota Errors (900-999)
    #[msg("Minter quota exceeded")]
    MinterQuotaExceeded,
    #[msg("Burner quota exceeded")]
    BurnerQuotaExceeded,
    #[msg("Daily mint limit exceeded")]
    DailyMintLimitExceeded,
    #[msg("Daily burn limit exceeded")]
    DailyBurnLimitExceeded,

    // PDA Errors (1000-1099)
    #[msg("PDA derivation failed")]
    PDADerivationFailed,
    #[msg("Invalid bump")]
    InvalidBump,

    // Timelock Errors (1100-1199)
    #[msg("Timelock not expired")]
    TimelockNotExpired,
    #[msg("Invalid timelock delay")]
    InvalidTimelockDelay,

    // Custom Preset Errors (1200-1299)
    #[msg("Custom preset configuration invalid")]
    InvalidCustomConfig,
    #[msg("Extension conflict detected")]
    ExtensionConflict,
}