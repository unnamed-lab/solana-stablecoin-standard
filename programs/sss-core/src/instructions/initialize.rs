use anchor_lang::prelude::*;
use crate::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension::ExtensionType;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub preset: StablecoinPreset,
    // Role assignments
    pub pauser: Pubkey,
    pub minter_authority: Pubkey,
    pub burner: Pubkey,
    // SSS-2 options (ignored for SSS-1)
    pub enable_permanent_delegate: bool,
    pub enable_transfer_hook: bool,
    pub default_account_frozen: bool,
    pub blacklister: Option<Pubkey>,
    pub seizer: Option<Pubkey>,
    pub hook_program_id: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(params: InitializeParams)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub master_authority: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = config,     // Config PDA is mint authority
        mint::freeze_authority = config,
        extensions::metadata_pointer::authority = config,
        extensions::metadata_pointer::metadata_address = mint,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    
    #[account(
        init,
        payer = payer,
        space = StablecoinConfig::LEN,
        seeds = [b"sss-config", mint.key().as_ref()],
        bump
    )]
    pub config: Account<'info, StablecoinConfig>,
    
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    // 1. Validate inputs
    require!(params.name.len() <= MAX_NAME_LENGTH, SSSError::NameTooLong);
    require!(params.symbol.len() <= MAX_SYMBOL_LENGTH, SSSError::SymbolTooLong);
    
    let config = &mut ctx.accounts.config;
    config.version = 1;
    config.preset = params.preset.clone();
    config.mint = ctx.accounts.mint.key();
    config.name = params.name;
    config.symbol = params.symbol;
    config.uri = params.uri;
    config.decimals = params.decimals;
    
    // Set Roles
    config.master_authority = ctx.accounts.master_authority.key();
    config.pending_master_authority = None;
    config.pauser = params.pauser;
    config.minter_authority = params.minter_authority;
    config.burner = params.burner;
    
    if params.preset == StablecoinPreset::SSS2 {
        config.enable_permanent_delegate = params.enable_permanent_delegate;
        config.enable_transfer_hook = params.enable_transfer_hook;
        config.default_account_frozen = params.default_account_frozen;
        config.blacklister = params.blacklister;
        config.seizer = params.seizer;
        config.hook_program_id = params.hook_program_id;
        config.hook_authority = Some(ctx.accounts.master_authority.key()); // As per standard, master is hook auth
    } else {
        config.enable_permanent_delegate = false;
        config.enable_transfer_hook = false;
        config.default_account_frozen = false;
        config.blacklister = None;
        config.seizer = None;
        config.hook_program_id = None;
        config.hook_authority = None;
    }
    
    config.paused = false;
    config.total_supply = 0;
    config.total_minted_all_time = 0;
    config.total_burned_all_time = 0;
    config.blacklist_count = 0;
    
    config.created_at = Clock::get()?.unix_timestamp;
    config.last_updated_at = config.created_at;
    config.bump = ctx.bumps.config;

    // Events
    emit!(Initialized {
        mint: config.mint,
        preset: format!("{:?}", config.preset),
        name: config.name.clone(),
        symbol: config.symbol.clone(),
        decimals: config.decimals,
        master_authority: config.master_authority,
        compliance_enabled: config.enable_permanent_delegate || config.enable_transfer_hook,
        timestamp: config.created_at,
    });

    Ok(())
}

#[event]
pub struct Initialized {
    pub mint: Pubkey,
    pub preset: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub master_authority: Pubkey,
    pub compliance_enabled: bool,
    pub timestamp: i64,
}
