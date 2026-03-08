use crate::errors::SSSError;
use crate::state::{proposal_status, GovernanceAction, Multisig, Proposal, StablecoinConfig};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, MintTo, Token2022, TransferChecked};

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,

    #[account(
        seeds = [b"sss-multisig", multisig.mint.as_ref()],
        bump = multisig.bump,
    )]
    pub multisig: Account<'info, Multisig>,

    #[account(
        mut,
        seeds = [b"sss-proposal", multisig.key().as_ref(), &proposal.id.to_le_bytes()],
        bump = proposal.bump,
        has_one = multisig,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        seeds = [b"sss-config", multisig.mint.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
}

pub fn execute_proposal<'info>(
    ctx: Context<'_, '_, '_, 'info, ExecuteProposal<'info>>,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    // multisig is validated via the accounts struct constraint
    let config = &mut ctx.accounts.config;

    require!(
        proposal.status == proposal_status::APPROVED,
        SSSError::ThresholdNotMet
    );
    require!(
        Clock::get()?.unix_timestamp >= proposal.eta,
        SSSError::ProposalTimeLockNotMatured
    );

    proposal.status = proposal_status::EXECUTED;

    let config_bump = config.bump;
    let mint_key = config.mint;
    let signer_seeds: &[&[&[u8]]] = &[&[b"sss-config", mint_key.as_ref(), &[config_bump]]];

    match &proposal.action {
        GovernanceAction::MintTo { amount, to } => {
            // Requires 1 remaining account: `to` token account
            let to_account_info = next_account_info(&mut ctx.remaining_accounts.iter())?;
            if to_account_info.key() != *to {
                return Err(ProgramError::InvalidArgument.into());
            }

            let cpi_accounts = MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: to_account_info.clone(),
                authority: config.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer_seeds,
            );
            token_interface::mint_to(cpi_ctx, *amount)?;
        }
        GovernanceAction::Seize { amount, from, to } => {
            // Requires 2 remaining accounts: `from` and `to` token accounts
            let mut iter = ctx.remaining_accounts.iter();
            let from_account_info = next_account_info(&mut iter)?;
            let to_account_info = next_account_info(&mut iter)?;

            if from_account_info.key() != *from || to_account_info.key() != *to {
                return Err(ProgramError::InvalidArgument.into());
            }

            let cpi_accounts = TransferChecked {
                from: from_account_info.clone(),
                mint: ctx.accounts.mint.to_account_info(),
                to: to_account_info.clone(),
                authority: config.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer_seeds,
            );
            token_interface::transfer_checked(cpi_ctx, *amount, ctx.accounts.mint.decimals)?;
        }
        GovernanceAction::UpdateRoles {
            new_master_authority,
            new_pauser,
            new_minter_authority,
            new_burner,
            new_blacklister,
            new_seizer,
            new_hook_authority,
        } => {
            if let Some(auth) = new_master_authority {
                config.master_authority = *auth;
            }
            if let Some(pauser) = new_pauser {
                config.pauser = *pauser;
            }
            if let Some(minter) = new_minter_authority {
                config.minter_authority = *minter;
            }
            if let Some(burner) = new_burner {
                config.burner = *burner;
            }
            if let Some(blacklister) = new_blacklister {
                config.blacklister = Some(*blacklister);
            }
            if let Some(seizer) = new_seizer {
                config.seizer = Some(*seizer);
            }
            if let Some(hook) = new_hook_authority {
                config.hook_authority = Some(*hook);
            }
        }
        GovernanceAction::DelegateToDao { program_id } => {
            config.master_authority = *program_id;
        }
    }

    Ok(())
}
