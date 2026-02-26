use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;
use sss_core::state::{BlacklistEntry, StablecoinConfig};

pub mod state;
pub mod errors;

use state::*;
use errors::*;

declare_id!("9Vu21Cy4yShn7SukayuArDRy36fVzXMjsnJiTG2ZZDxF");

#[program]
pub mod sss_transfer_hook {
    use super::*;

    pub fn initialize_hook(
        ctx: Context<InitializeHook>,
        default_enabled: bool,
    ) -> Result<()> {
        let hook_config = &mut ctx.accounts.hook_config;
        
        // We ensure authority matches the sss-core config master authority
        require!(
            ctx.accounts.sss_config.hook_authority == Some(ctx.accounts.authority.key()) 
            || ctx.accounts.sss_config.master_authority == ctx.accounts.authority.key(),
            HookError::InvalidAuthority
        );

        hook_config.mint = ctx.accounts.mint.key();
        hook_config.sss_core_program = sss_core::ID;
        hook_config.authority = ctx.accounts.authority.key();
        hook_config.enabled = default_enabled;
        hook_config.transfer_count = 0;
        hook_config.blocked_count = 0;
        hook_config.bump = ctx.bumps.hook_config;

        Ok(())
    }

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let account_metas = vec![
            // 1. The hook config
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal { bytes: b"hook-config".to_vec() },
                    Seed::AccountKey { index: 1 }, // mint index in transfer accounts
                ],
                false, // is_signer
                true,  // is_writable (we update transfer_count)
            )?,
            // 2. SSS-Core program (for PDA derivation reference)
            ExtraAccountMeta::new_with_pubkey(&sss_core::ID, false, false)?,
            // 3. Sender blacklist entry (derived from sender authority + mint)
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal { bytes: b"sss-blacklist".to_vec() },
                    Seed::AccountKey { index: 1 },  // mint
                    Seed::AccountKey { index: 3 },  // source_authority
                ],
                false,
                false,
            )?,
            // 4. Recipient blacklist entry (derived from destination owner + mint)
            // Wait: We need destination_owner. Because Token-2022 transfer doesn't pass destination_owner
            // automatically, we must use AccountData to look it up, or we pass it as an extra account.
            // Using AccountData seed derivation for destination owner:
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal { bytes: b"sss-blacklist".to_vec() },
                    Seed::AccountKey { index: 1 },  // mint
                    // We extract the owner from the destination token account data
                    Seed::AccountData {
                        account_index: 2, // destination account
                        data_index: 32, // token account owner is at offset 32
                        length: 32, // pubkey length
                    },
                ],
                false,
                false,
            )?,
        ];
        
        let mut data = ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?;
        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut data,
            &account_metas,
        )?;
        
        Ok(())
    }

    pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
        let hook_config = &mut ctx.accounts.hook_config;
        
        require!(hook_config.enabled, HookError::HookDisabled);
        require!(hook_config.mint == ctx.accounts.mint.key(), HookError::InvalidMint);
        
        hook_config.transfer_count += 1;
        
        let mint_key = ctx.accounts.mint.key();
        let source_authority = ctx.accounts.source_authority.key();
        
        // --- Check 1: Is the source (sender authority) blacklisted? ---
        let sender_blacklist_seed = [
            b"sss-blacklist",
            mint_key.as_ref(),
            source_authority.as_ref(),
        ];
        let (sender_blacklist_pda, _) = Pubkey::find_program_address(
            &sender_blacklist_seed,
            &ctx.accounts.sss_core_program.key(),
        );
        
        if ctx.accounts.sender_blacklist_entry.key() == sender_blacklist_pda {
            let entry = &ctx.accounts.sender_blacklist_entry;
            if !entry.data_is_empty() {
                let blacklist: BlacklistEntry = 
                    BlacklistEntry::try_deserialize(&mut entry.data.borrow().as_ref())?;
                if !blacklist.removed {
                    hook_config.blocked_count += 1;
                    emit!(TransferBlocked {
                        mint: mint_key,
                        blocked_address: source_authority,
                        reason: "Sender is blacklisted".to_string(),
                        amount,
                        timestamp: Clock::get()?.unix_timestamp,
                    });
                    return err!(HookError::SenderBlacklisted);
                }
            }
        }
        
        // --- Check 2: Is the destination owner blacklisted? ---
        // Extracted automatically via ExtraAccountMetaList Seed::AccountData
        // We just need to check if the PDA passed matches the derivation
        // Destination token account owner is at offset 32 in token account data
        let dest_data = ctx.accounts.destination.try_borrow_data()?;
        let mut dest_owner_bytes = [0u8; 32];
        dest_owner_bytes.copy_from_slice(&dest_data[32..64]);
        let dest_owner = Pubkey::new_from_array(dest_owner_bytes);

        let recipient_blacklist_seed = [
            b"sss-blacklist",
            mint_key.as_ref(),
            dest_owner.as_ref(),
        ];
        let (recipient_blacklist_pda, _) = Pubkey::find_program_address(
            &recipient_blacklist_seed,
            &ctx.accounts.sss_core_program.key(),
        );
        
        if ctx.accounts.recipient_blacklist_entry.key() == recipient_blacklist_pda {
            let entry = &ctx.accounts.recipient_blacklist_entry;
            if !entry.data_is_empty() {
                let blacklist: BlacklistEntry = 
                    BlacklistEntry::try_deserialize(&mut entry.data.borrow().as_ref())?;
                if !blacklist.removed {
                    hook_config.blocked_count += 1;
                    emit!(TransferBlocked {
                        mint: mint_key,
                        blocked_address: dest_owner,
                        reason: "Recipient is blacklisted".to_string(),
                        amount,
                        timestamp: Clock::get()?.unix_timestamp,
                    });
                    return err!(HookError::RecipientBlacklisted);
                }
            }
        }
        
        emit!(TransferValidated {
            mint: mint_key,
            source: source_authority,
            destination: dest_owner,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Admin commands
    pub fn disable_hook(ctx: Context<AdminHook>) -> Result<()> {
        ctx.accounts.hook_config.enabled = false;
        Ok(())
    }

    pub fn enable_hook(ctx: Context<AdminHook>) -> Result<()> {
        ctx.accounts.hook_config.enabled = true;
        Ok(())
    }
}


#[derive(Accounts)]
pub struct InitializeHook<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = HookConfig::LEN,
        seeds = [b"hook-config", mint.key().as_ref()],
        bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        seeds::program = sss_core::ID,
        bump = sss_config.bump,
        has_one = mint,
    )]
    pub sss_config: Account<'info, StablecoinConfig>,

    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = ExtraAccountMetaList::size_of(4).unwrap(), // 4 extra accounts
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
        payer = payer,
    )]
    /// CHECK: ExtraAccountMetaList Account
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        seeds = [b"hook-config", mint.key().as_ref()],
        bump = hook_config.bump,
        has_one = authority,
    )]
    pub hook_config: Account<'info, HookConfig>,
    
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Execute<'info> {
    /// CHECK: Source token account
    pub source: UncheckedAccount<'info>,
    
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    
    /// CHECK: Destination token account
    pub destination: UncheckedAccount<'info>,
    
    /// CHECK: Source token account authority
    pub source_authority: UncheckedAccount<'info>,
    
    // --- Extra accounts (resolved via ExtraAccountMetaList) ---
    #[account(
        mut,
        seeds = [b"hook-config", mint.key().as_ref()],
        bump = hook_config.bump,
    )]
    pub hook_config: Account<'info, HookConfig>,
    
    /// CHECK: SSS-Core program ID
    pub sss_core_program: UncheckedAccount<'info>,
    
    /// CHECK: Sender's blacklist entry PDA
    pub sender_blacklist_entry: UncheckedAccount<'info>,
    
    /// CHECK: Recipient's blacklist entry PDA
    pub recipient_blacklist_entry: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct AdminHook<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"hook-config", hook_config.mint.as_ref()],
        bump = hook_config.bump,
        has_one = authority,
    )]
    pub hook_config: Account<'info, HookConfig>,
}

#[event]
pub struct TransferBlocked {
    pub mint: Pubkey,
    pub blocked_address: Pubkey,
    pub reason: String,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TransferValidated {
    pub mint: Pubkey,
    pub source: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
