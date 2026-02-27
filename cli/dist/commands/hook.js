"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHookCommands = registerHookCommands;
const web3_js_1 = require("@solana/web3.js");
const sss_token_1 = require("@stbr/sss-token");
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("../utils");
function registerHookCommands(program) {
    const hook = program
        .command('hook')
        .description('SSS-2 transfer hook management');
    // ── init ───────────────────────────────────────────────────────────
    hook
        .command('init')
        .description('Initialize the transfer hook for this mint')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--enabled', 'Start with the hook enabled (default: true)', true)
        .option('--keypair <path>', 'Path to authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Initializing transfer hook...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig1 = await sdk.transferHook.initializeHook(authority, authority, opts.enabled);
            spinner.text = 'Registering extra account metas...';
            const txSig2 = await sdk.transferHook.initializeExtraAccountMetaList(authority, authority);
            spinner.stop();
            (0, utils_1.printSuccess)('Transfer hook initialized', txSig1);
            (0, utils_1.printSuccess)('Extra account metas registered', txSig2);
        }
        catch (err) {
            spinner.fail('Hook initialization failed');
            (0, utils_1.printError)('Failed to initialize transfer hook', err);
            process.exit(1);
        }
    });
    // ── enable ─────────────────────────────────────────────────────────
    hook
        .command('enable')
        .description('Enable the transfer hook (enforce blacklist on transfers)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Enabling transfer hook...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.transferHook.enableHook(authority);
            spinner.stop();
            (0, utils_1.printSuccess)('Transfer hook enabled', txSig);
        }
        catch (err) {
            spinner.fail('Enable failed');
            (0, utils_1.printError)('Failed to enable transfer hook', err);
            process.exit(1);
        }
    });
    // ── disable ────────────────────────────────────────────────────────
    hook
        .command('disable')
        .description('Disable the transfer hook (transfers bypass blacklist)')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .option('--keypair <path>', 'Path to authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Disabling transfer hook...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.transferHook.disableHook(authority);
            spinner.stop();
            (0, utils_1.printSuccess)('Transfer hook disabled', txSig);
        }
        catch (err) {
            spinner.fail('Disable failed');
            (0, utils_1.printError)('Failed to disable transfer hook', err);
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
        const spinner = (0, ora_1.default)('Fetching hook config...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const config = await sdk.transferHook.getHookConfig();
            spinner.stop();
            (0, utils_1.printHeader)('Transfer Hook Config');
            (0, utils_1.printField)('Mint', config.mint.toBase58());
            (0, utils_1.printField)('Authority', config.authority.toBase58());
            (0, utils_1.printField)('Enabled', config.enabled);
            (0, utils_1.printField)('Transfers', config.transferCount);
            (0, utils_1.printField)('Blocked', config.blockedCount);
            console.log();
        }
        catch (err) {
            spinner.fail('Failed to fetch hook config');
            (0, utils_1.printError)('Could not load hook configuration', err);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=hook.js.map