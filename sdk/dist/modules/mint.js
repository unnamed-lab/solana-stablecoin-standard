"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MintModule = void 0;
class MintModule {
    program;
    mint;
    constructor(program, mint) {
        this.program = program;
        this.mint = mint;
    }
    async mintTokens(params) {
        // Stub implementation
        return "tx_signature";
    }
    async burn(params) {
        // Stub implementation
        return "tx_signature";
    }
}
exports.MintModule = MintModule;
//# sourceMappingURL=mint.js.map