use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct AuditLog {
    pub mint: Pubkey,
    pub entries: u64,                   // Total entries count
    pub last_entry: i64,                 // Timestamp of last entry
    pub bump: u8,
}

#[account]
#[derive(Default)]
pub struct AuditEntry {
    pub mint: Pubkey,
    pub action_type: ActionType,
    pub actor: Pubkey,
    pub target: Option<Pubkey>,
    pub amount: Option<u64>,
    pub timestamp: i64,
    pub signature: String,               // Transaction signature
    pub metadata: Option<String>,         // Additional JSON metadata
    pub bump: u8,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug, Default)]
pub enum ActionType {
    #[default]
    Initialize = 0,
    Mint = 1,
    Burn = 2,
    Freeze = 3,
    Thaw = 4,
    Pause = 5,
    Unpause = 6,
    BlacklistAdd = 7,
    BlacklistRemove = 8,
    Seize = 9,
    RoleUpdate = 10,
    Transfer = 11,
    TransferHook = 12,
}

impl AuditEntry {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        1 + // action_type
        32 + // actor
        33 + // target (Option)
        9 + // amount (Option)
        8 + // timestamp
        4 + 64 + // signature (String)
        4 + 256 + // metadata (Option<String>)
        1; // bump
}

#[account]
#[derive(Default)]
pub struct ComplianceReport {
    pub mint: Pubkey,
    pub report_type: ReportType,
    pub period_start: i64,
    pub period_end: i64,
    pub total_transactions: u64,
    pub total_volume: u64,
    pub frozen_accounts: u32,
    pub blacklisted_accounts: u32,
    pub suspicious_transactions: u32,
    pub report_uri: String,              // IPFS/Arweave link to full report
    pub bump: u8,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug, Default)]
pub enum ReportType {
    #[default]
    Daily = 0,
    Weekly = 1,
    Monthly = 2,
    Quarterly = 3,
    Annual = 4,
}