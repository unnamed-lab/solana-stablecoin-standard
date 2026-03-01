import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import ora from 'ora';
import chalk from 'chalk';
import {
    loadKeypair,
    getDefaultKeypairPath,
    printHeader,
    printField,
    printSuccess,
    printError,
} from '../utils';

export function registerComplianceCommands(program: Command): void {
    const compliance = program
        .command('compliance')
        .description('SSS-2 compliance operations (blacklist & seizure)');

    // ── blacklist-add ──────────────────────────────────────────────────
    compliance
        .command('blacklist-add')
        .description('Add a wallet to the on-chain blacklist')
        .argument('<address>', 'Wallet address to blacklist')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--reason <reason>', 'Reason for blacklisting')
        .option('--keypair <path>', 'Path to blacklister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Adding to blacklist...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.compliance.blacklistAdd(authority, {
                    address: new PublicKey(address),
                    reason: opts.reason,
                });

                spinner.stop();
                printSuccess(`Blacklisted: ${address}`, txSig);
            } catch (err) {
                spinner.fail('Blacklist add failed');
                printError('Failed to add to blacklist', err);
                process.exit(1);
            }
        });

    // ── blacklist-remove ───────────────────────────────────────────────
    compliance
        .command('blacklist-remove')
        .description('Remove a wallet from the on-chain blacklist')
        .argument('<address>', 'Wallet address to un-blacklist')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to blacklister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Removing from blacklist...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.compliance.blacklistRemove(
                    authority,
                    new PublicKey(address),
                );

                spinner.stop();
                printSuccess(`Removed from blacklist: ${address}`, txSig);
            } catch (err) {
                spinner.fail('Blacklist remove failed');
                printError('Failed to remove from blacklist', err);
                process.exit(1);
            }
        });

    // ── check ──────────────────────────────────────────────────────────
    compliance
        .command('check')
        .description('Check if a wallet is blacklisted')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--address <pubkey>', 'Wallet address to check')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Checking blacklist status...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const isBlacklisted = await sdk.compliance.isBlacklisted(
                    new PublicKey(opts.address),
                );

                spinner.stop();
                printHeader('Blacklist Check');
                printField('Address', opts.address);
                printField('Blacklisted', isBlacklisted);
                console.log();
            } catch (err) {
                spinner.fail('Check failed');
                printError('Failed to check blacklist status', err);
                process.exit(1);
            }
        });

    // ── list ───────────────────────────────────────────────────────────
    compliance
        .command('list')
        .description('List all active blacklist entries')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Fetching blacklist...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const entries = await sdk.compliance.getBlacklist();

                spinner.stop();
                printHeader('Blacklist Entries');

                if (entries.length === 0) {
                    console.log(chalk.gray('  No active blacklist entries.'));
                } else {
                    for (const entry of entries) {
                        console.log(chalk.yellow(`  • ${entry.address.toBase58()}`));
                        console.log(chalk.gray(`    Reason: ${entry.reason}`));
                        console.log();
                    }
                    console.log(chalk.gray(`  Total: ${entries.length} entries`));
                }
                console.log();
            } catch (err) {
                spinner.fail('Failed to fetch blacklist');
                printError('Could not retrieve blacklist', err);
                process.exit(1);
            }
        });

    // ── seize ──────────────────────────────────────────────────────────
    compliance
        .command('seize')
        .description('Seize tokens from a frozen account (SSS-2, permanent delegate)')
        .argument('<address>', 'Source token account (must be frozen)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--to <pubkey>', 'Destination token account')
        .requiredOption('--amount <number>', 'Amount to seize (base units)')
        .requiredOption('--reason <reason>', 'Reason for seizure')
        .option('--keypair <path>', 'Path to seizer keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Seizing tokens...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.compliance.seize(
                    authority,
                    new PublicKey(address),
                    new PublicKey(opts.to),
                    parseInt(opts.amount),
                    opts.reason,
                );

                spinner.stop();
                printSuccess(`Seized ${opts.amount} tokens`, txSig);
            } catch (err) {
                spinner.fail('Seizure failed');
                printError('Failed to seize tokens', err);
                process.exit(1);
            }
        });
}
