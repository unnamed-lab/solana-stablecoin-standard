import { PublicKey, Keypair } from '@solana/web3.js';
import { Program } from '@anchor-lang/core';
import { SssCore } from '../sss_core';
import { BlacklistParams } from '../types';
export interface BlacklistEntry {
    address: PublicKey;
    reason: string;
}
export interface AuditEvent {
    action: string;
    timestamp: number;
    data: any;
}
export declare class ComplianceModule {
    private program;
    private mint;
    constructor(program: Program<SssCore>, mint: PublicKey);
    blacklistAdd(authority: Keypair, params: BlacklistParams): Promise<string>;
    blacklistRemove(authority: Keypair, address: PublicKey): Promise<string>;
    seize(authority: Keypair, from: PublicKey, to: PublicKey, amount: number, reason: string): Promise<string>;
    getBlacklist(): Promise<BlacklistEntry[]>;
    isBlacklisted(address: PublicKey): Promise<boolean>;
    getAuditLog(): Promise<AuditEvent[]>;
}
