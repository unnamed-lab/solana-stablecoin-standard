import { PublicKey, Keypair } from '@solana/web3.js';
import { Program, BN } from '@anchor-lang/core';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { SssCore } from '../sss_core';
import { MintParams, BurnParams } from '../types';

export class MintModule {
    private program: Program<SssCore>;
    private mint: PublicKey;

    constructor(program: Program<SssCore>, mint: PublicKey) {
        this.program = program;
        this.mint = mint;
    }

    async mintTokens(params: MintParams): Promise<string> {
        const [config] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), this.mint.toBuffer()],
            this.program.programId
        );
        const [minterConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-minter"), this.mint.toBuffer(), params.minter.publicKey.toBuffer()],
            this.program.programId
        );

        return await this.program.methods
            .mint(new BN(params.amount))
            .accounts({
                minter: params.minter.publicKey,
                config,
                minterConfig,
                mint: this.mint,
                destination: params.recipient,
                tokenProgram: TOKEN_2022_PROGRAM_ID
            } as any)
            .signers([params.minter])
            .rpc();
    }

    async burn(params: BurnParams): Promise<string> {
        const [config] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-config"), this.mint.toBuffer()],
            this.program.programId
        );
        const source = params.source || getAssociatedTokenAddressSync(this.mint, params.burner.publicKey, false, TOKEN_2022_PROGRAM_ID);

        return await this.program.methods
            .burn(new BN(params.amount))
            .accounts({
                burner: params.burner.publicKey,
                config,
                source,
                mint: this.mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID
            } as any)
            .signers([params.burner])
            .rpc();
    }
}
