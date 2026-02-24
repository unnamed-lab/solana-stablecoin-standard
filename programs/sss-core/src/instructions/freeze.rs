use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, FreezeAccount as SplFreezeAccount, ThawAccount as SplThawAccount, Token2022};
use crate::state::StablecoinConfig;
use crate::errors::SSSError;

#[derive(Accounts)]
pub struct FreezeAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct ThawAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
}

pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
    let config = &ctx.accounts.config;
    let auth = ctx.accounts.authority.key();
    
    require!(!config.paused, SSSError::Paused);
    require!(
        config.master_authority == auth || config.blacklister == Some(auth),
        SSSError::NotBlacklister
    );

    let mint_key = config.mint.key();
    let bump = config.bump;
    let seeds = &[
        b"sss-config".as_ref(),
        mint_key.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = SplFreezeAccount {
        account: ctx.accounts.account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::freeze_account(cpi_ctx)?;

    emit!(AccountFrozenEvent {
        mint: config.mint,
        account: ctx.accounts.account.key(),
        by: auth,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
    let config = &ctx.accounts.config;
    let auth = ctx.accounts.authority.key();
    
    require!(!config.paused, SSSError::Paused);
    require!(
        config.master_authority == auth || config.blacklister == Some(auth),
        SSSError::NotBlacklister
    );

    let mint_key = config.mint.key();
    let bump = config.bump;
    let seeds = &[
        b"sss-config".as_ref(),
        mint_key.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = SplThawAccount {
        account: ctx.accounts.account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::thaw_account(cpi_ctx)?;

    emit!(AccountThawedEvent {
        mint: config.mint,
        account: ctx.accounts.account.key(),
        by: auth,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct AccountFrozenEvent {
    pub mint: Pubkey,
    pub account: Pubkey,
    pub by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AccountThawedEvent {
    pub mint: Pubkey,
    pub account: Pubkey,
    pub by: Pubkey,
    pub timestamp: i64,
}
