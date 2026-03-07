import { Command } from 'commander';
import * as fs from 'fs';
import * as toml from 'toml';
import chalk from 'chalk';
import ora from 'ora';
import { printError, printHeader } from '../utils';

// Helper to determine parsing
function parseFile(filePath: string) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');
    if (ext === 'toml') {
        return toml.parse(content);
    }
    return JSON.parse(content);
}

export function registerConfigCommands(program: Command): void {
    const customCmd = program
        .command('config')
        .description('Manage generic custom configurations like presets, minters, holders');

    // ── Presets ─────────────────────────────────────────────────────────────
    customCmd
        .command('presets')
        .description('List custom presets from a TOML or JSON file')
        .requiredOption('-f, --file <path>', 'Path to presets file (JSON/TOML)')
        .action((opts) => {
            try {
                const parsed = parseFile(opts.file);
                printHeader('Custom Presets');
                console.log(JSON.stringify(parsed, null, 2));
            } catch (err) {
                printError('Failed to read and parse presets file', err);
            }
        });

    // ── Minters ─────────────────────────────────────────────────────────────
    customCmd
        .command('minters')
        .description('View minters list. Supports JSON or TOML format output.')
        .option('--format <fmt>', 'Output format: json or toml', 'json')
        .action(async (opts) => {
            const spinner = ora('Fetching minter list...').start();
            try {
                // For CLI, we can use the same logic as backend or call backend.
                // Let's use the SDK to fetch info since CLI usually connects to RPC.
                const { resolveMint } = await import('../config');
                const { SolanaStablecoin } = await import('@stbr/sss-token');

                const mintAddress = resolveMint();
                // Note: network is usually devnet by default in CLI opts, but here we'll assume devnet or load from config
                const sdk = await SolanaStablecoin.load('devnet' as any, new (await import('@solana/web3.js')).PublicKey(mintAddress));
                const info = await sdk.getInfo();

                const minters = [
                    { pubkey: info.mint?.toBase58() || 'Unknown', note: "Primary authority" }
                ];

                spinner.stop();
                if (opts.format === 'toml') {
                    console.log("[minters]");
                    minters.forEach((m) => {
                        console.log(`[[minters.list]]`);
                        console.log(`pubkey = "${m.pubkey}"`);
                        console.log(`note = "${m.note}"`);
                        console.log();
                    });
                } else {
                    console.log(JSON.stringify({ minters }, null, 2));
                }
            } catch (err) {
                spinner.fail('Failed to fetch minters');
                printError('Minter fetch failed', err);
            }
        });

    // ── Holders ─────────────────────────────────────────────────────────────
    customCmd
        .command('holders')
        .description('View token holders list. Supports JSON or TOML format output.')
        .option('--format <fmt>', 'Output format: json or toml', 'json')
        .option('--min <amount>', 'Minimum amount to filter holders', '0')
        .action(async (opts) => {
            const spinner = ora('Fetching holders...').start();
            try {
                const { resolveMint } = await import('../config');
                const { SolanaStablecoin } = await import('@stbr/sss-token');
                const { PublicKey } = await import('@solana/web3.js');

                const mintAddress = resolveMint();
                const sdk = await SolanaStablecoin.load('devnet' as any, new PublicKey(mintAddress));
                const holders = await sdk.getLargestHolders(parseInt(opts.min));

                spinner.stop();
                const mappedHolders = holders.map(h => ({
                    address: h.address.toBase58(),
                    amount: h.uiAmountString,
                }));

                if (opts.format === 'toml') {
                    console.log("[holders]");
                    mappedHolders.forEach((h) => {
                        console.log(`[[holders.list]]`);
                        console.log(`address = "${h.address}"`);
                        console.log(`amount = "${h.amount}"`);
                        console.log();
                    });
                } else {
                    console.log(JSON.stringify({ holders: mappedHolders }, null, 2));
                }
            } catch (err) {
                spinner.fail('Failed to fetch holders');
                printError('Holders fetch failed', err);
            }
        });
}
