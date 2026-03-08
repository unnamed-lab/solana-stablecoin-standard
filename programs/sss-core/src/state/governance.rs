use anchor_lang::prelude::*;

// ═══════════════════════════════════════════════════════════════════════════
// GovernanceAction
// Defines the exact administrative payload to be executed via SSS-3 Multi-Sig
// ═══════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum GovernanceAction {
    /// Mint tokens to a specific account
    MintTo { amount: u64, to: Pubkey },

    /// Seize tokens from a frozen account and send them to the treasury
    Seize {
        amount: u64,
        from: Pubkey,
        to: Pubkey,
    },

    /// Update the roles of the stablecoin config
    UpdateRoles {
        new_master_authority: Option<Pubkey>,
        new_pauser: Option<Pubkey>,
        new_minter_authority: Option<Pubkey>,
        new_burner: Option<Pubkey>,
        new_blacklister: Option<Pubkey>,
        new_seizer: Option<Pubkey>,
        new_hook_authority: Option<Pubkey>,
    },

    /// Delegate the SSS-3 multisig authority entirely to an external DAO program
    /// (e.g. SPL Governance) by giving it the master keys.
    DelegateToDao { program_id: Pubkey },
}

// ═══════════════════════════════════════════════════════════════════════════
// Multisig State
// PDA seed: ["sss-multisig", mint]
// ═══════════════════════════════════════════════════════════════════════════

#[account]
pub struct Multisig {
    pub mint: Pubkey,
    pub signers: Vec<Pubkey>,
    pub threshold: u8,
    pub time_lock_secs: i64,
    pub proposal_nonce: u64,
    pub bump: u8,
}

impl Multisig {
    pub fn space(signers_len: usize) -> usize {
        8 +                  // discriminator
        32 +                // mint
        (4 + signers_len * 32) + // signers (Vec)
        1 +                 // threshold
        8 +                 // time_lock_secs
        8 +                 // proposal_nonce
        1 // bump
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Proposal State
// PDA seed: ["sss-proposal", multisig, id]
// ═══════════════════════════════════════════════════════════════════════════

pub mod proposal_status {
    pub const PENDING: u8 = 0;
    pub const APPROVED: u8 = 1;
    pub const EXECUTED: u8 = 2;
    pub const CANCELLED: u8 = 3;
}

#[account]
pub struct Proposal {
    pub multisig: Pubkey,
    pub id: u64,
    pub proposer: Pubkey,
    pub action: GovernanceAction,
    pub approvals: Vec<Pubkey>,
    pub status: u8,
    pub proposed_at: i64,
    pub eta: i64, // Earliest time it can execute (proposed_at + time_lock_secs)
    pub bump: u8,
}

impl Proposal {
    pub fn space(approvals_len: usize) -> usize {
        8 +                 // discriminator
        32 +                // multisig
        8 +                 // id
        32 +                // proposer
        220 +               // action (max size for UpdateRoles ~ 200 bytes)
        (4 + approvals_len * 32) + // approvals (Vec)
        1 +                 // status
        8 +                 // proposed_at
        8 +                 // eta
        1 // bump
    }
}
