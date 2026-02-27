use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;
pub mod switchboard;

use instructions::*;
use state::*;

declare_id!("Brj7RU6jcmWXqCSfBa6o3v5bHS48Z6uDyKZUfG8ZbQoD");

#[program]
pub mod sss_oracle {
    use super::*;

    // ── Registry ────────────────────────────────────────────────────────────

    /// Initialize the global feed registry (one-time, admin only)
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        instructions::registry::initialize_registry(ctx)
    }

    /// Register a new price feed (e.g. BRLUSD, EURUSD, JPYUSD)
    pub fn register_feed(
        ctx: Context<RegisterFeed>,
        params: RegisterFeedParams,
    ) -> Result<()> {
        instructions::registry::register_feed(ctx, params)
    }

    // ── Oracle Config ────────────────────────────────────────────────────────

    /// Initialize an oracle config for a specific SSS token mint
    pub fn initialize_oracle(
        ctx: Context<InitializeOracle>,
        params: InitializeOracleParams,
    ) -> Result<()> {
        instructions::oracle_config::initialize_oracle(ctx, params)
    }

    /// Pause oracle mint/redeem operations (emergencies)
    pub fn pause_oracle(ctx: Context<PauseOracle>, reason: String) -> Result<()> {
        instructions::oracle_config::pause_oracle(ctx, reason)
    }

    /// Unpause oracle operations
    pub fn unpause_oracle(ctx: Context<PauseOracle>) -> Result<()> {
        instructions::oracle_config::unpause_oracle(ctx)
    }

    /// Propose a two-step authority transfer
    pub fn propose_authority_transfer(
        ctx: Context<ProposeAuthorityTransfer>,
        new_authority: Pubkey,
    ) -> Result<()> {
        instructions::oracle_config::propose_authority_transfer(ctx, new_authority)
    }

    /// Accept a pending authority transfer (must be signed by new authority)
    pub fn accept_authority_transfer(ctx: Context<AcceptAuthorityTransfer>) -> Result<()> {
        instructions::oracle_config::accept_authority_transfer(ctx)
    }

    // ── CPI ──────────────────────────────────────────────────────────────────

    /// Update CPI multiplier (monthly admin operation for CpiIndexed tokens)
    pub fn update_cpi_multiplier(
        ctx: Context<UpdateCpiMultiplier>,
        params: UpdateCpiParams,
    ) -> Result<()> {
        instructions::cpi_update::update_cpi_multiplier(ctx, params)
    }

    // ── Quotes ───────────────────────────────────────────────────────────────

    /// Get a mint quote — USD in → tokens out
    pub fn get_mint_quote(
        ctx: Context<GetMintQuote>,
        params: GetQuoteParams,
    ) -> Result<QuoteResult> {
        instructions::quotes::get_mint_quote(ctx, params)
    }

    /// Get a redeem quote — tokens in → USD out
    pub fn get_redeem_quote(
        ctx: Context<GetRedeemQuote>,
        params: GetQuoteParams,
    ) -> Result<QuoteResult> {
        instructions::quotes::get_redeem_quote(ctx, params)
    }

    // ── Atomic Execution ─────────────────────────────────────────────────────

    /// Execute a stored mint quote — validates + emits event atomically
    pub fn mint_with_oracle(ctx: Context<MintWithOracle>) -> Result<()> {
        instructions::execute::mint_with_oracle(ctx)
    }
}
