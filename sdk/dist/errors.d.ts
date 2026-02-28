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
/** Price feed is stale. */
export declare class PriceTooStaleError extends SSSBaseError {
    constructor();
}
/** Price feed returned an invalid value. */
export declare class InvalidPriceError extends SSSBaseError {
    constructor();
}
/** Price confidence interval is too wide. */
export declare class ConfidenceTooWideError extends SSSBaseError {
    constructor();
}
/** Switchboard feed account invalid. */
export declare class FeedNotReadyError extends SSSBaseError {
    constructor();
}
/** Quote has expired. */
export declare class QuoteExpiredError extends SSSBaseError {
    constructor();
}
/** Quote has already been used. */
export declare class QuoteAlreadyUsedError extends SSSBaseError {
    constructor();
}
/** Output amount below slippage threshold. */
export declare class SlippageExceededError extends SSSBaseError {
    constructor();
}
/** Oracle Input amount zero. */
export declare class OracleZeroAmountError extends SSSBaseError {
    constructor();
}
/** Output amount zero. */
export declare class ZeroOutputError extends SSSBaseError {
    constructor();
}
/** Feed symbol already exists. */
export declare class FeedAlreadyRegisteredError extends SSSBaseError {
    constructor();
}
/** Feed symbol not found. */
export declare class FeedNotFoundError extends SSSBaseError {
    constructor();
}
/** Feed symbol exceeds max length. */
export declare class FeedSymbolTooLongError extends SSSBaseError {
    constructor();
}
/** Feed registry is full. */
export declare class RegistryFullError extends SSSBaseError {
    constructor();
}
/** Oracle Paused. */
export declare class OraclePausedError extends SSSBaseError {
    constructor();
}
/** Unauthorized oracle operation. */
export declare class OracleUnauthorizedError extends SSSBaseError {
    constructor();
}
/** No pending oracle transfer. */
export declare class OracleNoPendingTransferError extends SSSBaseError {
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
 * @param isOracleInstruction - Optionally force parsing against the Oracle error map.
 * @returns A typed {@link SSSBaseError} subclass, or the original error.
 */
export declare function parseProgramError(err: unknown, isOracleInstruction?: boolean): Error;
