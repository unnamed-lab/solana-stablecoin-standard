use crate::errors::SSSError;
use crate::state::{proposal_status, GovernanceAction, Multisig, Proposal};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(action: GovernanceAction)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sss-multisig", multisig.mint.as_ref()],
        bump = multisig.bump,
    )]
    pub multisig: Account<'info, Multisig>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::space(0),
        seeds = [b"sss-proposal", multisig.key().as_ref(), &multisig.proposal_nonce.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn create_proposal(ctx: Context<CreateProposal>, action: GovernanceAction) -> Result<()> {
    require!(
        ctx.accounts
            .multisig
            .signers
            .contains(&ctx.accounts.proposer.key()),
        SSSError::SignerNotMultisigMember
    );

    let multisig = &mut ctx.accounts.multisig;
    let proposal = &mut ctx.accounts.proposal;

    let current_time = Clock::get()?.unix_timestamp;

    proposal.multisig = multisig.key();
    proposal.id = multisig.proposal_nonce;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.action = action;
    proposal.approvals = vec![];
    proposal.status = proposal_status::PENDING;
    proposal.proposed_at = current_time;
    proposal.eta = current_time + multisig.time_lock_secs;
    proposal.bump = ctx.bumps.proposal;

    multisig.proposal_nonce += 1;

    Ok(())
}
