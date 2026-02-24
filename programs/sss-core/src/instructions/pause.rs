use anchor_lang::prelude::*;
use crate::state::StablecoinConfig;
use crate::errors::SSSError;

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(mut)]
    pub pauser: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    /// CHECK: Identifier
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(mut)]
    pub master_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
        has_one = master_authority,
    )]
    pub config: Account<'info, StablecoinConfig>,

    /// CHECK: Identifier
    pub mint: UncheckedAccount<'info>,
}

pub fn pause(ctx: Context<Pause>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    require!(!config.paused, SSSError::Paused);
    require!(
        config.pauser == ctx.accounts.pauser.key() || config.master_authority == ctx.accounts.pauser.key(),
        SSSError::NotPauser
    );

    config.paused = true;

    emit!(PausedEvent {
        mint: config.mint,
        by: ctx.accounts.pauser.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    require!(config.paused, SSSError::NotPaused);
    
    config.paused = false;

    emit!(UnpausedEvent {
        mint: config.mint,
        by: ctx.accounts.master_authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct PausedEvent {
    pub mint: Pubkey,
    pub by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UnpausedEvent {
    pub mint: Pubkey,
    pub by: Pubkey,
    pub timestamp: i64,
}
