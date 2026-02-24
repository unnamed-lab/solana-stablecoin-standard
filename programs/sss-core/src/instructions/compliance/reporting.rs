use anchor_lang::prelude::*;
use crate::state::{ComplianceReport, ReportType, DailyMetrics};
use crate::utils::time::*;

#[account]
#[derive(Default)]
pub struct ComplianceAuditor {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub reporting_frequency: ReportType,
    pub last_report_generated: i64,
    pub next_report_due: i64,
    pub bump: u8,
}

impl ComplianceAuditor {
    pub fn generate_daily_report(
        &self,
        metrics: &DailyMetrics,
    ) -> Result<ComplianceReport> {
        Ok(ComplianceReport {
            mint: self.mint,
            report_type: ReportType::Daily,
            period_start: get_day_start(metrics.date),
            period_end: metrics.date,
            total_transactions: metrics.transfers,
            total_volume: metrics.transfer_volume,
            frozen_accounts: 0, // Would be fetched from on-chain state
            blacklisted_accounts: 0, // Would be fetched
            suspicious_transactions: 0, // Would be calculated
            report_uri: String::new(), // Would be IPFS hash
            bump: 0,
        })
    }
    
    pub fn should_generate_report(&self, current_time: i64) -> bool {
        current_time >= self.next_report_due
    }
}

pub fn format_compliance_audit_trail(
    mint: Pubkey,
    start_time: i64,
    end_time: i64,
) -> String {
    // Format compliance data for regulators
    format!(
        "Compliance Audit Report\n\
         Mint: {}\n\
         Period: {} to {}\n\
         Generated: {}\n\
         ---\n",
        mint,
        format_timestamp(start_time),
        format_timestamp(end_time),
        format_timestamp(current_timestamp().unwrap())
    )
}