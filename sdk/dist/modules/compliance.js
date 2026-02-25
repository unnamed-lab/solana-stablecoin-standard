"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
class ComplianceModule {
    program;
    mint;
    constructor(program, mint) {
        this.program = program;
        this.mint = mint;
    }
    async blacklistAdd(params) {
        // Stub implementation
        return "tx_signature";
    }
    async blacklistRemove(address) {
        // Stub implementation
        return "tx_signature";
    }
    async seize(from, to, amount, reason) {
        // Stub implementation
        return "tx_signature";
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