"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerComplianceCommands = registerComplianceCommands;
const web3_js_1 = require("@solana/web3.js");
const sss_token_1 = require("@stbr/sss-token");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils");
function registerComplianceCommands(program) {
    const compliance = program
        .command('compliance')
        .description('SSS-2 compliance operations (blacklist & seizure)');
    // ── blacklist-add ──────────────────────────────────────────────────
    compliance
        .command('blacklist-add')
        .description('Add a wallet to the on-chain blacklist')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--address <pubkey>', 'Wallet address to blacklist')
        .requiredOption('--reason <reason>', 'Reason for blacklisting')
        .option('--keypair <path>', 'Path to blacklister keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Adding to blacklist...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.compliance.blacklistAdd(authority, {
                address: new web3_js_1.PublicKey(opts.address),
                reason: opts.reason,
            });
            spinner.stop();
            (0, utils_1.printSuccess)(`Blacklisted: ${opts.address}`, txSig);
        }
        catch (err) {
            spinner.fail('Blacklist add failed');
            (0, utils_1.printError)('Failed to add to blacklist', err);
            process.exit(1);
        }
    });
    // ── blacklist-remove ───────────────────────────────────────────────
    compliance
        .command('blacklist-remove')
        .description('Remove a wallet from the on-chain blacklist')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--address <pubkey>', 'Wallet address to un-blacklist')
        .option('--keypair <path>', 'Path to blacklister keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Removing from blacklist...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.compliance.blacklistRemove(authority, new web3_js_1.PublicKey(opts.address));
            spinner.stop();
            (0, utils_1.printSuccess)(`Removed from blacklist: ${opts.address}`, txSig);
        }
        catch (err) {
            spinner.fail('Blacklist remove failed');
            (0, utils_1.printError)('Failed to remove from blacklist', err);
            process.exit(1);
        }
    });
    // ── check ──────────────────────────────────────────────────────────
    compliance
        .command('check')
        .description('Check if a wallet is blacklisted')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--address <pubkey>', 'Wallet address to check')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Checking blacklist status...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const isBlacklisted = await sdk.compliance.isBlacklisted(new web3_js_1.PublicKey(opts.address));
            spinner.stop();
            (0, utils_1.printHeader)('Blacklist Check');
            (0, utils_1.printField)('Address', opts.address);
            (0, utils_1.printField)('Blacklisted', isBlacklisted);
            console.log();
        }
        catch (err) {
            spinner.fail('Check failed');
            (0, utils_1.printError)('Failed to check blacklist status', err);
            process.exit(1);
        }
    });
    // ── list ───────────────────────────────────────────────────────────
    compliance
        .command('list')
        .description('List all active blacklist entries')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Fetching blacklist...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const entries = await sdk.compliance.getBlacklist();
            spinner.stop();
            (0, utils_1.printHeader)('Blacklist Entries');
            if (entries.length === 0) {
                console.log(chalk_1.default.gray('  No active blacklist entries.'));
            }
            else {
                for (const entry of entries) {
                    console.log(chalk_1.default.yellow(`  • ${entry.address.toBase58()}`));
                    console.log(chalk_1.default.gray(`    Reason: ${entry.reason}`));
                    console.log();
                }
                console.log(chalk_1.default.gray(`  Total: ${entries.length} entries`));
            }
            console.log();
        }
        catch (err) {
            spinner.fail('Failed to fetch blacklist');
            (0, utils_1.printError)('Could not retrieve blacklist', err);
            process.exit(1);
        }
    });
    // ── seize ──────────────────────────────────────────────────────────
    compliance
        .command('seize')
        .description('Seize tokens from a frozen account (SSS-2, permanent delegate)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--from <pubkey>', 'Source token account (must be frozen)')
        .requiredOption('--to <pubkey>', 'Destination token account')
        .requiredOption('--amount <number>', 'Amount to seize (base units)')
        .requiredOption('--reason <reason>', 'Reason for seizure')
        .option('--keypair <path>', 'Path to seizer keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Seizing tokens...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.compliance.seize(authority, new web3_js_1.PublicKey(opts.from), new web3_js_1.PublicKey(opts.to), parseInt(opts.amount), opts.reason);
            spinner.stop();
            (0, utils_1.printSuccess)(`Seized ${opts.amount} tokens`, txSig);
        }
        catch (err) {
            spinner.fail('Seizure failed');
            (0, utils_1.printError)('Failed to seize tokens', err);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=compliance.js.map