use anchor_lang::prelude::*;
use switchboard_on_demand::{PullFeedAccountData, Discriminator as _};
use crate::errors::OracleError;

// ─── Constants ───────────────────────────────────────────────────────────────

/// Maximum allowed age (in seconds) for a price feed before it is
/// considered stale. Tune this per-feed in production if needed.
const MAX_PRICE_AGE_SECONDS: i64 = 60;

/// Minimum accepted number of oracle successes in a V2 round.
/// A round with zero successes should never be trusted.
const MIN_ROUND_SUCCESS: u32 = 1;

/// Maximum allowed decimal scale. i128→f64 precision is lost beyond
/// ~18 significant digits anyway, and scale > 38 will make divisor
/// overflow to f64::INFINITY, silently zeroing the result.
const MAX_DECIMAL_SCALE: u32 = 18;

/// Minimum account size we expect for a Switchboard V2 aggregator.
/// The full struct is ~4 300+ bytes; 500 is a conservative floor.
const MIN_AGGREGATOR_SIZE: usize = 500;

// ─── Output type ─────────────────────────────────────────────────────────────

/// Parsed, validated price data from a Switchboard feed.
#[derive(Debug, Clone, Copy)]
pub struct SwitchboardPrice {
    /// The latest confirmed result value (always > 0.0 after validation).
    pub value: f64,
    /// Standard deviation / confidence interval.
    /// For V3 On-Demand feeds this is sourced from `result.std_deviation`
    /// rather than the `max_variance` config field.
    pub std_deviation: f64,
    /// Unix timestamp of the latest confirmed round (or last update for V3).
    pub round_open_timestamp: i64,
}

// ─── Public entry point ───────────────────────────────────────────────────────

/// Read and validate the latest price from a Switchboard V2 aggregator
/// account **or** a V3 On-Demand PullFeed account.
///
/// Applies staleness and sanity checks that are common to both paths so
/// that callers do not have to repeat them.
///
/// # Caller responsibilities
/// * Verify that the account is owned by the correct Switchboard program
///   before passing `account_data` here (use an `owner =` constraint on
///   the Anchor `AccountInfo`).
/// * Pass the raw `.data.borrow()` bytes of the account.
///
/// # Errors
/// Returns `OracleError::FeedNotReady`  – bad discriminator / too small / zero successes
/// Returns `OracleError::PriceStale`    – price older than `MAX_PRICE_AGE_SECONDS`
/// Returns `OracleError::InvalidPrice`  – value ≤ 0 or non-finite
/// Returns `OracleError::InvalidFeedData` – scale out of range
/// Returns `OracleError::DivisionByZero` – (shouldn't happen with scale guard, kept as safety net)
pub fn read_switchboard_price(account_data: &[u8]) -> Result<SwitchboardPrice> {
    // Need at least 8 bytes to read the discriminator.
    require!(account_data.len() >= 8, OracleError::FeedNotReady);

    let price = if account_data.starts_with(PullFeedAccountData::DISCRIMINATOR) {
        read_ondemand_pull_feed(account_data)?
    } else {
        read_v2_aggregator_feed(account_data)?
    };

    // ── Common post-parse validation ──────────────────────────────────────

    // 1. Staleness check — applies to both V2 and V3.
    let clock = Clock::get()?;
    let age = clock
        .unix_timestamp
        .checked_sub(price.round_open_timestamp)
        .unwrap_or(i64::MAX); // overflow → treat as infinitely old

    require!(age >= 0, OracleError::PriceTooStale);              // clock skew guard
    require!(age <= MAX_PRICE_AGE_SECONDS, OracleError::PriceTooStale);

    // 2. Sanity-check the value itself.
    require!(price.value.is_finite(), OracleError::InvalidPrice);
    require!(price.value > 0.0, OracleError::InvalidPrice);

    Ok(price)
}

// ─── V3 On-Demand path ───────────────────────────────────────────────────────

fn read_ondemand_pull_feed(account_data: &[u8]) -> Result<SwitchboardPrice> {
    let expected_len = 8 + std::mem::size_of::<PullFeedAccountData>();
    require!(account_data.len() >= expected_len, OracleError::FeedNotReady);

    // Parse zero-copy via pointer cast to avoid large stack allocations (PullFeedAccountData is >3KB).
    // The slice length is verified above, and AccountInfo.data is 8-byte aligned by Solana.
    let feed = unsafe {
        &*(account_data[8..].as_ptr() as *const PullFeedAccountData)
    };

    // On-Demand feeds use a fixed precision of 18 as per switchboard_on_demand crate
    let scale = 18;

    // result is of type CurrentResult 
    let value = decimal_to_f64(feed.result.value, scale)?;
    
    // We can also extract standard deviation from feed.result.std_dev
    let std_deviation = decimal_to_f64(feed.result.std_dev, scale).unwrap_or(0.0);

    Ok(SwitchboardPrice {
        value,
        std_deviation,
        round_open_timestamp: feed.last_update_timestamp,
    })
}

// ─── V2 Aggregator path ───────────────────────────────────────────────────────

/// Parse a Switchboard V2 `AggregatorAccountData` account using its known
/// binary layout.
///
/// ## Layout reference
///
/// ```text
/// Offset   0 :  8-byte anchor discriminator
/// Offset   8 :  name [32 bytes]
/// ...                (many fields omitted)
/// Offset 208 :  latest_confirmed_round  (AggregatorRound)
///   +  0 :  num_success         u32   (4 bytes)
///   +  4 :  num_error           u32   (4 bytes)
///   +  8 :  is_closed           bool  (1 byte)
///   +  9 :  round_open_slot     u64   (8 bytes)
///   + 17 :  round_open_timestamp i64  (8 bytes)
///   + 25 :  result              SwitchboardDecimal (20 bytes: i128 mantissa + u32 scale)
///   + 45 :  std_deviation       SwitchboardDecimal (20 bytes)
/// ```
///
/// These offsets are stable for Switchboard V2.  Verify against the upstream
/// struct definition if you upgrade the Switchboard SDK.
fn read_v2_aggregator_feed(account_data: &[u8]) -> Result<SwitchboardPrice> {
    require!(
        account_data.len() >= MIN_AGGREGATOR_SIZE,
        OracleError::FeedNotReady
    );

    const ROUND_BASE: usize = 208;

    // ── num_success at ROUND_BASE + 0 ─────────────────────────────────────
    let num_success = read_u32(account_data, ROUND_BASE)?;
    require!(num_success >= MIN_ROUND_SUCCESS, OracleError::FeedNotReady);

    // ── round_open_timestamp at ROUND_BASE + 17 ───────────────────────────
    let round_open_timestamp = read_i64(account_data, ROUND_BASE + 17)?;

    // ── result (SwitchboardDecimal) at ROUND_BASE + 25 ───────────────────
    // SwitchboardDecimal = i128 mantissa (16 bytes) + u32 scale (4 bytes) = 20 bytes
    let value = read_switchboard_decimal(account_data, ROUND_BASE + 25)?;

    // ── std_deviation (SwitchboardDecimal) at ROUND_BASE + 45 ────────────
    // Starts immediately after result: 25 + 20 = 45
    let std_deviation = read_switchboard_decimal(account_data, ROUND_BASE + 45)?;

    Ok(SwitchboardPrice {
        value,
        std_deviation,
        round_open_timestamp,
    })
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

/// Read a `SwitchboardDecimal` (i128 mantissa + u32 scale) starting at `offset`.
///
/// `value = mantissa / 10^scale`
///
/// Precision note: casting i128 → f64 loses precision for mantissas with more
/// than ~15–16 significant decimal digits.  This is acceptable for typical
/// price feeds but callers should be aware of the trade-off.
fn read_switchboard_decimal(data: &[u8], offset: usize) -> Result<f64> {
    require!(
        data.len() >= offset + 20,
        OracleError::FeedNotReady
    );

    let mantissa = i128::from_le_bytes(
        data[offset..offset + 16]
            .try_into()
            .map_err(|_| error!(OracleError::FeedNotReady))?,
    );

    let scale = u32::from_le_bytes(
        data[offset + 16..offset + 20]
            .try_into()
            .map_err(|_| error!(OracleError::FeedNotReady))?,
    );

    decimal_to_f64(mantissa, scale)
}

/// Convert a (mantissa, scale) pair to f64.
///
/// Shared by both V2 and V3 paths.
fn decimal_to_f64(mantissa: i128, scale: u32) -> Result<f64> {
    // Guard against scale values that would push the divisor to infinity,
    // silently zeroing the result.
    require!(scale <= MAX_DECIMAL_SCALE, OracleError::FeedNotReady);

    let divisor = 10f64.powi(scale as i32);

    // With the scale guard above, divisor is always a normal positive f64.
    // The explicit check is kept as a safety net.
    if divisor == 0.0 || !divisor.is_finite() {
        return Err(error!(OracleError::DivisionByZero));
    }

    Ok(mantissa as f64 / divisor)
}

/// Read a little-endian `u32` at `offset`.
fn read_u32(data: &[u8], offset: usize) -> Result<u32> {
    require!(data.len() >= offset + 4, OracleError::FeedNotReady);
    Ok(u32::from_le_bytes(
        data[offset..offset + 4]
            .try_into()
            .map_err(|_| error!(OracleError::FeedNotReady))?,
    ))
}

/// Read a little-endian `i64` at `offset`.
fn read_i64(data: &[u8], offset: usize) -> Result<i64> {
    require!(data.len() >= offset + 8, OracleError::FeedNotReady);
    Ok(i64::from_le_bytes(
        data[offset..offset + 8]
            .try_into()
            .map_err(|_| error!(OracleError::FeedNotReady))?,
    ))
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── decimal_to_f64 ────────────────────────────────────────────────────

    #[test]
    fn test_decimal_to_f64_basic() {
        // 12345 / 10^2 = 123.45
        let result = decimal_to_f64(12345, 2).unwrap();
        assert!((result - 123.45).abs() < 1e-9);
    }

    #[test]
    fn test_decimal_to_f64_zero_scale() {
        // 42 / 10^0 = 42.0
        let result = decimal_to_f64(42, 0).unwrap();
        assert!((result - 42.0).abs() < 1e-9);
    }

    #[test]
    fn test_decimal_to_f64_negative_mantissa() {
        // -5000 / 10^3 = -5.0
        let result = decimal_to_f64(-5000, 3).unwrap();
        assert!((result - (-5.0)).abs() < 1e-9);
    }

    #[test]
    fn test_decimal_to_f64_scale_too_large() {
        // scale > MAX_DECIMAL_SCALE should error
        assert!(decimal_to_f64(1, MAX_DECIMAL_SCALE + 1).is_err());
    }

    // ── read_u32 / read_i64 ───────────────────────────────────────────────

    #[test]
    fn test_read_u32_roundtrip() {
        let val: u32 = 0xDEAD_BEEF;
        let mut buf = vec![0u8; 8];
        buf[2..6].copy_from_slice(&val.to_le_bytes());
        assert_eq!(read_u32(&buf, 2).unwrap(), val);
    }

    #[test]
    fn test_read_i64_roundtrip() {
        let val: i64 = -987_654_321;
        let mut buf = vec![0u8; 16];
        buf[4..12].copy_from_slice(&val.to_le_bytes());
        assert_eq!(read_i64(&buf, 4).unwrap(), val);
    }

    #[test]
    fn test_read_u32_out_of_bounds() {
        let buf = vec![0u8; 2];
        assert!(read_u32(&buf, 0).is_err());
    }

    // ── read_switchboard_decimal ──────────────────────────────────────────

    #[test]
    fn test_read_switchboard_decimal_roundtrip() {
        // mantissa = 1_000_000, scale = 6  →  value = 1.0
        let mantissa: i128 = 1_000_000;
        let scale: u32 = 6;
        let mut data = vec![0u8; 20];
        data[0..16].copy_from_slice(&mantissa.to_le_bytes());
        data[16..20].copy_from_slice(&scale.to_le_bytes());

        let value = read_switchboard_decimal(&data, 0).unwrap();
        assert!((value - 1.0).abs() < 1e-9, "got {}", value);
    }

    #[test]
    fn test_read_switchboard_decimal_too_short() {
        let data = vec![0u8; 10]; // needs 20
        assert!(read_switchboard_decimal(&data, 0).is_err());
    }

    // ── V2 layout smoke test ──────────────────────────────────────────────

    #[test]
    fn test_v2_min_size_check() {
        let data = vec![0u8; MIN_AGGREGATOR_SIZE - 1];
        assert!(read_v2_aggregator_feed(&data).is_err());
    }

    #[test]
    fn test_v2_zero_num_success_rejected() {
        // Build a buffer large enough; num_success at offset 208 = 0 (default)
        let data = vec![0u8; MIN_AGGREGATOR_SIZE + 100];
        // num_success = 0 at ROUND_BASE → should fail
        assert!(read_v2_aggregator_feed(&data).is_err());
    }

    #[test]
    fn test_v2_valid_round() {
        const ROUND_BASE: usize = 208;
        let mut data = vec![0u8; ROUND_BASE + 100];

        // num_success = 3
        data[ROUND_BASE..ROUND_BASE + 4].copy_from_slice(&3u32.to_le_bytes());

        // round_open_timestamp = 1_700_000_000
        let ts: i64 = 1_700_000_000;
        data[ROUND_BASE + 17..ROUND_BASE + 25].copy_from_slice(&ts.to_le_bytes());

        // result: mantissa = 500_000, scale = 4  → 50.0
        let mantissa: i128 = 500_000;
        let scale: u32 = 4;
        data[ROUND_BASE + 25..ROUND_BASE + 41].copy_from_slice(&mantissa.to_le_bytes());
        data[ROUND_BASE + 41..ROUND_BASE + 45].copy_from_slice(&scale.to_le_bytes());

        // std_deviation: mantissa = 100, scale = 4  → 0.01
        let std_mantissa: i128 = 100;
        let std_scale: u32 = 4;
        data[ROUND_BASE + 45..ROUND_BASE + 61].copy_from_slice(&std_mantissa.to_le_bytes());
        data[ROUND_BASE + 61..ROUND_BASE + 65].copy_from_slice(&std_scale.to_le_bytes());

        let price = read_v2_aggregator_feed(&data).unwrap();
        assert!((price.value - 50.0).abs() < 1e-6, "value: {}", price.value);
        assert!((price.std_deviation - 0.01).abs() < 1e-9, "std_dev: {}", price.std_deviation);
        assert_eq!(price.round_open_timestamp, ts);
    }
}