use anchor_lang::prelude::*;
use crate::errors::StablecoinError;
use crate::state::{StablecoinConfig, Blacklist, BlacklistEntry};

pub fn validate_not_paused(config: &StablecoinConfig) -> Result<()> {
    if config.paused {
        return Err(error!(StablecoinError::Paused));
    }
    Ok(())
}

pub fn validate_amount(amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(error!(StablecoinError::InvalidAmount));
    }
    Ok(())
}

pub fn validate_roles(
    config: &StablecoinConfig,
    authority: Pubkey,
    required_role: &str,
) -> Result<()> {
    match required_role {
        "master" => {
            if config.master_authority != authority {
                return Err(error!(StablecoinError::UnauthorizedMaster));
            }
        }
        "minter" => {
            if config.minter != Some(authority) && config.master_authority != authority {
                return Err(error!(StablecoinError::UnauthorizedMinter));
            }
        }
        "burner" => {
            if config.burner != Some(authority) && config.master_authority != authority {
                return Err(error!(StablecoinError::UnauthorizedBurner));
            }
        }
        "pauser" => {
            if config.pauser != Some(authority) && config.master_authority != authority {
                return Err(error!(StablecoinError::UnauthorizedPauser));
            }
        }
        "blacklister" => {
            if config.blacklister != Some(authority) && config.master_authority != authority {
                return Err(error!(StablecoinError::UnauthorizedBlacklister));
            }
        }
        "seizer" => {
            if config.seizer != Some(authority) && config.master_authority != authority {
                return Err(error!(StablecoinError::UnauthorizedSeizer));
            }
        }
        _ => return Err(error!(StablecoinError::InvalidAuthority)),
    }
    Ok(())
}

pub fn validate_blacklist(
    blacklist_account: &Account<Blacklist>,
    address: Pubkey,
    expected_status: bool, // true = should be blacklisted, false = should not be blacklisted
) -> Result<()> {
    // This would check against the actual blacklist entries
    // For now, it's a placeholder for the actual implementation
    Ok(())
}

pub fn validate_not_blacklisted(
    blacklist: Option<&Account<Blacklist>>,
    address: Pubkey,
) -> Result<()> {
    if let Some(blacklist) = blacklist {
        // TODO
        // In a real implementation, we would check if address is in blacklist
        // For now, we assume it's not
    }
    Ok(())
}

pub fn validate_mint_cap(config: &StablecoinConfig, amount: u64) -> Result<()> {
    if !config.can_mint(amount) {
        return Err(error!(StablecoinError::SupplyCapExceeded));
    }
    Ok(())
}

pub fn validate_string_length(
    value: &str,
    max_len: usize,
    field_name: &str,
) -> Result<()> {
    if value.len() > max_len {
        return Err(StablecoinError::InvalidNameLength.into()); // Generic error, should be more specific in production
    }
    Ok(())
}

pub fn validate_decimals(decimals: u8) -> Result<()> {
    if decimals > 18 {
        return Err(error!(StablecoinError::InvalidDecimals));
    }
    Ok(())
}

pub fn validate_feature_enabled(
    config: &StablecoinConfig,
    feature_name: &str,
) -> Result<()> {
    match feature_name {
        "permanent_delegate" => {
            if !config.enable_permanent_delegate {
                return Err(error!(StablecoinError::PermanentDelegateNotEnabled));
            }
        }
        "transfer_hook" => {
            if !config.enable_transfer_hook {
                return Err(error!(StablecoinError::TransferHookNotEnabled));
            }
        }
        "blacklist" => {
            if !config.enable_blacklist {
                return Err(error!(StablecoinError::BlacklistNotEnabled));
            }
        }
        _ => return Err(error!(StablecoinError::InvalidConfiguration)),
    }
    Ok(())
}