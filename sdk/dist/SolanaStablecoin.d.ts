import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { SssCore } from './sss_core';
import { SssTransferHook } from './sss_transfer_hook';
import { CreateStablecoinConfig, MintParams, BurnParams, StablecoinPreset, StablecoinInfo, MinterQuota } from './types';
import { ComplianceModule } from './modules/compliance';
export declare class SolanaStablecoin {
    private program;
    private hookProgram;
    mintAddress: PublicKey;
    config: PublicKey;
    compliance: ComplianceModule;
    preset: StablecoinPreset;
    private constructor();
    static create(connection: Connection, config: CreateStablecoinConfig, program: Program<SssCore>, hookProgram: Program<SssTransferHook>): Promise<SolanaStablecoin>;
    static load(connection: Connection, mint: PublicKey, authority: Keypair, program: Program<SssCore>, hookProgram: Program<SssTransferHook>): Promise<SolanaStablecoin>;
    mint(params: MintParams): Promise<string>;
    burn(params: BurnParams): Promise<string>;
    freeze(account: PublicKey): Promise<string>;
    thaw(account: PublicKey): Promise<string>;
    pause(): Promise<string>;
    unpause(): Promise<string>;
    getInfo(): Promise<StablecoinInfo>;
    getTotalSupply(): Promise<number>;
    isPaused(): Promise<boolean>;
    addMinter(minter: PublicKey, quota?: MinterQuota): Promise<string>;
    removeMinter(minter: PublicKey): Promise<string>;
    private static resolvePreset;
}
