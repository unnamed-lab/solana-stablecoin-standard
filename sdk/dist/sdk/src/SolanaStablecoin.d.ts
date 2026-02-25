import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { CreateStablecoinConfig, MintParams, BurnParams, StablecoinPreset, StablecoinInfo, MinterQuota, SolanaNetwork, RoleUpdateParams } from './types';
import { TransferHookModule } from './modules/transfer-hook';
import { ComplianceModule } from './modules/compliance';
/**
 * Main entry point for the Solana Stablecoin Standard SDK.
 *
 * `SolanaStablecoin` wraps the **sss-core** Anchor program and exposes
 * high-level methods for every on-chain instruction: token lifecycle
 * (create / mint / burn), access control (freeze / thaw / pause), role
 * management, and — on SSS-2 instances — compliance and transfer-hook
 * sub-modules.
 *
 * @example
 * ```ts
 * // Create a new stablecoin
 * const txSig = await SolanaStablecoin.create({
 *   name: "My USD", symbol: "MUSD",
 *   uri: "https://example.com/meta.json",
 *   decimals: 6, preset: StablecoinPreset.SSS_2,
 *   authority: myKeypair,
 *   blacklister: myKeypair.publicKey,
 *   seizer: myKeypair.publicKey,
 * }, SolanaNetwork.DEVNET);
 *
 * // Load an existing stablecoin
 * const sdk = await SolanaStablecoin.load(SolanaNetwork.DEVNET, mintPubkey);
 * const info = await sdk.getInfo();
 * ```
 */
export declare class SolanaStablecoin {
    /** Active Solana JSON-RPC connection used for all operations. */
    readonly connection: Connection;
    /** @internal */
    private readonly network;
    /** The SPL Token-2022 mint address for this stablecoin. */
    readonly mintAddress: PublicKey;
    /** The on-chain `StablecoinConfig` PDA address. */
    readonly config: PublicKey;
    /** Preset that was used when the stablecoin was created. */
    readonly preset: StablecoinPreset;
    /**
     * Compliance sub-module for blacklist and seizure operations.
     * Only available on **SSS-2** instances; accessing on SSS-1 / CUSTOM throws.
     */
    readonly compliance: ComplianceModule;
    /**
     * Transfer hook sub-module for managing the Token-2022 transfer hook.
     * Only available on **SSS-2** instances; accessing on SSS-1 / CUSTOM throws.
     */
    readonly transferHook: TransferHookModule;
    private constructor();
    /**
     * @internal Builds an Anchor `Program<SssCore>` instance backed by the
     * given signer. Every write operation uses this to get a provider whose
     * wallet matches the required transaction signer.
     */
    private buildProgram;
    /** @internal Static variant of {@link buildProgram} for use in `create()`. */
    private static buildProgramForSigner;
    /**
     * Deploy a brand-new stablecoin to the blockchain.
     *
     * This static factory method initialises the mint, creates the on-chain
     * `StablecoinConfig` PDA, and configures Token-2022 extensions according
     * to the chosen preset.
     *
     * @param config - Stablecoin configuration (name, symbol, preset, roles, etc.).
     * @param network - Target Solana cluster. Defaults to `DEVNET`.
     * @returns The transaction signature of the `initialize` instruction.
     *
     * @example
     * ```ts
     * const txSig = await SolanaStablecoin.create({
     *   name: "ACME USD", symbol: "AUSD",
     *   uri: "https://acme.co/meta.json",
     *   decimals: 6,
     *   preset: StablecoinPreset.SSS_1,
     *   authority: payerKeypair,
     * });
     * ```
     */
    static create(config: CreateStablecoinConfig, network?: SolanaNetwork): Promise<string>;
    /**
     * Load an existing stablecoin by its mint address.
     *
     * Reads the on-chain `StablecoinConfig` PDA to determine the preset and
     * returns a fully initialised `SolanaStablecoin` instance.
     *
     * @param network - Solana cluster where the stablecoin lives.
     * @param mint    - The SPL Token-2022 mint public key.
     * @returns A ready-to-use SDK instance.
     *
     * @example
     * ```ts
     * const sdk = await SolanaStablecoin.load(SolanaNetwork.MAINNET, mintPubkey);
     * console.log(await sdk.getInfo());
     * ```
     */
    static load(network: SolanaNetwork | undefined, mint: PublicKey): Promise<SolanaStablecoin>;
    /**
     * Mint new tokens to a destination token account.
     *
     * The `minter` keypair must have been previously authorised via
     * {@link addMinter} and must not have exceeded its quota.
     *
     * @param params - Minting parameters (recipient ATA, amount, minter keypair).
     * @returns Transaction signature.
     */
    mint(params: MintParams): Promise<string>;
    /**
     * Burn tokens from a token account.
     *
     * If `source` is omitted, the burner's associated token account (ATA) is used.
     *
     * @param params - Burn parameters (amount, burner keypair, optional source ATA).
     * @returns Transaction signature.
     */
    burn(params: BurnParams): Promise<string>;
    /**
     * Freeze a token account, preventing all transfers out of it.
     *
     * @param authority - Keypair of the freeze authority (master authority or delegated).
     * @param account   - The token account to freeze.
     * @returns Transaction signature.
     */
    freeze(authority: Keypair, account: PublicKey): Promise<string>;
    /**
     * Thaw (unfreeze) a previously frozen token account.
     *
     * @param authority - Keypair of the freeze authority.
     * @param account   - The token account to thaw.
     * @returns Transaction signature.
     */
    thaw(authority: Keypair, account: PublicKey): Promise<string>;
    /**
     * Pause the stablecoin, blocking all minting and burning operations.
     *
     * @param pauser - Keypair of the designated pauser.
     * @returns Transaction signature.
     */
    pause(pauser: Keypair): Promise<string>;
    /**
     * Unpause the stablecoin, resuming normal operations.
     *
     * @param pauser - Keypair of the designated pauser.
     * @returns Transaction signature.
     */
    unpause(pauser: Keypair): Promise<string>;
    /**
     * Authorise a new minter with an optional quota.
     *
     * @param authority - Keypair of the minter authority.
     * @param minter    - Public key of the wallet to grant minting rights.
     * @param quota     - Optional minting quota (max tokens per period).
     * @returns Transaction signature.
     */
    addMinter(authority: Keypair, minter: PublicKey, quota?: MinterQuota): Promise<string>;
    /**
     * Revoke minting rights from an existing minter.
     *
     * @param authority - Keypair of the minter authority.
     * @param minter    - Public key of the minter to remove.
     * @returns Transaction signature.
     */
    removeMinter(authority: Keypair, minter: PublicKey): Promise<string>;
    /**
     * Update one or more role assignments on the stablecoin config.
     *
     * Only the roles included in `update` are changed; omitted roles remain
     * unchanged. Requires the master authority.
     *
     * @param authority - Keypair of the master authority.
     * @param update    - Object containing the roles to update.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * await sdk.updateRoles(authority, { newPauser: newPauserPubkey });
     * ```
     */
    updateRoles(authority: Keypair, update: RoleUpdateParams): Promise<string>;
    /**
     * Propose a transfer of the master authority to a new public key.
     *
     * This is the first step of a two-step authority transfer. The new
     * authority must call {@link acceptAuthorityTransfer} to finalise.
     *
     * @param authority    - Keypair of the current master authority.
     * @param newAuthority - Public key of the proposed new authority.
     * @returns Transaction signature.
     */
    proposeAuthorityTransfer(authority: Keypair, newAuthority: PublicKey): Promise<string>;
    /**
     * Accept a pending authority transfer, becoming the new master authority.
     *
     * Must be called by the public key that was proposed via
     * {@link proposeAuthorityTransfer}.
     *
     * @param pendingAuthority - Keypair of the pending new authority.
     * @returns Transaction signature.
     */
    acceptAuthorityTransfer(pendingAuthority: Keypair): Promise<string>;
    /** @internal Read-only program instance (no wallet/signer needed). */
    private get readProgram();
    /**
     * Fetch a read-only snapshot of the stablecoin's on-chain configuration.
     *
     * @returns A {@link StablecoinInfo} object with name, symbol, supply, etc.
     */
    getInfo(): Promise<StablecoinInfo>;
    /**
     * Get the current total token supply in base units.
     * @returns Total supply as a number.
     */
    getTotalSupply(): Promise<number>;
    /**
     * Check whether the stablecoin is currently paused.
     * @returns `true` if paused, `false` otherwise.
     */
    isPaused(): Promise<boolean>;
    /**
     * @internal Merges preset defaults with user-supplied overrides.
     * Returns a fully-resolved config with all extension flags set.
     */
    private static resolvePreset;
}
