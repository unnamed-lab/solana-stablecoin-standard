import { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SssCore } from './sss_core';
import { SssTransferHook } from './sss_transfer_hook';
import {
    CreateStablecoinConfig,
    MintParams,
    BurnParams,
    StablecoinPreset,
    StablecoinInfo,
    ResolvedConfig,
    MinterQuota
} from './types';
import { ComplianceModule } from './modules/compliance';

export class SolanaStablecoin {
    private program: Program<SssCore>;
    private hookProgram: Program<SssTransferHook>;
    public mintAddress: PublicKey;
    public config: PublicKey;
    public compliance: ComplianceModule; // SSS-2 only, throws if SSS-1
    public preset: StablecoinPreset;

    private constructor(
        program: Program<SssCore>,
        hookProgram: Program<SssTransferHook>,
        mint: PublicKey,
        config: PublicKey,
        preset: StablecoinPreset
    ) {
        this.program = program;
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
        hookProgram: Program<SssTransferHook>
    ): Promise<SolanaStablecoin> {
        const resolvedConfig = SolanaStablecoin.resolvePreset(config);
        // ... deploy on-chain, return initialized instance
        // Note: implementation depends on how anchor program is called to initialize.
        // For now, we stub the actual transaction and return a dummy instance.
        return new SolanaStablecoin(
            program,
            hookProgram,
            Keypair.generate().publicKey,
            Keypair.generate().publicKey,
            resolvedConfig.preset || StablecoinPreset.SSS_1
        );
    }

    static async load(
        connection: Connection,
        mint: PublicKey,
        authority: Keypair,
        program: Program<SssCore>,
        hookProgram: Program<SssTransferHook>
    ): Promise<SolanaStablecoin> {
        // Fetch config PDA, reconstruct instance
        return new SolanaStablecoin(program, hookProgram, mint, Keypair.generate().publicKey, StablecoinPreset.SSS_1);
    }

    async mint(params: MintParams): Promise<string> {
        return "tx_signature";
    }

    async burn(params: BurnParams): Promise<string> {
        return "tx_signature";
    }

    async freeze(account: PublicKey): Promise<string> {
        return "tx_signature";
    }

    async thaw(account: PublicKey): Promise<string> {
        return "tx_signature";
    }

    async pause(): Promise<string> {
        return "tx_signature";
    }

    async unpause(): Promise<string> {
        return "tx_signature";
    }

    async getInfo(): Promise<StablecoinInfo> {
        return {
            mint: this.mintAddress,
            preset: this.preset,
            name: "Stub",
            symbol: "STUB",
            totalSupply: 0,
            paused: false
        };
    }

    async getTotalSupply(): Promise<number> {
        return 0;
    }

    async isPaused(): Promise<boolean> {
        return false;
    }

    async addMinter(minter: PublicKey, quota?: MinterQuota): Promise<string> {
        return "tx_signature";
    }

    async removeMinter(minter: PublicKey): Promise<string> {
        return "tx_signature";
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
