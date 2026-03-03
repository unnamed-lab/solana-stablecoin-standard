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

export function registerCreateCommand(program: Command): void {
    program
        .command('create')
        .description('Deploy a new stablecoin to the blockchain')
        .requiredOption('--name <name>', 'Token name (e.g. "ACME USD")')
        .requiredOption('--symbol <symbol>', 'Token symbol (e.g. "AUSD")')
        .requiredOption('--uri <uri>', 'Metadata URI (e.g. "https://example.com/meta.json")')
        .option('--decimals <number>', 'Number of decimal places', '6')
        .option('--preset <preset>', 'Preset: sss1, sss2, or custom', 'sss1')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .option('--blacklister <pubkey>', 'Blacklister public key (SSS-2 only)')
        .option('--seizer <pubkey>', 'Seizer public key (SSS-2 only)')
        .action(async (opts) => {
            const spinner = ora('Deploying stablecoin...').start();

            try {
                const authority = loadKeypair(opts.keypair);
                const network = opts.network as SolanaNetwork;

                const presetMap: Record<string, StablecoinPreset> = {
                    sss1: StablecoinPreset.SSS_1,
                    sss2: StablecoinPreset.SSS_2,
                    custom: StablecoinPreset.CUSTOM,
                };
                const preset = presetMap[opts.preset];
                if (!preset) {
                    spinner.fail('Invalid preset. Use: sss1, sss2, or custom');
                    return;
                }

                const { txSig, mintAddress } = await SolanaStablecoin.create(
                    {
                        name: opts.name,
                        symbol: opts.symbol,
                        uri: opts.uri,
                        decimals: parseInt(opts.decimals),
                        preset,
                        authority,
                        blacklister: opts.blacklister ? new PublicKey(opts.blacklister) : undefined,
                        seizer: opts.seizer ? new PublicKey(opts.seizer) : undefined,
                    },
                    network,
                );

                spinner.stop();
                printHeader('Stablecoin Created');
                printField('Mint Address', mintAddress.toBase58());
                printField('Preset', opts.preset.toUpperCase());
                printField('Name', opts.name);
                printField('Symbol', opts.symbol);
                printField('Decimals', opts.decimals);
                printField('Network', network);
                printSuccess('Stablecoin deployed successfully', txSig);

                // ── Persist to ~/.sss/config.json ──
                const mint58 = mintAddress.toBase58();
                const entry: TokenEntry = {
                    name: opts.name,
                    symbol: opts.symbol,
                    preset: opts.preset,
                    network,
                    createdAt: new Date().toISOString(),
                    keypairPath: opts.keypair,
                    mintAddress: mint58,
                    decimals: parseInt(opts.decimals),
                };
                saveToken(mint58, entry);
                setActiveToken(mint58);
                console.log(chalk.gray(`\n  Saved to config & set as active token.`));
            } catch (err) {
                spinner.fail('Failed to create stablecoin');
                printError('Deployment failed', err);
                process.exit(1);
            }
        });
}

export function registerInfoCommand(program: Command): void {
    program
        .command('info')
        .description('Fetch on-chain info for an existing stablecoin')
        .requiredOption('--mint <pubkey>', 'Mint address of the stablecoin')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Fetching stablecoin info...').start();

            try {
                const mint = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
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
        .argument('<mint>', 'Mint address of the token to activate')
        .action((mint: string) => {
            const config = loadConfig();
            if (!config.tokens[mint]) {
                printError(
                    'Token not found',
                    new Error(`No stored token with mint ${mint}.\nRun sss-token list to see available tokens.`),
                );
                process.exit(1);
            }
            setActiveToken(mint);
            const t = config.tokens[mint];
            printSuccess(`Active token set to ${t.symbol} (${mint})`);
        });
}
