"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidNetworkError = exports.AccountNotFoundError = exports.TransferHookNotAvailableError = exports.InvalidAuthorityError = exports.InvalidMintError = exports.HookDisabledError = exports.RecipientBlacklistedError = exports.SenderBlacklistedError = exports.SupplyOverflowError = exports.ZeroAmountError = exports.SymbolTooLongError = exports.NameTooLongError = exports.NotPendingAuthorityError = exports.NoPendingTransferError = exports.MinterAlreadyExistsError = exports.MinterInactiveError = exports.QuotaExceededError = exports.AccountNotFrozenError = exports.InvalidBlacklistTargetError = exports.NotBlacklistedError = exports.AlreadyBlacklistedError = exports.NotPausedError = exports.PausedError = exports.HookNotRegisteredError = exports.PermanentDelegateNotEnabledError = exports.ComplianceNotEnabledError = exports.NotPauserError = exports.NotSeizerError = exports.NotBlacklisterError = exports.NotBurnerError = exports.NotMinterError = exports.NotMasterAuthorityError = exports.SSSBaseError = void 0;
exports.parseProgramError = parseProgramError;
// ═══════════════════════════════════════════════════════════════════════════════
// Base
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Base error class for all SSS SDK errors.
 *
 * Every SDK-specific error extends this class. The optional {@link code}
 * field carries the on-chain Anchor error code when the error originates
 * from a program instruction.
 */
class SSSBaseError extends Error {
    /** Anchor error code (e.g. 6000, 6001 …), if the error originated on-chain. */
    code;
    constructor(message, code) {
        super(message);
        this.name = 'SSSBaseError';
        this.code = code;
    }
}
exports.SSSBaseError = SSSBaseError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Access Control (6000 – 6005)
// ═══════════════════════════════════════════════════════════════════════════════
/** Signer is not the master authority. */
class NotMasterAuthorityError extends SSSBaseError {
    constructor() {
        super("Signer is not the master authority", 6000);
        this.name = 'NotMasterAuthorityError';
    }
}
exports.NotMasterAuthorityError = NotMasterAuthorityError;
/** Signer is not authorized to mint. */
class NotMinterError extends SSSBaseError {
    constructor() {
        super("Signer is not authorized to mint", 6001);
        this.name = 'NotMinterError';
    }
}
exports.NotMinterError = NotMinterError;
/** Signer is not authorized to burn. */
class NotBurnerError extends SSSBaseError {
    constructor() {
        super("Signer is not authorized to burn", 6002);
        this.name = 'NotBurnerError';
    }
}
exports.NotBurnerError = NotBurnerError;
/** Signer is not the blacklister. */
class NotBlacklisterError extends SSSBaseError {
    constructor() {
        super("Signer is not the blacklister", 6003);
        this.name = 'NotBlacklisterError';
    }
}
exports.NotBlacklisterError = NotBlacklisterError;
/** Signer is not the seizer. */
class NotSeizerError extends SSSBaseError {
    constructor() {
        super("Signer is not the seizer", 6004);
        this.name = 'NotSeizerError';
    }
}
exports.NotSeizerError = NotSeizerError;
/** Signer is not the pauser. */
class NotPauserError extends SSSBaseError {
    constructor() {
        super("Signer is not the pauser", 6005);
        this.name = 'NotPauserError';
    }
}
exports.NotPauserError = NotPauserError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Feature Gating (6006 – 6008)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Compliance module not enabled.
 * Initialize with `enable_transfer_hook: true` for SSS-2.
 */
class ComplianceNotEnabledError extends SSSBaseError {
    constructor() {
        super("Compliance module not enabled. Initialize with enable_transfer_hook: true for SSS-2", 6006);
        this.name = 'ComplianceNotEnabledError';
    }
}
exports.ComplianceNotEnabledError = ComplianceNotEnabledError;
/**
 * Permanent delegate not enabled.
 * Initialize with `enable_permanent_delegate: true` for SSS-2.
 */
class PermanentDelegateNotEnabledError extends SSSBaseError {
    constructor() {
        super("Permanent delegate not enabled. Initialize with enable_permanent_delegate: true for SSS-2", 6007);
        this.name = 'PermanentDelegateNotEnabledError';
    }
}
exports.PermanentDelegateNotEnabledError = PermanentDelegateNotEnabledError;
/** Transfer hook not registered on this stablecoin. */
class HookNotRegisteredError extends SSSBaseError {
    constructor() {
        super("Transfer hook not registered on this stablecoin", 6008);
        this.name = 'HookNotRegisteredError';
    }
}
exports.HookNotRegisteredError = HookNotRegisteredError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — State Guards (6009 – 6014)
// ═══════════════════════════════════════════════════════════════════════════════
/** The stablecoin is currently paused. */
class PausedError extends SSSBaseError {
    constructor() {
        super("Stablecoin is paused", 6009);
        this.name = 'PausedError';
    }
}
exports.PausedError = PausedError;
/** The stablecoin is not paused (cannot unpause). */
class NotPausedError extends SSSBaseError {
    constructor() {
        super("Stablecoin is not paused", 6010);
        this.name = 'NotPausedError';
    }
}
exports.NotPausedError = NotPausedError;
/** Address is already on the blacklist. */
class AlreadyBlacklistedError extends SSSBaseError {
    constructor() {
        super("Address is already blacklisted", 6011);
        this.name = 'AlreadyBlacklistedError';
    }
}
exports.AlreadyBlacklistedError = AlreadyBlacklistedError;
/** Address is not on the blacklist. */
class NotBlacklistedError extends SSSBaseError {
    constructor() {
        super("Address is not blacklisted", 6012);
        this.name = 'NotBlacklistedError';
    }
}
exports.NotBlacklistedError = NotBlacklistedError;
/** Cannot blacklist the zero address. */
class InvalidBlacklistTargetError extends SSSBaseError {
    constructor() {
        super("Cannot blacklist the zero address", 6013);
        this.name = 'InvalidBlacklistTargetError';
    }
}
exports.InvalidBlacklistTargetError = InvalidBlacklistTargetError;
/** Cannot seize from a non-frozen account. */
class AccountNotFrozenError extends SSSBaseError {
    constructor() {
        super("Cannot seize from a non-frozen account", 6014);
        this.name = 'AccountNotFrozenError';
    }
}
exports.AccountNotFrozenError = AccountNotFrozenError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Quota (6015 – 6017)
// ═══════════════════════════════════════════════════════════════════════════════
/** Mint amount exceeds the minter's per-period quota. */
class QuotaExceededError extends SSSBaseError {
    constructor() {
        super("Mint amount exceeds per-period quota", 6015);
        this.name = 'QuotaExceededError';
    }
}
exports.QuotaExceededError = QuotaExceededError;
/** Minter is inactive. */
class MinterInactiveError extends SSSBaseError {
    constructor() {
        super("Minter is inactive", 6016);
        this.name = 'MinterInactiveError';
    }
}
exports.MinterInactiveError = MinterInactiveError;
/** Minter config already exists for this address. */
class MinterAlreadyExistsError extends SSSBaseError {
    constructor() {
        super("Minter config already exists", 6017);
        this.name = 'MinterAlreadyExistsError';
    }
}
exports.MinterAlreadyExistsError = MinterAlreadyExistsError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Authority Transfer (6018 – 6019)
// ═══════════════════════════════════════════════════════════════════════════════
/** No pending authority transfer to accept. */
class NoPendingTransferError extends SSSBaseError {
    constructor() {
        super("No pending authority transfer", 6018);
        this.name = 'NoPendingTransferError';
    }
}
exports.NoPendingTransferError = NoPendingTransferError;
/** Signer is not the pending authority. */
class NotPendingAuthorityError extends SSSBaseError {
    constructor() {
        super("Signer is not the pending authority", 6019);
        this.name = 'NotPendingAuthorityError';
    }
}
exports.NotPendingAuthorityError = NotPendingAuthorityError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-core — Validation (6020 – 6023)
// ═══════════════════════════════════════════════════════════════════════════════
/** Token name exceeds 32 characters. */
class NameTooLongError extends SSSBaseError {
    constructor() {
        super("Name exceeds 32 characters", 6020);
        this.name = 'NameTooLongError';
    }
}
exports.NameTooLongError = NameTooLongError;
/** Token symbol exceeds 10 characters. */
class SymbolTooLongError extends SSSBaseError {
    constructor() {
        super("Symbol exceeds 10 characters", 6021);
        this.name = 'SymbolTooLongError';
    }
}
exports.SymbolTooLongError = SymbolTooLongError;
/** Amount must be greater than zero. */
class ZeroAmountError extends SSSBaseError {
    constructor() {
        super("Amount must be greater than zero", 6022);
        this.name = 'ZeroAmountError';
    }
}
exports.ZeroAmountError = ZeroAmountError;
/** Arithmetic overflow in supply calculation. */
class SupplyOverflowError extends SSSBaseError {
    constructor() {
        super("Overflow in supply calculation", 6023);
        this.name = 'SupplyOverflowError';
    }
}
exports.SupplyOverflowError = SupplyOverflowError;
// ═══════════════════════════════════════════════════════════════════════════════
// sss-transfer-hook — HookError (6100 – 6104)
// ═══════════════════════════════════════════════════════════════════════════════
/** Sender is blacklisted and cannot transfer tokens. */
class SenderBlacklistedError extends SSSBaseError {
    constructor() {
        super("Sender is blacklisted and cannot transfer tokens", 6100);
        this.name = 'SenderBlacklistedError';
    }
}
exports.SenderBlacklistedError = SenderBlacklistedError;
/** Recipient is blacklisted and cannot receive tokens. */
class RecipientBlacklistedError extends SSSBaseError {
    constructor() {
        super("Recipient is blacklisted and cannot receive tokens", 6101);
        this.name = 'RecipientBlacklistedError';
    }
}
exports.RecipientBlacklistedError = RecipientBlacklistedError;
/** Transfer hook is currently disabled. */
class HookDisabledError extends SSSBaseError {
    constructor() {
        super("Transfer hook is disabled", 6102);
        this.name = 'HookDisabledError';
    }
}
exports.HookDisabledError = HookDisabledError;
/** Invalid mint for this hook instance. */
class InvalidMintError extends SSSBaseError {
    constructor() {
        super("Invalid mint for this hook instance", 6103);
        this.name = 'InvalidMintError';
    }
}
exports.InvalidMintError = InvalidMintError;
/** Invalid authority for this hook operation. */
class InvalidAuthorityError extends SSSBaseError {
    constructor() {
        super("Invalid authority", 6104);
        this.name = 'InvalidAuthorityError';
    }
}
exports.InvalidAuthorityError = InvalidAuthorityError;
// ═══════════════════════════════════════════════════════════════════════════════
// SDK-only errors (not mapped to on-chain codes)
// ═══════════════════════════════════════════════════════════════════════════════
/** Thrown when accessing the transfer hook module on a non-SSS-2 instance. */
class TransferHookNotAvailableError extends SSSBaseError {
    constructor() {
        super("Transfer hook module is only available on SSS-2 instances");
        this.name = 'TransferHookNotAvailableError';
    }
}
exports.TransferHookNotAvailableError = TransferHookNotAvailableError;
/** Thrown when account data cannot be found on-chain. */
class AccountNotFoundError extends SSSBaseError {
    constructor(account) {
        super(`Account not found: ${account}`);
        this.name = 'AccountNotFoundError';
    }
}
exports.AccountNotFoundError = AccountNotFoundError;
/** Thrown when the network configuration is invalid. */
class InvalidNetworkError extends SSSBaseError {
    constructor(network) {
        super(`Invalid or unsupported network: ${network}`);
        this.name = 'InvalidNetworkError';
    }
}
exports.InvalidNetworkError = InvalidNetworkError;
// ═══════════════════════════════════════════════════════════════════════════════
// Error code → class mapping
// ═══════════════════════════════════════════════════════════════════════════════
/** @internal Map of Anchor error codes to their typed SDK error constructors. */
const ERROR_CODE_MAP = {
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
/**
 * Parse a raw Anchor / RPC error into the corresponding typed SDK error.
 *
 * If the error contains a recognised Anchor error code, the matching
 * typed error class is returned. Otherwise the original error is returned
 * unchanged.
 *
 * @param err - The caught error (typically from an `.rpc()` call).
 * @returns A typed {@link SSSBaseError} subclass, or the original error.
 *
 * @example
 * ```ts
 * try {
 *   await sdk.mint(params);
 * } catch (err) {
 *   const parsed = parseProgramError(err);
 *   if (parsed instanceof PausedError) {
 *     console.log("Token is paused, try again later");
 *   }
 * }
 * ```
 */
function parseProgramError(err) {
    if (err && typeof err === 'object') {
        // Anchor `AnchorError` shape: { error: { errorCode: { number } } }
        const anchorErr = err;
        const code = anchorErr?.error?.errorCode?.number ??
            anchorErr?.code ??
            anchorErr?.errorCode?.number;
        if (typeof code === 'number' && ERROR_CODE_MAP[code]) {
            return new ERROR_CODE_MAP[code]();
        }
        // Anchor ProgramError shape: "Program … failed: custom program error: 0x…"
        if (typeof anchorErr?.message === 'string') {
            const hexMatch = anchorErr.message.match(/custom program error: 0x([0-9a-fA-F]+)/);
            if (hexMatch) {
                const numCode = parseInt(hexMatch[1], 16);
                if (ERROR_CODE_MAP[numCode]) {
                    return new ERROR_CODE_MAP[numCode]();
                }
            }
        }
    }
    return err instanceof Error ? err : new Error(String(err));
}
//# sourceMappingURL=errors.js.map