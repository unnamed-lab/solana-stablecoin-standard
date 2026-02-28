use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::OracleError;
use crate::events::*;
use crate::switchboard::read_switchboard_price;

// ═══════════════════════════════════════════════════════════════════════════
// initialize_registry — One-time global setup
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = FeedRegistry::LEN,
        seeds = [b"sss-feed-registry"],
        bump,
    )]
    pub registry: Account<'info, FeedRegistry>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.authority  = ctx.accounts.authority.key();
    registry.feed_count = 0;
    registry.feeds      = Vec::with_capacity(MAX_FEEDS);
    registry.bump       = ctx.bumps.registry;
    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// register_feed — Add a new price feed to the global registry
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterFeedParams {
    pub symbol:         String,
    pub feed_type:      FeedType,
    pub base_currency:  String,
    pub quote_currency: String,
    pub decimals:       u8,
}

#[derive(Accounts)]
#[instruction(params: RegisterFeedParams)]
pub struct RegisterFeed<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        constraint = authority.key() == registry.authority @ OracleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-feed-registry"],
        bump = registry.bump,
    )]
    pub registry: Account<'info, FeedRegistry>,

    /// CHECK: Switchboard aggregator account — validated by reading its data
    pub switchboard_feed: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn register_feed(ctx: Context<RegisterFeed>, params: RegisterFeedParams) -> Result<()> {
    let registry = &mut ctx.accounts.registry;

    // Validation
    require!(params.symbol.len() <= 12, OracleError::SymbolTooLong);
    require!(
        registry.find_feed(&params.symbol).is_none(),
        OracleError::FeedAlreadyRegistered
    );
    require!(
        registry.feed_count < MAX_FEEDS as u8,
        OracleError::RegistryFull
    );

    // Verify the Switchboard feed account is readable
    let feed_data = ctx.accounts.switchboard_feed.try_borrow_data()?;
    let _price = read_switchboard_price(&feed_data)
        .map_err(|_| error!(OracleError::FeedNotReady))?;

    let now = Clock::get()?.unix_timestamp;

    registry.feeds.push(FeedEntry {
        symbol:           params.symbol.clone(),
        switchboard_feed: ctx.accounts.switchboard_feed.key(),
        feed_type:        params.feed_type.clone(),
        base_currency:    params.base_currency.clone(),
        quote_currency:   params.quote_currency.clone(),
        decimals:         params.decimals,
        active:           true,
        registered_at:    now,
        registered_by:    ctx.accounts.authority.key(),
    });
    registry.feed_count += 1;

    emit!(FeedRegistered {
        symbol:           params.symbol,
        switchboard_feed: ctx.accounts.switchboard_feed.key(),
        feed_type:        format!("{:?}", params.feed_type),
        base_currency:    params.base_currency,
        quote_currency:   params.quote_currency,
        registered_by:    ctx.accounts.authority.key(),
        timestamp:        now,
    });

    Ok(())
}
