use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct MinterQuota {
    pub minter: Pubkey,
    pub mint: Pubkey,
    pub daily_quota: Option<u64>,      // Max per day
    pub total_quota: Option<u64>,       // Lifetime max
    pub minted_today: u64,
    pub total_minted: u64,
    pub last_reset: i64,
    pub bump: u8,
}

#[account]
#[derive(Default)]
pub struct BurnerQuota {
    pub burner: Pubkey,
    pub mint: Pubkey,
    pub daily_quota: Option<u64>,
    pub total_quota: Option<u64>,
    pub burned_today: u64,
    pub total_burned: u64,
    pub last_reset: i64,
    pub bump: u8,
}

#[account]
#[derive(Default)]
pub struct DailyMetrics {
    pub mint: Pubkey,
    pub date: i64,                      // Unix timestamp at start of day
    pub minted: u64,
    pub burned: u64,
    pub transfers: u64,
    pub transfer_volume: u64,
    pub unique_senders: u32,
    pub unique_receivers: u32,
    pub bump: u8,
}

impl MinterQuota {
    pub fn can_mint(&self, amount: u64, current_time: i64) -> bool {
        // Reset daily quota if new day
        let daily_available = if let Some(quota) = self.daily_quota {
            let minted_today = if self.is_new_day(current_time) { 0 } else { self.minted_today };
            minted_today.saturating_add(amount) <= quota
        } else {
            true
        };

        // Check total quota
        let total_available = if let Some(quota) = self.total_quota {
            self.total_minted.saturating_add(amount) <= quota
        } else {
            true
        };

        daily_available && total_available
    }

    fn is_new_day(&self, current_time: i64) -> bool {
        let current_day = current_time / 86400; // Seconds in a day
        let last_day = self.last_reset / 86400;
        current_day > last_day
    }
}