use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::OracleError;
use crate::events::*;

// ═══════════════════════════════════════════════════════════════════════════
// mint_with_oracle — Atomic quote consumption + stats update
//
// Validates the stored PendingQuote, checks expiry and slippage,
// marks it as used, and updates oracle lifetime stats.
//
// NOTE: The actual CPI to sss-core::mint is stubbed — wiring it
// requires importing sss-core's CPI feature as a dependency.
// The event emission and stats tracking are fully functional.
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct MintWithOracle<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump  = oracle_config.bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        mut,
        seeds = [
            b"sss-quote",
            oracle_config.mint.as_ref(),
            requester.key().as_ref(),
            &quote.nonce.to_le_bytes(),
        ],
        bump  = quote.bump,
        constraint = quote.requester == requester.key() @ OracleError::Unauthorized,
        constraint = !quote.used @ OracleError::QuoteAlreadyUsed,
        constraint = quote.direction == QuoteDirection::Mint @ OracleError::Unauthorized,
        close = requester,
    )]
    pub quote: Account<'info, PendingQuote>,

    // TODO: Add remaining accounts for sss-core CPI when wiring:
    //   - sss_core_program: Program
    //   - config PDA
    //   - minter_config PDA
    //   - mint account
    //   - destination token account
    //   - token_program
}

pub fn mint_with_oracle(ctx: Context<MintWithOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let quote  = &ctx.accounts.quote;

    require!(!oracle.paused, OracleError::OraclePaused);

    // Check quote expiry
    let now = Clock::get()?.unix_timestamp;
    require!(!quote.is_expired(now), OracleError::QuoteExpired);

    // Slippage validation against the stored min_output
    require!(
        quote.output_amount >= quote.min_output,
        OracleError::SlippageExceeded
    );

    // Update oracle lifetime stats
    oracle.total_minted_usd = oracle
        .total_minted_usd
        .checked_add(quote.input_amount)
        .ok_or(OracleError::MathOverflow)?;
    oracle.total_fees_collected = oracle
        .total_fees_collected
        .checked_add(quote.fee_amount)
        .ok_or(OracleError::MathOverflow)?;
    oracle.last_updated_at = now;

    // ── CPI to sss-core::mint would go here ──
    // When wired, this would:
    //   1. Build CPI accounts from remaining_accounts
    //   2. Call sss_core::cpi::mint(cpi_ctx, quote.output_amount)
    //   3. The oracle PDA would need to be a registered minter in sss-core
    //
    // For now, the quote consumption + event emission is functional.
    // The integrator can read the emitted event and execute the mint
    // through the sss-core SDK separately.

    emit!(OracleMint {
        mint:         oracle.mint,
        recipient:    ctx.accounts.requester.key(),
        usd_amount:   quote.input_amount,
        token_amount: quote.output_amount,
        fee_amount:   quote.fee_amount,
        price_used:   quote.price_snapshot,
        feed_symbol:  quote.feed_symbol.clone(),
        timestamp:    now,
    });

    Ok(())
}
