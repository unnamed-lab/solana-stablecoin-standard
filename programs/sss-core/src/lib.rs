use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
// Ignore utils/compliance modules from the old implementation to avoid unresolved imports for now
pub mod prelude;

use instructions::*;

declare_id!("AyMjTKQcZh2WF2DG63kwR8yNvSLv8EfYzZgA1geZnXVL");

#[program]
pub mod sss_core {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::initialize::initialize(ctx, params)
    }
}
