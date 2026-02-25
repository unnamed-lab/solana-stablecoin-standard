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
export declare class SSSBaseError extends Error {
    /** Anchor error code (e.g. 6000, 6001 …), if the error originated on-chain. */
    readonly code?: number;
    constructor(message: string, code?: number);
}
/** Signer is not the master authority. */
export declare class NotMasterAuthorityError extends SSSBaseError {
    constructor();
}
/** Signer is not authorized to mint. */
export declare class NotMinterError extends SSSBaseError {
    constructor();
}
/** Signer is not authorized to burn. */
export declare class NotBurnerError extends SSSBaseError {
    constructor();
}
/** Signer is not the blacklister. */
export declare class NotBlacklisterError extends SSSBaseError {
    constructor();
}
/** Signer is not the seizer. */
export declare class NotSeizerError extends SSSBaseError {
    constructor();
}
/** Signer is not the pauser. */
export declare class NotPauserError extends SSSBaseError {
    constructor();
}
/**
 * Compliance module not enabled.
 * Initialize with `enable_transfer_hook: true` for SSS-2.
 */
export declare class ComplianceNotEnabledError extends SSSBaseError {
    constructor();
}
/**
 * Permanent delegate not enabled.
 * Initialize with `enable_permanent_delegate: true` for SSS-2.
 */
export declare class PermanentDelegateNotEnabledError extends SSSBaseError {
    constructor();
}
/** Transfer hook not registered on this stablecoin. */
export declare class HookNotRegisteredError extends SSSBaseError {
    constructor();
}
/** The stablecoin is currently paused. */
export declare class PausedError extends SSSBaseError {
    constructor();
}
/** The stablecoin is not paused (cannot unpause). */
export declare class NotPausedError extends SSSBaseError {
    constructor();
}
/** Address is already on the blacklist. */
export declare class AlreadyBlacklistedError extends SSSBaseError {
    constructor();
}
/** Address is not on the blacklist. */
export declare class NotBlacklistedError extends SSSBaseError {
    constructor();
}
/** Cannot blacklist the zero address. */
export declare class InvalidBlacklistTargetError extends SSSBaseError {
    constructor();
}
/** Cannot seize from a non-frozen account. */
export declare class AccountNotFrozenError extends SSSBaseError {
    constructor();
}
/** Mint amount exceeds the minter's per-period quota. */
export declare class QuotaExceededError extends SSSBaseError {
    constructor();
}
/** Minter is inactive. */
export declare class MinterInactiveError extends SSSBaseError {
    constructor();
}
/** Minter config already exists for this address. */
export declare class MinterAlreadyExistsError extends SSSBaseError {
    constructor();
}
/** No pending authority transfer to accept. */
export declare class NoPendingTransferError extends SSSBaseError {
    constructor();
}
/** Signer is not the pending authority. */
export declare class NotPendingAuthorityError extends SSSBaseError {
    constructor();
}
/** Token name exceeds 32 characters. */
export declare class NameTooLongError extends SSSBaseError {
    constructor();
}
/** Token symbol exceeds 10 characters. */
export declare class SymbolTooLongError extends SSSBaseError {
    constructor();
}
/** Amount must be greater than zero. */
export declare class ZeroAmountError extends SSSBaseError {
    constructor();
}
/** Arithmetic overflow in supply calculation. */
export declare class SupplyOverflowError extends SSSBaseError {
    constructor();
}
/** Sender is blacklisted and cannot transfer tokens. */
export declare class SenderBlacklistedError extends SSSBaseError {
    constructor();
}
/** Recipient is blacklisted and cannot receive tokens. */
export declare class RecipientBlacklistedError extends SSSBaseError {
    constructor();
}
/** Transfer hook is currently disabled. */
export declare class HookDisabledError extends SSSBaseError {
    constructor();
}
/** Invalid mint for this hook instance. */
export declare class InvalidMintError extends SSSBaseError {
    constructor();
}
/** Invalid authority for this hook operation. */
export declare class InvalidAuthorityError extends SSSBaseError {
    constructor();
}
/** Thrown when accessing the transfer hook module on a non-SSS-2 instance. */
export declare class TransferHookNotAvailableError extends SSSBaseError {
    constructor();
}
/** Thrown when account data cannot be found on-chain. */
export declare class AccountNotFoundError extends SSSBaseError {
    constructor(account: string);
}
/** Thrown when the network configuration is invalid. */
export declare class InvalidNetworkError extends SSSBaseError {
    constructor(network: string);
}
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
export declare function parseProgramError(err: unknown): Error;
