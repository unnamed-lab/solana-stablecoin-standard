use anchor_lang::prelude::*;
use crate::errors::StablecoinError;

pub fn checked_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or(error!(StablecoinError::MathOverflow))
}

pub fn checked_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or(error!(StablecoinError::MathOverflow))
}

pub fn checked_mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b).ok_or(error!(StablecoinError::MathOverflow))
}

pub fn checked_div(a: u64, b: u64) -> Result<u64> {
    if b == 0 {
        return Err(error!(StablecoinError::InvalidAmount));
    }
    a.checked_div(b).ok_or(error!(StablecoinError::MathOverflow))
}

pub fn calculate_percentage(amount: u64, percentage: u16) -> Result<u64> {
    // percentage is in basis points (1/100 of a percent)
    // e.g., 100 = 1%, 10000 = 100%
    checked_mul(amount, percentage as u64)?
        .checked_div(10000)
        .ok_or(error!(StablecoinError::MathOverflow))
}

pub fn calculate_fee(amount: u64, fee_basis_points: u16) -> Result<u64> {
    calculate_percentage(amount, fee_basis_points)
}

pub fn scale_amount(amount: u64, from_decimals: u8, to_decimals: u8) -> Result<u64> {
    if from_decimals == to_decimals {
        return Ok(amount);
    }
    
    if from_decimals < to_decimals {
        let multiplier = 10u64.pow((to_decimals - from_decimals) as u32);
        checked_mul(amount, multiplier)
    } else {
        let divisor = 10u64.pow((from_decimals - to_decimals) as u32);
        checked_div(amount, divisor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_checked_add() {
        assert_eq!(checked_add(5, 3).unwrap(), 8);
        assert!(checked_add(u64::MAX, 1).is_err());
    }

    #[test]
    fn test_calculate_percentage() {
        assert_eq!(calculate_percentage(1000, 100).unwrap(), 10); // 1% of 1000
        assert_eq!(calculate_percentage(1000, 10000).unwrap(), 1000); // 100% of 1000
        assert_eq!(calculate_percentage(1000, 0).unwrap(), 0);
    }
}