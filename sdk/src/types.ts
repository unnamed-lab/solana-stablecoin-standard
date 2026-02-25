import { PublicKey, Keypair } from '@solana/web3.js';

export enum StablecoinPreset {
    SSS_1 = 'sss1',
    SSS_2 = 'sss2',
    CUSTOM = 'custom',
}

export enum SolanaNetwork {
    DEVNET = 'devnet',
    MAINNET = 'mainnet',
    TESTNET = 'testnet',
    LOCALNET = 'localnet',
}
export interface CreateStablecoinConfig {
    preset?: StablecoinPreset;
    name: string;
    symbol: string;
    uri: string;
    decimals: number;
    authority: Keypair;
    // Roles
    pauser?: PublicKey;
    minterAuthority?: PublicKey;
    burner?: PublicKey;
    // SSS-2 only
    blacklister?: PublicKey;
    seizer?: PublicKey;
    // Custom overrides
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
    source?: PublicKey;
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
    // TODO - Add minter quota details here.
    amount: number;
}
