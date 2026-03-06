// ═══════════════════════════════════════════════════════════════════════════
// SSS-3 Instructions
//
// Extends sss-core for confidential transfers + scoped allowlists.
// Gated by `confidential_transfers_enabled` / `allowlist_active` flags.
//
// The actual confidential transfer operations (deposit, withdraw, transfer)
// are Token-2022 instructions called directly via CPI or by the client SDK.
// This program adds:
//   1. Initialization of the ConfidentialTransferMint extension
//   2. Allowlist enforcement via the transfer hook
//   3. Optional manual account approval
//   4. Analytics (max supply, snapshots)
// ═══════════════════════════════════════════════════════════════════════════

use anchor_lang::prelude::*;

use crate::errors::SSSError;
use crate::state::*;

// ═══════════════════════════════════════════════════════════════════════════
// 1. initialize_sss3
//
// Upgrades an SSS-2 mint to SSS-3 by:
//   a) Creating the ConfidentialConfig PDA
//   b) Setting the allowlist_active flag on StablecoinConfig
//   c) Updating the preset field to SSS3
//
// ONE-WAY operation: allowlist cannot be disabled.
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeSss3Params {
    pub auditor_elgamal_pubkey: Option<[u8; 64]>,
    pub auto_approve_new_accounts: bool,
    pub compliance_note: String,
}

#[derive(Accounts)]
#[instruction(params: InitializeSss3Params)]
pub struct InitializeSss3<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    /// CHECK: The SSS token mint
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = stable_config.bump,
        has_one = mint,
        constraint = stable_config.master_authority == authority.key() @ SSSError::NotMasterAuthority,
    )]
    pub stable_config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer  = payer,
        space  = ConfidentialConfig::LEN,
        seeds  = [b"sss-confidential", mint.key().as_ref()],
        bump,
    )]
    pub confidential_config: Account<'info, ConfidentialConfig>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_sss3(ctx: Context<InitializeSss3>, params: InitializeSss3Params) -> Result<()> {
    let config = &mut ctx.accounts.stable_config;

    // Must upgrade from SSS-2
    require!(
        config.preset == StablecoinPreset::SSS2,
        SSSError::RequiresSss2Preset
    );

    let now = Clock::get()?.unix_timestamp;

    // Populate ConfidentialConfig
    let conf = &mut ctx.accounts.confidential_config;
    conf.version = 1;
    conf.mint = ctx.accounts.mint.key();
    conf.authority = ctx.accounts.authority.key();
    conf.auditor_elgamal_pubkey = params.auditor_elgamal_pubkey;
    conf.auto_approve_new_accounts = params.auto_approve_new_accounts;
    conf.compliance_note = params.compliance_note;
    conf.enabled_at = now;
    conf.enabled_by = ctx.accounts.authority.key();
    conf.total_confidential_transfers = 0;
    conf.bump = ctx.bumps.confidential_config;

    // Update StablecoinConfig flags
    config.preset = StablecoinPreset::SSS3;
    config.confidential_transfers_enabled = true;
    config.allowlist_active = true;
    config.last_updated_at = now;

    // NOTE: In production, a CPI to Token-2022 would initialize the
    // ConfidentialTransferMint extension here. Stubbed as POC.
    // spl_token_2022::instruction::confidential_transfer::initialize_mint(...)

    emit!(Sss3Initialized {
        mint: ctx.accounts.mint.key(),
        authority: ctx.accounts.authority.key(),
        auto_approve: params.auto_approve_new_accounts,
        has_auditor: conf.auditor_elgamal_pubkey.is_some(),
        allowlist_active: true,
        timestamp: now,
    });

    msg!("SSS-3 initialized. Confidential transfers enabled. Allowlist active.");
    msg!("WARNING: This is a one-way upgrade. Allowlist cannot be disabled.");

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. add_to_allowlist
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddToAllowlistParams {
    pub address: Pubkey,
    pub allowed_operations: u8,
    pub kyc_tier: u8,
    pub expiry: i64,
    pub reason: String,
}

#[derive(Accounts)]
#[instruction(params: AddToAllowlistParams)]
pub struct AddToAllowlist<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub allowlister: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = stable_config.bump,
        has_one = mint,
        constraint = stable_config.master_authority == allowlister.key() @ SSSError::NotMasterAuthority,
        constraint = stable_config.allowlist_active @ SSSError::AllowlistNotActive,
    )]
    pub stable_config: Account<'info, StablecoinConfig>,

    /// CHECK: The mint address (for PDA seeds)
    pub mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer  = payer,
        space  = AllowlistEntry::LEN,
        seeds  = [b"sss-allowlist", mint.key().as_ref(), params.address.as_ref()],
        bump,
    )]
    pub allowlist_entry: Account<'info, AllowlistEntry>,

    pub system_program: Program<'info, System>,
}

pub fn add_to_allowlist(ctx: Context<AddToAllowlist>, params: AddToAllowlistParams) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let entry = &mut ctx.accounts.allowlist_entry;

    entry.mint = ctx.accounts.mint.key();
    entry.address = params.address;
    entry.allowed_operations = params.allowed_operations;
    entry.kyc_tier = params.kyc_tier;
    entry.expiry = params.expiry;
    entry.added_by = ctx.accounts.allowlister.key();
    entry.added_at = now;
    entry.reason = params.reason;
    entry.active = true;
    entry.removed_by = None;
    entry.removed_at = 0;
    entry.bump = ctx.bumps.allowlist_entry;

    emit!(AllowlistAdded {
        mint: ctx.accounts.mint.key(),
        address: params.address,
        allowed_operations: params.allowed_operations,
        kyc_tier: params.kyc_tier,
        expiry: params.expiry,
        added_by: ctx.accounts.allowlister.key(),
        timestamp: now,
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. remove_from_allowlist
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct RemoveFromAllowlist<'info> {
    pub allowlister: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = stable_config.bump,
        has_one = mint,
        constraint = stable_config.master_authority == allowlister.key() @ SSSError::NotMasterAuthority,
    )]
    pub stable_config: Account<'info, StablecoinConfig>,

    /// CHECK: Mint for PDA seeds
    pub mint: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"sss-allowlist", mint.key().as_ref(), allowlist_entry.address.as_ref()],
        bump  = allowlist_entry.bump,
    )]
    pub allowlist_entry: Account<'info, AllowlistEntry>,
}

pub fn remove_from_allowlist(ctx: Context<RemoveFromAllowlist>) -> Result<()> {
    let entry = &mut ctx.accounts.allowlist_entry;
    let now = Clock::get()?.unix_timestamp;

    require!(entry.active, SSSError::NotOnAllowlist);

    entry.active = false;
    entry.removed_by = Some(ctx.accounts.allowlister.key());
    entry.removed_at = now;

    emit!(AllowlistRemoved {
        mint: ctx.accounts.mint.key(),
        address: entry.address,
        removed_by: ctx.accounts.allowlister.key(),
        timestamp: now,
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. update_allowlist_entry
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAllowlistParams {
    pub allowed_operations: u8,
    pub kyc_tier: u8,
    pub expiry: i64,
    pub reason: String,
}

#[derive(Accounts)]
pub struct UpdateAllowlistEntry<'info> {
    pub allowlister: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = stable_config.bump,
        has_one = mint,
        constraint = stable_config.master_authority == allowlister.key() @ SSSError::NotMasterAuthority,
    )]
    pub stable_config: Account<'info, StablecoinConfig>,

    /// CHECK: Mint for PDA seeds
    pub mint: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"sss-allowlist", mint.key().as_ref(), allowlist_entry.address.as_ref()],
        bump  = allowlist_entry.bump,
    )]
    pub allowlist_entry: Account<'info, AllowlistEntry>,
}

pub fn update_allowlist_entry(
    ctx: Context<UpdateAllowlistEntry>,
    params: UpdateAllowlistParams,
) -> Result<()> {
    let entry = &mut ctx.accounts.allowlist_entry;
    require!(entry.active, SSSError::NotOnAllowlist);

    entry.allowed_operations = params.allowed_operations;
    entry.kyc_tier = params.kyc_tier;
    entry.expiry = params.expiry;
    entry.reason = params.reason;

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. approve_confidential_account
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct ApproveConfidentialAccount<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"sss-confidential", mint.key().as_ref()],
        bump  = confidential_config.bump,
        constraint = authority.key() == confidential_config.authority
            @ SSSError::NotMasterAuthority,
        constraint = !confidential_config.auto_approve_new_accounts
            @ SSSError::AutoApproveDisabled,
    )]
    pub confidential_config: Account<'info, ConfidentialConfig>,

    /// CHECK: The SSS mint
    pub mint: UncheckedAccount<'info>,

    /// CHECK: The token account to approve for confidential transfers
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,

    /// CHECK: Token-2022 program
    pub token_program: UncheckedAccount<'info>,
}

pub fn approve_confidential_account(ctx: Context<ApproveConfidentialAccount>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    // NOTE: In production, a CPI to Token-2022 would approve the account:
    // confidential_transfer::approve_account(...)
    // Stubbed as POC.

    emit!(ConfidentialAccountApproved {
        mint: ctx.accounts.mint.key(),
        token_account: ctx.accounts.token_account.key(),
        approved_by: ctx.accounts.authority.key(),
        timestamp: now,
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. set_max_supply
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct SetMaxSupply<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = stable_config.bump,
        has_one = mint,
        constraint = stable_config.master_authority == authority.key() @ SSSError::NotMasterAuthority,
    )]
    pub stable_config: Account<'info, StablecoinConfig>,

    /// CHECK: Mint address for event
    pub mint: UncheckedAccount<'info>,
}

pub fn set_max_supply(ctx: Context<SetMaxSupply>, new_max: u64) -> Result<()> {
    let config = &mut ctx.accounts.stable_config;

    // Cannot set max below current supply
    if new_max > 0 {
        require!(
            new_max >= config.total_supply,
            SSSError::MaxSupplyBelowCurrentSupply
        );
    }

    let old_max = config.max_supply;
    config.max_supply = new_max;
    config.last_updated_at = Clock::get()?.unix_timestamp;

    emit!(MaxSupplyUpdated {
        mint: ctx.accounts.mint.key(),
        old_max,
        new_max,
        updated_by: ctx.accounts.authority.key(),
        timestamp: config.last_updated_at,
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. take_supply_snapshot — Permissionless, anyone can call once per day
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(day_number: u32)]
pub struct TakeSupplySnapshot<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = stable_config.bump,
        has_one = mint,
    )]
    pub stable_config: Account<'info, StablecoinConfig>,

    /// CHECK: Mint
    pub mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer  = taker,
        space  = SupplySnapshot::LEN,
        seeds  = [
            b"sss-snapshot",
            mint.key().as_ref(),
            &day_number.to_le_bytes(),
        ],
        bump,
    )]
    pub snapshot: Account<'info, SupplySnapshot>,

    pub system_program: Program<'info, System>,
}

pub fn take_supply_snapshot(ctx: Context<TakeSupplySnapshot>, day_number: u32) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let computed = SupplySnapshot::day_number_from_timestamp(now);

    // The day_number in the instruction must match today's actual day
    require!(day_number == computed, SSSError::SnapshotAlreadyTaken);

    let config = &ctx.accounts.stable_config;
    let snap = &mut ctx.accounts.snapshot;
    snap.mint = ctx.accounts.mint.key();
    snap.day_number = day_number;
    snap.supply = config.total_supply;
    snap.minter_count = config.minter_count;
    snap.taken_by = ctx.accounts.taker.key();
    snap.taken_at = now;
    snap.bump = ctx.bumps.snapshot;

    emit!(SupplySnapshotTaken {
        mint: ctx.accounts.mint.key(),
        day_number,
        supply: config.total_supply,
        taken_by: ctx.accounts.taker.key(),
        timestamp: now,
    });

    Ok(())
}
