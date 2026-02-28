use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::OracleError;
use crate::events::*;

// ═══════════════════════════════════════════════════════════════════════════
// initialize_oracle — Per-mint oracle config setup
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeOracleParams {
    pub feed_symbol:             String,
    pub description:             String,
    pub max_staleness_secs:      i64,
    pub mint_fee_bps:            u16,
    pub redeem_fee_bps:          u16,
    pub max_confidence_bps:      u16,
    pub quote_validity_secs:     i64,
    pub cpi_multiplier:          u64,
    pub cpi_min_update_interval: i64,
    pub cpi_data_source:         String,
}

#[derive(Accounts)]
#[instruction(params: InitializeOracleParams)]
pub struct InitializeOracle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    /// CHECK: The SSS token mint address
    pub mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = OracleConfig::LEN,
        seeds = [b"sss-oracle", mint.key().as_ref()],
        bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        seeds = [b"sss-feed-registry"],
        bump = registry.bump,
    )]
    pub registry: Account<'info, FeedRegistry>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_oracle(
    ctx: Context<InitializeOracle>,
    params: InitializeOracleParams,
) -> Result<()> {
    // Verify feed exists in registry
    require!(
        ctx.accounts.registry.find_feed(&params.feed_symbol).is_some(),
        OracleError::FeedNotFound
    );
    require!(params.cpi_multiplier > 0, OracleError::InvalidCpiMultiplier);

    let now = Clock::get()?.unix_timestamp;
    let oracle = &mut ctx.accounts.oracle_config;

    oracle.version                 = 1;
    oracle.mint                    = ctx.accounts.mint.key();
    oracle.authority               = ctx.accounts.authority.key();
    oracle.pending_authority       = None;
    oracle.feed_symbol             = params.feed_symbol.clone();
    oracle.description             = params.description;
    oracle.max_staleness_secs      = params.max_staleness_secs;
    oracle.mint_fee_bps            = params.mint_fee_bps;
    oracle.redeem_fee_bps          = params.redeem_fee_bps;
    oracle.max_confidence_bps      = params.max_confidence_bps;
    oracle.quote_validity_secs     = params.quote_validity_secs;
    oracle.cpi_multiplier          = params.cpi_multiplier;
    oracle.cpi_last_updated        = now;
    oracle.cpi_min_update_interval = params.cpi_min_update_interval;
    oracle.cpi_data_source         = params.cpi_data_source;
    oracle.paused                  = false;
    oracle.pause_reason            = String::new();
    oracle.total_minted_usd        = 0;
    oracle.total_redeemed_usd      = 0;
    oracle.total_fees_collected    = 0;
    oracle.created_at              = now;
    oracle.last_updated_at         = now;
    oracle.bump                    = ctx.bumps.oracle_config;

    emit!(OracleInitialized {
        mint:           ctx.accounts.mint.key(),
        authority:      ctx.accounts.authority.key(),
        feed_symbol:    params.feed_symbol,
        mint_fee_bps:   oracle.mint_fee_bps,
        redeem_fee_bps: oracle.redeem_fee_bps,
        timestamp:      now,
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// pause_oracle / unpause_oracle
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct PauseOracle<'info> {
    #[account(
        constraint = authority.key() == oracle_config.authority @ OracleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump = oracle_config.bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

pub fn pause_oracle(ctx: Context<PauseOracle>, reason: String) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let now    = Clock::get()?.unix_timestamp;

    oracle.paused          = true;
    oracle.pause_reason    = reason.clone();
    oracle.last_updated_at = now;

    emit!(OraclePaused {
        mint:      oracle.mint,
        paused:    true,
        reason,
        by:        ctx.accounts.authority.key(),
        timestamp: now,
    });

    Ok(())
}

pub fn unpause_oracle(ctx: Context<PauseOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let now    = Clock::get()?.unix_timestamp;

    oracle.paused          = false;
    oracle.pause_reason    = String::new();
    oracle.last_updated_at = now;

    emit!(OraclePaused {
        mint:      oracle.mint,
        paused:    false,
        reason:    String::new(),
        by:        ctx.accounts.authority.key(),
        timestamp: now,
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// Two-step authority transfer
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct ProposeAuthorityTransfer<'info> {
    #[account(
        constraint = authority.key() == oracle_config.authority @ OracleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump = oracle_config.bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

pub fn propose_authority_transfer(
    ctx: Context<ProposeAuthorityTransfer>,
    new_authority: Pubkey,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let now    = Clock::get()?.unix_timestamp;

    oracle.pending_authority = Some(new_authority);
    oracle.last_updated_at   = now;

    emit!(AuthorityTransferProposed {
        mint:      oracle.mint,
        current:   ctx.accounts.authority.key(),
        proposed:  new_authority,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AcceptAuthorityTransfer<'info> {
    pub new_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump = oracle_config.bump,
        constraint = oracle_config.pending_authority == Some(new_authority.key())
            @ OracleError::NoPendingTransfer,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

pub fn accept_authority_transfer(ctx: Context<AcceptAuthorityTransfer>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let now    = Clock::get()?.unix_timestamp;

    let old_authority        = oracle.authority;
    oracle.authority         = ctx.accounts.new_authority.key();
    oracle.pending_authority = None;
    oracle.last_updated_at   = now;

    emit!(AuthorityTransferred {
        mint:      oracle.mint,
        from:      old_authority,
        to:        ctx.accounts.new_authority.key(),
        timestamp: now,
    });

    Ok(())
}
