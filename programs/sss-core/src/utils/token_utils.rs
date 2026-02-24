use anchor_lang::prelude::*;
use anchor_spl::token_2022::{
    self, Token2022, Mint, TokenAccount, FreezeAccount, ThawAccount,
    MintTo, Burn, TransferChecked,
};
use crate::errors::StablecoinError;

pub fn mint_tokens<'info>(
    token_program: &Program<'info, Token2022>,
    mint: &Account<'info, Mint>,
    destination: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_accounts = MintTo {
        mint: mint.to_account_info(),
        to: destination.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    token_2022::mint_to(cpi_ctx, amount)?;
    Ok(())
}

pub fn burn_tokens<'info>(
    token_program: &Program<'info, Token2022>,
    mint: &Account<'info, Mint>,
    source: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_accounts = Burn {
        mint: mint.to_account_info(),
        from: source.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    token_2022::burn(cpi_ctx, amount)?;
    Ok(())
}

pub fn freeze_token_account<'info>(
    token_program: &Program<'info, Token2022>,
    mint: &Account<'info, Mint>,
    account: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_accounts = FreezeAccount {
        mint: mint.to_account_info(),
        account: account.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    token_2022::freeze_account(cpi_ctx)?;
    Ok(())
}

pub fn thaw_token_account<'info>(
    token_program: &Program<'info, Token2022>,
    mint: &Account<'info, Mint>,
    account: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_accounts = ThawAccount {
        mint: mint.to_account_info(),
        account: account.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    token_2022::thaw_account(cpi_ctx)?;
    Ok(())
}

pub fn transfer_tokens<'info>(
    token_program: &Program<'info, Token2022>,
    source: &Account<'info, TokenAccount>,
    destination: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
    authority: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_accounts = TransferChecked {
        from: source.to_account_info(),
        to: destination.to_account_info(),
        mint: mint.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    token_2022::transfer_checked(cpi_ctx, amount, mint.decimals)?;
    Ok(())
}

pub fn get_token_account(account: &AccountInfo) -> Result<anchor_spl::token_2022::TokenAccount> {
    anchor_spl::token_2022::TokenAccount::try_deserialize(&mut &account.data.borrow()[..])
        .map_err(|_| error!(StablecoinError::InvalidTokenAccount))
}

pub fn is_frozen(account: &AccountInfo) -> Result<bool> {
    let token_account = get_token_account(account)?;
    Ok(token_account.is_frozen())
}