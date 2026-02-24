use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::StablecoinError;

pub fn find_config_pda(mint: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[CONFIG_SEED, mint.as_ref()],
        &crate::ID,
    )
}

pub fn find_blacklist_pda(mint: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[BLACKLIST_SEED, mint.as_ref()],
        &crate::ID,
    )
}

pub fn find_blacklist_entry_pda(mint: Pubkey, address: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[BLACKLIST_SEED, mint.as_ref(), address.as_ref()],
        &crate::ID,
    )
}

pub fn find_permanent_delegate_pda(mint: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[PERMANENT_DELEGATE_SEED, mint.as_ref()],
        &crate::ID,
    )
}

pub fn find_transfer_hook_pda(mint: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[TRANSFER_HOOK_SEED, mint.as_ref()],
        &crate::ID,
    )
}

pub fn find_minter_quota_pda(mint: Pubkey, minter: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"minter_quota", mint.as_ref(), minter.as_ref()],
        &crate::ID,
    )
}

pub fn find_audit_log_pda(mint: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"audit_log", mint.as_ref()],
        &crate::ID,
    )
}

pub fn find_audit_entry_pda(mint: Pubkey, index: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"audit_entry", mint.as_ref(), &index.to_le_bytes()],
        &crate::ID,
    )
}

pub fn verify_pda(
    pda: Pubkey,
    bump: u8,
    seeds: &[&[u8]],
) -> Result<()> {
    let derived = Pubkey::create_program_address(seeds, &crate::ID)
        .map_err(|_| error!(StablecoinError::PDADerivationFailed))?;
    
    if pda != derived {
        return Err(error!(StablecoinError::InvalidBump));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::pubkey::Pubkey;

    #[test]
    fn test_pda_derivation() {
        let mint = Pubkey::new_unique();
        let (config_pda, bump) = find_config_pda(mint);
        
        // Verify we can derive the same PDA
        let derived = Pubkey::create_program_address(
            &[CONFIG_SEED, mint.as_ref(), &[bump]],
            &crate::ID,
        ).unwrap();
        
        assert_eq!(config_pda, derived);
    }
}