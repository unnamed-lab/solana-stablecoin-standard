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

export function registerPauseCommand(program: Command): void {
    program
        .command('pause')
        .description('Pause the stablecoin (blocks minting & burning)')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to pauser keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Pausing stablecoin...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const pauser = loadKeypair(opts.keypair);
                const txSig = await sdk.pause(pauser);

                spinner.stop();
                printSuccess('Stablecoin paused', txSig);
            } catch (err) {
                spinner.fail('Pause failed');
                printError('Failed to pause stablecoin', err);
                process.exit(1);
            }
        });
}

export function registerUnpauseCommand(program: Command): void {
    program
        .command('unpause')
        .description('Unpause the stablecoin (resumes operations)')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to pauser keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Unpausing stablecoin...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const pauser = loadKeypair(opts.keypair);
                const txSig = await sdk.unpause(pauser);

                spinner.stop();
                printSuccess('Stablecoin unpaused', txSig);
            } catch (err) {
                spinner.fail('Unpause failed');
                printError('Failed to unpause stablecoin', err);
                process.exit(1);
            }
        });
}

export function registerAddMinterCommand(program: Command): void {
    program
        .command('add-minter')
        .description('Authorise a new minter with an optional quota')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--minter <pubkey>', 'Public key of the new minter')
        .option('--quota <number>', 'Max tokens this minter can mint per period')
        .option('--keypair <path>', 'Path to minter-authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Adding minter...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);
                const quota = opts.quota ? { amount: parseInt(opts.quota) } : undefined;

                const txSig = await sdk.addMinter(
                    authority,
                    new PublicKey(opts.minter),
                    quota,
                );

                spinner.stop();
                printSuccess(`Minter added: ${opts.minter}`, txSig);
            } catch (err) {
                spinner.fail('Failed to add minter');
                printError('Add minter failed', err);
                process.exit(1);
            }
        });
}

export function registerRemoveMinterCommand(program: Command): void {
    program
        .command('remove-minter')
        .description('Revoke minting rights from a minter')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--minter <pubkey>', 'Public key of the minter to remove')
        .option('--keypair <path>', 'Path to minter-authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Removing minter...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.removeMinter(
                    authority,
                    new PublicKey(opts.minter),
                );

                spinner.stop();
                printSuccess(`Minter removed: ${opts.minter}`, txSig);
            } catch (err) {
                spinner.fail('Failed to remove minter');
                printError('Remove minter failed', err);
                process.exit(1);
            }
        });
}

export function registerUpdateRolesCommand(program: Command): void {
    program
        .command('update-roles')
        .description('Update role assignments on the stablecoin')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--new-pauser <pubkey>', 'New pauser public key')
        .option('--new-minter-authority <pubkey>', 'New minter authority public key')
        .option('--new-burner <pubkey>', 'New burner public key')
        .option('--new-blacklister <pubkey>', 'New blacklister public key (SSS-2)')
        .option('--new-seizer <pubkey>', 'New seizer public key (SSS-2)')
        .option('--keypair <path>', 'Path to master authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Updating roles...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.updateRoles(authority, {
                    newPauser: opts.newPauser ? new PublicKey(opts.newPauser) : undefined,
                    newMinterAuthority: opts.newMinterAuthority ? new PublicKey(opts.newMinterAuthority) : undefined,
                    newBurner: opts.newBurner ? new PublicKey(opts.newBurner) : undefined,
                    newBlacklister: opts.newBlacklister ? new PublicKey(opts.newBlacklister) : undefined,
                    newSeizer: opts.newSeizer ? new PublicKey(opts.newSeizer) : undefined,
                });

                spinner.stop();
                printSuccess('Roles updated', txSig);
            } catch (err) {
                spinner.fail('Failed to update roles');
                printError('Role update failed', err);
                process.exit(1);
            }
        });
}

export function registerProposeTransferCommand(program: Command): void {
    program
        .command('propose-transfer')
        .description('Propose master authority transfer to a new key')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--new-authority <pubkey>', 'Public key of the proposed new authority')
        .option('--keypair <path>', 'Path to current authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Proposing authority transfer...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.proposeAuthorityTransfer(
                    authority,
                    new PublicKey(opts.newAuthority),
                );

                spinner.stop();
                printSuccess(`Authority transfer proposed to ${opts.newAuthority}`, txSig);
            } catch (err) {
                spinner.fail('Failed to propose transfer');
                printError('Propose authority transfer failed', err);
                process.exit(1);
            }
        });
}

export function registerAcceptTransferCommand(program: Command): void {
    program
        .command('accept-transfer')
        .description('Accept a pending master authority transfer')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to pending authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Accepting authority transfer...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const pendingAuthority = loadKeypair(opts.keypair);
                const txSig = await sdk.acceptAuthorityTransfer(pendingAuthority);

                spinner.stop();
                printSuccess('Authority transfer accepted — you are now the master authority', txSig);
            } catch (err) {
                spinner.fail('Failed to accept transfer');
                printError('Accept authority transfer failed', err);
                process.exit(1);
            }
        });
}
