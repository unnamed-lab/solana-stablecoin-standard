import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { SolanaNetwork } from '../types';
/**
 * Sub-module for SSS-2 compliance operations: blacklisting and asset seizure.
 *
 * This module is automatically instantiated by {@link SolanaStablecoin} for
 * SSS-2 preset tokens. Accessing it on SSS-1 or CUSTOM tokens throws.
 *
 * All write operations build a fresh Anchor provider using the supplied
 * signer keypair, so each call is self-contained.
 *
 * @example
 * ```ts
 * // Blacklist a wallet
 * await sdk.compliance.blacklistAdd(authority, {
 *   address: suspiciousWallet,
 *   reason: "Suspicious activity",
 * });
 *
 * // Check blacklist status
 * const blocked = await sdk.compliance.isBlacklisted(suspiciousWallet);
 * ```
 */
export declare class ComplianceModule {
    private connection;
    private programId;
    private mint;
    private config;
    constructor(connection: Connection, network: SolanaNetwork, mint: PublicKey, config: PublicKey);
    private buildProgram;
    /**
     * Add a wallet address to the on-chain blacklist.
     *
     * The target's associated token account is automatically frozen as part
     * of the same transaction.
     *
     * @param authority - Keypair of the designated blacklister.
     * @param params    - Wallet address and reason for the blacklisting.
     * @returns Transaction signature.
     */
    blacklistAdd(authority: Keypair, params: {
        address: PublicKey;
        reason: string;
    }): Promise<string>;
    /**
     * Remove a wallet address from the on-chain blacklist.
     *
     * The target's associated token account is automatically thawed.
     *
     * @param authority - Keypair of the designated blacklister.
     * @param address   - Wallet address to un-blacklist.
     * @returns Transaction signature.
     */
    blacklistRemove(authority: Keypair, address: PublicKey): Promise<string>;
    /**
     * Seize (forcibly transfer) tokens from a **frozen** source account to
     * a destination account.
     *
     * Requires the permanent delegate extension (SSS-2). The source account
     * **must** be frozen before seizure.
     *
     * @param authority - Keypair of the designated seizer.
     * @param from      - Token account to seize from (must be frozen).
     * @param to        - Destination token account.
     * @param amount    - Number of tokens to seize (base units).
     * @param reason    - Human-readable reason (stored in on-chain event).
     * @returns Transaction signature.
     */
    seize(authority: Keypair, from: PublicKey, to: PublicKey, amount: number, reason: string): Promise<string>;
    /**
     * Check whether a wallet address is currently blacklisted.
     *
     * @param address - Wallet public key to check.
     * @returns `true` if the address is actively blacklisted, `false` otherwise.
     */
    isBlacklisted(address: PublicKey): Promise<boolean>;
    /**
     * Fetch all active (non-removed) blacklist entries for this mint.
     *
     * @returns Array of blacklist entries with address, reason, addedBy, and addedAt.
     */
    getBlacklist(): Promise<any[]>;
}
