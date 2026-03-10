/**
 * config-validator.ts
 *
 * Belongs in: cli/src/config-validator.ts
 *
 * Owns the canonical schema for a custom config file (TOML or JSON),
 * validates it exhaustively, and exports a typed result the CLI can
 * act on without any guesswork.
 *
 * Used by: cli/src/commands/token.ts → registerInitCommand (--custom flag)
 * Depends on: SDK types only (no SDK runtime imports needed here)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { StablecoinPreset, SolanaNetwork } from '@stbr/sss-token';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Canonical schema — this is the contract the user must match
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The exact shape a valid custom config file must produce after parsing.
 * This mirrors CreateStablecoinConfig from the SDK but uses plain strings
 * for keypair paths (the CLI resolves them to Keypair objects separately).
 */
export interface CustomTokenConfig {
    /** Human-readable token name. e.g. "ACME USD" */
    name: string;
    /** Token ticker symbol. e.g. "AUSD" */
    symbol: string;
    /** Off-chain metadata URI. e.g. "https://example.com/meta.json" */
    uri: string;
    /** Number of decimal places. Typically 6 for stablecoins. */
    decimals: number;
    /**
     * Which standard to deploy with.
     * Accepted values: "sss1" | "sss2" | "sss3" | "custom"
     */
    preset: 'sss1' | 'sss2' | 'sss3' | 'custom';
    /**
     * Target Solana cluster.
     * Accepted values: "devnet" | "mainnet" | "testnet" | "localnet"
     */
    network: 'devnet' | 'mainnet' | 'testnet' | 'localnet';
    /** Authorities block — keypair paths or pubkeys depending on the role */
    authorities: {
        /**
         * Path to the authority keypair JSON file.
         * This becomes the master authority and pays for deployment.
         * e.g. "~/.config/solana/id.json"
         */
        keypair: string;
        /**
         * Public key of the account authorised to add/remove minters.
         * Optional — defaults to authority if omitted.
         */
        minterAuthority?: string;
        /**
         * Public key of the account authorised to burn tokens.
         * Optional — defaults to authority if omitted.
         */
        burner?: string;
        /**
         * Public key of the account authorised to pause/unpause.
         * Optional — defaults to authority if omitted.
         */
        pauser?: string;
        /**
         * Public key of the blacklister role.
         * Required when preset is "sss2" or "sss3".
         */
        blacklister?: string;
        /**
         * Public key of the seizer role.
         * Required when preset is "sss2" or "sss3".
         */
        seizer?: string;
    };
    /**
     * Per-extension overrides. Only meaningful when preset is "custom".
     * When preset is sss1/sss2/sss3 these are ignored — the preset
     * controls the extensions.
     */
    extensions?: {
        permanentDelegate?: boolean;
        transferHook?: boolean;
        defaultAccountFrozen?: boolean;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Validation result type
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationResult =
    | { ok: true; config: CustomTokenConfig }
    | { ok: false; errors: string[] };

// ─────────────────────────────────────────────────────────────────────────────
// 3. Validator — exhaustive, collect ALL errors before returning
// ─────────────────────────────────────────────────────────────────────────────

const VALID_PRESETS = ['sss1', 'sss2', 'sss3', 'custom'] as const;
const VALID_NETWORKS = ['devnet', 'mainnet', 'testnet', 'localnet'] as const;
const COMPLIANCE_PRESETS = ['sss2', 'sss3'];

export function validateCustomConfig(raw: unknown): ValidationResult {
    const errors: string[] = [];

    // Guard: raw must be a plain object
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { ok: false, errors: ['Config file must be a key-value object, not an array or primitive'] };
    }

    const r = raw as Record<string, unknown>;

    // ── Top-level required fields ───────────────────────────────────────────

    if (!r.name || typeof r.name !== 'string' || r.name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }

    if (!r.symbol || typeof r.symbol !== 'string' || r.symbol.trim() === '') {
        errors.push('symbol is required and must be a non-empty string');
    }

    if (!r.uri || typeof r.uri !== 'string') {
        errors.push('uri is required (e.g. "https://example.com/meta.json")');
    }

    if (r.decimals === undefined || r.decimals === null) {
        errors.push('decimals is required');
    } else if (typeof r.decimals !== 'number' || !Number.isInteger(r.decimals) || r.decimals < 0 || r.decimals > 18) {
        errors.push(`decimals must be an integer between 0 and 18 — got ${JSON.stringify(r.decimals)}`);
    }

    if (!r.preset) {
        errors.push(`preset is required — accepted values: ${VALID_PRESETS.join(', ')}`);
    } else if (!VALID_PRESETS.includes(r.preset as typeof VALID_PRESETS[number])) {
        errors.push(`preset must be one of: ${VALID_PRESETS.join(', ')} — got "${r.preset}"`);
    }

    if (!r.network) {
        errors.push(`network is required — accepted values: ${VALID_NETWORKS.join(', ')}`);
    } else if (!VALID_NETWORKS.includes(r.network as typeof VALID_NETWORKS[number])) {
        errors.push(`network must be one of: ${VALID_NETWORKS.join(', ')} — got "${r.network}"`);
    }

    // ── Authorities block ───────────────────────────────────────────────────

    if (!r.authorities || typeof r.authorities !== 'object' || Array.isArray(r.authorities)) {
        // Block is missing entirely — report it and all required sub-fields together
        errors.push('[authorities] block is required');
        errors.push('authorities.keypair is required (path to authority keypair JSON)');
        // No point drilling into sub-fields if the block doesn't exist
    } else {
        const a = r.authorities as Record<string, unknown>;

        if (!a.keypair || typeof a.keypair !== 'string' || a.keypair.trim() === '') {
            errors.push('authorities.keypair is required — path to your authority keypair JSON file');
        } else {
            // Resolve ~ and check the file actually exists
            const resolved = a.keypair.replace(/^~/, process.env.HOME ?? '~');
            if (!fs.existsSync(resolved)) {
                errors.push(`authorities.keypair file not found: "${a.keypair}" (resolved to "${resolved}")`);
            }
        }

        // Optional role fields — validate format only if provided
        const optionalPubkeyFields = ['minterAuthority', 'burner', 'pauser', 'blacklister', 'seizer'] as const;
        for (const field of optionalPubkeyFields) {
            if (a[field] !== undefined && (typeof a[field] !== 'string' || (a[field] as string).trim() === '')) {
                errors.push(`authorities.${field} must be a base58 public key string if provided`);
            }
        }

        // SSS-2 / SSS-3 compliance fields are REQUIRED when preset demands them
        if (COMPLIANCE_PRESETS.includes(r.preset as string)) {
            if (!a.blacklister) {
                errors.push(`authorities.blacklister is required when preset is "${r.preset}"`);
            }
            if (!a.seizer) {
                errors.push(`authorities.seizer is required when preset is "${r.preset}"`);
            }
        }
    }

    // ── Extensions block (optional, only warn for non-custom presets) ────────

    if (r.extensions !== undefined) {
        if (typeof r.extensions !== 'object' || Array.isArray(r.extensions)) {
            errors.push('[extensions] must be a key-value object if provided');
        } else {
            const ext = r.extensions as Record<string, unknown>;
            const boolFields = ['permanentDelegate', 'transferHook', 'defaultAccountFrozen'] as const;
            for (const field of boolFields) {
                if (ext[field] !== undefined && typeof ext[field] !== 'boolean') {
                    errors.push(`extensions.${field} must be true or false — got ${JSON.stringify(ext[field])}`);
                }
            }
            // Warn (not error) if extensions are set on a non-custom preset
            if (r.preset && r.preset !== 'custom' && VALID_PRESETS.includes(r.preset as typeof VALID_PRESETS[number])) {
                errors.push(
                    `[extensions] block is ignored when preset is "${r.preset}" — ` +
                    `extensions are fixed by the preset. Use preset = "custom" to override them.`
                );
            }
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return { ok: true, config: raw as CustomTokenConfig };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. File reader + parser + validator in one call
//    This is what the CLI calls — one function, typed result
// ─────────────────────────────────────────────────────────────────────────────

export function parseAndValidateConfigFile(filePath: string): ValidationResult {
    const resolved = path.resolve(filePath);

    // File existence check
    if (!fs.existsSync(resolved)) {
        return {
            ok: false,
            errors: [
                `Config file not found: "${filePath}"`,
                `Run: sss-token config --example > config.toml  to generate a template`,
            ],
        };
    }

    // Parse step
    let raw: unknown;
    try {
        const content = fs.readFileSync(resolved, 'utf-8');
        if (resolved.endsWith('.toml')) {
            raw = toml.parse(content);
        } else if (resolved.endsWith('.json')) {
            raw = JSON.parse(content);
        } else {
            return {
                ok: false,
                errors: [`Unsupported file format. Use a .toml or .json file — got "${path.extname(resolved)}"`],
            };
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            errors: [`Failed to parse "${filePath}": ${message}`],
        };
    }

    // Validate step
    return validateCustomConfig(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Example config generator
//    Used by: sss-token config --example
// ─────────────────────────────────────────────────────────────────────────────

export function generateExampleConfig(preset: 'sss1' | 'sss2' | 'sss3' | 'custom' = 'sss2'): string {
    const isCompliance = COMPLIANCE_PRESETS.includes(preset);
    const isCustom = preset === 'custom';

    return `# SSS Token Config — generated by sss-token config --example
# Fill in your values and run: sss-token init --custom config.toml
#
# Accepted preset values : sss1 | sss2 | sss3 | custom
# Accepted network values: devnet | mainnet | testnet | localnet

name    = "My Stablecoin"
symbol  = "MUSD"
uri     = "https://example.com/metadata.json"
decimals = 6
preset  = "${preset}"
network = "devnet"

[authorities]
# Path to your authority keypair JSON (the master key — pays for deployment)
keypair = "~/.config/solana/id.json"

# Optional: defaults to authority if omitted
# minterAuthority = "Base58PublicKey..."
# burner          = "Base58PublicKey..."
# pauser          = "Base58PublicKey..."
${isCompliance ? `
# Required for ${preset.toUpperCase()} — compliance roles
blacklister = "Base58PublicKeyOfBlacklister..."
seizer      = "Base58PublicKeyOfSeizer..."
` : '# blacklister and seizer are only required for sss2 and sss3\n'}
${isCustom ? `
# Extensions — only used when preset = "custom"
# When using sss1/sss2/sss3 these are ignored (preset controls extensions)
[extensions]
permanentDelegate    = false
transferHook         = false
defaultAccountFrozen = false
` : ''}`;
}