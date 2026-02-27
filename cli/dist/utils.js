"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadKeypair = loadKeypair;
exports.getDefaultKeypairPath = getDefaultKeypairPath;
exports.formatTxSig = formatTxSig;
exports.formatPubkey = formatPubkey;
exports.printField = printField;
exports.printHeader = printHeader;
exports.printSuccess = printSuccess;
exports.printError = printError;
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Load a Keypair from a JSON file path.
 *
 * Supports:
 *   - Absolute paths
 *   - Relative paths (resolved from cwd)
 *   - `~/.config/solana/id.json` shorthand via `--keypair` flag
 *
 * @param keypairPath - Path to a Solana keypair JSON file.
 * @returns A loaded `Keypair` instance.
 */
function loadKeypair(keypairPath) {
    const resolved = keypairPath.startsWith('~')
        ? path.join(os.homedir(), keypairPath.slice(1))
        : path.resolve(keypairPath);
    if (!fs.existsSync(resolved)) {
        console.error(chalk_1.default.red(`✗ Keypair file not found: ${resolved}`));
        process.exit(1);
    }
    try {
        const raw = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
        return web3_js_1.Keypair.fromSecretKey(Uint8Array.from(raw));
    }
    catch (err) {
        console.error(chalk_1.default.red(`✗ Failed to parse keypair file: ${resolved}`));
        process.exit(1);
    }
}
/**
 * Returns the default Solana keypair path (~/.config/solana/id.json).
 */
function getDefaultKeypairPath() {
    return path.join(os.homedir(), '.config', 'solana', 'id.json');
}
/**
 * Format a transaction signature for display.
 */
function formatTxSig(sig) {
    return chalk_1.default.cyan(sig.slice(0, 8) + '...' + sig.slice(-6));
}
/**
 * Format a public key for display (shortened).
 */
function formatPubkey(pubkey) {
    if (pubkey.length <= 16)
        return chalk_1.default.yellow(pubkey);
    return chalk_1.default.yellow(pubkey.slice(0, 6) + '...' + pubkey.slice(-4));
}
/**
 * Print a labelled key-value line.
 */
function printField(label, value) {
    const formattedLabel = chalk_1.default.gray(label.padEnd(20));
    const formattedValue = typeof value === 'boolean'
        ? (value ? chalk_1.default.green('Yes') : chalk_1.default.red('No'))
        : chalk_1.default.white(String(value));
    console.log(`  ${formattedLabel} ${formattedValue}`);
}
/**
 * Print a section header.
 */
function printHeader(title) {
    console.log();
    console.log(chalk_1.default.bold.white(`── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`));
    console.log();
}
/**
 * Print a success message with a transaction signature.
 */
function printSuccess(message, txSig) {
    console.log();
    console.log(chalk_1.default.green(`  ✓ ${message}`));
    if (txSig) {
        console.log(chalk_1.default.gray(`    tx: `) + chalk_1.default.cyan(txSig));
    }
    console.log();
}
/**
 * Print an error message and exit.
 */
function printError(message, err) {
    console.log();
    console.error(chalk_1.default.red(`  ✗ ${message}`));
    if (err instanceof Error) {
        console.error(chalk_1.default.gray(`    ${err.message}`));
    }
    console.log();
}
//# sourceMappingURL=utils.js.map