use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
// Ignore utils/compliance modules from the old implementation to avoid unresolved imports for now
pub mod prelude;

use instructions::*;

declare_id!("2Vh56aB6CX2SsHyLVwGQpt8Z9jWqYKNzjf5BXjgM2F5y");

#[program]
pub mod sss_core {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::initialize::initialize(ctx, params)
    }

    pub fn mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        instructions::mint::mint(ctx, amount)
    }
    
    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        instructions::burn::burn(ctx, amount)
    }

    pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
        instructions::freeze::freeze_account(ctx)
    }

    pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
        instructions::freeze::thaw_account(ctx)
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause::pause(ctx)
    }

    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::pause::unpause(ctx)
    }

    pub fn update_roles(ctx: Context<UpdateRoles>, update: RoleUpdate) -> Result<()> {
        instructions::roles::update_roles(ctx, update)
    }

    pub fn propose_authority_transfer(ctx: Context<ProposeTransfer>, new_authority: Pubkey) -> Result<()> {
        instructions::roles::propose_authority_transfer(ctx, new_authority)
    }

    pub fn accept_authority_transfer(ctx: Context<AcceptTransfer>) -> Result<()> {
        instructions::roles::accept_authority_transfer(ctx)
    }

    pub fn seize(ctx: Context<Seize>, amount: u64, reason: String) -> Result<()> {
        instructions::seize::seize(ctx, amount, reason)
    }

    pub fn add_minter(
        ctx: Context<AddMinter>,
        minter: Pubkey,
        quota_per_period: u64,
        period_seconds: i64,
    ) -> Result<()> {
        instructions::minter::add_minter(ctx, minter, quota_per_period, period_seconds)
    }

    pub fn remove_minter(ctx: Context<RemoveMinter>, minter: Pubkey) -> Result<()> {
        instructions::minter::remove_minter(ctx, minter)
    }

    pub fn add_to_blacklist(
        ctx: Context<AddToBlacklist>,
        target: Pubkey,
        reason: String,
    ) -> Result<()> {
        instructions::blacklist::add_to_blacklist(ctx, target, reason)
    }

    pub fn remove_from_blacklist(
        ctx: Context<RemoveFromBlacklist>,
        target: Pubkey,
    ) -> Result<()> {
        instructions::blacklist::remove_from_blacklist(ctx, target)
    }
}
