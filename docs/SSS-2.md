# SSS-2: Regulated

The **SSS-2** preset is designed specifically for regulated, compliance-first stablecoins on the Solana blockchain. It enforces strict transfer rules and asset management capabilities required by institutions and legal jurisdictions.

This is ideal for fiat-backed stablecoins interacting with traditional banking infrastructure, tokenized real-world assets (RWAs), or enterprise loyalty tokens.

## Included Features

When initializing an SSS token with the `SSS2` preset in the `sss-core` program, all features from SSS-1 (Roles, Mint Quotas, Pausing, Metadata) are inherited, with the addition of the following powerful Token-2022 compliance extensions:

*   **Transfer Hook Enablement:** Every transfer invokes the `sss-transfer-hook` program via CPI. This program checks the `BlacklistEntry` PDAs for both the source owner and the destination owner.
*   **Unified Blacklisting:** The `blacklister` role can freeze a specific account and generate a verifiable on-chain blacklist record. If a blacklisted address attempts to send or receive SSS-2 tokens, the transfer hook blocks the transaction.
*   **Permanent Delegate Execution (Seizing):** The `StablecoinConfig` PDA is assigned as the permanent delegate. The `seizer` role can trigger the `seize` instruction to force-transfer tokens from a frozen/blacklisted account to a designated reserve account, overriding the user's authority.
*   **Default Frozen State (Optional):** If the `default_account_frozen` parameter is true during initialization, all newly created associated token accounts (ATAs) for this mint start in a `Frozen` state. The user must pass KYC off-chain, after which the `blacklister` (or compliance officer) calls `thaw_account` to unlock it.

## Lifecycle

1.  **Initialize:** The issuer calls `initialize`, providing the `SSS2` preset. The `sss-core` program enforces the creation of the Transfer Hook and Permanent Delegate extensions. The issuer must provide the `hook_program_id` (the deployed address of `sss-transfer-hook`).
2.  **Hook Integration:** The issuer must also call `initialize_hook` and `initialize_extra_account_meta_list` on the `sss-transfer-hook` program to establish the CPI routing.
3.  **Onboarding (if default frozen):** Users create ATAs. They are frozen. 
4.  **Verification:** Users pass KYC. The `blacklister` role thaws their accounts.
5.  **Mint & Transfer:** The user receives minted tokens. Every transfer they make triggers the `sss-transfer-hook` to verify neither party is currently blacklisted.
6.  **Compliance Events:** If a user account is compromised or involved in illicit activity, the `blacklister` calls `add_to_blacklist` (freezing it instantly and generating the entry PDA). If ordered by authorities, the `seizer` calls `seize` to recover the funds.
