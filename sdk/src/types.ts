import { PublicKey, Keypair } from '@solana/web3.js';

/**
 * Predefined stablecoin configuration presets.
 *
 * - **SSS_1** — Lightweight preset: basic mint/burn/pause, no compliance features.
 * - **SSS_2** — Full-featured preset: adds permanent delegate, transfer hook,
 *   default-frozen accounts, blacklisting, and asset seizure.
 * - **CUSTOM** — Start with SSS-1 defaults but allow per-extension overrides.
 */
export enum StablecoinPreset {
    SSS_1 = 'sss1',
    SSS_2 = 'sss2',
    CUSTOM = 'custom',
}

/**
 * Supported Solana network clusters.
 *
 * Used to select the RPC endpoint for all SDK operations.
 */
export enum SolanaNetwork {
    DEVNET = 'devnet',
    MAINNET = 'mainnet',
    TESTNET = 'testnet',
    LOCALNET = 'localnet',
}

/**
 * Configuration for creating a new stablecoin via {@link SolanaStablecoin.create}.
 *
 * @example
 * ```ts
 * const config: CreateStablecoinConfig = {
 *   name: "My USD",
 *   symbol: "MUSD",
 *   uri: "https://example.com/metadata.json",
 *   decimals: 6,
 *   preset: StablecoinPreset.SSS_2,
 *   authority: myKeypair,
 *   blacklister: myKeypair.publicKey,
 *   seizer: myKeypair.publicKey,
 * };
 * ```
 */
export interface CreateStablecoinConfig {
    /** Optional preset to apply (SSS-1, SSS-2, or CUSTOM). When omitted, raw config is used. */
    preset?: StablecoinPreset;
    /** Human-readable token name (stored in on-chain metadata). */
    name: string;
    /** Token ticker symbol (e.g. "USDC"). */
    symbol: string;
    /** URI pointing to off-chain metadata JSON. */
    uri: string;
    /** Number of decimal places (typically 6 for stablecoins). */
    decimals: number;
    /** Keypair that becomes the master authority and initial payer. */
    authority: Keypair;

    // ── Role Assignments ──
    /** Public key of the account authorised to pause/unpause the token. Defaults to authority. */
    pauser?: PublicKey;
    /** Public key of the account authorised to add/remove minters. Defaults to authority. */
    minterAuthority?: PublicKey;
    /** Public key of the account authorised to burn tokens. Defaults to authority. */
    burner?: PublicKey;

    // ── SSS-2 Only ──
    /** Public key of the blacklister role (SSS-2 only). */
    blacklister?: PublicKey;
    /** Public key of the seizer role (SSS-2 only). */
    seizer?: PublicKey;

    /** Per-extension overrides; only meaningful when `preset` is `CUSTOM`. */
    extensions?: {
        /** Enable the permanent delegate extension (allows seizure). */
        permanentDelegate?: boolean;
        /** Enable the Token-2022 transfer hook (allows blacklist enforcement on transfers). */
        transferHook?: boolean;
        /** New token accounts are frozen by default and must be explicitly thawed. */
        defaultAccountFrozen?: boolean;
    };
}

/**
 * Parameters for the {@link SolanaStablecoin.mint} method.
 */
export interface MintParams {
    /** Token account (ATA) that receives the newly minted tokens. */
    recipient: PublicKey;
    /** Number of tokens to mint (in base units, e.g. lamports). */
    amount: number;
    /** Keypair of an authorised minter. Must have been added via `addMinter()`. */
    minter: Keypair;
}

/**
 * Parameters for the {@link SolanaStablecoin.burn} method.
 */
export interface BurnParams {
    /** Number of tokens to burn (in base units). */
    amount: number;
    /** Keypair of the token holder or authorised burner. */
    burner: Keypair;
    /** Token account to burn from. Defaults to the burner's ATA if omitted. */
    source?: PublicKey;
}

/**
 * Parameters for blacklist operations in the {@link ComplianceModule}.
 */
export interface BlacklistParams {
    /** Wallet address to blacklist. */
    address: PublicKey;
    /** Human-readable reason for the blacklisting (stored on-chain). */
    reason: string;
}

/**
 * Read-only snapshot of a stablecoin's on-chain configuration.
 * Returned by {@link SolanaStablecoin.getInfo}.
 */
export interface StablecoinInfo {
    /** The SPL Token-2022 mint address. */
    mint: PublicKey;
    /** The preset this stablecoin was created with. */
    preset: StablecoinPreset;
    /** Human-readable token name. */
    name: string;
    /** Token ticker symbol. */
    symbol: string;
    /** Current total supply in base units. */
    totalSupply: number;
    /** Whether the token is currently paused. */
    paused: boolean;
    /** Number of active blacklist entries (SSS-2 only). */
    blacklistCount?: number;
}

/**
 * Fully-resolved configuration after preset defaults and user overrides are merged.
 * @internal Used internally by {@link SolanaStablecoin.resolvePreset}.
 */
export interface ResolvedConfig extends CreateStablecoinConfig {
    permanentDelegate?: boolean;
    transferHook?: boolean;
    defaultAccountFrozen?: boolean;
}

/**
 * Minter quota configuration passed to {@link SolanaStablecoin.addMinter}.
 */
export interface MinterQuota {
    /** Maximum number of tokens (base units) this minter can mint per quota period. */
    amount: number;
}

/**
 * Represents a single blacklist entry returned by {@link ComplianceModule.getBlacklist}.
 */
export interface BlacklistEntry {
    /** Wallet address that is blacklisted. */
    address: PublicKey;
    /** Reason for the blacklisting. */
    reason: string;
}

/**
 * Generic audit event for compliance logging.
 */
export interface AuditEvent {
    /** Action identifier (e.g. "blacklist_add", "seize"). */
    action: string;
    /** Unix timestamp of the event. */
    timestamp: number;
    /** Arbitrary payload associated with the event. */
    data: any;
}

/**
 * Parameters for updating on-chain role assignments via {@link SolanaStablecoin.updateRoles}.
 *
 * Only the roles you wish to change need to be specified — omitted fields are left unchanged.
 *
 * @example
 * ```ts
 * await sdk.updateRoles(authority, {
 *   newPauser: newPauserKeypair.publicKey,
 * });
 * ```
 */
export interface RoleUpdateParams {
    /** New pauser public key. */
    newPauser?: PublicKey;
    /** New minter authority public key. */
    newMinterAuthority?: PublicKey;
    /** New burner public key. */
    newBurner?: PublicKey;
    /** New blacklister public key (SSS-2 only, requires transfer hook enabled). */
    newBlacklister?: PublicKey;
    /** New seizer public key (SSS-2 only, requires permanent delegate enabled). */
    newSeizer?: PublicKey;
}

/**
 * Read-only snapshot of the transfer hook's on-chain configuration.
 * Returned by {@link TransferHookModule.getHookConfig}.
 */
export interface HookConfigInfo {
    /** The mint this hook is associated with. */
    mint: PublicKey;
    /** The authority who can enable/disable the hook. */
    authority: PublicKey;
    /** Whether the hook is currently active. */
    enabled: boolean;
    /** Total number of transfers processed by the hook. */
    transferCount: number;
    /** Total number of transfers blocked by the hook. */
    blockedCount: number;
}