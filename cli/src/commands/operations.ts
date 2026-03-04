import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import ora from 'ora';
import {
    loadKeypair,
    getDefaultKeypairPath,
    printSuccess,
    printError,
} from '../utils';
import { resolveMint } from '../config';

export function registerMintCommand(program: Command): void {
    program
        .command('mint')
        .description('Mint new tokens to a recipient')
        .argument('<recipient>', 'Recipient token account (ATA)')
        .argument('<amount>', 'Amount to mint (base units)')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--minter <path>', 'Path to minter keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (recipient, amount, opts) => {
            const spinner = ora('Minting tokens...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const minter = loadKeypair(opts.minter);

                const txSig = await sdk.mint({
                    recipient: new PublicKey(recipient),
                    amount: parseInt(amount),
                    minter,
                });

                spinner.stop();
                printSuccess(`Minted ${amount} tokens`, txSig);
            } catch (err) {
                spinner.fail('Minting failed');
                printError('Failed to mint tokens', err);
                process.exit(1);
            }
        });
}

export function registerBurnCommand(program: Command): void {
    program
        .command('burn')
        .description('Burn tokens from a token account')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .argument('<amount>', 'Amount to burn (base units)')
        .option('--source <pubkey>', 'Source token account (defaults to burner ATA)')
        .option('--burner <path>', 'Path to burner keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (amount, opts) => {
            const spinner = ora('Burning tokens...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const burner = loadKeypair(opts.burner);

                const txSig = await sdk.burn({
                    amount: parseInt(amount),
                    burner,
                    source: opts.source ? new PublicKey(opts.source) : undefined,
                });

                spinner.stop();
                printSuccess(`Burned ${amount} tokens`, txSig);
            } catch (err) {
                spinner.fail('Burning failed');
                printError('Failed to burn tokens', err);
                process.exit(1);
            }
        });
}

export function registerFreezeCommand(program: Command): void {
    program
        .command('freeze')
        .description('Freeze a token account')
        .argument('<address>', 'Token account to freeze')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Freezing account...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.freeze(authority, new PublicKey(address));

                spinner.stop();
                printSuccess('Account frozen', txSig);
            } catch (err) {
                spinner.fail('Freeze failed');
                printError('Failed to freeze account', err);
                process.exit(1);
            }
        });
}

export function registerThawCommand(program: Command): void {
    program
        .command('thaw')
        .description('Thaw (unfreeze) a token account')
        .argument('<address>', 'Token account to thaw')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Thawing account...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.thaw(authority, new PublicKey(address));

                spinner.stop();
                printSuccess('Account thawed', txSig);
            } catch (err) {
                spinner.fail('Thaw failed');
                printError('Failed to thaw account', err);
                process.exit(1);
            }
        });
}
// export function registerHoldersCommand(program: Command): void {
//     program
//         .command('holders')
//         .description('List the largest token holders')
//         .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
//         .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
//         .option('--min-balance <amount>', 'Minimum balance filter (base units)', '0')
//         .action(async (opts) => {
//             const spinner = ora('Fetching holders...').start();

//             try {
//                 const mintPubkey = new PublicKey(resolveMint(opts.mint));
//                 const network = opts.network as SolanaNetwork;
//                 const sdk = await SolanaStablecoin.load(network, mintPubkey);

//                 const minBalance = parseInt(opts.minBalance ?? '0');
//                 const holders = await sdk.getLargestHolders(minBalance);

//                 spinner.stop();

//                 if (holders.length === 0) {
//                     console.log('\n  No holders found.\n');
//                     return;
//                 }

//                 console.log('\n  ── Largest Holders ────────────────────────────────────\n');
//                 holders.forEach((h: { address: { toBase58: () => string }; uiAmountString: string; amount: string }, i: number) => {
//                     console.log(`  ${i + 1}. ${h.address.toBase58()}`);
//                     console.log(`     Balance: ${h.uiAmountString} (${h.amount} base units)`);
//                     console.log();
//                 });
//             } catch (err) {
//                 spinner.fail('Failed to fetch holders');
//                 printError('Could not retrieve holders', err);
//                 process.exit(1);
//             }
//         });
// }