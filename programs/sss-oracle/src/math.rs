use anchor_lang::prelude::*;
use crate::state::FeedType;
use crate::errors::OracleError;

/// Fixed-point scale for prices: 1_000_000 = 1.0
pub const PRICE_SCALE: u64 = 1_000_000;

/// Fixed-point scale for CPI multiplier: 1_000_000 = 1.0
pub const CPI_SCALE: u64 = 1_000_000;

/// Token decimals for SSS standard (always 6)
pub const TOKEN_DECIMALS: u32 = 6;

/// 10^TOKEN_DECIMALS
pub const TOKEN_SCALE: u64 = 1_000_000;

// ─── Token amount calculations ──────────────────────────────────────────────

/// Calculate how many tokens to mint for a given USD input.
///
/// All math uses u128 intermediaries to avoid overflow.
///
/// - `Direct`:     tokens = (usd_cents * TOKEN_SCALE * PRICE_SCALE) / (price_scaled * 100)
/// - `Inverse`:    tokens = (usd_cents * price_scaled * TOKEN_SCALE) / (PRICE_SCALE * 100)
/// - `CpiIndexed`: tokens = (usd_cents * TOKEN_SCALE * CPI_SCALE)   / (cpi_multiplier * 100)
/// - `Custom`:     applies numerator/denominator scaling then delegates to Direct or Inverse
pub fn calc_token_amount_for_usd(
    usd_cents:       u64,
    price_scaled:    u64,
    feed_type:       &FeedType,
    cpi_multiplier:  u64,
) -> Result<u64> {
    require!(price_scaled > 0, OracleError::InvalidPrice);

    let result = match feed_type {
        FeedType::Direct => {
            // tokens = usd_cents / 100 * (1 / price) * TOKEN_SCALE
            // = (usd_cents * TOKEN_SCALE * PRICE_SCALE) / (price_scaled * 100)
            let numerator   = (usd_cents as u128)
                .checked_mul(TOKEN_SCALE as u128)
                .and_then(|v| v.checked_mul(PRICE_SCALE as u128))
                .ok_or(OracleError::MathOverflow)?;
            let denominator = (price_scaled as u128)
                .checked_mul(100)
                .ok_or(OracleError::MathOverflow)?;
            require!(denominator > 0, OracleError::DivisionByZero);
            numerator / denominator
        }

        FeedType::Inverse => {
            // tokens = usd_cents / 100 * price * TOKEN_SCALE
            // = (usd_cents * price_scaled * TOKEN_SCALE) / (PRICE_SCALE * 100)
            let numerator   = (usd_cents as u128)
                .checked_mul(price_scaled as u128)
                .and_then(|v| v.checked_mul(TOKEN_SCALE as u128))
                .ok_or(OracleError::MathOverflow)?;
            let denominator = (PRICE_SCALE as u128)
                .checked_mul(100)
                .ok_or(OracleError::MathOverflow)?;
            numerator / denominator
        }

        FeedType::CpiIndexed => {
            // tokens = (usd_cents / 100) / (cpi_multiplier / CPI_SCALE) * TOKEN_SCALE
            // = (usd_cents * TOKEN_SCALE * CPI_SCALE) / (cpi_multiplier * 100)
            require!(cpi_multiplier > 0, OracleError::InvalidCpiMultiplier);
            let numerator   = (usd_cents as u128)
                .checked_mul(TOKEN_SCALE as u128)
                .and_then(|v| v.checked_mul(CPI_SCALE as u128))
                .ok_or(OracleError::MathOverflow)?;
            let denominator = (cpi_multiplier as u128)
                .checked_mul(100)
                .ok_or(OracleError::MathOverflow)?;
            numerator / denominator
        }

        FeedType::Custom { numerator, denominator, base_type } => {
            require!(*denominator > 0, OracleError::DivisionByZero);
            // Scale the price: adjusted_price = price * numerator / denominator
            let adjusted_price = (price_scaled as u128)
                .checked_mul(*numerator as u128)
                .ok_or(OracleError::MathOverflow)?
                / (*denominator as u128);
            let adjusted_u64 = u64::try_from(adjusted_price)
                .map_err(|_| error!(OracleError::MathOverflow))?;

            // Delegate to Direct (base_type=0) or Inverse (base_type=1)
            if *base_type == 0 {
                return calc_token_amount_for_usd(usd_cents, adjusted_u64, &FeedType::Direct, cpi_multiplier);
            } else {
                return calc_token_amount_for_usd(usd_cents, adjusted_u64, &FeedType::Inverse, cpi_multiplier);
            }
        }
    };

    u64::try_from(result).map_err(|_| error!(OracleError::MathOverflow))
}

/// Calculate how many USD cents to return for a given token amount (reverse of mint).
pub fn calc_usd_for_token_amount(
    token_amount:    u64,
    price_scaled:    u64,
    feed_type:       &FeedType,
    cpi_multiplier:  u64,
) -> Result<u64> {
    require!(price_scaled > 0, OracleError::InvalidPrice);

    let result = match feed_type {
        FeedType::Direct => {
            // usd_cents = token_amount / TOKEN_SCALE * price * 100
            // = (token_amount * price_scaled * 100) / (TOKEN_SCALE * PRICE_SCALE)
            let numerator   = (token_amount as u128)
                .checked_mul(price_scaled as u128)
                .and_then(|v| v.checked_mul(100))
                .ok_or(OracleError::MathOverflow)?;
            let denominator = (TOKEN_SCALE as u128)
                .checked_mul(PRICE_SCALE as u128)
                .ok_or(OracleError::MathOverflow)?;
            numerator / denominator
        }

        FeedType::Inverse => {
            // usd_cents = token_amount / TOKEN_SCALE / price * 100
            // = (token_amount * PRICE_SCALE * 100) / (TOKEN_SCALE * price_scaled)
            let numerator   = (token_amount as u128)
                .checked_mul(PRICE_SCALE as u128)
                .and_then(|v| v.checked_mul(100))
                .ok_or(OracleError::MathOverflow)?;
            let denominator = (TOKEN_SCALE as u128)
                .checked_mul(price_scaled as u128)
                .ok_or(OracleError::MathOverflow)?;
            require!(denominator > 0, OracleError::DivisionByZero);
            numerator / denominator
        }

        FeedType::CpiIndexed => {
            // usd_cents = token_amount / TOKEN_SCALE * (cpi_multiplier / CPI_SCALE) * 100
            // = (token_amount * cpi_multiplier * 100) / (TOKEN_SCALE * CPI_SCALE)
            require!(cpi_multiplier > 0, OracleError::InvalidCpiMultiplier);
            let numerator   = (token_amount as u128)
                .checked_mul(cpi_multiplier as u128)
                .and_then(|v| v.checked_mul(100))
                .ok_or(OracleError::MathOverflow)?;
            let denominator = (TOKEN_SCALE as u128)
                .checked_mul(CPI_SCALE as u128)
                .ok_or(OracleError::MathOverflow)?;
            numerator / denominator
        }

        FeedType::Custom { numerator, denominator, base_type } => {
            require!(*denominator > 0, OracleError::DivisionByZero);
            let adjusted_price = (price_scaled as u128)
                .checked_mul(*numerator as u128)
                .ok_or(OracleError::MathOverflow)?
                / (*denominator as u128);
            let adjusted_u64 = u64::try_from(adjusted_price)
                .map_err(|_| error!(OracleError::MathOverflow))?;

            if *base_type == 0 {
                return calc_usd_for_token_amount(token_amount, adjusted_u64, &FeedType::Direct, cpi_multiplier);
            } else {
                return calc_usd_for_token_amount(token_amount, adjusted_u64, &FeedType::Inverse, cpi_multiplier);
            }
        }
    };

    u64::try_from(result).map_err(|_| error!(OracleError::MathOverflow))
}

// ─── Fee math ───────────────────────────────────────────────────────────────

/// Apply a basis-point fee to a gross amount.
/// Returns (net_amount, fee_amount).
pub fn apply_fee(gross: u64, fee_bps: u16) -> Result<(u64, u64)> {
    let fee = (gross as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(OracleError::MathOverflow)?
        / 10_000u128;
    let fee_u64 = u64::try_from(fee).map_err(|_| error!(OracleError::MathOverflow))?;
    let net = gross.checked_sub(fee_u64).ok_or(OracleError::MathOverflow)?;
    Ok((net, fee_u64))
}

// ─── Validation helpers ─────────────────────────────────────────────────────

/// Reject if the price feed's last update is older than max_staleness.
pub fn validate_staleness(last_updated: i64, max_staleness_secs: i64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(
        now.saturating_sub(last_updated) <= max_staleness_secs,
        OracleError::PriceTooStale
    );
    Ok(())
}

/// Reject if the confidence interval is wider than max_confidence_bps of the price.
/// confidence_scaled and price_scaled are both * PRICE_SCALE.
pub fn validate_confidence(price_scaled: u64, confidence_scaled: u64, max_confidence_bps: u16) -> Result<()> {
    if max_confidence_bps == 0 {
        // 0 means no confidence check
        return Ok(());
    }
    // confidence_pct_bps = (confidence / price) * 10_000
    let conf_bps = (confidence_scaled as u128)
        .checked_mul(10_000)
        .ok_or(OracleError::MathOverflow)?
        / (price_scaled as u128);

    require!(
        conf_bps <= max_confidence_bps as u128,
        OracleError::ConfidenceTooWide
    );
    Ok(())
}

/// Check that output meets the minimum expected (slippage protection).
pub fn check_slippage(output: u64, min_output: u64) -> Result<()> {
    require!(output >= min_output, OracleError::SlippageExceeded);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_direct_eur_usd() {
        // EUR/USD = 1.08 → deposit $108 → get 100 EUR tokens
        let price = 1_080_000u64; // 1.08 * PRICE_SCALE
        let usd = 10_800u64;      // $108.00 in cents
        let tokens = calc_token_amount_for_usd(usd, price, &FeedType::Direct, CPI_SCALE).unwrap();
        assert_eq!(tokens, 100_000_000); // 100 tokens * TOKEN_SCALE
    }

    #[test]
    fn test_inverse_brl_usd() {
        // BRL/USD = 5.72 → deposit $100 → get 572 BRL tokens
        let price = 5_720_000u64; // 5.72 * PRICE_SCALE
        let usd = 10_000u64;      // $100.00 in cents
        let tokens = calc_token_amount_for_usd(usd, price, &FeedType::Inverse, CPI_SCALE).unwrap();
        assert_eq!(tokens, 572_000_000); // 572 tokens * TOKEN_SCALE
    }

    #[test]
    fn test_cpi_indexed() {
        // CPI multiplier = 1.083 → deposit $108.30 → get 100 tokens
        let cpi_mult = 1_083_000u64; // 1.083 * CPI_SCALE
        let usd = 10_830u64;         // $108.30 in cents
        let tokens = calc_token_amount_for_usd(usd, PRICE_SCALE, &FeedType::CpiIndexed, cpi_mult).unwrap();
        assert_eq!(tokens, 100_000_000); // 100 tokens
    }

    #[test]
    fn test_apply_fee_30bps() {
        let (net, fee) = apply_fee(1_000_000, 30).unwrap();
        assert_eq!(fee, 3_000);       // 0.3% of 1M
        assert_eq!(net, 997_000);     // 1M - 3K
    }

    #[test]
    fn test_roundtrip_direct() {
        let price = 1_080_000u64;
        let usd = 10_800u64;
        let tokens = calc_token_amount_for_usd(usd, price, &FeedType::Direct, CPI_SCALE).unwrap();
        let usd_back = calc_usd_for_token_amount(tokens, price, &FeedType::Direct, CPI_SCALE).unwrap();
        assert_eq!(usd_back, usd);
    }

    #[test]
    fn test_roundtrip_inverse() {
        let price = 5_720_000u64;
        let usd = 10_000u64;
        let tokens = calc_token_amount_for_usd(usd, price, &FeedType::Inverse, CPI_SCALE).unwrap();
        let usd_back = calc_usd_for_token_amount(tokens, price, &FeedType::Inverse, CPI_SCALE).unwrap();
        assert_eq!(usd_back, usd);
    }
}
