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
} from './types';
import { ComplianceModule } from './modules/compliance';
import idl from '../../target/idl/sss_core.json';
import hookIdl from '../../target/idl/sss_transfer_hook.json';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

// ─── Network RPC map (single source of truth) ──────────────────────────────
const NETWORK_RPC: Record<SolanaNetwork, string> = {
    [SolanaNetwork.DEVNET]:   "https://api.devnet.solana.com",
    [SolanaNetwork.MAINNET]:  "https://api.mainnet-beta.solana.com",
    [SolanaNetwork.TESTNET]:  "https://api.testnet.solana.com",
    [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
};

export class SolanaStablecoin {
    // ✅ Store connection + network so we can build providers on demand
    public  readonly connection: Connection;
    private readonly network: SolanaNetwork;

    public  readonly mintAddress: PublicKey;
    public  readonly config:      PublicKey;
    public  readonly preset:      StablecoinPreset;
    public  readonly compliance:  ComplianceModule;

    // ── Constructor ────────────────────────────────────────────────────────
    private constructor(
        network:  SolanaNetwork,
        mint:     PublicKey,
        config:   PublicKey,
        preset:   StablecoinPreset,
    ) {
        this.network    = network;
        this.connection = new Connection(NETWORK_RPC[network], "confirmed");
        this.mintAddress = mint;
        this.config      = config;
        this.preset      = preset;

        if (preset === StablecoinPreset.SSS_2) {
            // Pass a factory so ComplianceModule can also build its own providers
            this.compliance = new ComplianceModule(
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
        }
    }

    // ── Key helper: build an AnchorProvider + Program for a given signer ──
    // This is what makes .rpc() work — every operation gets a proper provider.
    private buildProgram(signer: Keypair): Program<SssCore> {
        const wallet   = new NodeWallet(signer);
        const provider = new AnchorProvider(
            this.connection,
            wallet,
            { commitment: "confirmed", preflightCommitment: "confirmed" }
        );
        return new Program(idl as SssCore, provider);
    }

    // Same helper for the static create() context
    private static buildProgramForSigner(
        connection: Connection,
        signer: Keypair,
    ): Program<SssCore> {
        const wallet   = new NodeWallet(signer);
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
            preflightCommitment: "confirmed",
        });
        return new Program(idl as SssCore, provider);
    }

    // ── Static: create a brand-new stablecoin ─────────────────────────────
    static async create(
        config:  CreateStablecoinConfig,
        network: SolanaNetwork = SolanaNetwork.DEVNET,
    ): Promise<string> {
        const resolvedConfig = SolanaStablecoin.resolvePreset(config);
        const connection     = new Connection(NETWORK_RPC[network], "confirmed");

        // ✅ Build a proper Program using the authority as the wallet
        const program     = SolanaStablecoin.buildProgramForSigner(connection, config.authority);
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
            name:                   resolvedConfig.name,
            symbol:                 resolvedConfig.symbol,
            uri:                    resolvedConfig.uri,
            decimals:               resolvedConfig.decimals,
            preset:                 presetEnum,
            pauser:                 resolvedConfig.pauser          || config.authority.publicKey,
            minterAuthority:        resolvedConfig.minterAuthority || config.authority.publicKey,
            burner:                 resolvedConfig.burner           || config.authority.publicKey,
            enablePermanentDelegate: resolvedConfig.permanentDelegate    ?? false,
            enableTransferHook:     resolvedConfig.transferHook          ?? false,
            defaultAccountFrozen:   resolvedConfig.defaultAccountFrozen  ?? false,
            blacklister:            resolvedConfig.blacklister || null,
            seizer:                 resolvedConfig.seizer     || null,
            hookProgramId:          hookProgram.programId,
        };

        return await program.methods
            .initialize(params as any)
            .accounts({
                payer:           config.authority.publicKey,
                masterAuthority: config.authority.publicKey,
                mint:            mint.publicKey,
                config:          configPda,
                tokenProgram:    TOKEN_2022_PROGRAM_ID,
                systemProgram:   SystemProgram.programId,
                rent:            SYSVAR_RENT_PUBKEY,
            } as any)
            .signers([config.authority, mint]) // authority is already the wallet signer; mint is extra
            .rpc();
    }

    // ── Static: load an existing deployed stablecoin ──────────────────────
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
            configData.preset.sss2   ? StablecoinPreset.SSS_2   :
            configData.preset.custom ? StablecoinPreset.CUSTOM   :
            StablecoinPreset.SSS_1;

        return new SolanaStablecoin(network, mint, configPda, preset);
    }

    // ── Mint ──────────────────────────────────────────────────────────────
    async mint(params: MintParams): Promise<string> {
        const program = this.buildProgram(params.minter); // ✅ minter signs

        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), params.minter.publicKey.toBuffer()],
            program.programId,
        );

        return await program.methods
            .mint(new BN(params.amount))
            .accounts({
                minter:       params.minter.publicKey,
                config:       this.config,
                minterConfig,
                mint:         this.mintAddress,
                destination:  params.recipient,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([params.minter])
            .rpc();
    }

    // ── Burn ──────────────────────────────────────────────────────────────
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
                burner:       params.burner.publicKey,
                config:       this.config,
                source,
                mint:         this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([params.burner])
            .rpc();
    }

    // ── Freeze ────────────────────────────────────────────────────────────
    async freeze(authority: Keypair, account: PublicKey): Promise<string> {
        const program = this.buildProgram(authority); // ✅ authority signs

        return await program.methods
            .freezeAccount()
            .accounts({
                authority:    authority.publicKey,
                config:       this.config,
                account,
                mint:         this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

    // ── Thaw ──────────────────────────────────────────────────────────────
    async thaw(authority: Keypair, account: PublicKey): Promise<string> {
        const program = this.buildProgram(authority);

        return await program.methods
            .thawAccount()
            .accounts({
                authority:    authority.publicKey,
                config:       this.config,
                account,
                mint:         this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

    // ── Pause ─────────────────────────────────────────────────────────────
    async pause(pauser: Keypair): Promise<string> {
        const program = this.buildProgram(pauser);

        return await program.methods
            .pause()
            .accounts({
                pauser: pauser.publicKey,
                config: this.config,
                mint:   this.mintAddress,
            } as any)
            .signers([pauser])
            .rpc();
    }

    // ── Unpause ───────────────────────────────────────────────────────────
    async unpause(pauser: Keypair): Promise<string> {
        const program = this.buildProgram(pauser);

        return await program.methods
            .unpause()
            .accounts({
                pauser: pauser.publicKey,
                config: this.config,
                mint:   this.mintAddress,
            } as any)
            .signers([pauser])
            .rpc();
    }

    // ── Add minter ────────────────────────────────────────────────────────
    async addMinter(
        authority: Keypair,
        minter:    PublicKey,
        quota?:    MinterQuota,
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
                config:          this.config,
                minterConfig,
                mint:            this.mintAddress,
                systemProgram:   SystemProgram.programId,
            } as any)
            .signers([authority])
            .rpc();
    }

    // ── Remove minter ─────────────────────────────────────────────────────
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
                config:          this.config,
                minterConfig,
                mint:            this.mintAddress,
            } as any)
            .signers([authority])
            .rpc();
    }

    // ── Read-only helpers (no signer needed) ─────────────────────────────
    private get readProgram(): Program<SssCore> {
        return new Program(idl as SssCore, { connection: this.connection });
    }

    async getInfo(): Promise<StablecoinInfo> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return {
            mint:           this.mintAddress,
            preset:         this.preset,
            name:           data.name,
            symbol:         data.symbol,
            totalSupply:    data.totalSupply.toNumber(),
            paused:         data.paused,
            blacklistCount: data.blacklistCount,
        };
    }

    async getTotalSupply(): Promise<number> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.totalSupply.toNumber();
    }

    async isPaused(): Promise<boolean> {
        const data = await this.readProgram.account.stablecoinConfig.fetch(this.config);
        return data.paused;
    }

    // ── resolvePreset ─────────────────────────────────────────────────────
    private static resolvePreset(config: CreateStablecoinConfig): ResolvedConfig {
        const defaults: Record<StablecoinPreset, { permanentDelegate: boolean; transferHook: boolean; defaultAccountFrozen: boolean }> = {
            [StablecoinPreset.SSS_1]:  { permanentDelegate: false, transferHook: false, defaultAccountFrozen: false },
            [StablecoinPreset.SSS_2]:  { permanentDelegate: true,  transferHook: true,  defaultAccountFrozen: true  },
            [StablecoinPreset.CUSTOM]: { permanentDelegate: false, transferHook: false, defaultAccountFrozen: false },
        };

        if (!config.preset) return config as ResolvedConfig;

        const base = defaults[config.preset];
        const overrides = config.extensions ? {
            permanentDelegate:   config.extensions.permanentDelegate   ?? base.permanentDelegate,
            transferHook:        config.extensions.transferHook        ?? base.transferHook,
            defaultAccountFrozen: config.extensions.defaultAccountFrozen ?? base.defaultAccountFrozen,
        } : base;

        return { ...base, ...config, ...overrides };
    }
}