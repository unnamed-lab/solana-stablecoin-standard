/**
 * @module errors
 *
 * Typed error classes that mirror every on-chain error from the **sss-core**
 * and **sss-transfer-hook** Anchor programs.
 *
 * All errors extend {@link SSSBaseError}, so callers can catch the entire
 * family with a single guard:
 *
 * ```ts
 * try {
 *   await sdk.mint(params);
 * } catch (err) {
 *   if (err instanceof SSSBaseError) {
 *     console.error("SSS error:", err.code, err.message);
 *   }
 * }
 * ```
 *
 * Use {@link parseProgramError} to convert raw Anchor / RPC errors into
 * the appropriate typed error class.
 */


/**
 * Base error class for all SSS SDK errors.
 *
 * Every SDK-specific error extends this class. The optional {@link code}
 * field carries the on-chain Anchor error code when the error originates
 * from a program instruction.
 */
export class SSSBaseError extends Error {
    /** Anchor error code (e.g. 6000, 6001 …), if the error originated on-chain. */
    public readonly code?: number;

    constructor(message: string, code?: number) {
        super(message);
        this.name = 'SSSBaseError';
        this.code = code;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Access Control (6000 – 6005)
// ═══════════════════════════════════════════════════════════════════════════════

/** Signer is not the master authority. */
export class NotMasterAuthorityError extends SSSBaseError {
    constructor() {
        super("Signer is not the master authority", 6000);
        this.name = 'NotMasterAuthorityError';
    }
}

/** Signer is not authorized to mint. */
export class NotMinterError extends SSSBaseError {
    constructor() {
        super("Signer is not authorized to mint", 6001);
        this.name = 'NotMinterError';
    }
}

/** Signer is not authorized to burn. */
export class NotBurnerError extends SSSBaseError {
    constructor() {
        super("Signer is not authorized to burn", 6002);
        this.name = 'NotBurnerError';
    }
}

/** Signer is not the blacklister. */
export class NotBlacklisterError extends SSSBaseError {
    constructor() {
        super("Signer is not the blacklister", 6003);
        this.name = 'NotBlacklisterError';
    }
}

/** Signer is not the seizer. */
export class NotSeizerError extends SSSBaseError {
    constructor() {
        super("Signer is not the seizer", 6004);
        this.name = 'NotSeizerError';
    }
}

/** Signer is not the pauser. */
export class NotPauserError extends SSSBaseError {
    constructor() {
        super("Signer is not the pauser", 6005);
        this.name = 'NotPauserError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Feature Gating (6006 – 6008)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compliance module not enabled.
 * Initialize with `enable_transfer_hook: true` for SSS-2.
 */
export class ComplianceNotEnabledError extends SSSBaseError {
    constructor() {
        super("Compliance module not enabled. Initialize with enable_transfer_hook: true for SSS-2", 6006);
        this.name = 'ComplianceNotEnabledError';
    }
}

/**
 * Permanent delegate not enabled.
 * Initialize with `enable_permanent_delegate: true` for SSS-2.
 */
export class PermanentDelegateNotEnabledError extends SSSBaseError {
    constructor() {
        super("Permanent delegate not enabled. Initialize with enable_permanent_delegate: true for SSS-2", 6007);
        this.name = 'PermanentDelegateNotEnabledError';
    }
}

/** Transfer hook not registered on this stablecoin. */
export class HookNotRegisteredError extends SSSBaseError {
    constructor() {
        super("Transfer hook not registered on this stablecoin", 6008);
        this.name = 'HookNotRegisteredError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — State Guards (6009 – 6014)
// ═══════════════════════════════════════════════════════════════════════════════

/** The stablecoin is currently paused. */
export class PausedError extends SSSBaseError {
    constructor() {
        super("Stablecoin is paused", 6009);
        this.name = 'PausedError';
    }
}

/** The stablecoin is not paused (cannot unpause). */
export class NotPausedError extends SSSBaseError {
    constructor() {
        super("Stablecoin is not paused", 6010);
        this.name = 'NotPausedError';
    }
}

/** Address is already on the blacklist. */
export class AlreadyBlacklistedError extends SSSBaseError {
    constructor() {
        super("Address is already blacklisted", 6011);
        this.name = 'AlreadyBlacklistedError';
    }
}

/** Address is not on the blacklist. */
export class NotBlacklistedError extends SSSBaseError {
    constructor() {
        super("Address is not blacklisted", 6012);
        this.name = 'NotBlacklistedError';
    }
}

/** Cannot blacklist the zero address. */
export class InvalidBlacklistTargetError extends SSSBaseError {
    constructor() {
        super("Cannot blacklist the zero address", 6013);
        this.name = 'InvalidBlacklistTargetError';
    }
}

/** Cannot seize from a non-frozen account. */
export class AccountNotFrozenError extends SSSBaseError {
    constructor() {
        super("Cannot seize from a non-frozen account", 6014);
        this.name = 'AccountNotFrozenError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Quota (6015 – 6017)
// ═══════════════════════════════════════════════════════════════════════════════

/** Mint amount exceeds the minter's per-period quota. */
export class QuotaExceededError extends SSSBaseError {
    constructor() {
        super("Mint amount exceeds per-period quota", 6015);
        this.name = 'QuotaExceededError';
    }
}

/** Minter is inactive. */
export class MinterInactiveError extends SSSBaseError {
    constructor() {
        super("Minter is inactive", 6016);
        this.name = 'MinterInactiveError';
    }
}

/** Minter config already exists for this address. */
export class MinterAlreadyExistsError extends SSSBaseError {
    constructor() {
        super("Minter config already exists", 6017);
        this.name = 'MinterAlreadyExistsError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Authority Transfer (6018 – 6019)
// ═══════════════════════════════════════════════════════════════════════════════

/** No pending authority transfer to accept. */
export class NoPendingTransferError extends SSSBaseError {
    constructor() {
        super("No pending authority transfer", 6018);
        this.name = 'NoPendingTransferError';
    }
}

/** Signer is not the pending authority. */
export class NotPendingAuthorityError extends SSSBaseError {
    constructor() {
        super("Signer is not the pending authority", 6019);
        this.name = 'NotPendingAuthorityError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Validation (6020 – 6023)
// ═══════════════════════════════════════════════════════════════════════════════

/** Token name exceeds 32 characters. */
export class NameTooLongError extends SSSBaseError {
    constructor() {
        super("Name exceeds 32 characters", 6020);
        this.name = 'NameTooLongError';
    }
}

/** Token symbol exceeds 10 characters. */
export class SymbolTooLongError extends SSSBaseError {
    constructor() {
        super("Symbol exceeds 10 characters", 6021);
        this.name = 'SymbolTooLongError';
    }
}

/** Amount must be greater than zero. */
export class ZeroAmountError extends SSSBaseError {
    constructor() {
        super("Amount must be greater than zero", 6022);
        this.name = 'ZeroAmountError';
    }
}

/** Arithmetic overflow in supply calculation. */
export class SupplyOverflowError extends SSSBaseError {
    constructor() {
        super("Overflow in supply calculation", 6023);
        this.name = 'SupplyOverflowError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-transfer-hook — HookError (6100 – 6104)
// ═══════════════════════════════════════════════════════════════════════════════

/** Sender is blacklisted and cannot transfer tokens. */
export class SenderBlacklistedError extends SSSBaseError {
    constructor() {
        super("Sender is blacklisted and cannot transfer tokens", 6100);
        this.name = 'SenderBlacklistedError';
    }
}

/** Recipient is blacklisted and cannot receive tokens. */
export class RecipientBlacklistedError extends SSSBaseError {
    constructor() {
        super("Recipient is blacklisted and cannot receive tokens", 6101);
        this.name = 'RecipientBlacklistedError';
    }
}

/** Transfer hook is currently disabled. */
export class HookDisabledError extends SSSBaseError {
    constructor() {
        super("Transfer hook is disabled", 6102);
        this.name = 'HookDisabledError';
    }
}

/** Invalid mint for this hook instance. */
export class InvalidMintError extends SSSBaseError {
    constructor() {
        super("Invalid mint for this hook instance", 6103);
        this.name = 'InvalidMintError';
    }
}

/** Invalid authority for this hook operation. */
export class InvalidAuthorityError extends SSSBaseError {
    constructor() {
        super("Invalid authority", 6104);
        this.name = 'InvalidAuthorityError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-oracle — Feed Validity (6000 – 6003)
// ═══════════════════════════════════════════════════════════════════════════════

/** Price feed is stale. */
export class PriceTooStaleError extends SSSBaseError {
    constructor() {
        super("Price feed is stale — last update exceeds max_staleness threshold", 6000);
        this.name = 'PriceTooStaleError';
    }
}

/** Price feed returned an invalid value. */
export class InvalidPriceError extends SSSBaseError {
    constructor() {
        super("Price feed returned a negative or zero value", 6001);
        this.name = 'InvalidPriceError';
    }
}

/** Price confidence interval is too wide. */
export class ConfidenceTooWideError extends SSSBaseError {
    constructor() {
        super("Price confidence interval is too wide — market is too volatile to price safely", 6002);
        this.name = 'ConfidenceTooWideError';
    }
}

/** Switchboard feed account invalid. */
export class FeedNotReadyError extends SSSBaseError {
    constructor() {
        super("Switchboard aggregator account data is invalid or unreadable", 6003);
        this.name = 'FeedNotReadyError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-oracle — Quote (6004 – 6008)
// ═══════════════════════════════════════════════════════════════════════════════

/** Quote has expired. */
export class QuoteExpiredError extends SSSBaseError {
    constructor() {
        super("Quote has expired — please request a new quote", 6004);
        this.name = 'QuoteExpiredError';
    }
}

/** Quote has already been used. */
export class QuoteAlreadyUsedError extends SSSBaseError {
    constructor() {
        super("Quote has already been used", 6005);
        this.name = 'QuoteAlreadyUsedError';
    }
}

/** Output amount below slippage threshold. */
export class SlippageExceededError extends SSSBaseError {
    constructor() {
        super("Token amount is below slippage threshold (min_output)", 6006);
        this.name = 'SlippageExceededError';
    }
}

/** Oracle Input amount zero. */
export class OracleZeroAmountError extends SSSBaseError {
    constructor() {
        super("Input amount must be greater than zero", 6007);
        this.name = 'OracleZeroAmountError';
    }
}

/** Output amount zero. */
export class ZeroOutputError extends SSSBaseError {
    constructor() {
        super("Calculated output amount is zero after fee deduction", 6008);
        this.name = 'ZeroOutputError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-oracle — Registry (6009 – 6012)
// ═══════════════════════════════════════════════════════════════════════════════

/** Feed symbol already exists. */
export class FeedAlreadyRegisteredError extends SSSBaseError {
    constructor() {
        super("Feed with this symbol already exists in the registry", 6009);
        this.name = 'FeedAlreadyRegisteredError';
    }
}

/** Feed symbol not found. */
export class FeedNotFoundError extends SSSBaseError {
    constructor() {
        super("Feed symbol not found in registry", 6010);
        this.name = 'FeedNotFoundError';
    }
}

/** Feed symbol exceeds max length. */
export class FeedSymbolTooLongError extends SSSBaseError {
    constructor() {
        super("Feed symbol exceeds maximum length of 12 characters", 6011);
        this.name = 'FeedSymbolTooLongError';
    }
}

/** Feed registry is full. */
export class RegistryFullError extends SSSBaseError {
    constructor() {
        super("Registry is at maximum capacity (64 feeds)", 6012);
        this.name = 'RegistryFullError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// sss-oracle — Oracle Config (6013 – 6015)
// ═══════════════════════════════════════════════════════════════════════════════

/** Oracle Paused. */
export class OraclePausedError extends SSSBaseError {
    constructor() {
        super("Oracle is paused — mint and redeem operations are suspended", 6013);
        this.name = 'OraclePausedError';
    }
}

/** Unauthorized oracle operation. */
export class OracleUnauthorizedError extends SSSBaseError {
    constructor() {
        super("Signer is not the oracle authority", 6014);
        this.name = 'OracleUnauthorizedError';
    }
}

/** No pending oracle transfer. */
export class OracleNoPendingTransferError extends SSSBaseError {
    constructor() {
        super("No pending authority transfer exists", 6015);
        this.name = 'OracleNoPendingTransferError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SDK-only errors (not mapped to on-chain codes)
// ═══════════════════════════════════════════════════════════════════════════════

/** Thrown when accessing the transfer hook module on a non-SSS-2 instance. */
export class TransferHookNotAvailableError extends SSSBaseError {
    constructor() {
        super("Transfer hook module is only available on SSS-2 instances");
        this.name = 'TransferHookNotAvailableError';
    }
}

/** Thrown when account data cannot be found on-chain. */
export class AccountNotFoundError extends SSSBaseError {
    constructor(account: string) {
        super(`Account not found: ${account}`);
        this.name = 'AccountNotFoundError';
    }
}

/** Thrown when the network configuration is invalid. */
export class InvalidNetworkError extends SSSBaseError {
    constructor(network: string) {
        super(`Invalid or unsupported network: ${network}`);
        this.name = 'InvalidNetworkError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error code → class mapping
// ═══════════════════════════════════════════════════════════════════════════════

/** @internal Map of Anchor error codes to their typed SDK error constructors. */
const ERROR_CODE_MAP: Record<number, new () => SSSBaseError> = {
    // sss-core
    6000: NotMasterAuthorityError,
    6001: NotMinterError,
    6002: NotBurnerError,
    6003: NotBlacklisterError,
    6004: NotSeizerError,
    6005: NotPauserError,
    6006: ComplianceNotEnabledError,
    6007: PermanentDelegateNotEnabledError,
    6008: HookNotRegisteredError,
    6009: PausedError,
    6010: NotPausedError,
    6011: AlreadyBlacklistedError,
    6012: NotBlacklistedError,
    6013: InvalidBlacklistTargetError,
    6014: AccountNotFrozenError,
    6015: QuotaExceededError,
    6016: MinterInactiveError,
    6017: MinterAlreadyExistsError,
    6018: NoPendingTransferError,
    6019: NotPendingAuthorityError,
    6020: NameTooLongError,
    6021: SymbolTooLongError,
    6022: ZeroAmountError,
    6023: SupplyOverflowError,
    // sss-transfer-hook
    6100: SenderBlacklistedError,
    6101: RecipientBlacklistedError,
    6102: HookDisabledError,
    6103: InvalidMintError,
    6104: InvalidAuthorityError,
};

/** @internal Map of Anchor error codes for the SSS Oracle program. */
const ORACLE_ERROR_CODE_MAP: Record<number, new () => SSSBaseError> = {
    6000: PriceTooStaleError,
    6001: InvalidPriceError,
    6002: ConfidenceTooWideError,
    6003: FeedNotReadyError,
    6004: QuoteExpiredError,
    6005: QuoteAlreadyUsedError,
    6006: SlippageExceededError,
    6007: OracleZeroAmountError,
    6008: ZeroOutputError,
    6009: FeedAlreadyRegisteredError,
    6010: FeedNotFoundError,
    6011: FeedSymbolTooLongError,
    6012: RegistryFullError,
    6013: OraclePausedError,
    6014: OracleUnauthorizedError,
    6015: OracleNoPendingTransferError,
};

/**
 * Parse a raw Anchor / RPC error into the corresponding typed SDK error.
 *
 * If the error contains a recognised Anchor error code, the matching
 * typed error class is returned. Otherwise the original error is returned
 * unchanged.
 *
 * @param err - The caught error (typically from an `.rpc()` call).
 * @param isOracleInstruction - Optionally force parsing against the Oracle error map.
 * @returns A typed {@link SSSBaseError} subclass, or the original error.
 */
export function parseProgramError(err: unknown, isOracleInstruction: boolean = false): Error {
    if (err && typeof err === 'object') {
        const anchorErr = err as any;
        const code =
            anchorErr?.error?.errorCode?.number ??
            anchorErr?.code ??
            anchorErr?.errorCode?.number;

        if (typeof code === 'number') {
            const map = isOracleInstruction ? ORACLE_ERROR_CODE_MAP : ERROR_CODE_MAP;
            if (map[code]) {
                return new map[code]();
            }
        }

        if (typeof anchorErr?.message === 'string') {
            const hexMatch = anchorErr.message.match(/custom program error: 0x([0-9a-fA-F]+)/);
            if (hexMatch) {
                const numCode = parseInt(hexMatch[1], 16);
                const map = isOracleInstruction ? ORACLE_ERROR_CODE_MAP : ERROR_CODE_MAP;
                if (map[numCode]) {
                    return new map[numCode]();
                }
            }
        }
    }

    return err instanceof Error ? err : new Error(String(err));
}
