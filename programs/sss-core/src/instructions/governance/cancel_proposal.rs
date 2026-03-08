use crate::errors::SSSError;
use crate::state::{proposal_status, Multisig, Proposal};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

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
        has_one = proposer, // Only the proposer can cancel
    )]
    pub proposal: Account<'info, Proposal>,
}

pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    require!(
        proposal.status == proposal_status::PENDING || proposal.status == proposal_status::APPROVED,
        SSSError::ProposalAlreadyExecuted
    );

    proposal.status = proposal_status::CANCELLED;
    Ok(())
}
