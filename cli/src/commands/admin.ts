import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import ora from 'ora';
import chalk from 'chalk';
import { intro, outro, text, isCancel, cancel, multiselect } from '@clack/prompts';
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
        .option('--minter <pubkey>', 'Public key of the new minter')
        .option('--quota <number>', 'Max tokens this minter can mint per period')
        .option('--keypair <path>', 'Path to minter-authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            let minter = opts.minter;
            const isInteractive = !minter;

            if (isInteractive) {
                intro(chalk.blue('Add New Minter'));
                const res = await text({
                    message: 'Enter public key of the new minter:',
                    placeholder: 'Address',
                    validate: (v: string) => {
                        if (!v) return 'Minter address is required';
                        try { new PublicKey(v); } catch { return 'Invalid public key'; }
                    }
                });
                if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                minter = res as string;
            }

            const spinner = ora('Adding minter...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);
                const quota = opts.quota ? { amount: parseInt(opts.quota) } : undefined;

                const txSig = await sdk.addMinter(
                    authority,
                    new PublicKey(minter),
                    quota,
                );

                spinner.stop();
                if (isInteractive) outro(chalk.green('Minter added successfully!'));
                printSuccess(`Minter added: ${minter}`, txSig);
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
        .option('--minter <pubkey>', 'Public key of the minter to remove')
        .option('--keypair <path>', 'Path to minter-authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            let minter = opts.minter;
            const isInteractive = !minter;

            if (isInteractive) {
                intro(chalk.blue('Remove Minter'));
                const res = await text({
                    message: 'Enter public key of the minter to remove:',
                    placeholder: 'Address',
                    validate: (v: string) => {
                        if (!v) return 'Minter address is required';
                        try { new PublicKey(v); } catch { return 'Invalid public key'; }
                    }
                });
                if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                minter = res as string;
            }

            const spinner = ora('Removing minter...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.removeMinter(
                    authority,
                    new PublicKey(minter),
                );

                spinner.stop();
                if (isInteractive) outro(chalk.green('Minter removed successfully!'));
                printSuccess(`Minter removed: ${minter}`, txSig);
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
            let roles: any = {
                newPauser: opts.newPauser,
                newMinterAuthority: opts.newMinterAuthority,
                newBurner: opts.newBurner,
                newBlacklister: opts.newBlacklister,
                newSeizer: opts.newSeizer,
            };

            const hasAnyFlag = Object.values(roles).some(v => !!v);

            if (!hasAnyFlag) {
                intro(chalk.blue('Update Roles'));

                const selected = await multiselect({
                    message: 'Select roles to update:',
                    options: [
                        { value: 'newPauser', label: 'Pauser' },
                        { value: 'newMinterAuthority', label: 'Minter Authority' },
                        { value: 'newBurner', label: 'Burner' },
                        { value: 'newBlacklister', label: 'Blacklister (SSS-2)' },
                        { value: 'newSeizer', label: 'Seizer (SSS-2)' },
                    ]
                });

                if (isCancel(selected)) { cancel('Operation cancelled.'); process.exit(0); }

                for (const role of (selected as string[])) {
                    const res = await text({
                        message: `Enter new address for ${role}:`,
                        validate: (v: string) => {
                            if (!v) return 'Address is required';
                            try { new PublicKey(v); } catch { return 'Invalid public key'; }
                        }
                    });
                    if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                    roles[role] = res as string;
                }
            }

            const spinner = ora('Updating roles...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.updateRoles(authority, {
                    newPauser: roles.newPauser ? new PublicKey(roles.newPauser) : undefined,
                    newMinterAuthority: roles.newMinterAuthority ? new PublicKey(roles.newMinterAuthority) : undefined,
                    newBurner: roles.newBurner ? new PublicKey(roles.newBurner) : undefined,
                    newBlacklister: roles.newBlacklister ? new PublicKey(roles.newBlacklister) : undefined,
                    newSeizer: roles.newSeizer ? new PublicKey(roles.newSeizer) : undefined,
                });

                spinner.stop();
                if (!hasAnyFlag) outro(chalk.green('Roles updated successfully!'));
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
        .option('--new-authority <pubkey>', 'Public key of the proposed new authority')
        .option('--keypair <path>', 'Path to current authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            let newAuthority = opts.newAuthority;
            const isInteractive = !newAuthority;

            if (isInteractive) {
                intro(chalk.blue('Propose Authority Transfer'));
                const res = await text({
                    message: 'Enter public key of the proposed new authority:',
                    placeholder: 'Address',
                    validate: (v: string) => {
                        if (!v) return 'Address is required';
                        try { new PublicKey(v); } catch { return 'Invalid public key'; }
                    }
                });
                if (isCancel(res)) { cancel('Operation cancelled.'); process.exit(0); }
                newAuthority = res as string;
            }

            const spinner = ora('Proposing authority transfer...').start();

            try {
                const mintPubkey = new PublicKey(resolveMint(opts.mint));
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mintPubkey);

                const authority = loadKeypair(opts.keypair);

                const txSig = await sdk.proposeAuthorityTransfer(
                    authority,
                    new PublicKey(newAuthority),
                );

                spinner.stop();
                if (isInteractive) outro(chalk.green('Authority transfer proposed successfully!'));
                printSuccess(`Authority transfer proposed to ${newAuthority}`, txSig);
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
