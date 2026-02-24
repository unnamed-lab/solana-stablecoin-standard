use anchor_lang::prelude::*;
use crate::state::StablecoinConfig;
use crate::errors::SSSError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RoleUpdate {
    pub new_pauser: Option<Pubkey>,
    pub new_minter_authority: Option<Pubkey>,
    pub new_burner: Option<Pubkey>,
    pub new_blacklister: Option<Pubkey>,  // SSS-2 only
    pub new_seizer: Option<Pubkey>,       // SSS-2 only
}

#[derive(Accounts)]
pub struct UpdateRoles<'info> {
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

#[derive(Accounts)]
pub struct ProposeTransfer<'info> {
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

#[derive(Accounts)]
pub struct AcceptTransfer<'info> {
    #[account(mut)]
    pub pending_authority: Signer<'info>,

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

pub fn update_roles(ctx: Context<UpdateRoles>, update: RoleUpdate) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let auth = ctx.accounts.master_authority.key();
    let current_time = Clock::get()?.unix_timestamp;

    if let Some(pauser) = update.new_pauser {
        let old = config.pauser;
        config.pauser = pauser;
        emit_role_update(config.mint, "pauser", old, pauser, auth, current_time);
    }
    
    if let Some(minter_auth) = update.new_minter_authority {
        let old = config.minter_authority;
        config.minter_authority = minter_auth;
        emit_role_update(config.mint, "minter_authority", old, minter_auth, auth, current_time);
    }
    
    if let Some(burner) = update.new_burner {
        let old = config.burner;
        config.burner = burner;
        emit_role_update(config.mint, "burner", old, burner, auth, current_time);
    }

    if let Some(blacklister) = update.new_blacklister {
        if config.enable_transfer_hook {
            let old = config.blacklister.unwrap_or_default();
            config.blacklister = Some(blacklister);
            emit_role_update(config.mint, "blacklister", old, blacklister, auth, current_time);
        }
    }

    if let Some(seizer) = update.new_seizer {
        if config.enable_permanent_delegate {
            let old = config.seizer.unwrap_or_default();
            config.seizer = Some(seizer);
            emit_role_update(config.mint, "seizer", old, seizer, auth, current_time);
        }
    }

    Ok(())
}

fn emit_role_update(
    mint: Pubkey,
    role: &str,
    old_address: Pubkey,
    new_address: Pubkey,
    updated_by: Pubkey,
    timestamp: i64,
) {
    emit!(RoleUpdated {
        mint,
        role: role.to_string(),
        old_address,
        new_address,
        updated_by,
        timestamp,
    });
}

pub fn propose_authority_transfer(ctx: Context<ProposeTransfer>, new_authority: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.pending_master_authority = Some(new_authority);
    Ok(())
}

pub fn accept_authority_transfer(ctx: Context<AcceptTransfer>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let pending = config.pending_master_authority.ok_or(SSSError::NoPendingTransfer)?;
    
    require!(ctx.accounts.pending_authority.key() == pending, SSSError::NotPendingAuthority);
    
    let old_auth = config.master_authority;
    config.master_authority = pending;
    config.pending_master_authority = None;
    
    emit_role_update(
        config.mint,
        "master_authority",
        old_auth,
        pending,
        pending,
        Clock::get()?.unix_timestamp,
    );
    
    Ok(())
}

#[event]
pub struct RoleUpdated {
    pub mint: Pubkey,
    pub role: String,
    pub old_address: Pubkey,
    pub new_address: Pubkey,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}
