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
     * @returns An object with `txSig` (transaction signature) and `mintAddress` (the new mint public key).
     *
     * @example
     * ```ts
     * const { txSig, mintAddress } = await SolanaStablecoin.create({
     *   name: "ACME USD", symbol: "AUSD",
     *   uri: "https://acme.co/meta.json",
     *   decimals: 6,
     *   preset: StablecoinPreset.SSS_1,
     *   authority: payerKeypair,
     * });
     * // txSig       → "5Kz7H...xYpQ" (base-58 transaction signature)
     * // mintAddress  → PublicKey("HduyiW...") (newly created mint)
     * ```
     */
    static create(config: CreateStablecoinConfig, network?: SolanaNetwork): Promise<{
        txSig: string;
        mintAddress: PublicKey;
    }>;
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
     * // sdk.mintAddress  → PublicKey("HduyiW...") (the loaded mint)
     * // sdk.preset       → "sss2"  (auto-detected from on-chain config)
     *
     * const info = await sdk.getInfo();
     * // info.name        → "ACME USD"
     * // info.totalSupply → 1_000_000
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
     *
     * @example
     * ```ts
     * const txSig = await sdk.mint({
     *   recipient: recipientAta,
     *   amount: 100_000,
     *   minter: minterKeypair,
     * });
     * // txSig → "5Kz7...xYpQ" (base-58 transaction signature)
     *
     * const supply = await sdk.getTotalSupply();
     * // supply → 100_000 (tokens minted in base units)
     * ```
     */
    mint(params: MintParams): Promise<string>;
    /**
     * Burn tokens from a token account.
     *
     * The designated burner (from config) must own the source token account.
     * If `source` is omitted, the burner's associated token account (ATA) is used.
     *
     * @param params - Burn parameters (amount, burner keypair, optional source ATA).
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.burn({
     *   amount: 50_000,
     *   burner: authorityKeypair,  // must match config.burner
     *   source: authorityAta,       // must be owned by the burner
     * });
     * // txSig → "3wCX...URH8" (base-58 transaction signature)
     *
     * const supply = await sdk.getTotalSupply();
     * // supply → 50_000 (previous supply minus burned amount)
     * ```
     */
    burn(params: BurnParams): Promise<string>;
    /**
     * Freeze a token account, preventing all transfers out of it.
     *
     * @param authority - Keypair of the freeze authority (master authority or delegated).
     * @param account   - The token account to freeze.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.freeze(authority, user1Ata);
     * // txSig → "4NpnK...MN42" (base-58 transaction signature)
     * // The token account is now frozen; transfers will be rejected.
     * ```
     */
    freeze(authority: Keypair, account: PublicKey): Promise<string>;
    /**
     * Thaw (unfreeze) a previously frozen token account.
     *
     * @param authority - Keypair of the freeze authority.
     * @param account   - The token account to thaw.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.thaw(authority, user1Ata);
     * // txSig → "2yvxr...2bf" (base-58 transaction signature)
     * // The token account is now unfrozen; transfers are allowed again.
     * ```
     */
    thaw(authority: Keypair, account: PublicKey): Promise<string>;
    /**
     * Pause the stablecoin, blocking all minting and burning operations.
     *
     * @param pauser - Keypair of the designated pauser.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.pause(authority);
     * // txSig → "Exp3C...LU2" (base-58 transaction signature)
     *
     * const paused = await sdk.isPaused();
     * // paused → true
     * ```
     */
    pause(pauser: Keypair): Promise<string>;
    /**
     * Unpause the stablecoin, resuming normal operations.
     *
     * @param pauser - Keypair of the designated pauser.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.unpause(authority);
     * // txSig → "4NpnK...MN42" (base-58 transaction signature)
     *
     * const paused = await sdk.isPaused();
     * // paused → false
     * ```
     */
    unpause(pauser: Keypair): Promise<string>;
    /**
     * Authorise a new minter with an optional quota.
     *
     * @param authority - Keypair of the minter authority.
     * @param minter    - Public key of the wallet to grant minting rights.
     * @param quota     - Optional minting quota (max tokens per period).
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.addMinter(
     *   authority,
     *   minterKeypair.publicKey,
     *   { amount: 1_000_000 },
     * );
     * // txSig → "3MSqf...efX" (base-58 transaction signature)
     * // minterKeypair can now mint up to 1,000,000 base-unit tokens.
     * ```
     */
    addMinter(authority: Keypair, minter: PublicKey, quota?: MinterQuota): Promise<string>;
    /**
     * Revoke minting rights from an existing minter.
     *
     * @param authority - Keypair of the minter authority.
     * @param minter    - Public key of the minter to remove.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.removeMinter(authority, minterKeypair.publicKey);
     * // txSig → "2kTyb...fZg" (base-58 transaction signature)
     * // minterKeypair can no longer mint tokens.
     * ```
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
     * const txSig = await sdk.updateRoles(authority, {
     *   newPauser: newPauserKeypair.publicKey,
     *   newBurner: newBurnerKeypair.publicKey,
     * });
     * // txSig → "2yvxr...2bf" (base-58 transaction signature)
     * // Only pauser and burner roles are updated; other roles are unchanged.
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
     *
     * @example
     * ```ts
     * const txSig = await sdk.proposeAuthorityTransfer(
     *   currentAuthority,
     *   newAuthorityKeypair.publicKey,
     * );
     * // txSig → "4CMrN...MsK" (base-58 transaction signature)
     * // The transfer is now pending; newAuthorityKeypair must accept.
     * ```
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
     *
     * @example
     * ```ts
     * const txSig = await sdk.acceptAuthorityTransfer(newAuthorityKeypair);
     * // txSig → "5qvDA...7k" (base-58 transaction signature)
     * // newAuthorityKeypair is now the master authority.
     * ```
     */
    acceptAuthorityTransfer(pendingAuthority: Keypair): Promise<string>;
    /** @internal Read-only program instance (no wallet/signer needed). */
    private get readProgram();
    /**
     * Fetch a read-only snapshot of the stablecoin's on-chain configuration.
     *
     * @returns A {@link StablecoinInfo} object with name, symbol, supply, etc.
     *
     * @example
     * ```ts
     * const info = await sdk.getInfo();
     * // info → {
     * //   mint: PublicKey("HduyiW..."),
     * //   preset: "sss2",
     * //   name: "Test USD",
     * //   symbol: "TUSD",
     * //   totalSupply: 100000,
     * //   paused: false,
     * //   blacklistCount: 0
     * // }
     * ```
     */
    getInfo(): Promise<StablecoinInfo>;
    /**
     * Get the current total token supply in base units.
     *
     * @returns Total supply as a number.
     *
     * @example
     * ```ts
     * const supply = await sdk.getTotalSupply();
     * // supply → 100_000 (number of tokens in base units)
     * ```
     */
    getTotalSupply(): Promise<number>;
    /**
     * Check whether the stablecoin is currently paused.
     *
     * @returns `true` if paused, `false` otherwise.
     *
     * @example
     * ```ts
     * const paused = await sdk.isPaused();
     * // paused → false (stablecoin is operational)
     * ```
     */
    isPaused(): Promise<boolean>;
    /**
     * @internal Merges preset defaults with user-supplied overrides.
     * Returns a fully-resolved config with all extension flags set.
     */
    private static resolvePreset;
}
