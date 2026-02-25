"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const core_1 = require("@anchor-lang/core");
const spl_token_1 = require("@solana/spl-token");
class ComplianceModule {
    program;
    mint;
    constructor(program, mint) {
        this.program = program;
        this.mint = mint;
    }
    async blacklistAdd(authority, params) {
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), this.mint.toBuffer()], this.program.programId);
        const [blacklistEntryPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-blacklist"), this.mint.toBuffer(), params.address.toBuffer()], this.program.programId);
        const targetAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mint, params.address, true, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await this.program.methods
            .addToBlacklist(params.address, params.reason)
            .accounts({
            blacklister: authority.publicKey,
            config: configPda,
            blacklistEntry: blacklistEntryPda,
            targetAccount,
            mint: this.mint,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([authority])
            .rpc();
    }
    async blacklistRemove(authority, address) {
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), this.mint.toBuffer()], this.program.programId);
        const [blacklistEntryPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-blacklist"), this.mint.toBuffer(), address.toBuffer()], this.program.programId);
        const targetAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mint, address, true, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await this.program.methods
            .removeFromBlacklist(address)
            .accounts({
            blacklister: authority.publicKey,
            config: configPda,
            blacklistEntry: blacklistEntryPda,
            targetAccount,
            mint: this.mint,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([authority])
            .rpc();
    }
    async seize(authority, from, to, amount, reason) {
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), this.mint.toBuffer()], this.program.programId);
        const sourceAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mint, from, true, spl_token_1.TOKEN_2022_PROGRAM_ID);
        const destinationAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mint, to, true, spl_token_1.TOKEN_2022_PROGRAM_ID);
        const [seizureRecordPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-seizure"), this.mint.toBuffer(), sourceAccount.toBuffer()], this.program.programId);
        return await this.program.methods
            .seize(new core_1.BN(amount), reason)
            .accounts({
            seizer: authority.publicKey,
            config: configPda,
            seizureRecord: seizureRecordPda,
            sourceAccount,
            destinationAccount,
            mint: this.mint,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([authority])
            .rpc();
    }
    async getBlacklist() {
        return [];
    }
    async isBlacklisted(address) {
        return false;
    }
    async getAuditLog() {
        return [];
    }
}
exports.ComplianceModule = ComplianceModule;
//# sourceMappingURL=compliance.js.map