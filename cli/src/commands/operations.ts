import { Command } from 'commander';
import { Connection, PublicKey } from '@solana/web3.js';
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    getAccount,
    createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import ora from 'ora';
import chalk from 'chalk';
import { intro, outro, text, isCancel, cancel } from '@clack/prompts';
import {
    loadKeypair,
    getDefaultKeypairPath,
    printSuccess,
    printError,
} from '../utils';
import { resolveMint } from '../config';

const NETWORK_RPC: Record<string, string> = {
    devnet: 'https://api.devnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com',
    testnet: 'https://api.testnet.solana.com',
    localnet: 'http://127.0.0.1:8899',
};

export function registerMintCommand(program: Command): void {
    program
        .command('mint')
        .description('Mint new tokens to a recipient wallet (ATA is derived automatically)')
        .argument('[recipient]', 'Recipient wallet address (ATA will be created/derived if needed)')
        .argument('[amount]', 'Amount to mint (base units)')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--minter <path>', 'Path to minter keypair JSON (must be registered via add-minter first)', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (recipientArg, amountArg, opts) => {
            let recipient = recipientArg;
            let amount = amountArg;

            const isInteractive = !recipient || !amount;

            if (isInteractive) {
                intro(chalk.blue('Token Minting'));

                if (!recipient) {
                    const res = await text({
                        message: 'Enter recipient wallet address:',
                        placeholder: 'Wallet address (ATA will be derived automatically)',
                        validate: (v) => {
                            if (!v) return 'Recipient address is required';
                            try { new PublicKey(v); } catch { return 'Invalid public key'; }
                        }
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    recipient = res as string;
                }

                if (!amount) {
                    const res = await text({
                        message: 'Enter amount to mint (base units):',
                        placeholder: 'e.g. 1000000',
                        validate: (v) => !v || isNaN(parseInt(v)) ? 'Valid amount is required' : undefined
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    amount = res as string;
                }
            }


            const spinner = ora('Minting tokens...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const minter = loadKeypair(opts.minter);

                // Derive the ATA for the recipient wallet address
                const recipientWallet = new PublicKey(recipient);
                const recipientAta = getAssociatedTokenAddressSync(
                    mintPubkey,
                    recipientWallet,
                    false,
                    TOKEN_2022_PROGRAM_ID,
                );

                // Create the ATA if it doesn't exist yet
                const connection = new Connection(NETWORK_RPC[opts.network] || NETWORK_RPC['devnet'], 'confirmed');
                try {
                    await getAccount(connection, recipientAta, 'confirmed', TOKEN_2022_PROGRAM_ID);
                } catch {
                    spinner.text = 'Creating recipient token account (ATA)...';
                    const createAtaTx = new Transaction().add(
                        createAssociatedTokenAccountInstruction(
                            minter.publicKey,
                            recipientAta,
                            recipientWallet,
                            mintPubkey,
                            TOKEN_2022_PROGRAM_ID,
                        )
                    );
                    await sendAndConfirmTransaction(connection, createAtaTx, [minter], { commitment: 'confirmed' });
                }

                spinner.text = 'Minting tokens...';
                const txSig = await sdk.mint({
                    recipient: recipientAta,
                    amount: parseInt(amount),
                    minter,
                });

                spinner.stop();
                if (isInteractive) outro(chalk.green('Tokens minted successfully!'));
                printSuccess(`Minted ${amount} tokens to ${recipient} (ATA: ${recipientAta.toBase58()})`, txSig);
            } catch (err: any) {
                spinner.fail('Minting failed');
                const msg: string = err?.message ?? String(err);
                if (msg.includes('AccountNotInitialized') && msg.includes('minter_config')) {
                    printError(
                        'Failed to mint tokens',
                        new Error(
                            `The signing keypair has not been registered as a minter.\n` +
                            `  Run first:  sss-token add-minter <YOUR_PUBKEY> --network ${opts.network}\n` +
                            `  Your pubkey can be found with: solana-keygen pubkey ${opts.minter}`
                        )
                    );
                } else {
                    printError('Failed to mint tokens', err);
                }
                process.exit(1);
            }
        });
}

export function registerBurnCommand(program: Command): void {
    program
        .command('burn')
        .description('Burn tokens from a token account')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .argument('[amount]', 'Amount to burn (base units)')
        .option('--source <pubkey>', 'Source token account (defaults to burner ATA)')
        .option('--burner <path>', 'Path to burner keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (amountArg, opts) => {
            let amount = amountArg;
            const isInteractive = !amount;

            if (isInteractive) {
                intro(chalk.blue('Token Burning'));
                const res = await text({
                    message: 'Enter amount to burn (base units):',
                    placeholder: 'e.g. 1000000',
                    validate: (v) => !v || isNaN(parseInt(v)) ? 'Valid amount is required' : undefined
                });
                if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                amount = res as string;
            }

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
                if (isInteractive) outro(chalk.green('Tokens burned successfully!'));
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
        .argument('[address]', 'Token account to freeze')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (addressArg, opts) => {
            let address = addressArg;
            const isInteractive = !address;

            if (isInteractive) {
                intro(chalk.blue('Freeze Account'));
                const res = await text({
                    message: 'Enter token account to freeze:',
                    placeholder: 'Address',
                    validate: (v) => {
                        if (!v) return 'Address is required';
                        try { new PublicKey(v); } catch { return 'Invalid public key'; }
                    }
                });
                if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                address = res as string;
            }

            const spinner = ora('Freezing account...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.freeze(authority, new PublicKey(address));

                spinner.stop();
                if (isInteractive) outro(chalk.green('Account frozen successfully!'));
                printSuccess(`Account frozen: ${address}`, txSig);
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
        .argument('[address]', 'Token account to thaw')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (addressArg, opts) => {
            let address = addressArg;
            const isInteractive = !address;

            if (isInteractive) {
                intro(chalk.blue('Thaw Account'));
                const res = await text({
                    message: 'Enter token account to thaw:',
                    placeholder: 'Address',
                    validate: (v) => {
                        if (!v) return 'Address is required';
                        try { new PublicKey(v); } catch { return 'Invalid public key'; }
                    }
                });
                if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                address = res as string;
            }

            const spinner = ora('Thawing account...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.thaw(authority, new PublicKey(address));

                spinner.stop();
                if (isInteractive) outro(chalk.green('Account thawed successfully!'));
                printSuccess(`Account thawed: ${address}`, txSig);
            } catch (err) {
                spinner.fail('Thaw failed');
                printError('Failed to thaw account', err);
                process.exit(1);
            }
        });
}

export function registerHoldersCommand(program: Command): void {
    program
        .command('holders')
        .description('Get token holders list and count')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .option('--min <amount>', 'Minimum amount to filter largest holders', '0')
        .action(async (opts) => {
            const spinner = ora('Fetching holders...').start();
            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const count = await sdk.getHoldersCount();
                const largestHolders = await sdk.getLargestHolders(parseInt(opts.min));

                spinner.stop();
                console.log(chalk.bold(`\nTotal Holders: ${count}`));
                
                if (largestHolders.length > 0) {
                    console.log(chalk.bold('\nLargest Holders:'));
                    largestHolders.forEach((h, i) => {
                        console.log(`  ${i + 1}. ${h.address.toBase58()} - ${h.uiAmountString != null ? h.uiAmountString : h.amount} tokens`);
                    });
                } else {
                    console.log(chalk.gray('\nNo top holders found matching criteria.'));
                }
                console.log();
            } catch (err) {
                spinner.fail('Failed to fetch holders');
                printError('Could not get holders info', err);
                process.exit(1);
            }
        });
}
