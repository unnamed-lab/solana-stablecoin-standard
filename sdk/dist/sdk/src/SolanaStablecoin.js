"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaStablecoin = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
const types_1 = require("./types");
const transfer_hook_1 = require("./modules/transfer-hook");
const compliance_1 = require("./modules/compliance");
const sss_core_json_1 = __importDefault(require("../../target/idl/sss_core.json"));
const sss_transfer_hook_json_1 = __importDefault(require("../../target/idl/sss_transfer_hook.json"));
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
/** @internal Maps each {@link SolanaNetwork} value to its default JSON-RPC endpoint. */
const NETWORK_RPC = {
    [types_1.SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [types_1.SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [types_1.SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [types_1.SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
};
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
class SolanaStablecoin {
    /** Active Solana JSON-RPC connection used for all operations. */
    connection;
    /** @internal */
    network;
    /** The SPL Token-2022 mint address for this stablecoin. */
    mintAddress;
    /** The on-chain `StablecoinConfig` PDA address. */
    config;
    /** Preset that was used when the stablecoin was created. */
    preset;
    /**
     * Compliance sub-module for blacklist and seizure operations.
     * Only available on **SSS-2** instances; accessing on SSS-1 / CUSTOM throws.
     */
    compliance;
    /**
     * Transfer hook sub-module for managing the Token-2022 transfer hook.
     * Only available on **SSS-2** instances; accessing on SSS-1 / CUSTOM throws.
     */
    transferHook;
    // ── Constructor ────────────────────────────────────────────────────────
    constructor(network, mint, config, preset) {
        this.network = network;
        this.connection = new web3_js_1.Connection(NETWORK_RPC[network], "confirmed");
        this.mintAddress = mint;
        this.config = config;
        this.preset = preset;
        if (preset === types_1.StablecoinPreset.SSS_2) {
            // Pass a factory so ComplianceModule can also build its own providers
            this.compliance = new compliance_1.ComplianceModule(this.connection, this.network, mint, config);
            this.transferHook = new transfer_hook_1.TransferHookModule(this.connection, this.network, mint, config);
        }
        else {
            this.compliance = new Proxy({}, {
                get() {
                    throw new Error("Compliance module is only available on SSS-2 instances");
                },
            });
            this.transferHook = new Proxy({}, {
                get() {
                    throw new Error("Transfer hook module is only available on SSS-2 instances");
                },
            });
        }
    }
    /**
     * @internal Builds an Anchor `Program<SssCore>` instance backed by the
     * given signer. Every write operation uses this to get a provider whose
     * wallet matches the required transaction signer.
     */
    buildProgram(signer) {
        const wallet = new nodewallet_1.default(signer);
        const provider = new anchor_1.AnchorProvider(this.connection, wallet, { commitment: "confirmed", preflightCommitment: "confirmed" });
        return new anchor_1.Program(sss_core_json_1.default, provider);
    }
    /** @internal Static variant of {@link buildProgram} for use in `create()`. */
    static buildProgramForSigner(connection, signer) {
        const wallet = new nodewallet_1.default(signer);
        const provider = new anchor_1.AnchorProvider(connection, wallet, {
            commitment: "confirmed",
            preflightCommitment: "confirmed",
        });
        return new anchor_1.Program(sss_core_json_1.default, provider);
    }
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
    static async create(config, network = types_1.SolanaNetwork.DEVNET) {
        const resolvedConfig = SolanaStablecoin.resolvePreset(config);
        const connection = new web3_js_1.Connection(NETWORK_RPC[network], "confirmed");
        // ✅ Build a proper Program using the authority as the wallet
        const program = SolanaStablecoin.buildProgramForSigner(connection, config.authority);
        const hookProgram = new anchor_1.Program(sss_transfer_hook_json_1.default, { connection });
        const mint = web3_js_1.Keypair.generate();
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), mint.publicKey.toBuffer()], program.programId);
        const presetEnum = resolvedConfig.preset === types_1.StablecoinPreset.SSS_2 ? { sss2: {} } :
            resolvedConfig.preset === types_1.StablecoinPreset.CUSTOM ? { custom: {} } :
                { sss1: {} };
        const params = {
            name: resolvedConfig.name,
            symbol: resolvedConfig.symbol,
            uri: resolvedConfig.uri,
            decimals: resolvedConfig.decimals,
            preset: presetEnum,
            pauser: resolvedConfig.pauser || config.authority.publicKey,
            minterAuthority: resolvedConfig.minterAuthority || config.authority.publicKey,
            burner: resolvedConfig.burner || config.authority.publicKey,
            enablePermanentDelegate: resolvedConfig.permanentDelegate ?? false,
            enableTransferHook: resolvedConfig.transferHook ?? false,
            defaultAccountFrozen: resolvedConfig.defaultAccountFrozen ?? false,
            blacklister: resolvedConfig.blacklister || null,
            seizer: resolvedConfig.seizer || null,
            hookProgramId: hookProgram.programId,
        };
        const txSig = await program.methods
            .initialize(params)
            .accounts({
            payer: config.authority.publicKey,
            masterAuthority: config.authority.publicKey,
            mint: mint.publicKey,
            config: configPda,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        })
            .signers([config.authority, mint])
            .rpc();
        return { txSig, mintAddress: mint.publicKey };
    }
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
    static async load(network = types_1.SolanaNetwork.DEVNET, mint) {
        const connection = new web3_js_1.Connection(NETWORK_RPC[network], "confirmed");
        // Read-only program — fine for fetching, no wallet needed
        const program = new anchor_1.Program(sss_core_json_1.default, { connection });
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), mint.toBuffer()], program.programId);
        const configData = await program.account.stablecoinConfig.fetch(configPda);
        const preset = configData.preset.sss2 ? types_1.StablecoinPreset.SSS_2 :
            configData.preset.custom ? types_1.StablecoinPreset.CUSTOM :
                types_1.StablecoinPreset.SSS_1;
        return new SolanaStablecoin(network, mint, configPda, preset);
    }
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
    async mint(params) {
        const program = this.buildProgram(params.minter); // ✅ minter signs
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mintAddress.toBuffer(), params.minter.publicKey.toBuffer()], program.programId);
        return await program.methods
            .mint(new anchor_1.BN(params.amount))
            .accounts({
            minter: params.minter.publicKey,
            config: this.config,
            minterConfig,
            mint: this.mintAddress,
            destination: params.recipient,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
        })
            .signers([params.minter])
            .rpc();
    }
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
    async burn(params) {
        const program = this.buildProgram(params.burner); // ✅ burner signs
        const source = params.source
            || (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, params.burner.publicKey, false, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await program.methods
            .burn(new anchor_1.BN(params.amount))
            .accounts({
            burner: params.burner.publicKey,
            config: this.config,
            source,
            mint: this.mintAddress,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
        })
            .signers([params.burner])
            .rpc();
    }
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
    async freeze(authority, account) {
        const program = this.buildProgram(authority); // ✅ authority signs
        return await program.methods
            .freezeAccount()
            .accounts({
            authority: authority.publicKey,
            config: this.config,
            account,
            mint: this.mintAddress,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
        })
            .signers([authority])
            .rpc();
    }
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
    async thaw(authority, account) {
        const program = this.buildProgram(authority);
        return await program.methods
            .thawAccount()
            .accounts({
            authority: authority.publicKey,
            config: this.config,
            account,
            mint: this.mintAddress,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
        })
            .signers([authority])
            .rpc();
    }
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
    async pause(pauser) {
        const program = this.buildProgram(pauser);
        return await program.methods
            .pause()
            .accounts({
            pauser: pauser.publicKey,
            config: this.config,
            mint: this.mintAddress,
        })
            .signers([pauser])
            .rpc();
    }
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
    async unpause(pauser) {
        const program = this.buildProgram(pauser);
        return await program.methods
            .unpause()
            .accounts({
            pauser: pauser.publicKey,
            config: this.config,
            mint: this.mintAddress,
        })
            .signers([pauser])
            .rpc();
    }
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
    async addMinter(authority, minter, quota) {
        const program = this.buildProgram(authority);
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()], program.programId);
        return await program.methods
            .addMinter(minter, new anchor_1.BN(quota?.amount ?? 0), new anchor_1.BN(0))
            .accounts({
            minterAuthority: authority.publicKey,
            config: this.config,
            minterConfig,
            mint: this.mintAddress,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([authority])
            .rpc();
    }
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
    async removeMinter(authority, minter) {
        const program = this.buildProgram(authority);
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()], program.programId);
        return await program.methods
            .removeMinter(minter)
            .accounts({
            minterAuthority: authority.publicKey,
            config: this.config,
            minterConfig,
            mint: this.mintAddress,
        })
            .signers([authority])
            .rpc();
    }
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
    async updateRoles(authority, update) {
        const program = this.buildProgram(authority);
        return await program.methods
            .updateRoles({
            newPauser: update.newPauser || null,
            newMinterAuthority: update.newMinterAuthority || null,
            newBurner: update.newBurner || null,
            newBlacklister: update.newBlacklister || null,
            newSeizer: update.newSeizer || null,
        })
            .accounts({
            masterAuthority: authority.publicKey,
            config: this.config,
            mint: this.mintAddress,
        })
            .signers([authority])
            .rpc();
    }
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
    async proposeAuthorityTransfer(authority, newAuthority) {
        const program = this.buildProgram(authority);
        return await program.methods
            .proposeAuthorityTransfer(newAuthority)
            .accounts({
            masterAuthority: authority.publicKey,
            config: this.config,
            mint: this.mintAddress,
        })
            .signers([authority])
            .rpc();
    }
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
    async acceptAuthorityTransfer(pendingAuthority) {
        const program = this.buildProgram(pendingAuthority);
        return await program.methods
            .acceptAuthorityTransfer()
            .accounts({
            pendingAuthority: pendingAuthority.publicKey,
            config: this.config,
            mint: this.mintAddress,
        })
            .signers([pendingAuthority])
            .rpc();
    }
    // ── Read-only helpers ────────────────────────────────────────────────
    /** @internal Read-only program instance (no wallet/signer needed). */
    get readProgram() {
        return new anchor_1.Program(sss_core_json_1.default, { connection: this.connection });
    }
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
    async getInfo() {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return {
            mint: this.mintAddress,
            preset: this.preset,
            name: data.name,
            symbol: data.symbol,
            totalSupply: data.totalSupply.toNumber(),
            paused: data.paused,
            blacklistCount: data.blacklistCount,
        };
    }
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
    async getTotalSupply() {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.totalSupply.toNumber();
    }
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
    async isPaused() {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.paused;
    }
    /**
     * @internal Merges preset defaults with user-supplied overrides.
     * Returns a fully-resolved config with all extension flags set.
     */
    static resolvePreset(config) {
        const defaults = {
            [types_1.StablecoinPreset.SSS_1]: { permanentDelegate: false, transferHook: false, defaultAccountFrozen: false },
            [types_1.StablecoinPreset.SSS_2]: { permanentDelegate: true, transferHook: true, defaultAccountFrozen: true },
            [types_1.StablecoinPreset.CUSTOM]: { permanentDelegate: false, transferHook: false, defaultAccountFrozen: false },
        };
        if (!config.preset)
            return config;
        const base = defaults[config.preset];
        const overrides = config.extensions ? {
            permanentDelegate: config.extensions.permanentDelegate ?? base.permanentDelegate,
            transferHook: config.extensions.transferHook ?? base.transferHook,
            defaultAccountFrozen: config.extensions.defaultAccountFrozen ?? base.defaultAccountFrozen,
        } : base;
        return { ...base, ...config, ...overrides };
    }
}
exports.SolanaStablecoin = SolanaStablecoin;
//# sourceMappingURL=SolanaStablecoin.js.map