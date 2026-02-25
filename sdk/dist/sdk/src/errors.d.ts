export declare class SSSBaseError extends Error {
    constructor(message: string);
}
export declare class ComplianceNotEnabledError extends SSSBaseError {
    constructor();
}
export declare class PermanentDelegateNotEnabledError extends SSSBaseError {
    constructor();
}
