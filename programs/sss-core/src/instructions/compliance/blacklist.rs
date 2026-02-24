use anchor_lang::prelude::*;
use crate::errors::StablecoinError;
use crate::state::{Blacklist, BlacklistEntry, StablecoinConfig};
use crate::utils::validation::*;

pub fn add_to_blacklist_internal(
    config: &mut StablecoinConfig,
    blacklist: &mut Account<Blacklist>,
    entry: &mut Account<BlacklistEntry>,
    authority: Pubkey,
    address: Pubkey,
    reason: String,
    current_time: i64,
) -> Result<()> {
    // Validate feature is enabled
    validate_feature_enabled(config, "blacklist")?;
    
    // Validate roles
    validate_roles(config, authority, "blacklister")?;
    
    // Validate address isn't already blacklisted
    if entry.address != Pubkey::default() {
        return Err(error!(StablecoinError::AlreadyBlacklisted));
    }
    
    // Validate reason length
    if reason.len() > BlacklistEntry::MAX_REASON_LEN {
        return Err(error!(StablecoinError::InvalidConfiguration));
    }
    
    // Update blacklist count
    blacklist.count = blacklist.count
        .checked_add(1)
        .ok_or(error!(StablecoinError::MathOverflow))?;
    
    // Create entry
    entry.address = address;
    entry.reason = reason;
    entry.blacklisted_at = current_time;
    entry.blacklisted_by = authority;
    entry.bump = *ctx.bumps.get("entry").unwrap();
    
    Ok(())
}

pub fn remove_from_blacklist_internal(
    config: &mut StablecoinConfig,
    blacklist: &mut Account<Blacklist>,
    entry: &mut Account<BlacklistEntry>,
    authority: Pubkey,
    address: Pubkey,
) -> Result<()> {
    // Validate feature is enabled
    validate_feature_enabled(config, "blacklist")?;
    
    // Validate roles
    validate_roles(config, authority, "blacklister")?;
    
    // Validate address is blacklisted
    if entry.address == Pubkey::default() || entry.address != address {
        return Err(error!(StablecoinError::NotBlacklisted));
    }
    
    // Update blacklist count
    blacklist.count = blacklist.count
        .checked_sub(1)
        .ok_or(error!(StablecoinError::MathOverflow))?;
    
    // Clear entry
    entry.address = Pubkey::default();
    entry.reason = String::new();
    entry.blacklisted_at = 0;
    entry.blacklisted_by = Pubkey::default();
    
    Ok(())
}