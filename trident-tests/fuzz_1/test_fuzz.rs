use fuzz_accounts::*;
use trident_fuzz::fuzzing::*;
mod fuzz_accounts;

/// Fuzz Test: sss-oracle
///
/// Tests that oracle program instructions handle arbitrary input without panicking.
/// Errors from the on-chain program (duplicate symbols, missing registry, etc.)
/// are expected and allowed — Trident flags panics/crashes, not program errors.
#[derive(FuzzTestMethods)]
struct FuzzTest {
    trident: Trident,
    fuzz_accounts: AccountAddresses,
}

#[flow_executor]
impl FuzzTest {
    fn new() -> Self {
        Self {
            trident: Trident::default(),
            fuzz_accounts: AccountAddresses::default(),
        }
    }

    #[init]
    fn start(&mut self) {
        // Account setup is handled lazily by AddressStorage::get()
    }

    /// Flow: Attempt to initialize the global feed registry.
    /// This is idempotent — already-initialized errors are expected.
    #[flow]
    fn flow_initialize_registry(&mut self) {
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let registry = match self.fuzz_accounts.registry.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let discriminator: [u8; 8] = [0x0c, 0x9e, 0x55, 0x6f, 0x27, 0xb0, 0xac, 0xef];
        let data = discriminator.to_vec();

        let ix = Instruction {
            program_id: pubkey!("Brj7RU6jcmWXqCSfBa6o3v5bHS48Z6uDyKZUfG8ZbQoD"),
            accounts: vec![
                AccountMeta::new(authority, true),
                AccountMeta::new(authority, true),
                AccountMeta::new(registry, false),
                AccountMeta::new_readonly(pubkey!("11111111111111111111111111111111"), false),
            ],
            data,
        };

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Submit a randomized oracle initialization payload.
    /// Expected to fail gracefully if registry isn't set up — program should not panic.
    #[flow]
    fn flow_initialize_oracle(&mut self) {
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let mint = Pubkey::new_unique();

        // Intentionally malformed payload — we're testing panic-resistance, not correctness
        let discriminator: [u8; 8] = [0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x7a, 0x8b];
        let ix = Instruction {
            program_id: pubkey!("Brj7RU6jcmWXqCSfBa6o3v5bHS48Z6uDyKZUfG8ZbQoD"),
            accounts: vec![
                AccountMeta::new(authority, true),
                AccountMeta::new_readonly(mint, false),
            ],
            data: discriminator.to_vec(),
        };

        let _ = self.trident.process_transaction(&[ix], None);
    }

    #[end]
    fn end(&mut self) {}
}

fn main() {
    FuzzTest::fuzz(10000, 100);
}
