import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork, StablecoinPreset } from '@stbr/sss-token';
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
import { saveToken, setActiveToken, loadConfig, type TokenEntry } from '../config';

import { intro, outro, text, select, isCancel, cancel } from '@clack/prompts';

export function registerCreateCommand(program: Command): void {
    program
        .command('create')
        .description('Deploy a new stablecoin to the blockchain')
        .option('--name <name>', 'Token name (e.g. "ACME USD")')
        .option('--symbol <symbol>', 'Token symbol (e.g. "AUSD")')
        .option('--uri <uri>', 'Metadata URI (e.g. "https://example.com/meta.json")')
        .option('--decimals <number>', 'Number of decimal places', '6')
        .option('--preset <preset>', 'Preset: sss1, sss2, s, or custom', 'sss1')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .option('--blacklister <pubkey>', 'Blacklister public key (SSS-2 only)')
        .option('--seizer <pubkey>', 'Seizer public key (SSS-2 only)')
        .action(async (opts) => {
            let { name, symbol, uri, decimals, preset: presetName, network: networkName, keypair: keypairPath, blacklister, seizer } = opts;

            // Check if we should enter interactive mode
            const isInteractive = !name || !symbol || !uri;

            if (isInteractive) {
                console.log();
                intro(chalk.bgCyan.black(' SSS Stablecoin Creation '));

                if (!name) {
                    const res = await text({
                        message: 'What is the name of your stablecoin?',
                        placeholder: 'e.g. ACME USD',
                        validate: (value: string | undefined) => {
                            if (!value) return 'Name is required';
                        },
                    });
                    if (isCancel(res)) {
                        cancel('Operation cancelled.');
                        process.exit(0);
                    }
                    name = res;
                }

                if (!symbol) {
                    const res = await text({
                        message: 'What is the symbol?',
                        placeholder: 'e.g. AUSD',
                        validate: (value: string | undefined) => {
                            if (!value) return 'Symbol is required';
                        },
                    });
                    if (isCancel(res)) {
                        cancel('Operation cancelled.');
                        process.exit(0);
                    }
                    symbol = res;
                }

                if (!uri) {
                    const res = await text({
                        message: 'What is the metadata URI?',
                        placeholder: 'e.g. https://example.com/meta.json',
                        validate: (value: string | undefined) => {
                            if (!value) return 'Metadata URI is required';
                        },
                    });
                    if (isCancel(res)) {
                        cancel('Operation cancelled.');
                        process.exit(0);
                    }
                    uri = res;
                }

                if (opts.decimals === '6') { // only prompt if default
                    const res = await text({
                        message: 'How many decimal places?',
                        initialValue: '6',
                        validate: (value: string | undefined) => {
                            if (!value || isNaN(parseInt(value))) return 'Must be a number';
                        },
                    });
                    if (isCancel(res)) {
                        cancel('Operation cancelled.');
                        process.exit(0);
                    }
                    decimals = res;
                }

                if (opts.preset === 'sss1') { // only prompt if default
                    const res = await select({
                        message: 'Select a stablecoin preset:',
                        options: [
                            { value: 'sss1', label: 'SSS-1 (Basic Stablecoin)' },
                            { value: 'sss2', label: 'SSS-2 (Compliance & Seizure)' },
                            { value: 'sss3', label: 'SSS-3 (Confidential & Scoped Allowlists)' },
                            { value: 'custom', label: 'Custom' },
                        ],
                    });
                    if (isCancel(res)) {
                        cancel('Operation cancelled.');
                        process.exit(0);
                    }
                    presetName = res as string;
                }

                if (opts.network === 'devnet') { // only prompt if default
                    const res = await select({
                        message: 'Select target network:',
                        options: [
                            { value: 'devnet', label: 'Devnet' },
                            { value: 'mainnet-beta', label: 'Mainnet-Beta' },
                            { value: 'testnet', label: 'Testnet' },
                            { value: 'localnet', label: 'Localnet' },
                        ],
                    });
                    if (isCancel(res)) {
                        cancel('Operation cancelled.');
                        process.exit(0);
                    }
                    networkName = res as string;
                }

                // Advanced options for SSS-2 & SSS-3
                if ((presetName === 'sss2' || presetName === 'sss3') && !blacklister && !seizer) {
                    const configureAdvanced = await select({
                        message: `Configure advanced ${presetName.toUpperCase()} roles (blacklister, seizer)?`,
                        options: [
                            { value: 'no', label: 'No, use my authority address for all roles' },
                            { value: 'yes', label: 'Yes, I want to specify different addresses' },
                        ],
                    });

                    if (configureAdvanced === 'yes') {
                        const bl = await text({
                            message: 'Blacklister public key:',
                            placeholder: 'Pubkey of the blacklister authority',
                            validate: (value: string | undefined) => {
                                if (value) {
                                    try { new PublicKey(value); } catch { return 'Invalid public key'; }
                                }
                            },
                        });
                        if (isCancel(bl)) { cancel('Operation cancelled.'); process.exit(0); }
                        blacklister = bl as string;

                        const sz = await text({
                            message: 'Seizer public key:',
                            placeholder: 'Pubkey of the seizer authority',
                            validate: (value: string | undefined) => {
                                if (value) {
                                    try { new PublicKey(value); } catch { return 'Invalid public key'; }
                                }
                            },
                        });
                        if (isCancel(sz)) { cancel('Operation cancelled.'); process.exit(0); }
                        seizer = sz as string;
                    }
                }
            }

            const spinnerMsg = ora('Deploying stablecoin...').start();

            try {
                const authority = loadKeypair(keypairPath);
                const network = networkName as SolanaNetwork;

                const presetMap: Record<string, StablecoinPreset> = {
                    sss1: StablecoinPreset.SSS_1,
                    sss2: StablecoinPreset.SSS_2,
                    sss3: StablecoinPreset.SSS_3,
                    custom: StablecoinPreset.CUSTOM,
                };
                const preset = presetMap[presetName];
                if (!preset) {
                    spinnerMsg.fail('Invalid preset. Use: sss1, sss2, sss3, or custom');
                    return;
                }

                const { txSig, mintAddress } = await SolanaStablecoin.create(
                    {
                        name,
                        symbol,
                        uri,
                        decimals: parseInt(decimals),
                        preset,
                        authority,
                        blacklister: blacklister ? new PublicKey(blacklister) : undefined,
                        seizer: seizer ? new PublicKey(seizer) : undefined,
                    },
                    network,
                );

                spinnerMsg.stop();

                if (isInteractive) {
                    outro(chalk.green('Stablecoin deployed successfully!'));
                }

                printHeader('Stablecoin Created');
                printField('Mint Address', mintAddress.toBase58());
                printField('Preset', presetName.toUpperCase());
                printField('Name', name);
                printField('Symbol', symbol);
                printField('Decimals', decimals);
                printField('Network', network);
                printSuccess('Deployment details', txSig);

                // ── Persist to ~/.sss/config.json ──
                const mint58 = mintAddress.toBase58();
                const entry: TokenEntry = {
                    name,
                    symbol,
                    preset: presetName,
                    network,
                    createdAt: new Date().toISOString(),
                    keypairPath: keypairPath,
                    mintAddress: mint58,
                    decimals: parseInt(decimals),
                };
                saveToken(mint58, entry);
                setActiveToken(mint58);
                console.log(chalk.gray(`\n  Saved to config & set as active token.`));
            } catch (err) {
                spinnerMsg.fail('Failed to create stablecoin');
                printError('Deployment failed', err);
                process.exit(1);
            }
        });
}

export function registerInfoCommand(program: Command): void {
    program
        .command('info')
        .description('Fetch on-chain info for an existing stablecoin')
        .option('--mint <pubkey>', 'Mint address of the stablecoin')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            let mintStr = opts.mint;
            let networkName = opts.network;

            if (!mintStr) {
                intro(chalk.bgCyan.black(' Fetch Stablecoin Info '));
                const res = await text({
                    message: 'Enter the mint address:',
                    validate: (value: string | undefined) => {
                        if (!value) return 'Mint address is required';
                        try { new PublicKey(value); } catch { return 'Invalid public key'; }
                    },
                });
                if (isCancel(res)) {
                    cancel('Operation cancelled.');
                    process.exit(0);
                }
                mintStr = res;
            }

            const spinner = ora('Fetching stablecoin info...').start();

            try {
                const mint = new PublicKey(mintStr);
                const network = networkName as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mint);
                const info = await sdk.getInfo();

                spinner.stop();
                printHeader('Stablecoin Info');
                printField('Mint', info.mint.toBase58());
                printField('Preset', info.preset.toUpperCase());
                printField('Name', info.name);
                printField('Symbol', info.symbol);
                printField('Total Supply', info.totalSupply);
                printField('Paused', info.paused);
                if (info.blacklistCount !== undefined) {
                    printField('Blacklist Count', info.blacklistCount);
                }
                console.log();

                if (!opts.mint) {
                    outro(chalk.green('Info retrieved successfully.'));
                }
            } catch (err) {
                spinner.fail('Failed to fetch stablecoin info');
                printError('Could not load stablecoin', err);
                process.exit(1);
            }
        });
}

export function registerListCommand(program: Command): void {
    program
        .command('list')
        .description('List all locally stored tokens')
        .action(() => {
            const config = loadConfig();
            const mints = Object.keys(config.tokens);

            printHeader('Stored Tokens');

            if (mints.length === 0) {
                console.log(chalk.gray('  No tokens stored yet. Run sss-token create to get started.'));
                console.log();
                return;
            }

            for (const mint of mints) {
                const t = config.tokens[mint];
                const active = mint === config.activeToken ? chalk.green(' (active)') : '';
                console.log(`  ${chalk.cyan(t.symbol)} — ${t.name}${active}`);
                console.log(chalk.gray(`    Mint:    ${mint}`));
                console.log(chalk.gray(`    Network: ${t.network}  |  Preset: ${t.preset}  |  Decimals: ${t.decimals}`));
                console.log(chalk.gray(`    Created: ${t.createdAt}`));
                console.log();
            }
        });
}

export function registerUseCommand(program: Command): void {
    program
        .command('use')
        .description('Set a stored token as the active token')
        .argument('[mint]', 'Mint address of the token to activate')
        .action(async (mintArg?: string) => {
            const config = loadConfig();
            let mint = mintArg;

            if (!mint) {
                const mints = Object.keys(config.tokens);
                if (mints.length === 0) {
                    printError('No tokens stored', new Error('Run sss-token create or use --mint with a pubkey.'));
                    process.exit(1);
                }

                intro(chalk.bgCyan.black(' Switch Active Token '));
                const res = await select({
                    message: 'Select a token to make active:',
                    options: mints.map(m => ({
                        value: m,
                        label: `${config.tokens[m].symbol} (${config.tokens[m].name})`,
                        hint: m.slice(0, 8) + '...'
                    })),
                });

                if (isCancel(res)) {
                    cancel('Operation cancelled.');
                    process.exit(0);
                }
                mint = res as string;
            }

            if (!config.tokens[mint]) {
                printError(
                    'Token not found',
                    new Error(`No stored token with mint ${mint}.\nRun sss-token list to see available tokens.`),
                );
                process.exit(1);
            }
            setActiveToken(mint);
            const t = config.tokens[mint];

            if (!mintArg) {
                outro(chalk.green(`Active token set to ${t.symbol}`));
            } else {
                printSuccess(`Active token set to ${t.symbol} (${mint})`);
            }
        });
}
3