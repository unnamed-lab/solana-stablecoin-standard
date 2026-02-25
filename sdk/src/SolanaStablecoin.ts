import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
    Program,
    BN,
    AnchorProvider,
} from '@coral-xyz/anchor';
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { SssCore } from './types/sss_core';
import { SssTransferHook } from './types/sss_transfer_hook';
import {
    CreateStablecoinConfig,
    MintParams,
    BurnParams,
    StablecoinPreset,
    StablecoinInfo,
    ResolvedConfig,
    MinterQuota,
    SolanaNetwork,
    RoleUpdateParams,
} from './types';
import { TransferHookModule } from './modules/transfer-hook';
import { ComplianceModule } from './modules/compliance';
import idl from '../../target/idl/sss_core.json';
import hookIdl from '../../target/idl/sss_transfer_hook.json';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

/** @internal Maps each {@link SolanaNetwork} value to its default JSON-RPC endpoint. */
const NETWORK_RPC: Record<SolanaNetwork, string> = {
    [SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
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
export class SolanaStablecoin {
    /** Active Solana JSON-RPC connection used for all operations. */
    public readonly connection: Connection;
    /** @internal */
    private readonly network: SolanaNetwork;

    /** The SPL Token-2022 mint address for this stablecoin. */
    public readonly mintAddress: PublicKey;
    /** The on-chain `StablecoinConfig` PDA address. */
    public readonly config: PublicKey;
    /** Preset that was used when the stablecoin was created. */
    public readonly preset: StablecoinPreset;
    /**
     * Compliance sub-module for blacklist and seizure operations.
     * Only available on **SSS-2** instances; accessing on SSS-1 / CUSTOM throws.
     */
    public readonly compliance: ComplianceModule;
    /**
     * Transfer hook sub-module for managing the Token-2022 transfer hook.
     * Only available on **SSS-2** instances; accessing on SSS-1 / CUSTOM throws.
     */
    public readonly transferHook: TransferHookModule;

    // ── Constructor ────────────────────────────────────────────────────────
    private constructor(
        network: SolanaNetwork,
        mint: PublicKey,
        config: PublicKey,
        preset: StablecoinPreset,
    ) {
        this.network = network;
        this.connection = new Connection(NETWORK_RPC[network], "confirmed");
        this.mintAddress = mint;
        this.config = config;
        this.preset = preset;

        if (preset === StablecoinPreset.SSS_2) {
            // Pass a factory so ComplianceModule can also build its own providers
            this.compliance = new ComplianceModule(
                this.connection,
                this.network,
                mint,
                config,
            );
            this.transferHook = new TransferHookModule(
                this.connection,
                this.network,
                mint,
                config,
            );
        } else {
            this.compliance = new Proxy({} as ComplianceModule, {
                get() {
                    throw new Error(
                        "Compliance module is only available on SSS-2 instances"
                    );
                },
            });
            this.transferHook = new Proxy({} as TransferHookModule, {
                get() {
                    throw new Error(
                        "Transfer hook module is only available on SSS-2 instances"
                    );
                },
            });
        }
    }

    /**
     * @internal Builds an Anchor `Program<SssCore>` instance backed by the
     * given signer. Every write operation uses this to get a provider whose
     * wallet matches the required transaction signer.
     */
    private buildProgram(signer: Keypair): Program<SssCore> {
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(
            this.connection,
            wallet,
            { commitment: "confirmed", preflightCommitment: "confirmed" }
        );
        return new Program(idl as SssCore, provider);
    }

    /** @internal Static variant of {@link buildProgram} for use in `create()`. */
    private static buildProgramForSigner(
        connection: Connection,
        signer: Keypair,
    ): Program<SssCore> {
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
            preflightCommitment: "confirmed",
        });
        return new Program(idl as SssCore, provider);
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
     * ```
     */
    static async create(
        config: CreateStablecoinConfig,
        network: SolanaNetwork = SolanaNetwork.DEVNET,
    ): Promise<{ txSig: string; mintAddress: PublicKey }> {
        const resolvedConfig = SolanaStablecoin.resolvePreset(config);
        const connection = new Connection(NETWORK_RPC[network], "confirmed");

        // ✅ Build a proper Program using the authority as the wallet
        const program = SolanaStablecoin.buildProgramForSigner(connection, config.authority);
        const hookProgram = new Program(hookIdl as SssTransferHook, { connection });

        const mint = Keypair.generate();
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), mint.publicKey.toBuffer()],
            program.programId,
        );

        const presetEnum =
            resolvedConfig.preset === StablecoinPreset.SSS_2 ? { sss2: {} } :
                resolvedConfig.preset === StablecoinPreset.CUSTOM ? { custom: {} } :
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
            .initialize(params as any)
            .accounts({
                payer: config.authority.publicKey,
                masterAuthority: config.authority.publicKey,
                mint: mint.publicKey,
                config: configPda,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            } as any)
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
     * console.log(await sdk.getInfo());
     * ```
     */
    static async load(
        network: SolanaNetwork = SolanaNetwork.DEVNET,
        mint: PublicKey,
    ): Promise<SolanaStablecoin> {
        const connection = new Connection(NETWORK_RPC[network], "confirmed");
        // Read-only program — fine for fetching, no wallet needed
        const program = new Program(idl as SssCore, { connection });

        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), mint.toBuffer()],
            program.programId,
        );

        const configData = await program.account.stablecoinConfig.fetch(configPda);

        const preset =
            configData.preset.sss2 ? StablecoinPreset.SSS_2 :
                configData.preset.custom ? StablecoinPreset.CUSTOM :
                    StablecoinPreset.SSS_1;

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
     */
    async mint(params: MintParams): Promise<string> {
        const program = this.buildProgram(params.minter); // ✅ minter signs

        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), params.minter.publicKey.toBuffer()],
            program.programId,
        );

        return await program.methods
            .mint(new BN(params.amount))
            .accounts({
                minter: params.minter.publicKey,
                config: this.config,
                minterConfig,
                mint: this.mintAddress,
                destination: params.recipient,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([params.minter])
            .rpc();
    }

    /**
     * Burn tokens from a token account.
     *
     * If `source` is omitted, the burner's associated token account (ATA) is used.
     *
     * @param params - Burn parameters (amount, burner keypair, optional source ATA).
     * @returns Transaction signature.
     */
    async burn(params: BurnParams): Promise<string> {
        const program = this.buildProgram(params.burner); // ✅ burner signs

        const source = params.source
            || getAssociatedTokenAddressSync(
                this.mintAddress,
                params.burner.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );

        return await program.methods
            .burn(new BN(params.amount))
            .accounts({
                burner: params.burner.publicKey,
                config: this.config,
                source,
                mint: this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([params.burner])
            .rpc();
    }

    /**
     * Freeze a token account, preventing all transfers out of it.
     *
     * @param authority - Keypair of the freeze authority (master authority or delegated).
     * @param account   - The token account to freeze.
     * @returns Transaction signature.
     */
    async freeze(authority: Keypair, account: PublicKey): Promise<string> {
        const program = this.buildProgram(authority); // ✅ authority signs

        return await program.methods
            .freezeAccount()
            .accounts({
                authority: authority.publicKey,
                config: this.config,
                account,
                mint: this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Thaw (unfreeze) a previously frozen token account.
     *
     * @param authority - Keypair of the freeze authority.
     * @param account   - The token account to thaw.
     * @returns Transaction signature.
     */
    async thaw(authority: Keypair, account: PublicKey): Promise<string> {
        const program = this.buildProgram(authority);

        return await program.methods
            .thawAccount()
            .accounts({
                authority: authority.publicKey,
                config: this.config,
                account,
                mint: this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Pause the stablecoin, blocking all minting and burning operations.
     *
     * @param pauser - Keypair of the designated pauser.
     * @returns Transaction signature.
     */
    async pause(pauser: Keypair): Promise<string> {
        const program = this.buildProgram(pauser);

        return await program.methods
            .pause()
            .accounts({
                pauser: pauser.publicKey,
                config: this.config,
                mint: this.mintAddress,
            } as any)
            .signers([pauser])
            .rpc();
    }

    /**
     * Unpause the stablecoin, resuming normal operations.
     *
     * @param pauser - Keypair of the designated pauser.
     * @returns Transaction signature.
     */
    async unpause(pauser: Keypair): Promise<string> {
        const program = this.buildProgram(pauser);

        return await program.methods
            .unpause()
            .accounts({
                pauser: pauser.publicKey,
                config: this.config,
                mint: this.mintAddress,
            } as any)
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
     */
    async addMinter(
        authority: Keypair,
        minter: PublicKey,
        quota?: MinterQuota,
    ): Promise<string> {
        const program = this.buildProgram(authority);

        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()],
            program.programId,
        );

        return await program.methods
            .addMinter(
                minter,
                new BN(quota?.amount ?? 0),
                new BN(0),
            )
            .accounts({
                minterAuthority: authority.publicKey,
                config: this.config,
                minterConfig,
                mint: this.mintAddress,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Revoke minting rights from an existing minter.
     *
     * @param authority - Keypair of the minter authority.
     * @param minter    - Public key of the minter to remove.
     * @returns Transaction signature.
     */
    async removeMinter(authority: Keypair, minter: PublicKey): Promise<string> {
        const program = this.buildProgram(authority);

        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()],
            program.programId,
        );

        return await program.methods
            .removeMinter(minter)
            .accounts({
                minterAuthority: authority.publicKey,
                config: this.config,
                minterConfig,
                mint: this.mintAddress,
            } as any)
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
     * await sdk.updateRoles(authority, { newPauser: newPauserPubkey });
     * ```
     */
    async updateRoles(authority: Keypair, update: RoleUpdateParams): Promise<string> {
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
            } as any)
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
     */
    async proposeAuthorityTransfer(
        authority: Keypair,
        newAuthority: PublicKey,
    ): Promise<string> {
        const program = this.buildProgram(authority);

        return await program.methods
            .proposeAuthorityTransfer(newAuthority)
            .accounts({
                masterAuthority: authority.publicKey,
                config: this.config,
                mint: this.mintAddress,
            } as any)
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
     */
    async acceptAuthorityTransfer(pendingAuthority: Keypair): Promise<string> {
        const program = this.buildProgram(pendingAuthority);

        return await program.methods
            .acceptAuthorityTransfer()
            .accounts({
                pendingAuthority: pendingAuthority.publicKey,
                config: this.config,
                mint: this.mintAddress,
            } as any)
            .signers([pendingAuthority])
            .rpc();
    }

    // ── Read-only helpers ────────────────────────────────────────────────

    /** @internal Read-only program instance (no wallet/signer needed). */
    private get readProgram(): Program<SssCore> {
        return new Program(idl as SssCore, { connection: this.connection });
    }

    /**
     * Fetch a read-only snapshot of the stablecoin's on-chain configuration.
     *
     * @returns A {@link StablecoinInfo} object with name, symbol, supply, etc.
     */
    async getInfo(): Promise<StablecoinInfo> {
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
     * @returns Total supply as a number.
     */
    async getTotalSupply(): Promise<number> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.totalSupply.toNumber();
    }

    /**
     * Check whether the stablecoin is currently paused.
     * @returns `true` if paused, `false` otherwise.
     */
    async isPaused(): Promise<boolean> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.paused;
    }

    /**
     * @internal Merges preset defaults with user-supplied overrides.
     * Returns a fully-resolved config with all extension flags set.
     */
    private static resolvePreset(config: CreateStablecoinConfig): ResolvedConfig {
        const defaults: Record<StablecoinPreset, { permanentDelegate: boolean; transferHook: boolean; defaultAccountFrozen: boolean }> = {
            [StablecoinPreset.SSS_1]: { permanentDelegate: false, transferHook: false, defaultAccountFrozen: false },
            [StablecoinPreset.SSS_2]: { permanentDelegate: true, transferHook: true, defaultAccountFrozen: true },
            [StablecoinPreset.CUSTOM]: { permanentDelegate: false, transferHook: false, defaultAccountFrozen: false },
        };

        if (!config.preset) return config as ResolvedConfig;

        const base = defaults[config.preset];
        const overrides = config.extensions ? {
            permanentDelegate: config.extensions.permanentDelegate ?? base.permanentDelegate,
            transferHook: config.extensions.transferHook ?? base.transferHook,
            defaultAccountFrozen: config.extensions.defaultAccountFrozen ?? base.defaultAccountFrozen,
        } : base;

        return { ...base, ...config, ...overrides };
    }
}