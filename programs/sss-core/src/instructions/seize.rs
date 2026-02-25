use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, TransferChecked, Token2022, spl_token_2022::state::AccountState};
use anchor_spl::token_interface::TokenAccount;
use crate::state::{StablecoinConfig, SeizureRecord};
use crate::errors::SSSError;

#[derive(Accounts)]
#[instruction(amount: u64, reason: String)]
pub struct Seize<'info> {
    #[account(mut)]
    pub seizer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = seizer,
        space = SeizureRecord::LEN,
        seeds = [
            b"sss-seizure", 
            mint.key().as_ref(), 
            source_account.key().as_ref(), 
            &Clock::get().unwrap().unix_timestamp.to_le_bytes() // unique timestamp bytes
        ],
        bump,
    )]
    pub seizure_record: Account<'info, SeizureRecord>,

    #[account(mut)]
    pub source_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub destination_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

pub fn seize(ctx: Context<Seize>, amount: u64, reason: String) -> Result<()> {
    let config = &ctx.accounts.config;
    let record = &mut ctx.accounts.seizure_record;
    
    require!(config.enable_transfer_hook, SSSError::ComplianceNotEnabled);
    require!(config.enable_permanent_delegate, SSSError::PermanentDelegateNotEnabled);
    require!(config.seizer == Some(ctx.accounts.seizer.key()), SSSError::NotSeizer);
    
    // Check if account is frozen
    require!(ctx.accounts.source_account.state == AccountState::Frozen, SSSError::AccountNotFrozen);
    require!(amount > 0 && amount <= ctx.accounts.source_account.amount, SSSError::ZeroAmount);

    let current_time = Clock::get()?.unix_timestamp;

    record.mint = config.mint;
    record.seized_from = ctx.accounts.source_account.key();
    record.seized_to = ctx.accounts.destination_account.key();
    record.amount = amount;
    record.reason = reason.clone();
    record.executed_by = ctx.accounts.seizer.key();
    record.executed_at = current_time;
    record.bump = ctx.bumps.seizure_record;
    // transaction_signature can be populated if indexed, we leave it default for on-chain
    record.transaction_signature = [0u8; 64];

    let mint_key = config.mint.key();
    let config_bump = config.bump;
    let seeds = &[
        b"sss-config".as_ref(),
        mint_key.as_ref(),
        &[config_bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.source_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.destination_account.to_account_info(),
        authority: config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::transfer_checked(cpi_ctx, amount, config.decimals)?;

    emit!(Seized {
        mint: config.mint,
        seized_from: ctx.accounts.source_account.key(),
        seized_to: ctx.accounts.destination_account.key(),
        amount,
        reason,
        seizer: ctx.accounts.seizer.key(),
        timestamp: current_time,
    });

    Ok(())
}

#[event]
pub struct Seized {
    pub mint: Pubkey,
    pub seized_from: Pubkey,
    pub seized_to: Pubkey,
    pub amount: u64,
    pub reason: String,
    pub seizer: Pubkey,
    pub timestamp: i64,
}
