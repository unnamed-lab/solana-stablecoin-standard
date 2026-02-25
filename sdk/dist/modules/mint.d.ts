import { PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { SssCore } from '../sss_core';
import { MintParams, BurnParams } from '../types';
export declare class MintModule {
    private program;
    private mint;
    constructor(program: Program<SssCore>, mint: PublicKey);
    mintTokens(params: MintParams): Promise<string>;
    burn(params: BurnParams): Promise<string>;
}
