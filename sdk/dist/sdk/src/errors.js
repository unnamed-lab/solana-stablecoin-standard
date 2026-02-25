"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermanentDelegateNotEnabledError = exports.ComplianceNotEnabledError = exports.SSSBaseError = void 0;
class SSSBaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SSSBaseError';
    }
}
exports.SSSBaseError = SSSBaseError;
class ComplianceNotEnabledError extends SSSBaseError {
    constructor() {
        super("Compliance module is only available on SSS-2 instances");
        this.name = 'ComplianceNotEnabledError';
    }
}
exports.ComplianceNotEnabledError = ComplianceNotEnabledError;
class PermanentDelegateNotEnabledError extends SSSBaseError {
    constructor() {
        super("Permanent delegate is not enabled for this config");
        this.name = 'PermanentDelegateNotEnabledError';
    }
}
exports.PermanentDelegateNotEnabledError = PermanentDelegateNotEnabledError;
//# sourceMappingURL=errors.js.map