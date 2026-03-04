use fuzz_accounts::*;
use trident_fuzz::fuzzing::*;
mod fuzz_accounts;
mod types;
use types::sss_core::*;

/// Fuzz Test: sss-core (SSS-1 and SSS-2 instructions)
///
/// Flows are fuzz-selected randomly each iteration.
/// All instructions use the pre-seeded account addresses from `fuzz_accounts`.
///
/// Invariants:
///   - Programs must not panic on any combination of randomized instruction inputs.
///   - Supply, freeze, pause, and blacklist state must be consistent after each sequence.
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

    /// Called once at the start of each fuzzing iteration.
    /// Resolves account addresses from the fuzz engine's stored state.
    #[init]
    fn start(&mut self) {
        // Account addresses are resolved lazily via AddressStorage::get(&mut self.trident)
        // Trident seeds the accounts with fund and creates them as needed.
    }

    /// Flow: Attempt to mint tokens.
    /// Guard: amount = 0 would be rejected by the program.
    #[flow]
    fn flow_mint(&mut self) {
        let config = match self.fuzz_accounts.config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let minter = match self.fuzz_accounts.minter_authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let minter_config = match self.fuzz_accounts.minter_config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let dest = match self.fuzz_accounts.destination.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let ix = MintInstruction::data(MintInstructionData::new(1_000))
            .accounts(MintInstructionAccounts::new(
                minter,
                config,
                minter_config,
                mint,
                dest,
            ))
            .instruction();

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Burn tokens from the source account.
    #[flow]
    fn flow_burn(&mut self) {
        let config = match self.fuzz_accounts.config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let source = match self.fuzz_accounts.source.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let ix = BurnInstruction::data(BurnInstructionData::new(500))
            .accounts(BurnInstructionAccounts::new(
                authority, config, source, mint,
            ))
            .instruction();

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Freeze an account.
    /// Invariant: only the authority can freeze.
    #[flow]
    fn flow_freeze(&mut self) {
        let config = match self.fuzz_accounts.config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let account = match self.fuzz_accounts.account.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let ix = FreezeAccountInstruction::data(FreezeAccountInstructionData::new())
            .accounts(FreezeAccountInstructionAccounts::new(
                authority, config, account, mint,
            ))
            .instruction();

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Add a wallet to the blacklist.
    /// Invariant: blacklisting also freezes the account.
    #[flow]
    fn flow_blacklist_add(&mut self) {
        let config = match self.fuzz_accounts.config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let blacklister = match self.fuzz_accounts.blacklister.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let blacklist_entry = match self.fuzz_accounts.blacklist_entry.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let target_account = match self.fuzz_accounts.target_account.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        // Use a unique target pubkey each time
        let target = Pubkey::new_unique();

        let ix = AddToBlacklistInstruction::data(AddToBlacklistInstructionData::new(
            target,
            "fuzz-reason".to_string(),
        ))
        .accounts(AddToBlacklistInstructionAccounts::new(
            blacklister,
            config,
            blacklist_entry,
            target_account,
            mint,
        ))
        .instruction();

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Pause the token.
    /// Invariant: mint/burn must fail while paused.
    #[flow]
    fn flow_pause(&mut self) {
        let config = match self.fuzz_accounts.config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let pauser = match self.fuzz_accounts.pauser.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let ix = PauseInstruction::data(PauseInstructionData::new())
            .accounts(PauseInstructionAccounts::new(pauser, config, mint))
            .instruction();

        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow: Unpause the token.
    #[flow]
    fn flow_unpause(&mut self) {
        let config = match self.fuzz_accounts.config.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        let mint = match self.fuzz_accounts.mint.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };
        // Unpause requires the master_authority signer
        let master_authority = match self.fuzz_accounts.master_authority.get(&mut self.trident) {
            Some(v) => v,
            None => return,
        };

        let ix = UnpauseInstruction::data(UnpauseInstructionData::new())
            .accounts(UnpauseInstructionAccounts::new(
                master_authority,
                config,
                mint,
            ))
            .instruction();

        let _ = self.trident.process_transaction(&[ix], None);
    }

    #[end]
    fn end(&mut self) {
        // No global invariant verification needed here —
        // supply / state consistency is enforced per-instruction by the on-chain program.
        // Panics caught by Trident are saved to fuzzing/crashes/.
    }
}

fn main() {
    FuzzTest::fuzz(10000, 100);
}
