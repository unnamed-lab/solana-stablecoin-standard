import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import ora from 'ora';
import {
    loadKeypair,
    getDefaultKeypairPath,
    printHeader,
    printField,
    printSuccess,
    printError,
} from '../utils';

export function registerHookCommands(program: Command): void {
    const hook = program
        .command('hook')
        .description('SSS-2 transfer hook management');

    // ── init ───────────────────────────────────────────────────────────
    hook
        .command('init')
        .description('Initialize the transfer hook for this mint')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--enabled', 'Start with the hook enabled (default: true)', true)
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Initializing transfer hook...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig1 = await sdk.transferHook.initializeHook(
                    authority,
                    authority,
                    opts.enabled,
                );

                spinner.text = 'Registering extra account metas...';

                const txSig2 = await sdk.transferHook.initializeExtraAccountMetaList(
                    authority,
                    authority,
                );

                spinner.stop();
                printSuccess('Transfer hook initialized', txSig1);
                printSuccess('Extra account metas registered', txSig2);
            } catch (err) {
                spinner.fail('Hook initialization failed');
                printError('Failed to initialize transfer hook', err);
                process.exit(1);
            }
        });

    // ── enable ─────────────────────────────────────────────────────────
    hook
        .command('enable')
        .description('Enable the transfer hook (enforce blacklist on transfers)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Enabling transfer hook...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);
                const txSig = await sdk.transferHook.enableHook(authority);

                spinner.stop();
                printSuccess('Transfer hook enabled', txSig);
            } catch (err) {
                spinner.fail('Enable failed');
                printError('Failed to enable transfer hook', err);
                process.exit(1);
            }
        });

    // ── disable ────────────────────────────────────────────────────────
    hook
        .command('disable')
        .description('Disable the transfer hook (transfers bypass blacklist)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Disabling transfer hook...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);
                const txSig = await sdk.transferHook.disableHook(authority);

                spinner.stop();
                printSuccess('Transfer hook disabled', txSig);
            } catch (err) {
                spinner.fail('Disable failed');
                printError('Failed to disable transfer hook', err);
                process.exit(1);
            }
        });

    // ── status ─────────────────────────────────────────────────────────
    hook
        .command('status')
        .description('Show current transfer hook configuration')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Fetching hook config...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const config = await sdk.transferHook.getHookConfig();

                spinner.stop();
                printHeader('Transfer Hook Config');
                printField('Mint', config.mint.toBase58());
                printField('Authority', config.authority.toBase58());
                printField('Enabled', config.enabled);
                printField('Transfers', config.transferCount);
                printField('Blocked', config.blockedCount);
                console.log();
            } catch (err) {
                spinner.fail('Failed to fetch hook config');
                printError('Could not load hook configuration', err);
                process.exit(1);
            }
        });
}
