use crate::errors::SSSError;
use crate::state::{proposal_status, Multisig, Proposal};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ApproveProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"sss-multisig", multisig.mint.as_ref()],
        bump = multisig.bump,
    )]
    pub multisig: Account<'info, Multisig>,

    // Realloc is used here to safely extend the array size of approvals in the PDA
    #[account(
        mut,
        seeds = [b"sss-proposal", multisig.key().as_ref(), &proposal.id.to_le_bytes()],
        bump = proposal.bump,
        has_one = multisig,
        realloc = Proposal::space(proposal.approvals.len() + 1),
        realloc::payer = signer,
        realloc::zero = false,
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn approve_proposal(ctx: Context<ApproveProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let multisig = &ctx.accounts.multisig;
    let signer_key = ctx.accounts.signer.key();

    require!(
        proposal.status == proposal_status::PENDING,
        SSSError::ProposalAlreadyExecuted
    ); // technically already executed, cancelled, or approved
    require!(
        multisig.signers.contains(&signer_key),
        SSSError::SignerNotMultisigMember
    );
    require!(
        !proposal.approvals.contains(&signer_key),
        SSSError::DuplicateApproval
    );

    proposal.approvals.push(signer_key);

    if proposal.approvals.len() as u8 >= multisig.threshold {
        proposal.status = proposal_status::APPROVED;
    }

    Ok(())
}
