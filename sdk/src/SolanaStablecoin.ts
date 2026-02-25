import { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, BN } from '@anchor-lang/core';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { SssCore } from './sss_core';
import { SssTransferHook } from './sss_transfer_hook';
import {
    CreateStablecoinConfig,
    MintParams,
    BurnParams,
    StablecoinPreset,
    StablecoinInfo,
    ResolvedConfig,
    MinterQuota,
    SolanaNetwork
} from './types';
import { ComplianceModule } from './modules/compliance';
import idl from '../../target/idl/sss_core.json';

export class SolanaStablecoin {
    private program: Program<SssCore>;
    private hookProgram: Program<SssTransferHook>;
    public mintAddress: PublicKey;
    public config: PublicKey;
    public compliance: ComplianceModule; // SSS-2 only, throws if SSS-1
    public preset: StablecoinPreset;
    public connection: Connection;

    private constructor(
        network: SolanaNetwork = SolanaNetwork.DEVNET,
        program: Program<SssCore>,
        hookProgram: Program<SssTransferHook>,
        mint: PublicKey,
        config: PublicKey,
        preset: StablecoinPreset
    ) {
        const networkRpc = {
            [SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
            [SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
            [SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
            [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
        };

        // Set up a connection to the cluster
        const connection = new Connection(networkRpc[network], "confirmed");
        this.connection = connection;

        // Create a Program instance using the IDL and connection
        this.program = new Program(idl as SssCore, {
            connection,
        });

        this.hookProgram = hookProgram;
        this.mintAddress = mint;
        this.config = config;
        this.preset = preset;

        if (preset === StablecoinPreset.SSS_2) {
            this.compliance = new ComplianceModule(program, mint);
        } else {
            // Dummy or proxy that throws
            this.compliance = new Proxy({} as ComplianceModule, {
                get() {
                    throw new Error("Compliance module is only available on SSS-2 instances");
                }
            });
        }
    }

    static async create(
        connection: Connection,
        config: CreateStablecoinConfig,
        program: Program<SssCore>,
        hookProgram?: Program<SssTransferHook>
    ): Promise<string> {
        const resolvedConfig = SolanaStablecoin.resolvePreset(config);

        const mint = Keypair.generate();
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), mint.publicKey.toBuffer()],
            program.programId
        );

        let presetEnum: { sss1?: object, sss2?: object, custom?: object } = { sss1: {} };
        if (resolvedConfig.preset === StablecoinPreset.SSS_2) {
            presetEnum = { sss2: {} };
        } else if (resolvedConfig.preset === StablecoinPreset.CUSTOM) {
            presetEnum = { custom: {} };
        }

        const params = {
            name: resolvedConfig.name,
            symbol: resolvedConfig.symbol,
            uri: resolvedConfig.uri,
            decimals: resolvedConfig.decimals,
            preset: presetEnum,
            pauser: resolvedConfig.pauser || config.authority.publicKey,
            minterAuthority: resolvedConfig.minterAuthority || config.authority.publicKey,
            burner: resolvedConfig.burner || config.authority.publicKey,
            enablePermanentDelegate: resolvedConfig.permanentDelegate || false,
            enableTransferHook: resolvedConfig.transferHook || false,
            defaultAccountFrozen: resolvedConfig.defaultAccountFrozen || false,
            blacklister: resolvedConfig.blacklister || null,
            seizer: resolvedConfig.seizer || null,
            hookProgramId: hookProgram?.programId || null
        };

        return await program.methods
            .initialize(params as any)
            .accounts({
                payer: config.authority.publicKey,
                masterAuthority: config.authority.publicKey,
                mint: mint.publicKey,
                config: configPda,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY
            } as any)
            .signers([config.authority, mint])
            .rpc();
    }

    static async load(
        network: SolanaNetwork = SolanaNetwork.DEVNET,
        mint: PublicKey,
        program: Program<SssCore>,
        hookProgram?: Program<SssTransferHook>
    ): Promise<SolanaStablecoin> {
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), mint.toBuffer()],
            program.programId
        );

        const configData = await program.account.stablecoinConfig.fetch(configPda);
        let presetStr = StablecoinPreset.SSS_1;
        if (configData.preset.sss2) presetStr = StablecoinPreset.SSS_2;
        if (configData.preset.custom) presetStr = StablecoinPreset.CUSTOM;

        return new SolanaStablecoin(network, program, hookProgram as any, mint, configPda, presetStr);
    }

    async mint(params: MintParams): Promise<string> {
        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), params.minter.publicKey.toBuffer()],
            this.program.programId
        );

        return await this.program.methods
            .mint(new BN(params.amount))
            .accounts({
                minter: params.minter.publicKey,
                config: this.config,
                minterConfig,
                mint: this.mintAddress,
                destination: params.recipient,
                tokenProgram: TOKEN_2022_PROGRAM_ID
            } as any)
            .signers([params.minter])
            .rpc();
    }

    async burn(params: BurnParams): Promise<string> {
        const source = params.source || getAssociatedTokenAddressSync(this.mintAddress, params.burner.publicKey, false, TOKEN_2022_PROGRAM_ID);
        return await this.program.methods
            .burn(new BN(params.amount))
            .accounts({
                burner: params.burner.publicKey,
                config: this.config,
                source,
                mint: this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID
            } as any)
            .signers([params.burner])
            .rpc();
    }

    async freeze(authority: Keypair, account: PublicKey): Promise<string> {
        return await this.program.methods
            .freezeAccount()
            .accounts({
                authority: authority.publicKey,
                config: this.config,
                account,
                mint: this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID
            } as any)
            .signers([authority])
            .rpc();
    }

    async thaw(authority: Keypair, account: PublicKey): Promise<string> {
        return await this.program.methods
            .thawAccount()
            .accounts({
                authority: authority.publicKey,
                config: this.config,
                account,
                mint: this.mintAddress,
                tokenProgram: TOKEN_2022_PROGRAM_ID
            } as any)
            .signers([authority])
            .rpc();
    }

    async pause(pauser: Keypair): Promise<string> {
        return await this.program.methods
            .pause()
            .accounts({
                pauser: pauser.publicKey,
                config: this.config,
                mint: this.mintAddress
            } as any)
            .signers([pauser])
            .rpc();
    }

    async unpause(pauser: Keypair): Promise<string> {
        return await this.program.methods
            .unpause()
            .accounts({
                pauser: pauser.publicKey,
                config: this.config,
                mint: this.mintAddress
            } as any)
            .signers([pauser])
            .rpc();
    }

    async getInfo(): Promise<StablecoinInfo> {
        const configData = await this.program.account.stablecoinConfig.fetch(this.config);

        return {
            mint: this.mintAddress,
            preset: this.preset,
            name: configData.name,
            symbol: configData.symbol,
            totalSupply: configData.totalSupply.toNumber(),
            paused: configData.paused,
            blacklistCount: configData.blacklistCount
        };
    }

    async getTotalSupply(): Promise<number> {
        const configData = await this.program.account.stablecoinConfig.fetch(this.config);
        return configData.totalSupply.toNumber();
    }

    async isPaused(): Promise<boolean> {
        const configData = await this.program.account.stablecoinConfig.fetch(this.config);
        return configData.paused;
    }

    async addMinter(authority: Keypair, minter: PublicKey, quota?: MinterQuota): Promise<string> {
        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()],
            this.program.programId
        );
        return await this.program.methods
            .addMinter(
                minter,
                new BN(quota?.amount || 0),
                new BN(0) // Default period seconds
            )
            .accounts({
                minterAuthority: authority.publicKey,
                config: this.config,
                minterConfig,
                mint: this.mintAddress,
                systemProgram: SystemProgram.programId
            } as any)
            .signers([authority])
            .rpc();
    }

    async removeMinter(authority: Keypair, minter: PublicKey): Promise<string> {
        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()],
            this.program.programId
        );
        return await this.program.methods
            .removeMinter(minter)
            .accounts({
                minterAuthority: authority.publicKey,
                config: this.config,
                minterConfig,
                mint: this.mintAddress
            } as any)
            .signers([authority])
            .rpc();
    }

    private static resolvePreset(config: CreateStablecoinConfig): ResolvedConfig {
        const presetDefaults = {
            [StablecoinPreset.SSS_1]: {
                permanentDelegate: false,
                transferHook: false,
                defaultAccountFrozen: false,
            },
            [StablecoinPreset.SSS_2]: {
                permanentDelegate: true,
                transferHook: true,
                defaultAccountFrozen: true,
            },
            [StablecoinPreset.CUSTOM]: {
                permanentDelegate: false,
                transferHook: false,
                defaultAccountFrozen: false,
            }
        };

        if (config.preset) {
            return { ...presetDefaults[config.preset], ...config };
        }
        return config as ResolvedConfig;
    }
}
