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

export function registerMintCommand(program: Command): void {
    program
        .command('mint')
        .description('Mint new tokens to a recipient')
        .argument('<recipient>', 'Recipient token account (ATA)')
        .argument('<amount>', 'Amount to mint (base units)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--minter <path>', 'Path to minter keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (recipient, amount, opts) => {
            const spinner = ora('Minting tokens...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
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
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .argument('<amount>', 'Amount to burn (base units)')
        .option('--source <pubkey>', 'Source token account (defaults to burner ATA)')
        .option('--burner <path>', 'Path to burner keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (amount, opts) => {
            const spinner = ora('Burning tokens...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
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
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Freezing account...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
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
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (address, opts) => {
            const spinner = ora('Thawing account...').start();

            try {
                const mintPubkey = new PublicKey(opts.mint);
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
