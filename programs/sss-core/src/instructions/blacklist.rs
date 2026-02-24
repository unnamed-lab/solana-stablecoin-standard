use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, FreezeAccount as SplFreezeAccount, ThawAccount as SplThawAccount, Token2022};
use crate::state::{StablecoinConfig, BlacklistEntry};
use crate::errors::SSSError;

#[derive(Accounts)]
#[instruction(target: Pubkey, reason: String)]
pub struct AddToBlacklist<'info> {
    #[account(mut)]
    pub blacklister: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = blacklister,
        space = BlacklistEntry::LEN,
        seeds = [b"sss-blacklist", mint.key().as_ref(), target.as_ref()],
        bump,
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub target_account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct RemoveFromBlacklist<'info> {
    #[account(mut)]
    pub blacklister: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        mut,
        seeds = [b"sss-blacklist", mint.key().as_ref(), target.as_ref()],
        bump = blacklist_entry.bump,
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub target_account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Validated by token program
    pub mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
}

pub fn add_to_blacklist(
    ctx: Context<AddToBlacklist>,
    target: Pubkey,
    reason: String,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let entry = &mut ctx.accounts.blacklist_entry;
    
    require!(config.enable_transfer_hook, SSSError::ComplianceNotEnabled);
    require!(!config.paused, SSSError::Paused);
    require!(config.blacklister == Some(ctx.accounts.blacklister.key()), SSSError::NotBlacklister);
    require!(target != Pubkey::default(), SSSError::InvalidBlacklistTarget);
    require!(reason.len() <= 100, SSSError::NameTooLong); // Reusing NameTooLong or max reason size
    
    entry.mint = config.mint;
    entry.address = target;
    entry.reason = reason;
    entry.added_by = ctx.accounts.blacklister.key();
    entry.added_at = Clock::get()?.unix_timestamp;
    entry.removed = false;
    entry.removed_by = None;
    entry.removed_at = None;
    entry.bump = ctx.bumps.blacklist_entry;

    config.blacklist_count = config.blacklist_count.checked_add(1).unwrap();

    let mint_key = config.mint.key();
    let config_bump = config.bump;
    let seeds = &[
        b"sss-config".as_ref(),
        mint_key.as_ref(),
        &[config_bump],
    ];
    let signer = &[&seeds[..]];

    // Immediately freeze the account
    let cpi_accounts = SplFreezeAccount {
        account: ctx.accounts.target_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::freeze_account(cpi_ctx)?;

    emit!(Blacklisted {
        mint: config.mint,
        address: target,
        reason: entry.reason.clone(),
        blacklisted_by: ctx.accounts.blacklister.key(),
        timestamp: entry.added_at,
    });

    Ok(())
}

pub fn remove_from_blacklist(
    ctx: Context<RemoveFromBlacklist>,
    target: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let entry = &mut ctx.accounts.blacklist_entry;
    
    require!(config.enable_transfer_hook, SSSError::ComplianceNotEnabled);
    require!(config.blacklister == Some(ctx.accounts.blacklister.key()), SSSError::NotBlacklister);
    require!(!entry.removed, SSSError::NotBlacklisted);

    entry.removed = true;
    entry.removed_by = Some(ctx.accounts.blacklister.key());
    entry.removed_at = Some(Clock::get()?.unix_timestamp);

    config.blacklist_count = config.blacklist_count.checked_sub(1).unwrap_or(0);

    let mint_key = config.mint.key();
    let config_bump = config.bump;
    let seeds = &[
        b"sss-config".as_ref(),
        mint_key.as_ref(),
        &[config_bump],
    ];
    let signer = &[&seeds[..]];

    // Thaw the account
    let cpi_accounts = SplThawAccount {
        account: ctx.accounts.target_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::thaw_account(cpi_ctx)?;

    let removed_at = entry.removed_at.unwrap();
    
    emit!(RemovedFromBlacklist {
        mint: config.mint,
        address: target,
        removed_by: ctx.accounts.blacklister.key(),
        timestamp: removed_at,
    });

    Ok(())
}

#[event]
pub struct Blacklisted {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub reason: String,
    pub blacklisted_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RemovedFromBlacklist {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub removed_by: Pubkey,
    pub timestamp: i64,
}
