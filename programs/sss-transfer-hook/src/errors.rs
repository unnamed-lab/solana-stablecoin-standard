use anchor_lang::prelude::*;

#[error_code]
pub enum HookError {
    #[msg("Sender is blacklisted and cannot transfer tokens")]
    SenderBlacklisted,
    #[msg("Recipient is blacklisted and cannot receive tokens")]
    RecipientBlacklisted,
    #[msg("Transfer hook is disabled")]
    HookDisabled,
    #[msg("Invalid mint for this hook instance")]
    InvalidMint,
    #[msg("Invalid authority")]
    InvalidAuthority,
}
