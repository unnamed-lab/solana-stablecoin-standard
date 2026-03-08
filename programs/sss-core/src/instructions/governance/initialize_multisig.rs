use crate::errors::SSSError;
use crate::state::{Multisig, StablecoinConfig};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(signers: Vec<Pubkey>, threshold: u8, time_lock_secs: i64)]
pub struct InitializeMultisig<'info> {
    #[account(mut)]
    pub master_authority: Signer<'info>,

    #[account(
        seeds = [b"sss-config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint,
        has_one = master_authority
    )]
    pub config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = master_authority,
        space = Multisig::space(signers.len()),
        seeds = [b"sss-multisig", mint.key().as_ref()],
        bump
    )]
    pub multisig: Account<'info, Multisig>,

    /// CHECK: The mint identifier
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_multisig(
    ctx: Context<InitializeMultisig>,
    signers: Vec<Pubkey>,
    threshold: u8,
    time_lock_secs: i64,
) -> Result<()> {
    require!(
        threshold > 0 && threshold as usize <= signers.len(),
        SSSError::InvalidThreshold
    );

    let multisig = &mut ctx.accounts.multisig;
    multisig.mint = ctx.accounts.mint.key();
    multisig.signers = signers;
    multisig.threshold = threshold;
    multisig.time_lock_secs = time_lock_secs;
    multisig.proposal_nonce = 0;
    multisig.bump = ctx.bumps.multisig;

    Ok(())
}
