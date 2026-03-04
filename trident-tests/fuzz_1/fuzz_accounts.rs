use trident_fuzz::fuzzing::*;

/// Storage for all account addresses used in oracle fuzz testing.
#[derive(Default)]
pub struct AccountAddresses {
    pub payer: AddressStorage,
    pub authority: AddressStorage,
    pub registry: AddressStorage,
    pub switchboard_feed: AddressStorage,
    pub mint: AddressStorage,
    pub oracle_config: AddressStorage,
}
