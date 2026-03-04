use trident_fuzz::fuzzing::*;

/// Storage for all account addresses used in fuzz testing.
///
/// This struct serves as a centralized repository for account addresses,
/// enabling their reuse across different instruction flows and test scenarios.
///
/// Docs: https://ackee.xyz/trident/docs/latest/trident-api-macro/trident-types/fuzz-accounts/
#[derive(Default)]
pub struct AccountAddresses {
    pub pending_authority: AddressStorage,

    pub config: AddressStorage,

    pub mint: AddressStorage,

    pub minter_authority: AddressStorage,

    pub minter_config: AddressStorage,

    pub system_program: AddressStorage,

    pub blacklister: AddressStorage,

    pub blacklist_entry: AddressStorage,

    pub target_account: AddressStorage,

    pub token_program: AddressStorage,

    pub burner: AddressStorage,

    pub source: AddressStorage,

    pub authority: AddressStorage,

    pub account: AddressStorage,

    pub payer: AddressStorage,

    pub master_authority: AddressStorage,

    pub rent: AddressStorage,

    pub minter: AddressStorage,

    pub destination: AddressStorage,

    pub pauser: AddressStorage,

    pub seizer: AddressStorage,

    pub seizure_record: AddressStorage,

    pub source_account: AddressStorage,

    pub destination_account: AddressStorage,

    pub new_authority: AddressStorage,

    pub oracle_config: AddressStorage,

    pub requester: AddressStorage,

    pub registry: AddressStorage,

    pub switchboard_feed: AddressStorage,

    pub quote: AddressStorage,

    pub hook_config: AddressStorage,

    pub source_authority: AddressStorage,

    pub sss_core_program: AddressStorage,

    pub sender_blacklist_entry: AddressStorage,

    pub recipient_blacklist_entry: AddressStorage,

    pub extra_account_meta_list: AddressStorage,

    pub sss_config: AddressStorage,
}
