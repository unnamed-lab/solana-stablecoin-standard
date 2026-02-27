use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::OracleError;
use crate::events::*;
use crate::math::*;
use crate::switchboard::read_switchboard_price;

// ═══════════════════════════════════════════════════════════════════════════
// get_mint_quote — USD → tokens
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GetQuoteParams {
    /// Input amount: USD cents for mint, token base units for redeem
    pub input_amount: u64,
    /// Minimum acceptable output (slippage floor)
    pub min_output:   u64,
    /// Caller-provided nonce to avoid PDA collision between quotes
    pub nonce:        u64,
}

#[derive(Accounts)]
#[instruction(params: GetQuoteParams)]
pub struct GetMintQuote<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump  = oracle_config.bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        seeds = [b"sss-feed-registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, FeedRegistry>,

    /// CHECK: The Switchboard aggregator for this feed — validated inside instruction
    pub switchboard_feed: UncheckedAccount<'info>,

    #[account(
        init,
        payer  = requester,
        space  = PendingQuote::LEN,
        seeds  = [
            b"sss-quote",
            oracle_config.mint.as_ref(),
            requester.key().as_ref(),
            &params.nonce.to_le_bytes(),
        ],
        bump,
    )]
    pub quote: Account<'info, PendingQuote>,

    pub system_program: Program<'info, System>,
}

pub fn get_mint_quote(ctx: Context<GetMintQuote>, params: GetQuoteParams) -> Result<QuoteResult> {
    let oracle   = &ctx.accounts.oracle_config;
    let registry = &ctx.accounts.registry;

    require!(!oracle.paused, OracleError::OraclePaused);
    require!(params.input_amount > 0, OracleError::ZeroAmount);

    // Get feed entry from registry
    let feed = registry
        .find_feed(&oracle.feed_symbol)
        .ok_or(OracleError::FeedNotFound)?;

    // Verify caller passed the correct switchboard_feed account
    require!(
        ctx.accounts.switchboard_feed.key() == feed.switchboard_feed,
        OracleError::FeedMismatch
    );

    // Read Switchboard price via raw deserialization
    let feed_data = ctx.accounts.switchboard_feed.try_borrow_data()?;
    let sb_price  = read_switchboard_price(&feed_data)?;

    // Validate
    require!(sb_price.value > 0.0, OracleError::InvalidPrice);
    validate_staleness(sb_price.round_open_timestamp, oracle.max_staleness_secs)?;

    let price_scaled = (sb_price.value * PRICE_SCALE as f64) as u64;
    let conf_scaled  = (sb_price.std_deviation.abs() * PRICE_SCALE as f64) as u64;

    validate_confidence(price_scaled, conf_scaled, oracle.max_confidence_bps)?;

    // Calculate gross token amount
    let gross_tokens = calc_token_amount_for_usd(
        params.input_amount,
        price_scaled,
        &feed.feed_type,
        oracle.cpi_multiplier,
    )?;

    require!(gross_tokens > 0, OracleError::ZeroOutput);

    // Deduct mint fee
    let (net_tokens, fee_tokens) = apply_fee(gross_tokens, oracle.mint_fee_bps)?;

    // Slippage check
    check_slippage(net_tokens, params.min_output)?;

    let now         = Clock::get()?.unix_timestamp;
    let valid_until = now + oracle.quote_validity_secs;

    // Store the quote on-chain
    let quote = &mut ctx.accounts.quote;
    quote.mint           = oracle.mint;
    quote.requester      = ctx.accounts.requester.key();
    quote.direction      = QuoteDirection::Mint;
    quote.feed_symbol    = oracle.feed_symbol.clone();
    quote.input_amount   = params.input_amount;
    quote.output_amount  = net_tokens;
    quote.fee_amount     = fee_tokens;
    quote.price_snapshot = price_scaled;
    quote.valid_until    = valid_until;
    quote.min_output     = params.min_output;
    quote.used           = false;
    quote.created_at     = now;
    quote.nonce          = params.nonce;
    quote.bump           = ctx.bumps.quote;

    emit!(QuoteGenerated {
        quote_id:      ctx.accounts.quote.key(),
        mint:          oracle.mint,
        feed_symbol:   oracle.feed_symbol.clone(),
        direction:     "Mint".to_string(),
        input_amount:  params.input_amount,
        output_amount: net_tokens,
        fee_amount:    fee_tokens,
        price_used:    price_scaled,
        valid_until,
        timestamp:     now,
    });

    Ok(QuoteResult {
        output_amount: net_tokens,
        fee_amount:    fee_tokens,
        price_used:    price_scaled,
        valid_until,
        quote_account: ctx.accounts.quote.key(),
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// get_redeem_quote — tokens → USD
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(params: GetQuoteParams)]
pub struct GetRedeemQuote<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        seeds = [b"sss-oracle", oracle_config.mint.as_ref()],
        bump  = oracle_config.bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        seeds = [b"sss-feed-registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, FeedRegistry>,

    /// CHECK: Switchboard aggregator — validated inside instruction
    pub switchboard_feed: UncheckedAccount<'info>,

    #[account(
        init,
        payer  = requester,
        space  = PendingQuote::LEN,
        seeds  = [
            b"sss-quote",
            oracle_config.mint.as_ref(),
            requester.key().as_ref(),
            &params.nonce.to_le_bytes(),
        ],
        bump,
    )]
    pub quote: Account<'info, PendingQuote>,

    pub system_program: Program<'info, System>,
}

pub fn get_redeem_quote(
    ctx: Context<GetRedeemQuote>,
    params: GetQuoteParams,
) -> Result<QuoteResult> {
    let oracle   = &ctx.accounts.oracle_config;
    let registry = &ctx.accounts.registry;

    require!(!oracle.paused, OracleError::OraclePaused);
    require!(params.input_amount > 0, OracleError::ZeroAmount);

    let feed = registry
        .find_feed(&oracle.feed_symbol)
        .ok_or(OracleError::FeedNotFound)?;

    require!(
        ctx.accounts.switchboard_feed.key() == feed.switchboard_feed,
        OracleError::FeedMismatch
    );

    // Read price
    let feed_data = ctx.accounts.switchboard_feed.try_borrow_data()?;
    let sb_price  = read_switchboard_price(&feed_data)?;

    require!(sb_price.value > 0.0, OracleError::InvalidPrice);
    validate_staleness(sb_price.round_open_timestamp, oracle.max_staleness_secs)?;

    let price_scaled = (sb_price.value * PRICE_SCALE as f64) as u64;
    let conf_scaled  = (sb_price.std_deviation.abs() * PRICE_SCALE as f64) as u64;

    validate_confidence(price_scaled, conf_scaled, oracle.max_confidence_bps)?;

    // Calculate gross USD output from token input
    let gross_usd = calc_usd_for_token_amount(
        params.input_amount,
        price_scaled,
        &feed.feed_type,
        oracle.cpi_multiplier,
    )?;

    require!(gross_usd > 0, OracleError::ZeroOutput);

    let (net_usd, fee_usd) = apply_fee(gross_usd, oracle.redeem_fee_bps)?;

    check_slippage(net_usd, params.min_output)?;

    let now         = Clock::get()?.unix_timestamp;
    let valid_until = now + oracle.quote_validity_secs;

    let quote = &mut ctx.accounts.quote;
    quote.mint           = oracle.mint;
    quote.requester      = ctx.accounts.requester.key();
    quote.direction      = QuoteDirection::Redeem;
    quote.feed_symbol    = oracle.feed_symbol.clone();
    quote.input_amount   = params.input_amount;
    quote.output_amount  = net_usd;
    quote.fee_amount     = fee_usd;
    quote.price_snapshot = price_scaled;
    quote.valid_until    = valid_until;
    quote.min_output     = params.min_output;
    quote.used           = false;
    quote.created_at     = now;
    quote.nonce          = params.nonce;
    quote.bump           = ctx.bumps.quote;

    emit!(QuoteGenerated {
        quote_id:      ctx.accounts.quote.key(),
        mint:          oracle.mint,
        feed_symbol:   oracle.feed_symbol.clone(),
        direction:     "Redeem".to_string(),
        input_amount:  params.input_amount,
        output_amount: net_usd,
        fee_amount:    fee_usd,
        price_used:    price_scaled,
        valid_until,
        timestamp:     now,
    });

    Ok(QuoteResult {
        output_amount: net_usd,
        fee_amount:    fee_usd,
        price_used:    price_scaled,
        valid_until,
        quote_account: ctx.accounts.quote.key(),
    })
}
