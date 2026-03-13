import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import {
    Program,
    BN,
    AnchorProvider,
} from '@coral-xyz/anchor';
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    transferChecked,
    getMint,
} from '@solana/spl-token';
import { SssCore } from './types/sss_core';
import { SssTransferHook } from './types/sss_transfer_hook';
import {
    CreateStablecoinConfig,
    MintParams,
    BurnParams,
    TransferParams,
    StablecoinPreset,
    StablecoinInfo,
    ResolvedConfig,
    MinterQuota,
    SolanaNetwork,
    RoleUpdateParams,
} from './types';
import { TransferHookModule } from './modules/transfer-hook';
import { ComplianceModule } from './modules/compliance';
import { Sss3Module } from './modules/sss3';
import { AnalyticsModule } from './modules/analytics';
import idl from './idl/sss_core.json';
import hookIdl from './idl/sss_transfer_hook.json';
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
     * Only available on **SSS-2 / SSS-3** instances.
     */
    public readonly transferHook: TransferHookModule;
    /**
     * SSS-3 sub-module for scoped allowlists and confidential transfers.
     * Only available on **SSS-2 / SSS-3** instances (since SSS-2 can upgrade).
     */
    public readonly sss3: Sss3Module;
    /**
     * Analytics sub-module for supply caps, snapshots, and metrics.
     * Available on all preset instances.
     */
    public readonly analytics: AnalyticsModule;

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

        this.analytics = new AnalyticsModule(
            this.connection,
            this.network,
            mint,
            config,
        );

        if (preset === StablecoinPreset.SSS_2 || preset === StablecoinPreset.SSS_3) {
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
            this.sss3 = new Sss3Module(
                this.connection,
                this.network,
                mint,
                config,
            );
        } else {
            this.compliance = new Proxy({} as ComplianceModule, {
                get() {
                    throw new Error(
                        "Compliance module is only available on SSS-2 and SSS-3 instances"
                    );
                },
            });
            this.transferHook = new Proxy({} as TransferHookModule, {
                get() {
                    throw new Error(
                        "Transfer hook module is only available on SSS-2 and SSS-3 instances"
                    );
                },
            });
            this.sss3 = new Proxy({} as Sss3Module, {
                get() {
                    throw new Error(
                        "SSS-3 module is only available on SSS-2 and SSS-3 instances"
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

        /** @internal Builds a read-only Program instance for fetching data. */
    private static buildReadOnlyProgram(connection: Connection): Program<SssCore> {
        // Use a dummy keypair for read-only operations (not used for signing)
        const dummyKeypair = Keypair.generate();
        const wallet = new NodeWallet(dummyKeypair);
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
     * // txSig       → "5Kz7H...xYpQ" (base-58 transaction signature)
     * // mintAddress  → PublicKey("HduyiW...") (newly created mint)
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
            resolvedConfig.preset === StablecoinPreset.SSS_3 ? { sss3: {} } :
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
     * // sdk.mintAddress  → PublicKey("HduyiW...") (the loaded mint)
     * // sdk.preset       → "sss2"  (auto-detected from on-chain config)
     *
     * const info = await sdk.getInfo();
     * // info.name        → "ACME USD"
     * // info.totalSupply → 1_000_000
     * ```
     */
    static async load(
        network: SolanaNetwork = SolanaNetwork.DEVNET,
        mint: PublicKey,
    ): Promise<SolanaStablecoin> {
                const connection = new Connection(NETWORK_RPC[network], "confirmed");
        // Read-only program — fine for fetching, no wallet needed
        const program = SolanaStablecoin.buildReadOnlyProgram(connection);
        // const connection = new Connection(NETWORK_RPC[network], "confirmed");
        // // Read-only program — fine for fetching, no wallet needed
        // const program = new Program(idl as SssCore, { connection });

        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), mint.toBuffer()],
            program.programId,
        );

        const configData = await program.account.stablecoinConfig.fetch(configPda);

        const preset =
            configData.preset.sss3 ? StablecoinPreset.SSS_3 :
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
    async mint(params: MintParams): Promise<string> {
        const program = this.buildProgram(params.minter); // ✅ minter signs

        // Resolve recipient: if it's a wallet address (not a token account),
        // derive the Token-2022 ATA and create it if it doesn't exist.
        let destination = params.recipient;
        const recipientInfo = await this.connection.getAccountInfo(destination);
        const isExistingTokenAccount = recipientInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID);

        if (!isExistingTokenAccount) {
            // Treat recipient as a wallet address — derive ATA
            const recipientWallet = destination;
            destination = getAssociatedTokenAddressSync(
                this.mintAddress,
                recipientWallet,
                false,
                TOKEN_2022_PROGRAM_ID,
            );

            // Create the ATA if it doesn't exist yet
            const ataInfo = await this.connection.getAccountInfo(destination);
            if (!ataInfo) {
                const createAtaTx = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                        params.minter.publicKey, // payer
                        destination,
                        recipientWallet,
                        this.mintAddress,
                        TOKEN_2022_PROGRAM_ID,
                    ),
                );
                const latestBlockhash = await this.connection.getLatestBlockhash();
                createAtaTx.recentBlockhash = latestBlockhash.blockhash;
                createAtaTx.feePayer = params.minter.publicKey;
                createAtaTx.sign(params.minter);
                const ataSignature = await this.connection.sendRawTransaction(
                    createAtaTx.serialize(),
                );
                await this.connection.confirmTransaction(ataSignature, 'confirmed');
            }
        }

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
                destination,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
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
    async burn(params: BurnParams): Promise<string> {
        const program = this.buildProgram(params.burner); // ✅ burner signs

        let source: PublicKey;
        if (params.source) {
            // Check if the provided source is a token account or a wallet address
            const sourceInfo = await this.connection.getAccountInfo(params.source);
            const isTokenAccount = sourceInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID);
            if (isTokenAccount) {
                source = params.source;
            } else {
                // Treat it as a wallet address — derive the ATA
                source = getAssociatedTokenAddressSync(
                    this.mintAddress,
                    params.source,
                    false,
                    TOKEN_2022_PROGRAM_ID,
                );
            }
        } else {
            // Default to the burner's own ATA
            source = getAssociatedTokenAddressSync(
                this.mintAddress,
                params.burner.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
        }

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
     * Transfer tokens between two token accounts using Token-2022's
     * `transfer_checked` instruction.
     *
     * This is a direct SPL Token transfer — it does **not** go through
     * sss-core. For SSS-2 tokens with the transfer-hook enabled, the hook
     * will still fire automatically.
     *
     * @param params - Transfer parameters (sender keypair, source ATA, destination ATA, amount).
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.transfer({
     *   sender: senderKeypair,
     *   fromAta: senderAta,
     *   toAta: recipientAta,
     *   amount: 100_000,
     * });
     * ```
     */
    async transfer(params: TransferParams): Promise<string> {
        const mintInfo = await getMint(
            this.connection,
            this.mintAddress,
            'confirmed',
            TOKEN_2022_PROGRAM_ID,
        );

        // Resolve fromAta: if it's a wallet address, derive ATA
        let fromAta = params.fromAta;
        const fromInfo = await this.connection.getAccountInfo(fromAta);
        const isFromToken = fromInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID);
        if (!isFromToken) {
            fromAta = getAssociatedTokenAddressSync(
                this.mintAddress,
                params.fromAta,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
        }

        // Resolve toAta: if it's a wallet address, derive ATA and create if needed
        let toAta = params.toAta;
        const toInfo = await this.connection.getAccountInfo(toAta);
        const isToToken = toInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID);
        if (!isToToken) {
            const recipientWallet = toAta;
            toAta = getAssociatedTokenAddressSync(
                this.mintAddress,
                recipientWallet,
                false,
                TOKEN_2022_PROGRAM_ID,
            );

            // Create the ATA if it doesn't exist yet
            const ataInfo = await this.connection.getAccountInfo(toAta);
            if (!ataInfo) {
                const createAtaTx = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                        params.sender.publicKey,
                        toAta,
                        recipientWallet,
                        this.mintAddress,
                        TOKEN_2022_PROGRAM_ID,
                    ),
                );
                const latestBlockhash = await this.connection.getLatestBlockhash();
                createAtaTx.recentBlockhash = latestBlockhash.blockhash;
                createAtaTx.feePayer = params.sender.publicKey;
                createAtaTx.sign(params.sender);
                const ataSignature = await this.connection.sendRawTransaction(
                    createAtaTx.serialize(),
                );
                await this.connection.confirmTransaction(ataSignature, 'confirmed');
            }
        }

        const sig = await transferChecked(
            this.connection,
            params.sender,            // payer & signer
            fromAta,                  // source ATA
            this.mintAddress,         // mint
            toAta,                    // destination ATA
            params.sender.publicKey,  // owner of source ATA
            BigInt(params.amount),
            mintInfo.decimals,        // actual mint decimals
            [],
            { commitment: 'confirmed' },
            TOKEN_2022_PROGRAM_ID,
        );

        return sig;
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
    async freeze(authority: Keypair, account: PublicKey): Promise<string> {
        const program = this.buildProgram(authority); // ✅ authority signs

        // Resolve: if account is a wallet address (not a token account), derive ATA
        let tokenAccount = account;
        const accountInfo = await this.connection.getAccountInfo(account);
        const isTokenAccount = accountInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID);
        if (!isTokenAccount) {
            tokenAccount = getAssociatedTokenAddressSync(
                this.mintAddress,
                account,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
        }

        return await program.methods
            .freezeAccount()
            .accounts({
                authority: authority.publicKey,
                config: this.config,
                account: tokenAccount,
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
     *
     * @example
     * ```ts
     * const txSig = await sdk.thaw(authority, user1Ata);
     * // txSig → "2yvxr...2bf" (base-58 transaction signature)
     * // The token account is now unfrozen; transfers are allowed again.
     * ```
     */
    async thaw(authority: Keypair, account: PublicKey): Promise<string> {
        const program = this.buildProgram(authority);

        // Resolve: if account is a wallet address (not a token account), derive ATA
        let tokenAccount = account;
        const accountInfo = await this.connection.getAccountInfo(account);
        const isTokenAccount = accountInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID);
        if (!isTokenAccount) {
            tokenAccount = getAssociatedTokenAddressSync(
                this.mintAddress,
                account,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
        }

        return await program.methods
            .thawAccount()
            .accounts({
                authority: authority.publicKey,
                config: this.config,
                account: tokenAccount,
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
     *
     * @example
     * ```ts
     * const txSig = await sdk.removeMinter(authority, minterKeypair.publicKey);
     * // txSig → "2kTyb...fZg" (base-58 transaction signature)
     * // minterKeypair can no longer mint tokens.
     * ```
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
     * const txSig = await sdk.updateRoles(authority, {
     *   newPauser: newPauserKeypair.publicKey,
     *   newBurner: newBurnerKeypair.publicKey,
     * });
     * // txSig → "2yvxr...2bf" (base-58 transaction signature)
     * // Only pauser and burner roles are updated; other roles are unchanged.
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
     *
     * @example
     * ```ts
     * const txSig = await sdk.acceptAuthorityTransfer(newAuthorityKeypair);
     * // txSig → "5qvDA...7k" (base-58 transaction signature)
     * // newAuthorityKeypair is now the master authority.
     * ```
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

    // ─── SSS-3 Governance Multisig Methods ──────────────────────────────

    /**
     * Create a new SSS-3 governance proposal for administrative actions.
     */
    async createProposal(params: {
        proposer: Keypair;
        action: any;
    }): Promise<string> {
        const program = this.buildProgram(params.proposer);

        const [multisigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-multisig"), this.mintAddress.toBuffer()],
            program.programId
        );

        const multisigData = await program.account.multisig.fetch(multisigPda);
        const proposalNonceBytes = new Uint8Array(new BN(multisigData.proposalNonce).toArray('le', 8));

        const [proposalPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-proposal"), multisigPda.toBuffer(), proposalNonceBytes],
            program.programId
        );

        return await program.methods
            .createProposal(params.action)
            .accounts({
                proposer: params.proposer.publicKey,
                multisig: multisigPda,
                proposal: proposalPda,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([params.proposer])
            .rpc();
    }

    /**
     * Approve an existing SSS-3 proposal.
     */
    async approveProposal(params: {
        approver: Keypair;
        proposalParams: { proposalAddress: PublicKey };
    }): Promise<string> {
        const program = this.buildProgram(params.approver);

        const [multisigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-multisig"), this.mintAddress.toBuffer()],
            program.programId
        );

        return await program.methods
            .approveProposal()
            .accounts({
                signer: params.approver.publicKey,
                multisig: multisigPda,
                proposal: params.proposalParams.proposalAddress,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([params.approver])
            .rpc();
    }

    /**
     * Fetch all SSS-3 proposals for this mint.
     */
    async getProposals(): Promise<any[]> {
        const program = this.readProgram;

        const [multisigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-multisig"), this.mintAddress.toBuffer()],
            program.programId
        );

        // Fetch all proposal accounts that belong to this multisig
        const proposals = await program.account.proposal.all([
            {
                memcmp: {
                    offset: 8, // discriminator
                    bytes: multisigPda.toBase58(),
                }
            }
        ]);

        return proposals;
    }

    // ── Read-only helpers ────────────────────────────────────────────────

    /** @internal Read-only program instance (no wallet/signer needed). */
    // private get readProgram(): Program<SssCore> {
    //     return new Program(idl as SssCore, { connection: this.connection });
    // }

        private get readProgram(): Program<SssCore> {
        return SolanaStablecoin.buildReadOnlyProgram(this.connection);
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
            allowlistCount: data.allowlistCount,
            maxSupply: data.maxSupply.toNumber() > 0 ? data.maxSupply.toNumber() : undefined,
            confidentialEnabled: data.confidentialTransfersEnabled,
            allowlistActive: data.allowlistActive,
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
    async getTotalSupply(): Promise<number> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.totalSupply.toNumber();
    }

    /**
     * Get the maximum token supply in base units.
     * 
     * Uses the SSS-3 max_supply configuration field. Returns `null` if no cap is set.
     *
     * @returns Maximum supply cap or `null`.
     *
     * @example
     * ```ts
     * const maxSupply = await sdk.getMaxSupply();
     * // maxSupply → 10_000_000
     * ```
     */
    async getMaxSupply(): Promise<number | null> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.maxSupply.toNumber() > 0 ? data.maxSupply.toNumber() : null;
    }

    /**
     * Get the total number of unique token holders (accounts) for this mint.
     * Note: This fetches all token accounts for the mint via RPC and may be slow for large tokens.
     *
     * @returns The total number of token accounts.
     *
     * @example
     * ```ts
     * const holdersCount = await sdk.getHoldersCount();
     * // holdersCount → 1500
     * ```
     */
    async getHoldersCount(): Promise<number> {
        // We use getProgramAccounts with a memcmp filter on the mint address (offset 0 in Token account layout).
        // Since Token-2022 accounts can have variable sizes due to extensions, we cannot rely solely on dataSize.
        // We use dataSlice to avoid fetching the actual account data, saving bandwidth.
        const tokenHolders = await this.connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
            filters: [
                { memcmp: { offset: 0, bytes: this.mintAddress.toBase58() } },
            ],
            dataSlice: { offset: 0, length: 0 }
        });

        return tokenHolders.length;
    }

    /**
     * Get the largest token holders for this mint.
     *
     * @param minAmount - Optional minimum balance in base units to filter the list.
     * @returns An array of the top token holders.
     *
     * @example
     * ```ts
     * const largestHolders = await sdk.getLargestHolders(1000);
     * // largestHolders → [{ address: PublicKey, amount: 50000, decimals: 6, uiAmount: 0.05 }]
     * ```
     */
    async getLargestHolders(minAmount: number = 0): Promise<Array<{
        address: PublicKey;
        amount: string;
        decimals: number;
        uiAmount: number | null;
        uiAmountString?: string;
    }>> {
        const response = await this.connection.getTokenLargestAccounts(this.mintAddress);
        const holders = response.value.filter((account) => Number(account.amount) >= minAmount);

        // Fetch parsed account info to get the actual wallet owner of the token account
        const accountsToFetch = holders.map((h) => h.address);
        if (accountsToFetch.length === 0) {
            return [];
        }
        const parsedAccounts = await this.connection.getMultipleParsedAccounts(accountsToFetch);

        return holders.map((account, index) => {
            const parsedData = parsedAccounts.value[index]?.data as any;
            const ownerString = parsedData?.parsed?.info?.owner;
            const address = ownerString ? new PublicKey(ownerString) : account.address;

            return {
                address,
                amount: account.amount,
                decimals: account.decimals,
                uiAmount: account.uiAmount,
                uiAmountString: account.uiAmountString,
            };
        });
    }

    /**
     * Get all minters for this stablecoin from on-chain minter configs.
     * 
     * @returns Array of minter authorities and their quotas.
     */
    async getMinters(): Promise<Array<{ minter: PublicKey, isActive: boolean, quota: number }>> {
        const minters = await this.readProgram.account.minterConfig.all([
            {
                memcmp: {
                    offset: 8, // 8 byte discriminator
                    bytes: this.mintAddress.toBase58(),
                }
            }
        ]);
        return minters.map((m) => ({
            minter: m.account.minter,
            isActive: m.account.isActive,
            quota: m.account.quotaPerPeriod.toNumber(),
        }));
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
            [StablecoinPreset.SSS_3]: { permanentDelegate: true, transferHook: true, defaultAccountFrozen: true },
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