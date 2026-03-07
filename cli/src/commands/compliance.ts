import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import ora from 'ora';
import chalk from 'chalk';
import { intro, outro, text, isCancel, cancel, select } from '@clack/prompts';
import {
    loadKeypair,
    getDefaultKeypairPath,
    printHeader,
    printField,
    printSuccess,
    printError,
} from '../utils';
import { resolveMint } from '../config';

export function registerComplianceCommands(program: Command): void {
    const compliance = program
        .command('compliance')
        .description('SSS-2 & SSS-3 compliance operations (blacklist, seizure, allowlist)');

    // ── blacklist-add ──────────────────────────────────────────────────
    compliance
        .command('blacklist-add')
        .description('Add a wallet to the on-chain blacklist')
        .argument('[address]', 'Wallet address to blacklist')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--reason <reason>', 'Reason for blacklisting')
        .option('--keypair <path>', 'Path to blacklister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (addressArg, opts) => {
            let address = addressArg;
            let reason = opts.reason;

            const isInteractive = !address || !reason;

            if (isInteractive) {
                intro(chalk.blue('Blacklist Management'));

                if (!address) {
                    const res = await text({
                        message: 'Enter wallet address to blacklist:',
                        placeholder: 'Address',
                        validate: (v: string) => {
                            if (!v) return 'Address is required';
                            try { new PublicKey(v); } catch { return 'Invalid public key'; }
                        }
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    address = res as string;
                }

                if (!reason) {
                    const res = await text({
                        message: 'Enter reason for blacklisting:',
                        placeholder: 'e.g. Regulatory compliance',
                        validate: (v: string) => !v ? 'Reason is required' : undefined
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    reason = res as string;
                }
            }

            const spinner = ora('Adding to blacklist...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.compliance.blacklistAdd(authority, {
                    address: new PublicKey(address),
                    reason: reason,
                });

                spinner.stop();
                if (isInteractive) outro(chalk.green('Wallet blacklisted successfully!'));
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
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to blacklister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Removing from blacklist...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
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
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--address <pubkey>', 'Wallet address to check')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Checking blacklist status...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
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
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Fetching blacklist...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
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
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--to <pubkey>', 'Destination token account')
        .requiredOption('--amount <number>', 'Amount to seize (base units)')
        .requiredOption('--reason <reason>', 'Reason for seizure')
        .option('--keypair <path>', 'Path to seizer keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Seizing tokens...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
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

    // ── allowlist-add ──────────────────────────────────────────────────
    compliance
        .command('allowlist-add')
        .description('Add a wallet to the SSS-3 scoped allowlist')
        .argument('[address]', 'Wallet address to allowlist')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--ops <ops>', 'Allowed operations: 1=RECEIVE, 2=SEND, 3=BOTH')
        .option('--tier <tier>', 'KYC tier: 0=BASIC, 1=ENHANCED, 2=INSTITUTIONAL')
        .option('--reason <reason>', 'Reason for allowlisting')
        .option('--expiry <date>', 'Expiry date (YYYY-MM-DD), default=permanent')
        .option('--keypair <path>', 'Path to allowlister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (addressArg, opts) => {
            let address = addressArg;
            let ops = opts.ops;
            let tier = opts.tier;
            let reason = opts.reason;

            const isInteractive = !address || !ops || !tier || !reason;

            if (isInteractive) {
                intro(chalk.blue('Allowlist Management'));

                if (!address) {
                    const res = await text({
                        message: 'Enter wallet address to allowlist:',
                        placeholder: 'Address',
                        validate: (v: string) => {
                            if (!v) return 'Address is required';
                            try { new PublicKey(v); } catch { return 'Invalid public key'; }
                        }
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    address = res as string;
                }

                if (!ops) {
                    const res = await select({
                        message: 'Select allowed operations:',
                        options: [
                            { value: '1', label: 'RECEIVE' },
                            { value: '2', label: 'SEND' },
                            { value: '3', label: 'BOTH' },
                        ]
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    ops = res as string;
                }

                if (!tier) {
                    const res = await select({
                        message: 'Select KYC tier:',
                        options: [
                            { value: '0', label: 'BASIC' },
                            { value: '1', label: 'ENHANCED' },
                            { value: '2', label: 'INSTITUTIONAL' },
                        ]
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    tier = res as string;
                }

                if (!reason) {
                    const res = await text({
                        message: 'Enter reason for allowlisting:',
                        placeholder: 'e.g. KYC Verified',
                        validate: (v: string) => !v ? 'Reason is required' : undefined
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    reason = res as string;
                }
            } else {
                // If not interactive, use defaults if missing (though commander usually handles this, we be safe)
                ops = ops || '3';
                tier = tier || '0';
            }

            const spinner = ora('Adding to allowlist...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.sss3.addToAllowlist(authority, {
                    address: new PublicKey(address),
                    allowedOperations: parseInt(ops),
                    kycTier: parseInt(tier),
                    reason: reason,
                    expiry: opts.expiry ? new Date(opts.expiry) : undefined,
                });

                spinner.stop();
                if (isInteractive) outro(chalk.green('Wallet added to allowlist successfully!'));
                printSuccess(`Allowlisted: ${address}`, txSig);
            } catch (err) {
                spinner.fail('Allowlist add failed');
                printError('Failed to add to allowlist', err);
                process.exit(1);
            }
        });

    // ── allowlist-remove ───────────────────────────────────────────────
    compliance
        .command('allowlist-remove')
        .description('Remove a wallet from the SSS-3 allowlist')
        .argument('<address>', 'Wallet address to remove')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to allowlister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Removing from allowlist...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.sss3.removeFromAllowlist(
                    authority,
                    new PublicKey(address),
                );

                spinner.stop();
                printSuccess(`Removed from allowlist: ${address}`, txSig);
            } catch (err) {
                spinner.fail('Allowlist remove failed');
                printError('Failed to remove from allowlist', err);
                process.exit(1);
            }
        });

    // ── allowlist-info ─────────────────────────────────────────────────
    compliance
        .command('allowlist-info')
        .description('Fetch allowlist entry details for a specific address')
        .argument('<address>', 'Wallet address to check')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Fetching allowlist entry...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const entry = await sdk.sss3.getAllowlistEntry(new PublicKey(address));

                spinner.stop();
                printHeader('Allowlist Entry Details');

                if (!entry) {
                    console.log(chalk.gray(`  No allowlist entry found for ${address}`));
                } else {
                    printField('Address', entry.address.toBase58());
                    printField('Active', entry.active);
                    printField('KYC Tier', entry.kycTier === 0 ? 'BASIC' : entry.kycTier === 1 ? 'ENHANCED' : 'INSTITUTIONAL');
                    printField('Can Send', entry.allowedOperations.canSend);
                    printField('Can Receive', entry.allowedOperations.canReceive);
                    printField('Reason', entry.reason);
                    printField('Added By', entry.addedBy.toBase58());
                    printField('Added At', new Date(entry.addedAt * 1000).toLocaleString());
                    printField('Expiry', entry.expiry === 0 ? 'Permanent' : new Date(entry.expiry * 1000).toLocaleString());
                }
                console.log();
            } catch (err) {
                spinner.fail('Fetch failed');
                printError('Could not retrieve allowlist entry', err);
                process.exit(1);
            }
        });

    // ── allowlist-update ───────────────────────────────────────────────
    compliance
        .command('allowlist-update')
        .description('Update an existing SSS-3 allowlist entry')
        .argument('<address>', 'Wallet address to update')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--ops <ops>', 'Allowed operations: 1=RECEIVE, 2=SEND, 3=BOTH')
        .requiredOption('--tier <tier>', 'KYC tier: 0=BASIC, 1=ENHANCED, 2=INSTITUTIONAL')
        .requiredOption('--reason <reason>', 'Update reason')
        .option('--expiry <date>', 'Expiry date (YYYY-MM-DD), default=permanent')
        .option('--keypair <path>', 'Path to allowlister keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Updating allowlist entry...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.sss3.updateAllowlistEntry(authority, {
                    address: new PublicKey(address),
                    allowedOperations: parseInt(opts.ops),
                    kycTier: parseInt(opts.tier),
                    reason: opts.reason,
                    expiry: opts.expiry ? new Date(opts.expiry) : undefined,
                });

                spinner.stop();
                printSuccess(`Updated allowlist entry: ${address}`, txSig);
            } catch (err) {
                spinner.fail('Update failed');
                printError('Failed to update allowlist entry', err);
                process.exit(1);
            }
        });
}
