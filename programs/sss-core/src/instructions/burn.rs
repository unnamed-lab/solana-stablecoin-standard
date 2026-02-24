use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Burn, Token2022};
use crate::state::StablecoinConfig;
use crate::errors::SSSError;

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub burner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
        has_one = burner,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    /// CHECK: Validated by Token-2022 program
    pub source: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Validated by Token-2022 program
    pub mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
}

pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    require!(!config.paused, SSSError::Paused);
    require!(amount > 0, SSSError::ZeroAmount);

    config.total_supply = config.total_supply.checked_sub(amount).unwrap_or(0);
    config.total_burned_all_time = config.total_burned_all_time.checked_add(amount).unwrap();

    let cpi_accounts = Burn {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.source.to_account_info(),
        authority: ctx.accounts.burner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token_2022::burn(cpi_ctx, amount)?;

    emit!(Burned {
        mint: config.mint,
        from: ctx.accounts.source.key(),
        amount,
        burner: ctx.accounts.burner.key(),
        new_total_supply: config.total_supply,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct Burned {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub amount: u64,
    pub burner: Pubkey,
    pub new_total_supply: u64,
    pub timestamp: i64,
}
