export class SSSBaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SSSBaseError';
    }
}

export class ComplianceNotEnabledError extends SSSBaseError {
    constructor() {
        super("Compliance module is only available on SSS-2 instances");
        this.name = 'ComplianceNotEnabledError';
    }
}

export class PermanentDelegateNotEnabledError extends SSSBaseError {
    constructor() {
        super("Permanent delegate is not enabled for this config");
        this.name = 'PermanentDelegateNotEnabledError';
    }
}
