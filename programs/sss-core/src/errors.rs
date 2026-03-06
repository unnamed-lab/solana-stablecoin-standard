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
    #[msg(
        "Permanent delegate not enabled. Initialize with enable_permanent_delegate: true for SSS-2"
    )]
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

    // -- SSS-3: Allowlist --
    #[msg("Sender is not on the allowlist — SSS-3 requires explicit allowlist membership to send")]
    SenderNotAllowed,
    #[msg("Recipient is not on the allowlist — SSS-3 requires explicit allowlist membership to receive")]
    RecipientNotAllowed,
    #[msg("Allowlist entry has expired — request renewal from the issuer")]
    AllowlistEntryExpired,
    #[msg("Sender's allowlist entry does not grant SEND permission")]
    SendPermissionDenied,
    #[msg("Recipient's allowlist entry does not grant RECEIVE permission")]
    ReceivePermissionDenied,
    #[msg("Address is already on the allowlist")]
    AlreadyAllowlisted,
    #[msg("Address is not on the allowlist — cannot remove what doesn't exist")]
    NotOnAllowlist,

    // -- SSS-3: Confidential Transfer --
    #[msg("Confidential transfers are not enabled on this mint")]
    ConfidentialNotEnabled,
    #[msg("Confidential config already initialized for this mint")]
    ConfidentialAlreadyInitialized,
    #[msg("Auto-approve is disabled — authority must call approve_confidential_account first")]
    AutoApproveDisabled,
    #[msg("Confidential token account has not been approved for confidential transfers")]
    AccountNotApproved,
    #[msg("Auditor ElGamal pubkey is not 64 bytes — check key format")]
    InvalidAuditorKey,

    // -- SSS-3: Supply Cap --
    #[msg("Mint would exceed the configured max_supply cap")]
    MaxSupplyExceeded,
    #[msg("New max supply cannot be less than the current total supply")]
    MaxSupplyBelowCurrentSupply,

    // -- SSS-3: Mode --
    #[msg("Allowlist mode is not active on this mint — this instruction requires SSS-3")]
    AllowlistNotActive,
    #[msg("Cannot disable allowlist mode once active — security invariant")]
    CannotDisableAllowlist,
    #[msg("Cannot initialize SSS-3 on a non-SSS-2 mint — upgrade to SSS-2 first")]
    RequiresSss2Preset,

    // -- SSS-3: Snapshots --
    #[msg("A supply snapshot has already been taken for today — one per day maximum")]
    SnapshotAlreadyTaken,
}
