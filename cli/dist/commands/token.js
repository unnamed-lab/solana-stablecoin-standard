"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCreateCommand = registerCreateCommand;
exports.registerInfoCommand = registerInfoCommand;
const web3_js_1 = require("@solana/web3.js");
const sss_token_1 = require("@stbr/sss-token");
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("../utils");
function registerCreateCommand(program) {
    program
        .command('create')
        .description('Deploy a new stablecoin to the blockchain')
        .requiredOption('--name <name>', 'Token name (e.g. "ACME USD")')
        .requiredOption('--symbol <symbol>', 'Token symbol (e.g. "AUSD")')
        .requiredOption('--uri <uri>', 'Metadata URI (e.g. "https://example.com/meta.json")')
        .option('--decimals <number>', 'Number of decimal places', '6')
        .option('--preset <preset>', 'Preset: sss1, sss2, or custom', 'sss1')
        .option('--keypair <path>', 'Path to authority keypair JSON', (0, utils_1.getDefaultKeypairPath)())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .option('--blacklister <pubkey>', 'Blacklister public key (SSS-2 only)')
        .option('--seizer <pubkey>', 'Seizer public key (SSS-2 only)')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Deploying stablecoin...').start();
        try {
            const authority = (0, utils_1.loadKeypair)(opts.keypair);
            const network = opts.network;
            const presetMap = {
                sss1: sss_token_1.StablecoinPreset.SSS_1,
                sss2: sss_token_1.StablecoinPreset.SSS_2,
                custom: sss_token_1.StablecoinPreset.CUSTOM,
            };
            const preset = presetMap[opts.preset];
            if (!preset) {
                spinner.fail('Invalid preset. Use: sss1, sss2, or custom');
                return;
            }
            const { txSig, mintAddress } = await sss_token_1.SolanaStablecoin.create({
                name: opts.name,
                symbol: opts.symbol,
                uri: opts.uri,
                decimals: parseInt(opts.decimals),
                preset,
                authority,
                blacklister: opts.blacklister ? new web3_js_1.PublicKey(opts.blacklister) : undefined,
                seizer: opts.seizer ? new web3_js_1.PublicKey(opts.seizer) : undefined,
            }, network);
            spinner.stop();
            (0, utils_1.printHeader)('Stablecoin Created');
            (0, utils_1.printField)('Mint Address', mintAddress.toBase58());
            (0, utils_1.printField)('Preset', opts.preset.toUpperCase());
            (0, utils_1.printField)('Name', opts.name);
            (0, utils_1.printField)('Symbol', opts.symbol);
            (0, utils_1.printField)('Decimals', opts.decimals);
            (0, utils_1.printField)('Network', network);
            (0, utils_1.printSuccess)('Stablecoin deployed successfully', txSig);
        }
        catch (err) {
            spinner.fail('Failed to create stablecoin');
            (0, utils_1.printError)('Deployment failed', err);
            process.exit(1);
        }
    });
}
function registerInfoCommand(program) {
    program
        .command('info')
        .description('Fetch on-chain info for an existing stablecoin')
        .requiredOption('--mint <pubkey>', 'Mint address of the stablecoin')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Fetching stablecoin info...').start();
        try {
            const mint = new web3_js_1.PublicKey(opts.mint);
            const network = opts.network;
            const sdk = await sss_token_1.SolanaStablecoin.load(network, mint);
            const info = await sdk.getInfo();
            spinner.stop();
            (0, utils_1.printHeader)('Stablecoin Info');
            (0, utils_1.printField)('Mint', info.mint.toBase58());
            (0, utils_1.printField)('Preset', info.preset.toUpperCase());
            (0, utils_1.printField)('Name', info.name);
            (0, utils_1.printField)('Symbol', info.symbol);
            (0, utils_1.printField)('Total Supply', info.totalSupply);
            (0, utils_1.printField)('Paused', info.paused);
            if (info.blacklistCount !== undefined) {
                (0, utils_1.printField)('Blacklist Count', info.blacklistCount);
            }
            console.log();
        }
        catch (err) {
            spinner.fail('Failed to fetch stablecoin info');
            (0, utils_1.printError)('Could not load stablecoin', err);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=token.js.map