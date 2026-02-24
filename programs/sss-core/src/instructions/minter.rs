use anchor_lang::prelude::*;
use crate::state::{StablecoinConfig, MinterConfig};

#[derive(Accounts)]
#[instruction(minter: Pubkey, quota_per_period: u64, period_seconds: i64)]
pub struct AddMinter<'info> {
    #[account(mut)]
    pub minter_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
        has_one = minter_authority,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = minter_authority,
        space = MinterConfig::LEN,
        seeds = [b"sss-minter", mint.key().as_ref(), minter.as_ref()],
        bump,
    )]
    pub minter_config: Account<'info, MinterConfig>,

    /// CHECK: Identifier string for PDA derivation
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(minter: Pubkey)]
pub struct RemoveMinter<'info> {
    #[account(mut)]
    pub minter_authority: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
        has_one = minter_authority,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        mut,
        seeds = [b"sss-minter", mint.key().as_ref(), minter.as_ref()],
        bump = minter_config.bump,
    )]
    pub minter_config: Account<'info, MinterConfig>,

    /// CHECK: Identifier
    pub mint: UncheckedAccount<'info>,
}

pub fn add_minter(
    ctx: Context<AddMinter>,
    minter: Pubkey,
    quota_per_period: u64,
    period_seconds: i64,
) -> Result<()> {
    let minter_config = &mut ctx.accounts.minter_config;
    let current_time = Clock::get()?.unix_timestamp;

    minter_config.mint = ctx.accounts.config.mint;
    minter_config.minter = minter;
    minter_config.is_active = true;
    minter_config.quota_per_period = quota_per_period;
    minter_config.period_seconds = period_seconds;
    minter_config.minted_this_period = 0;
    minter_config.period_start = current_time;
    minter_config.total_minted = 0;
    minter_config.mint_count = 0;
    minter_config.created_at = current_time;
    minter_config.bump = ctx.bumps.minter_config;

    Ok(())
}

pub fn remove_minter(ctx: Context<RemoveMinter>, _minter: Pubkey) -> Result<()> {
    let minter_config = &mut ctx.accounts.minter_config;
    minter_config.is_active = false;
    Ok(())
}
