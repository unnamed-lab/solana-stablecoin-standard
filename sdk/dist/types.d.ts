import { PublicKey, Keypair } from '@solana/web3.js';
export declare enum StablecoinPreset {
    SSS_1 = "sss1",
    SSS_2 = "sss2",
    CUSTOM = "custom"
}
export interface CreateStablecoinConfig {
    preset?: StablecoinPreset;
    name: string;
    symbol: string;
    uri: string;
    decimals: number;
    authority: Keypair;
    pauser?: PublicKey;
    minterAuthority?: PublicKey;
    burner?: PublicKey;
    blacklister?: PublicKey;
    seizer?: PublicKey;
    extensions?: {
        permanentDelegate?: boolean;
        transferHook?: boolean;
        defaultAccountFrozen?: boolean;
    };
}
export interface MintParams {
    recipient: PublicKey;
    amount: number;
    minter: Keypair;
}
export interface BurnParams {
    amount: number;
    burner: Keypair;
}
export interface BlacklistParams {
    address: PublicKey;
    reason: string;
}
export interface StablecoinInfo {
    mint: PublicKey;
    preset: StablecoinPreset;
    name: string;
    symbol: string;
    totalSupply: number;
    paused: boolean;
    blacklistCount?: number;
}
export interface ResolvedConfig extends CreateStablecoinConfig {
    permanentDelegate?: boolean;
    transferHook?: boolean;
    defaultAccountFrozen?: boolean;
}
export interface MinterQuota {
    amount: number;
}
