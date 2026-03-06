use anchor_lang::prelude::*;

// ═══════════════════════════════════════════════════════════════════════════
// ConfidentialConfig
// Per-mint SSS-3 configuration. Stores the auditor key and approval policy.
// PDA seed: ["sss-confidential", mint]
//
// Separate from StablecoinConfig because:
//   1. Keeps the base config account small (SSS-1/SSS-2 don't need these fields)
//   2. The auditor ElGamal key is large (64 bytes) and shouldn't bloat every config
//   3. Allows SSS-3 to be initialized as an upgrade path without redeploying
// ═══════════════════════════════════════════════════════════════════════════

/// Maximum length of the compliance note string stored in ConfidentialConfig
pub const MAX_COMPLIANCE_NOTE: usize = 200;

#[account]
pub struct ConfidentialConfig {
    /// Schema version — increment if structure changes
    pub version: u8,

    /// The SSS token mint this confidential config is for
    pub mint: Pubkey,

    /// Authority that can update this config (same as StablecoinConfig.master_authority)
    pub authority: Pubkey,

    /// ElGamal public key of the auditor.
    /// The holder of the corresponding private key can decrypt ALL ciphertext
    /// balances and transfer amounts on this mint.
    ///
    /// SECURITY: Treat this key material with HSM-level protection.
    /// If None: no auditor — fully private (not recommended for regulated tokens)
    /// If Some: auditor can see all amounts — compliant but privacy-limited
    ///
    /// Stored as 64 raw bytes (the compressed ElGamal pubkey format used by
    /// Token-2022's ConfidentialTransferMint extension)
    pub auditor_elgamal_pubkey: Option<[u8; 64]>,

    /// If true: any wallet can self-configure their ATA for confidential use.
    /// If false: the authority must explicitly call approve_confidential_account.
    ///
    /// For regulated stablecoins: MUST be false.
    pub auto_approve_new_accounts: bool,

    /// Human-readable note about the compliance/auditing arrangement.
    /// e.g. "Auditor key held by XYZ Law Firm under data protection agreement"
    pub compliance_note: String,

    /// Timestamp when confidential mode was enabled
    pub enabled_at: i64,

    /// Who enabled confidential mode
    pub enabled_by: Pubkey,

    /// Cumulative count of confidential transfer operations
    pub total_confidential_transfers: u64,

    pub bump: u8,
}

impl ConfidentialConfig {
    pub const LEN: usize = 8       // discriminator
        + 1                        // version
        + 32                       // mint
        + 32                       // authority
        + 1 + 64                   // auditor_elgamal_pubkey (Option<[u8;64]>)
        + 1                        // auto_approve_new_accounts
        + 4 + MAX_COMPLIANCE_NOTE  // compliance_note (String)
        + 8                        // enabled_at
        + 32                       // enabled_by
        + 8                        // total_confidential_transfers
        + 1                        // bump
        + 32; // slack
}

// ═══════════════════════════════════════════════════════════════════════════
// AllowlistEntry
// PDA that grants a specific address permission to transact.
// Only exists in SSS-3 mode. Transfer hook checks this for every transfer.
//
// PDA seed: ["sss-allowlist", mint, address]
//
// DESIGN vs SSS-2 BlacklistEntry:
//   BlacklistEntry (SSS-2): presence = BLOCKED  (default = allowed)
//   AllowlistEntry (SSS-3): presence = ALLOWED  (default = blocked)
// ═══════════════════════════════════════════════════════════════════════════

pub const MAX_ALLOWLIST_REASON: usize = 100;

/// Bitmask flags for AllowlistEntry.allowed_operations
pub mod allowlist_ops {
    pub const RECEIVE: u8 = 0b0000_0001;
    pub const SEND: u8 = 0b0000_0010;
    pub const BOTH: u8 = RECEIVE | SEND;
}

#[account]
pub struct AllowlistEntry {
    /// The SSS token mint this entry is for
    pub mint: Pubkey,

    /// The wallet address being allowlisted
    pub address: Pubkey,

    /// Bitmask of permitted operations — see allowlist_ops
    /// 0x01 = receive, 0x02 = send, 0x03 = both
    pub allowed_operations: u8,

    /// KYC tier (application-level metadata, not enforced by program)
    /// 0 = basic, 1 = enhanced (EDD), 2 = institutional
    pub kyc_tier: u8,

    /// Optional expiry timestamp.
    /// 0 = never expires
    /// If current time > expiry: hook rejects the transfer
    pub expiry: i64,

    /// Who added this entry
    pub added_by: Pubkey,

    /// Timestamp this entry was added
    pub added_at: i64,

    /// Reason for allowlisting (audit trail)
    pub reason: String,

    /// Whether this entry is active.
    /// Soft-delete: set to false rather than closing the account.
    pub active: bool,

    /// If active=false, who removed it
    pub removed_by: Option<Pubkey>,

    /// If active=false, when it was removed
    pub removed_at: i64,

    pub bump: u8,
}

impl AllowlistEntry {
    pub const LEN: usize = 8       // discriminator
        + 32                       // mint
        + 32                       // address
        + 1                        // allowed_operations
        + 1                        // kyc_tier
        + 8                        // expiry
        + 32                       // added_by
        + 8                        // added_at
        + 4 + MAX_ALLOWLIST_REASON // reason
        + 1                        // active
        + 1 + 32                   // removed_by (Option<Pubkey>)
        + 8                        // removed_at
        + 1                        // bump
        + 16; // slack

    pub fn is_valid_for_send(&self) -> bool {
        self.active
            && (self.expiry == 0 || Clock::get().map_or(false, |c| c.unix_timestamp < self.expiry))
            && (self.allowed_operations & allowlist_ops::SEND != 0)
    }

    pub fn is_valid_for_receive(&self) -> bool {
        self.active
            && (self.expiry == 0 || Clock::get().map_or(false, |c| c.unix_timestamp < self.expiry))
            && (self.allowed_operations & allowlist_ops::RECEIVE != 0)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SupplySnapshot
// Daily supply checkpoint — permissionless, anyone can write one per day.
// PDA seed: ["sss-snapshot", mint, day_number_bytes]
// ═══════════════════════════════════════════════════════════════════════════

#[account]
pub struct SupplySnapshot {
    pub mint: Pubkey,
    pub day_number: u32,
    pub supply: u64,
    pub minter_count: u32,
    pub taken_by: Pubkey,
    pub taken_at: i64,
    pub bump: u8,
}

impl SupplySnapshot {
    pub const LEN: usize = 8 + 32 + 4 + 8 + 4 + 32 + 8 + 1 + 8;

    pub fn day_number_from_timestamp(ts: i64) -> u32 {
        (ts / 86_400) as u32
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Events — SSS-3 specific
// ═══════════════════════════════════════════════════════════════════════════

#[event]
pub struct Sss3Initialized {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub auto_approve: bool,
    pub has_auditor: bool,
    pub allowlist_active: bool,
    pub timestamp: i64,
}

#[event]
pub struct AllowlistAdded {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub allowed_operations: u8,
    pub kyc_tier: u8,
    pub expiry: i64,
    pub added_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AllowlistRemoved {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub removed_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ConfidentialAccountApproved {
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub approved_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SupplySnapshotTaken {
    pub mint: Pubkey,
    pub day_number: u32,
    pub supply: u64,
    pub taken_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MaxSupplyUpdated {
    pub mint: Pubkey,
    pub old_max: u64,
    pub new_max: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}
