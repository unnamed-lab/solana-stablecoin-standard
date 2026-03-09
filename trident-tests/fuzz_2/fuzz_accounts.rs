use trident_fuzz::fuzzing::*;

/// Storage for all account addresses used in SSS-3 (Confidential/Allowlist/Governance) fuzz testing.
#[derive(Default)]
pub struct AccountAddresses {
    pub payer: AddressStorage,
    pub authority: AddressStorage,
    pub mint: AddressStorage,
    pub stable_config: AddressStorage,
    pub confidential_config: AddressStorage,
    pub allowlister: AddressStorage,
    pub allowlist_entry: AddressStorage,
    pub token_account: AddressStorage,
    pub multisig: AddressStorage,
    pub proposal: AddressStorage,
    pub master_authority: AddressStorage,
    pub executor: AddressStorage,
    pub proposer: AddressStorage,
    pub signer: AddressStorage,
    pub taker: AddressStorage,
    pub snapshot: AddressStorage,
}
