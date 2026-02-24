# SSS-1: Standard

The **SSS-1** preset is designed for standard, low-friction stablecoins on the Solana blockchain. It provides standard supply and access management without the heavy overhead of strict on-chain compliance enforcements.

This is ideal for algorithmic stablecoins, decentralized lending collaterals, or community-driven pegged assets where open transferability is a priority.

## Included Features

When initializing an SSS token with the `SSS1` preset in the `sss-core` program, the following features are supported:

*   **Role Management:** The `master_authority` can assign a `minter_authority`, `burner`, and `pauser`.
*   **Mint Quotas:** The minter authority can add individual minters with specific periodic quotas (e.g., allow a specific Hot Wallet to mint a maximum of 1,000,000 tokens every 24 hours).
*   **Emergency Pause:** The `pauser` role can temporarily halt all minting and burning operations in case of a critical event or migration.
*   **Metadata Integration:** Uses the Token-2022 `MetadataPointer` and `TokenMetadata` extensions to store the token's name, symbol, and URI directly on-chain within the mint account.

## Excluded Features

The SSS-1 preset explicitly **disables** the advanced Token-2022 compliance extensions to save on account space, transaction compute, and friction:

*   **Transfer Hook Disabled:** Transfers are not intercepted or validated against any on-chain blacklists. The `sss-transfer-hook` program is not utilized.
*   **Permanent Delegate Disabled:** Neither the `master_authority` nor the `seizer` role can force-transfer or confiscate tokens from user accounts.
*   **Default Account State:** Accounts are initialized normally (`Initialized`), not `Frozen`. Any user can freely receive and send the stablecoin upon creating an associated token account.

## Lifecycle

1.  **Initialize:** The issuer calls `initialize` on `sss-core`, providing the `SSS1` preset, `name`, `symbol`, `decimals`, and assigning initial roles.
2.  **Add Minters:** The `minter_authority` registers specific minters and their quotas.
3.  **Mint:** Minters supply fiat/collateral off-chain, and trigger the `mint` instruction on-chain to issue tokens to users.
4.  **Transfer:** Users freely transfer the SSS-1 tokens using standard Solana mechanisms without any hook interventions.
5.  **Burn:** Users redeem tokens off-chain; the `burner` role calls the `burn` instruction to permanently destroy the supply.
