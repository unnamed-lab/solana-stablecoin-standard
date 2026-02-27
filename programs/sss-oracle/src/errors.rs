use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    // ── Feed Validity ───────────────────────────────────────────────────────
    #[msg("Price feed is stale — last update exceeds max_staleness threshold")]
    PriceTooStale,

    #[msg("Price feed returned a negative or zero value")]
    InvalidPrice,

    #[msg("Price confidence interval is too wide — market is too volatile to price safely")]
    ConfidenceTooWide,

    #[msg("Switchboard aggregator account data is invalid or unreadable")]
    FeedNotReady,

    // ── Quote ───────────────────────────────────────────────────────────────
    #[msg("Quote has expired — please request a new quote")]
    QuoteExpired,

    #[msg("Quote has already been used")]
    QuoteAlreadyUsed,

    #[msg("Token amount is below slippage threshold (min_output)")]
    SlippageExceeded,

    #[msg("Input amount must be greater than zero")]
    ZeroAmount,

    #[msg("Calculated output amount is zero after fee deduction")]
    ZeroOutput,

    // ── Feed Registry ────────────────────────────────────────────────────────
    #[msg("Feed with this symbol already exists in the registry")]
    FeedAlreadyRegistered,

    #[msg("Feed symbol not found in registry")]
    FeedNotFound,

    #[msg("Feed symbol exceeds maximum length of 12 characters")]
    SymbolTooLong,

    #[msg("Registry is at maximum capacity (64 feeds)")]
    RegistryFull,

    // ── Oracle Config ────────────────────────────────────────────────────────
    #[msg("Oracle is paused — mint and redeem operations are suspended")]
    OraclePaused,

    #[msg("Signer is not the oracle authority")]
    Unauthorized,

    #[msg("No pending authority transfer exists")]
    NoPendingTransfer,

    // ── CPI Index ───────────────────────────────────────────────────────────
    #[msg("CPI multiplier cannot be zero")]
    InvalidCpiMultiplier,

    #[msg("CPI multiplier update too soon — minimum interval not reached")]
    CpiUpdateTooSoon,

    // ── Math ────────────────────────────────────────────────────────────────
    #[msg("Arithmetic overflow in calculation")]
    MathOverflow,

    #[msg("Division by zero in price calculation")]
    DivisionByZero,

    // ── Feed account ────────────────────────────────────────────────────────
    #[msg("Switchboard feed account mismatch — wrong feed passed")]
    FeedMismatch,
}
