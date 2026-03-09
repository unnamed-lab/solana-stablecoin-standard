use fuzz_accounts::*;
use trident_fuzz::fuzzing::*;
mod fuzz_accounts;

/// Fuzz Test: sss-core (SSS-3 Extensions)
///
/// Tests that SSS-3 instructions (Allowlist, Confidential Transfers, Governance)
/// handle arbitrary input without panicking.
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
    fn start(&mut self) {}

    /// Flow: Attempt to Initialize SSS-3 Configs
    #[flow]
    fn flow_initialize_sss3(&mut self) {
        let payer = match self.fuzz_accounts.payer.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let stable_config = match self.fuzz_accounts.stable_config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let confidential_config = match self
            .fuzz_accounts
            .confidential_config
            .get(&mut self.trident)
        {
            Some(v) => v,
            None => return,
        };

        let mut data = vec![2, 245, 16, 64, 10, 249, 110, 143]; // initialize_sss3 discriminator
        data.extend_from_slice(&[0u8; 8]); // Dummy InitializeSss3Params data

        let ix = Instruction {
            program_id: pubkey!("AVKfSdE7SLvR4NzK7C8kcSRK4BauKwSoUApZaUC5US9c"),
            accounts: vec![
                AccountMeta::new(payer, true),
                AccountMeta::new_readonly(authority, true),
                AccountMeta::new(mint, false),
                AccountMeta::new(stable_config, false),
                AccountMeta::new(confidential_config, false),
                AccountMeta::new_readonly(pubkey!("11111111111111111111111111111111"), false),
            ],
            data,
        };

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Attempt to Add to Allowlist
    #[flow]
    fn flow_add_to_allowlist(&mut self) {
        let payer = match self.fuzz_accounts.payer.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let allowlister = match self.fuzz_accounts.allowlister.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let stable_config = match self.fuzz_accounts.stable_config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let allowlist_entry = match self.fuzz_accounts.allowlist_entry.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let mut data = vec![149, 143, 78, 134, 241, 244, 7, 56]; // add_to_allowlist discriminator
        data.extend_from_slice(&[0u8; 40]); // Dummy AddToAllowlistParams

        let ix = Instruction {
            program_id: pubkey!("AVKfSdE7SLvR4NzK7C8kcSRK4BauKwSoUApZaUC5US9c"),
            accounts: vec![
                AccountMeta::new(payer, true),
                AccountMeta::new_readonly(allowlister, true),
                AccountMeta::new_readonly(stable_config, false),
                AccountMeta::new_readonly(mint, false),
                AccountMeta::new(allowlist_entry, false),
                AccountMeta::new_readonly(pubkey!("11111111111111111111111111111111"), false),
            ],
            data,
        };

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Attempt to Approve Confidential Account
    #[flow]
    fn flow_approve_confidential_account(&mut self) {
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let confidential_config = match self
            .fuzz_accounts
            .confidential_config
            .get(&mut self.trident)
        {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let token_account = match self.fuzz_accounts.token_account.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let data = vec![64, 146, 249, 68, 150, 102, 96, 140]; // approve_confidential_account discriminator

        let ix = Instruction {
            program_id: pubkey!("AVKfSdE7SLvR4NzK7C8kcSRK4BauKwSoUApZaUC5US9c"),
            accounts: vec![
                AccountMeta::new_readonly(authority, true),
                AccountMeta::new_readonly(confidential_config, false),
                AccountMeta::new_readonly(mint, false),
                AccountMeta::new(token_account, false),
                AccountMeta::new_readonly(
                    pubkey!("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
                    false,
                ),
            ],
            data,
        };

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Attempt to Create Proposal
    #[flow]
    fn flow_create_proposal(&mut self) {
        let proposer = match self.fuzz_accounts.proposer.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let multisig = match self.fuzz_accounts.multisig.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let proposal = match self.fuzz_accounts.proposal.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let mut data = vec![132, 116, 68, 174, 216, 160, 198, 22]; // create_proposal discriminator
        data.extend_from_slice(&[0u8; 10]); // Dummy GovernanceAction

        let ix = Instruction {
            program_id: pubkey!("AVKfSdE7SLvR4NzK7C8kcSRK4BauKwSoUApZaUC5US9c"),
            accounts: vec![
                AccountMeta::new(proposer, true),
                AccountMeta::new(multisig, false),
                AccountMeta::new(proposal, false),
                AccountMeta::new_readonly(pubkey!("11111111111111111111111111111111"), false),
            ],
            data,
        };

        let _ = self.trident.process_transaction(&[ix], None);
    }

    #[end]
    fn end(&mut self) {}
}

fn main() {
    FuzzTest::fuzz(10000, 100);
}
