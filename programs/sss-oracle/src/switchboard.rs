use anchor_lang::prelude::*;
use crate::errors::OracleError;

/// Raw deserialization of Switchboard V2 AggregatorAccountData.
///
/// We parse just the fields we need (result value and round metadata)
/// directly from the account bytes, avoiding the switchboard-solana
/// crate dependency (which requires anchor-lang 0.30.x).
///
/// Layout reference: https://github.com/switchboard-xyz/solana-sdk
/// The aggregator account is a large struct (~4300+ bytes).
/// Key offsets for the latest confirmed round:
///   - result mantissa/scale is read via the SwitchboardDecimal at a known offset
///   - the round_open_timestamp and std_deviation are nearby

/// Minimum account size we expect for a Switchboard aggregator
const MIN_AGGREGATOR_SIZE: usize = 500;

/// Parsed price data from a Switchboard aggregator account
#[derive(Debug)]
pub struct SwitchboardPrice {
    /// The latest confirmed result value as f64
    pub value: f64,
    /// Standard deviation (confidence interval)
    pub std_deviation: f64,
    /// Unix timestamp of the latest confirmed round
    pub round_open_timestamp: i64,
}

/// Read the latest price from a Switchboard V2 aggregator account.
///
/// This function uses the known layout of the Switchboard aggregator
/// account to extract the result without depending on the switchboard crate.
///
/// # Safety
/// The account data must be a valid Switchboard aggregator account.
/// We validate the minimum size but cannot validate the account owner
/// from within the program (the caller must verify that).
pub fn read_switchboard_price(account_data: &[u8]) -> Result<SwitchboardPrice> {
    require!(
        account_data.len() >= MIN_AGGREGATOR_SIZE,
        OracleError::FeedNotReady
    );

    // ── Switchboard V2 Layout ──────────────────────────────────────────
    //
    // The AggregatorAccountData struct has many fields. The ones we need:
    //
    // Offset 208: latest_confirmed_round (AggregatorRound)
    //   - Offset  +0:  num_success (u32)
    //   - Offset  +4:  num_error   (u32)
    //   - Offset  +8:  is_closed   (bool, 1 byte)
    //   - Offset  +9:  round_open_slot (u64)
    //   - Offset +17:  round_open_timestamp (i64)
    //   - Offset +25:  result (SwitchboardDecimal: mantissa i128 + scale u32 = 20 bytes)
    //   - Offset +45:  std_deviation (SwitchboardDecimal: mantissa i128 + scale u32 = 20 bytes)
    //
    // SwitchboardDecimal layout:
    //   - mantissa: i128 (16 bytes, little-endian)
    //   - scale:    u32  (4 bytes, little-endian)
    //
    // These offsets are stable for Switchboard V2, but if the account
    // format changes, this module would need updating.

    let round_base: usize = 208;

    // round_open_timestamp at round_base + 17
    let ts_offset = round_base + 17;
    require!(
        account_data.len() >= ts_offset + 8,
        OracleError::FeedNotReady
    );
    let round_open_timestamp = i64::from_le_bytes(
        account_data[ts_offset..ts_offset + 8]
            .try_into()
            .map_err(|_| error!(OracleError::FeedNotReady))?,
    );

    // result (SwitchboardDecimal) at round_base + 25
    let result_offset = round_base + 25;
    let value = read_switchboard_decimal(account_data, result_offset)?;

    // std_deviation (SwitchboardDecimal) at round_base + 45
    let std_offset = round_base + 45;
    let std_deviation = read_switchboard_decimal(account_data, std_offset)?;

    Ok(SwitchboardPrice {
        value,
        std_deviation,
        round_open_timestamp,
    })
}

/// Read a SwitchboardDecimal (i128 mantissa + u32 scale) from a byte slice.
///
/// value = mantissa / 10^scale
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

    // value = mantissa / 10^scale
    let divisor = 10f64.powi(scale as i32);
    if divisor == 0.0 {
        return Err(error!(OracleError::DivisionByZero));
    }

    Ok(mantissa as f64 / divisor)
}
