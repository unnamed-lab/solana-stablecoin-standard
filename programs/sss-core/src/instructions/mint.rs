use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, MintTo, Token2022};
use crate::state::{StablecoinConfig, MinterConfig};
use crate::errors::SSSError;

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub minter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        mut,
        seeds = [b"sss-minter", mint.key().as_ref(), minter.key().as_ref()],
        bump = minter_config.bump,
        has_one = mint,
        has_one = minter,
    )]
    pub minter_config: Account<'info, MinterConfig>,

    #[account(mut)]
    /// CHECK: We trust Token-2022 program to validate mint
    pub mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Validated by Token-2022 CPI
    pub destination: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
}

pub fn mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let minter_config = &mut ctx.accounts.minter_config;
    let current_time = Clock::get()?.unix_timestamp;

    // 1. Check if paused
    require!(!config.paused, SSSError::Paused);

    // 2. Check if minter is active
    require!(minter_config.is_active, SSSError::MinterInactive);
    
    // 3. Quota check
    if minter_config.quota_per_period > 0 {
        // Reset period if expired
        if current_time >= minter_config.period_start + minter_config.period_seconds {
            minter_config.period_start = current_time;
            minter_config.minted_this_period = 0;
        }

        require!(
            minter_config.minted_this_period.checked_add(amount).unwrap() <= minter_config.quota_per_period,
            SSSError::QuotaExceeded
        );
    }

    // 4. Amount > 0
    require!(amount > 0, SSSError::ZeroAmount);

    // 5. Overflow check and state update
    config.total_supply = config.total_supply.checked_add(amount).ok_or(SSSError::SupplyOverflow)?;
    config.total_minted_all_time = config.total_minted_all_time.checked_add(amount).ok_or(SSSError::SupplyOverflow)?;
    
    minter_config.minted_this_period = minter_config.minted_this_period.checked_add(amount).unwrap();
    minter_config.total_minted = minter_config.total_minted.checked_add(amount).unwrap();
    minter_config.mint_count = minter_config.mint_count.checked_add(1).unwrap();

    // 6. CPI to token program
    let mint_key = config.mint.key();
    let bump = config.bump;
    let seeds = &[
        b"sss-config".as_ref(),
        mint_key.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.destination.to_account_info(),
        authority: config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::mint_to(cpi_ctx, amount)?;

    // 7. Event
    emit!(Minted {
        mint: config.mint,
        recipient: ctx.accounts.destination.key(),
        amount,
        minter: ctx.accounts.minter.key(),
        new_total_supply: config.total_supply,
        timestamp: current_time,
    });

    Ok(())
}

#[event]
pub struct Minted {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub minter: Pubkey,
    pub new_total_supply: u64,
    pub timestamp: i64,
}
