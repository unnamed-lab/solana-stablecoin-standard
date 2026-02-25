import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

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
export function loadKeypair(keypairPath: string): Keypair {
    const resolved = keypairPath.startsWith('~')
        ? path.join(os.homedir(), keypairPath.slice(1))
        : path.resolve(keypairPath);

    if (!fs.existsSync(resolved)) {
        console.error(chalk.red(`✗ Keypair file not found: ${resolved}`));
        process.exit(1);
    }

    try {
        const raw = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
        return Keypair.fromSecretKey(Uint8Array.from(raw));
    } catch (err) {
        console.error(chalk.red(`✗ Failed to parse keypair file: ${resolved}`));
        process.exit(1);
    }
}

/**
 * Returns the default Solana keypair path (~/.config/solana/id.json).
 */
export function getDefaultKeypairPath(): string {
    return path.join(os.homedir(), '.config', 'solana', 'id.json');
}

/**
 * Format a transaction signature for display.
 */
export function formatTxSig(sig: string): string {
    return chalk.cyan(sig.slice(0, 8) + '...' + sig.slice(-6));
}

/**
 * Format a public key for display (shortened).
 */
export function formatPubkey(pubkey: string): string {
    if (pubkey.length <= 16) return chalk.yellow(pubkey);
    return chalk.yellow(pubkey.slice(0, 6) + '...' + pubkey.slice(-4));
}

/**
 * Print a labelled key-value line.
 */
export function printField(label: string, value: string | number | boolean): void {
    const formattedLabel = chalk.gray(label.padEnd(20));
    const formattedValue = typeof value === 'boolean'
        ? (value ? chalk.green('Yes') : chalk.red('No'))
        : chalk.white(String(value));
    console.log(`  ${formattedLabel} ${formattedValue}`);
}

/**
 * Print a section header.
 */
export function printHeader(title: string): void {
    console.log();
    console.log(chalk.bold.white(`── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`));
    console.log();
}

/**
 * Print a success message with a transaction signature.
 */
export function printSuccess(message: string, txSig?: string): void {
    console.log();
    console.log(chalk.green(`  ✓ ${message}`));
    if (txSig) {
        console.log(chalk.gray(`    tx: `) + chalk.cyan(txSig));
    }
    console.log();
}

/**
 * Print an error message and exit.
 */
export function printError(message: string, err?: unknown): void {
    console.log();
    console.error(chalk.red(`  ✗ ${message}`));
    if (err instanceof Error) {
        console.error(chalk.gray(`    ${err.message}`));
    }
    console.log();
}
