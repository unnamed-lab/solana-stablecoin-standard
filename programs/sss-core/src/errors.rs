use anchor_lang::prelude::*;

#[error_code]
pub enum SSSError {
    // -- Access Control --
    #[msg("Signer is not the master authority")]
    NotMasterAuthority,
    #[msg("Signer is not authorized to mint")]
    NotMinter,
    #[msg("Signer is not authorized to burn")]
    NotBurner,
    #[msg("Signer is not the blacklister")]
    NotBlacklister,
    #[msg("Signer is not the seizer")]
    NotSeizer,
    #[msg("Signer is not the pauser")]
    NotPauser,

    // -- Feature Gating --
    #[msg("Compliance module not enabled. Initialize with enable_transfer_hook: true for SSS-2")]
    ComplianceNotEnabled,
    #[msg("Permanent delegate not enabled. Initialize with enable_permanent_delegate: true for SSS-2")]
    PermanentDelegateNotEnabled,
    #[msg("Transfer hook not registered on this stablecoin")]
    HookNotRegistered,

    // -- State Guards --
    #[msg("Stablecoin is paused")]
    Paused,
    #[msg("Stablecoin is not paused")]
    NotPaused,
    #[msg("Address is already blacklisted")]
    AlreadyBlacklisted,
    #[msg("Address is not blacklisted")]
    NotBlacklisted,
    #[msg("Cannot blacklist the zero address")]
    InvalidBlacklistTarget,
    #[msg("Cannot seize from a non-frozen account")]
    AccountNotFrozen,

    // -- Quota --
    #[msg("Mint amount exceeds per-period quota")]
    QuotaExceeded,
    #[msg("Minter is inactive")]
    MinterInactive,
    #[msg("Minter config already exists")]
    MinterAlreadyExists,

    // -- Authority Transfer --
    #[msg("No pending authority transfer")]
    NoPendingTransfer,
    #[msg("Signer is not the pending authority")]
    NotPendingAuthority,

    // -- Validation --
    #[msg("Name exceeds 32 characters")]
    NameTooLong,
    #[msg("Symbol exceeds 10 characters")]
    SymbolTooLong,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Overflow in supply calculation")]
    SupplyOverflow,
}