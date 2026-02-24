use anchor_lang::prelude::*;

declare_id!("7H7fqqjASpTDCgYwDpp8EatKM4sSMwxaYvbhf6s3ThqM");

#[program]
pub mod sss_core {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
