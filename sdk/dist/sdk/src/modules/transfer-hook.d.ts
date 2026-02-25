import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { SolanaNetwork, HookConfigInfo } from '../types';
/**
 * Sub-module for managing the Token-2022 transfer hook (sss-transfer-hook program).
 *
 * The transfer hook intercepts every Token-2022 transfer, checking whether
 * the sender or recipient is blacklisted, and blocking the transfer if so.
 *
 * This module is automatically instantiated by {@link SolanaStablecoin} for
 * SSS-2 preset tokens. Accessing it on SSS-1 or CUSTOM tokens throws.
 *
 * @example
 * ```ts
 * // Initialize the hook after creating an SSS-2 stablecoin
 * await sdk.transferHook.initializeHook(payer, authority, true);
 * await sdk.transferHook.initializeExtraAccountMetaList(payer, authority);
 *
 * // Check hook status
 * const config = await sdk.transferHook.getHookConfig();
 * console.log(config.enabled, config.transferCount);
 * ```
 */
export declare class TransferHookModule {
    private connection;
    private programId;
    private mint;
    private sssConfigPda;
    constructor(connection: Connection, network: SolanaNetwork, mint: PublicKey, sssConfigPda: PublicKey);
    /**
     * @internal Builds an Anchor `Program<SssTransferHook>` backed by the
     * given signer for write operations.
     */
    private buildProgram;
    /** @internal Derives the hook config PDA: `["hook-config", mint]`. */
    private getHookConfigPda;
    /** @internal Derives the extra account meta list PDA: `["extra-account-metas", mint]`. */
    private getExtraAccountMetaListPda;
    /**
     * Initialize the transfer hook configuration for this mint.
     *
     * Creates the on-chain `HookConfig` PDA. Must be called once after the
     * stablecoin is created.
     *
     * @param payer          - Keypair that pays for account creation.
     * @param authority      - Hook authority (must match sss-core config authority).
     * @param defaultEnabled - Whether the hook starts enabled (`true`) or disabled.
     * @returns Transaction signature.
     */
    initializeHook(payer: Keypair, authority: Keypair, defaultEnabled?: boolean): Promise<string>;
    /**
     * Register the extra account metas required by Token-2022 for hook execution.
     *
     * Must be called once after {@link initializeHook}. Configures the extra
     * accounts Token-2022 will automatically resolve during every transfer.
     *
     * @param payer     - Keypair that pays for account creation.
     * @param authority - Hook authority.
     * @returns Transaction signature.
     */
    initializeExtraAccountMetaList(payer: Keypair, authority: Keypair): Promise<string>;
    /**
     * Enable the transfer hook, allowing it to enforce blacklist checks.
     *
     * @param authority - Keypair of the hook authority.
     * @returns Transaction signature.
     */
    enableHook(authority: Keypair): Promise<string>;
    /**
     * Disable the transfer hook without un-registering it.
     *
     * While disabled, all transfers proceed without blacklist checks.
     *
     * @param authority - Keypair of the hook authority.
     * @returns Transaction signature.
     */
    disableHook(authority: Keypair): Promise<string>;
    /**
     * Fetch the current hook configuration from the chain.
     *
     * @returns A {@link HookConfigInfo} with enabled state, transfer/blocked counts, etc.
     */
    getHookConfig(): Promise<HookConfigInfo>;
}
