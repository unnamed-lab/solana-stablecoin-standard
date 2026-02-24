use anchor_lang::prelude::*;
use crate::constants::{ONE_DAY, ONE_WEEK, ONE_MONTH};

pub fn current_timestamp() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

pub fn is_expired(timestamp: i64, duration_seconds: i64) -> Result<bool> {
    let now = current_timestamp()?;
    Ok(now >= timestamp + duration_seconds)
}

pub fn days_ago(days: u64) -> Result<i64> {
    let now = current_timestamp()?;
    Ok(now - (days as i64 * ONE_DAY))
}

pub fn weeks_ago(weeks: u64) -> Result<i64> {
    let now = current_timestamp()?;
    Ok(now - (weeks as i64 * ONE_WEEK))
}

pub fn months_ago(months: u64) -> Result<i64> {
    let now = current_timestamp()?;
    Ok(now - (months as i64 * ONE_MONTH))
}

pub fn get_day_start(timestamp: i64) -> i64 {
    timestamp - (timestamp % ONE_DAY)
}

pub fn get_week_start(timestamp: i64) -> i64 {
    timestamp - (timestamp % ONE_WEEK)
}

pub fn get_month_start(timestamp: i64) -> i64 {
    timestamp - (timestamp % ONE_MONTH)
}

pub fn format_timestamp(timestamp: i64) -> String {
    let naive = chrono::NaiveDateTime::from_timestamp_opt(timestamp, 0).unwrap();
    naive.format("%Y-%m-%d %H:%M:%S").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_day_start() {
        let timestamp = 1700000000; // Some random timestamp
        let day_start = get_day_start(timestamp);
        assert_eq!(day_start % ONE_DAY, 0);
        assert!(day_start <= timestamp);
        assert!(timestamp - day_start < ONE_DAY);
    }
}