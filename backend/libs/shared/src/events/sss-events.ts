/**
 * Shared SSS on-chain event types.
 *
 * These mirror the `#[event]` structs emitted by the sss-core
 * and sss-transfer-hook Anchor programs.
 */

// ── Audit Action Enum ────────────────────────────────────────────────

export enum AuditAction {
    MINT = 'MINT',
    BURN = 'BURN',
    BLACKLIST_ADD = 'BLACKLIST_ADD',
    BLACKLIST_REMOVE = 'BLACKLIST_REMOVE',
    SEIZE = 'SEIZE',
    PAUSE = 'PAUSE',
    UNPAUSE = 'UNPAUSE',
    FREEZE = 'FREEZE',
    THAW = 'THAW',
}

// ── On-Chain Event Interfaces ────────────────────────────────────────

export interface MintedEvent {
    mint: string;
    recipient: string;
    amount: string; // u64 as string
    minter: string;
    newTotalSupply: string;
    timestamp: string; // i64 as string
}

export interface BurnedEvent {
    mint: string;
    from: string;
    amount: string;
    burner: string;
    newTotalSupply: string;
    timestamp: string;
}

export interface BlacklistedEvent {
    mint: string;
    address: string;
    reason: string;
    blacklistedBy: string;
    timestamp: string;
}

export interface RemovedFromBlacklistEvent {
    mint: string;
    address: string;
    removedBy: string;
    timestamp: string;
}

export interface SeizedEvent {
    mint: string;
    seizedFrom: string;
    seizedTo: string;
    amount: string;
    reason: string;
    seizer: string;
    timestamp: string;
}

export interface PausedEventData {
    mint: string;
    by: string;
    timestamp: string;
}

export interface UnpausedEventData {
    mint: string;
    by: string;
    timestamp: string;
}

export interface AccountFrozenEventData {
    mint: string;
    account: string;
    by: string;
    timestamp: string;
}

export interface AccountThawedEventData {
    mint: string;
    account: string;
    by: string;
    timestamp: string;
}

// ── Parsed Event Wrapper ─────────────────────────────────────────────

export interface ParsedEvent {
    name: string;
    data: any;
}

// ── Webhook Payload ──────────────────────────────────────────────────

export interface WebhookPayload {
    event: string;
    data: any;
    txSignature: string;
    timestamp: number;
}
