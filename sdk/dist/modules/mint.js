"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MintModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const core_1 = require("@anchor-lang/core");
const spl_token_1 = require("@solana/spl-token");
class MintModule {
    program;
    mint;
    constructor(program, mint) {
        this.program = program;
        this.mint = mint;
    }
    async mintTokens(params) {
        const [config] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), this.mint.toBuffer()], this.program.programId);
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mint.toBuffer(), params.minter.publicKey.toBuffer()], this.program.programId);
        return await this.program.methods
            .mint(new core_1.BN(params.amount))
            .accounts({
            minter: params.minter.publicKey,
            config,
            minterConfig,
            mint: this.mint,
            destination: params.recipient,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([params.minter])
            .rpc();
    }
    async burn(params) {
        const [config] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), this.mint.toBuffer()], this.program.programId);
        const source = params.source || (0, spl_token_1.getAssociatedTokenAddressSync)(this.mint, params.burner.publicKey, false, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await this.program.methods
            .burn(new core_1.BN(params.amount))
            .accounts({
            burner: params.burner.publicKey,
            config,
            source,
            mint: this.mint,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([params.burner])
            .rpc();
    }
}
exports.MintModule = MintModule;
//# sourceMappingURL=mint.js.map