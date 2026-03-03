"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPauseCommand = registerPauseCommand;
exports.registerUnpauseCommand = registerUnpauseCommand;
exports.registerAddMinterCommand = registerAddMinterCommand;
exports.registerRemoveMinterCommand = registerRemoveMinterCommand;
exports.registerUpdateRolesCommand = registerUpdateRolesCommand;
exports.registerProposeTransferCommand = registerProposeTransferCommand;
exports.registerAcceptTransferCommand = registerAcceptTransferCommand;
const web3_js_1 = require("@solana/web3.js");
const sss_token_1 = require("@stbr/sss-token");
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("../utils");
const config_1 = require("../config");
function registerPauseCommand(program) {
    program
        .command('pause')
        .description('Pause the stablecoin (blocks minting & burning)')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to pauser keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Pausing stablecoin...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const pauser = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.pause(pauser);
            spinner.stop();
            (0, utils_1.printSuccess)('Stablecoin paused', txSig);
        }
        catch (err) {
            spinner.fail('Pause failed');
            (0, utils_1.printError)('Failed to pause stablecoin', err);
            process.exit(1);
        }
    });
}
function registerUnpauseCommand(program) {
    program
        .command('unpause')
        .description('Unpause the stablecoin (resumes operations)')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to pauser keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Unpausing stablecoin...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const pauser = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.unpause(pauser);
            spinner.stop();
            (0, utils_1.printSuccess)('Stablecoin unpaused', txSig);
        }
        catch (err) {
            spinner.fail('Unpause failed');
            (0, utils_1.printError)('Failed to unpause stablecoin', err);
            process.exit(1);
        }
    });
}
function registerAddMinterCommand(program) {
    program
        .command('add-minter')
        .description('Authorise a new minter with an optional quota')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--minter <pubkey>', 'Public key of the new minter')
        .option('--quota <number>', 'Max tokens this minter can mint per period')
        .option('--keypair <path>', 'Path to minter-authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Adding minter...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const quota = opts.quota ? { amount: parseInt(opts.quota) } : undefined;
            const txSig = await sdk.addMinter(authority, new web3_js_1.PublicKey(opts.minter), quota);
            spinner.stop();
            (0, utils_1.printSuccess)(`Minter added: ${opts.minter}`, txSig);
        }
        catch (err) {
            spinner.fail('Failed to add minter');
            (0, utils_1.printError)('Add minter failed', err);
            process.exit(1);
        }
    });
}
function registerRemoveMinterCommand(program) {
    program
        .command('remove-minter')
        .description('Revoke minting rights from a minter')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--minter <pubkey>', 'Public key of the minter to remove')
        .option('--keypair <path>', 'Path to minter-authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Removing minter...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.removeMinter(authority, new web3_js_1.PublicKey(opts.minter));
            spinner.stop();
            (0, utils_1.printSuccess)(`Minter removed: ${opts.minter}`, txSig);
        }
        catch (err) {
            spinner.fail('Failed to remove minter');
            (0, utils_1.printError)('Remove minter failed', err);
            process.exit(1);
        }
    });
}
function registerUpdateRolesCommand(program) {
    program
        .command('update-roles')
        .description('Update role assignments on the stablecoin')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--new-pauser <pubkey>', 'New pauser public key')
        .option('--new-minter-authority <pubkey>', 'New minter authority public key')
        .option('--new-burner <pubkey>', 'New burner public key')
        .option('--new-blacklister <pubkey>', 'New blacklister public key (SSS-2)')
        .option('--new-seizer <pubkey>', 'New seizer public key (SSS-2)')
        .option('--keypair <path>', 'Path to master authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Updating roles...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.updateRoles(authority, {
                newPauser: opts.newPauser ? new web3_js_1.PublicKey(opts.newPauser) : undefined,
                newMinterAuthority: opts.newMinterAuthority ? new web3_js_1.PublicKey(opts.newMinterAuthority) : undefined,
                newBurner: opts.newBurner ? new web3_js_1.PublicKey(opts.newBurner) : undefined,
                newBlacklister: opts.newBlacklister ? new web3_js_1.PublicKey(opts.newBlacklister) : undefined,
                newSeizer: opts.newSeizer ? new web3_js_1.PublicKey(opts.newSeizer) : undefined,
            });
            spinner.stop();
            (0, utils_1.printSuccess)('Roles updated', txSig);
        }
        catch (err) {
            spinner.fail('Failed to update roles');
            (0, utils_1.printError)('Role update failed', err);
            process.exit(1);
        }
    });
}
function registerProposeTransferCommand(program) {
    program
        .command('propose-transfer')
        .description('Propose master authority transfer to a new key')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .requiredOption('--new-authority <pubkey>', 'Public key of the proposed new authority')
        .option('--keypair <path>', 'Path to current authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Proposing authority transfer...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.proposeAuthorityTransfer(authority, new web3_js_1.PublicKey(opts.newAuthority));
            spinner.stop();
            (0, utils_1.printSuccess)(`Authority transfer proposed to ${opts.newAuthority}`, txSig);
        }
        catch (err) {
            spinner.fail('Failed to propose transfer');
            (0, utils_1.printError)('Propose authority transfer failed', err);
            process.exit(1);
        }
    });
}
function registerAcceptTransferCommand(program) {
    program
        .command('accept-transfer')
        .description('Accept a pending master authority transfer')
        .option('--mint <pubkey>', 'Stablecoin mint address (defaults to active token)')
        .option('--keypair <path>', 'Path to pending authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Accepting authority transfer...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey((0, config_1.resolveMint)(opts.mint));
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const pendingAuthority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.acceptAuthorityTransfer(pendingAuthority);
            spinner.stop();
            (0, utils_1.printSuccess)('Authority transfer accepted — you are now the master authority', txSig);
        }
        catch (err) {
            spinner.fail('Failed to accept transfer');
            (0, utils_1.printError)('Accept authority transfer failed', err);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=admin.js.map