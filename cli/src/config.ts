import path from "path";
import os from "os";
import fs from "fs";

const CONFIG_DIR = path.join(os.homedir(), ".sss");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface TokenEntry {
    name: string;
    symbol: string;
    preset: string;
    network: string;
    createdAt: string;
    keypairPath: string;
    mintAddress: string;
    decimals: number;
}

interface SSSConfig {
    activeToken: string;
    tokens: Record<string, TokenEntry>;
}

export function loadConfig(): SSSConfig {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            activeToken: "",
            tokens: {}
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

export function saveToken(mintAddress: string, metadata: TokenEntry) {
    const config = loadConfig();
    config.tokens[mintAddress] = metadata;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getActiveToken(): TokenEntry {
    const config = loadConfig();
    if (!config.activeToken) {
        throw new Error("No active token set...");
    }
    const token = config.tokens[config.activeToken];
    if (!token) {
        throw new Error(`Active token ${config.activeToken} not found in config`);
    }
    return token;
}

export function setActiveToken(mintAddress: string) {
    const config = loadConfig();
    config.activeToken = mintAddress;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Remove a single token entry from the local config by mint address.
 *
 * If the deleted token was the active token, the active token is
 * automatically reassigned to the next available token, or cleared
 * if no tokens remain.
 *
 * NOTE: This only removes the local reference. The token still
 * exists on-chain and is not affected in any way.
 *
 * @returns The deleted TokenEntry, or null if the mint was not found.
 */
export function deleteToken(mintAddress: string): TokenEntry | null {
    const config = loadConfig();

    const entry = config.tokens[mintAddress];
    if (!entry) return null;

    delete config.tokens[mintAddress];

    // If we just deleted the active token, reassign or clear
    if (config.activeToken === mintAddress) {
        const remaining = Object.keys(config.tokens);
        config.activeToken = remaining.length > 0 ? remaining[0] : "";
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return entry;
}

/**
 * Remove all token entries from the local config and clear the active token.
 *
 * NOTE: This only clears local references. All tokens still
 * exist on-chain and are not affected in any way.
 *
 * @returns The number of tokens that were deleted.
 */
export function deleteAllTokens(): number {
    const config = loadConfig();

    const count = Object.keys(config.tokens).length;

    config.tokens = {};
    config.activeToken = "";

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return count;
}

/**
 * Resolve the mint address: use explicit --mint flag if provided,
 * otherwise fall back to the active token from ~/.sss/config.json.
 */
export function resolveMint(optsMint?: string): string {
    if (optsMint) return optsMint;
    try {
        const token = getActiveToken();
        return token.mintAddress;
    } catch {
        throw new Error(
            'No --mint flag provided and no active token set.\n' +
            '  Either pass --mint <pubkey> or run:\n' +
            '    sss-token init ...     (auto-sets active token)\n' +
            '    sss-token use <mint>   (sets an existing token as active)'
        );
    }
}