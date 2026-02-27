"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMintCommand = registerMintCommand;
exports.registerBurnCommand = registerBurnCommand;
exports.registerFreezeCommand = registerFreezeCommand;
exports.registerThawCommand = registerThawCommand;
const web3_js_1 = require("@solana/web3.js");
const sss_token_1 = require("@stbr/sss-token");
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("../utils");
function registerMintCommand(program) {
    program
        .command('mint')
        .description('Mint new tokens to a recipient')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--recipient <pubkey>', 'Recipient token account (ATA)')
        .requiredOption('--amount <number>', 'Amount to mint (base units)')
        .option('--minter <path>', 'Path to minter keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Minting tokens...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const minter = (0, utils_1.loadKeypair)(opts.minter);
            const txSig = await sdk.mint({
                recipient: new web3_js_1.PublicKey(opts.recipient),
                amount: parseInt(opts.amount),
                minter,
            });
            spinner.stop();
            (0, utils_1.printSuccess)(`Minted ${opts.amount} tokens`, txSig);
        }
        catch (err) {
            spinner.fail('Minting failed');
            (0, utils_1.printError)('Failed to mint tokens', err);
            process.exit(1);
        }
    });
}
function registerBurnCommand(program) {
    program
        .command('burn')
        .description('Burn tokens from a token account')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--amount <number>', 'Amount to burn (base units)')
        .option('--source <pubkey>', 'Source token account (defaults to burner ATA)')
        .option('--burner <path>', 'Path to burner keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Burning tokens...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const burner = (0, utils_1.loadKeypair)(opts.burner);
            const txSig = await sdk.burn({
                amount: parseInt(opts.amount),
                burner,
                source: opts.source ? new web3_js_1.PublicKey(opts.source) : undefined,
            });
            spinner.stop();
            (0, utils_1.printSuccess)(`Burned ${opts.amount} tokens`, txSig);
        }
        catch (err) {
            spinner.fail('Burning failed');
            (0, utils_1.printError)('Failed to burn tokens', err);
            process.exit(1);
        }
    });
}
function registerFreezeCommand(program) {
    program
        .command('freeze')
        .description('Freeze a token account')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--account <pubkey>', 'Token account to freeze')
        .option('--keypair <path>', 'Path to authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Freezing account...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.freeze(authority, new web3_js_1.PublicKey(opts.account));
            spinner.stop();
            (0, utils_1.printSuccess)('Account frozen', txSig);
        }
        catch (err) {
            spinner.fail('Freeze failed');
            (0, utils_1.printError)('Failed to freeze account', err);
            process.exit(1);
        }
    });
}
function registerThawCommand(program) {
    program
        .command('thaw')
        .description('Thaw (unfreeze) a token account')
        .requiredOption('--mint <pubkey>', 'Stablecoin mint address')
        .requiredOption('--account <pubkey>', 'Token account to thaw')
        .option('--keypair <path>', 'Path to authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Thawing account...').start();
        try {
            const mintPubkey = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mintPubkey);
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const txSig = await sdk.thaw(authority, new web3_js_1.PublicKey(opts.account));
            spinner.stop();
            (0, utils_1.printSuccess)('Account thawed', txSig);
        }
        catch (err) {
            spinner.fail('Thaw failed');
            (0, utils_1.printError)('Failed to thaw account', err);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=operations.js.map