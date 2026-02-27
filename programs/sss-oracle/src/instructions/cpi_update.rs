use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::OracleError;
use crate::events::*;

// ═══════════════════════════════════════════════════════════════════════════
// update_cpi_multiplier — Monthly admin operation for CpiIndexed tokens
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateCpiParams {
    /// New CPI multiplier (fixed-point * 1_000_000). 1.083 = 1_083_000
    pub new_multiplier:   u64,
    /// Reference month string, e.g. "2026-01"
    pub reference_month:  String,
    /// Data source URL/description for audit trail
    pub data_source:      String,
}

#[derive(Accounts)]
pub struct UpdateCpiMultiplier<'info> {
    #[account(
        constraint = authority.key() == oracle_config.authority @ OracleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump  = oracle_config.bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

pub fn update_cpi_multiplier(
    ctx: Context<UpdateCpiMultiplier>,
    params: UpdateCpiParams,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let now    = Clock::get()?.unix_timestamp;

    require!(params.new_multiplier > 0, OracleError::InvalidCpiMultiplier);

    // Enforce minimum update interval
    require!(
        now - oracle.cpi_last_updated >= oracle.cpi_min_update_interval,
        OracleError::CpiUpdateTooSoon
    );

    let old_multiplier = oracle.cpi_multiplier;

    oracle.cpi_multiplier   = params.new_multiplier;
    oracle.cpi_last_updated = now;
    oracle.cpi_data_source  = params.data_source.clone();
    oracle.last_updated_at  = now;

    emit!(CpiMultiplierUpdated {
        mint:            oracle.mint,
        old_multiplier,
        new_multiplier:  params.new_multiplier,
        reference_month: params.reference_month,
        data_source:     params.data_source,
        updated_by:      ctx.accounts.authority.key(),
        timestamp:       now,
    });

    Ok(())
}
