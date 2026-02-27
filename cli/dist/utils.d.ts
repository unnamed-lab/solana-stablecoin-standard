import { Keypair } from '@solana/web3.js';
/**
 * Load a Keypair from a JSON file path.
 *
 * Supports:
 *   - Absolute paths
 *   - Relative paths (resolved from cwd)
 *   - `~/.config/solana/id.json` shorthand via `--keypair` flag
 *
 * @param keypairPath - Path to a Solana keypair JSON file.
 * @returns A loaded `Keypair` instance.
 */
export declare function loadKeypair(keypairPath: string): Keypair;
/**
 * Returns the default Solana keypair path (~/.config/solana/id.json).
 */
export declare function getDefaultKeypairPath(): string;
/**
 * Format a transaction signature for display.
 */
export declare function formatTxSig(sig: string): string;
/**
 * Format a public key for display (shortened).
 */
export declare function formatPubkey(pubkey: string): string;
/**
 * Print a labelled key-value line.
 */
export declare function printField(label: string, value: string | number | boolean): void;
/**
 * Print a section header.
 */
export declare function printHeader(title: string): void;
/**
 * Print a success message with a transaction signature.
 */
export declare function printSuccess(message: string, txSig?: string): void;
/**
 * Print an error message and exit.
 */
export declare function printError(message: string, err?: unknown): void;
