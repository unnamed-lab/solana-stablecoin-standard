import { StablecoinPreset, SolanaNetwork } from './types';

export const VALID_PRESETS = [
    StablecoinPreset.SSS_1,   // 'sss1'
    StablecoinPreset.SSS_2,   // 'sss2'
    StablecoinPreset.SSS_3,   // 'sss3'
    StablecoinPreset.CUSTOM,  // 'custom'
] as const;

export const VALID_NETWORKS = [
    SolanaNetwork.DEVNET,     // 'devnet'
    SolanaNetwork.MAINNET,    // 'mainnet'
    SolanaNetwork.TESTNET,    // 'testnet'
    SolanaNetwork.LOCALNET,   // 'localnet'
] as const;

/** Presets that require compliance roles (blacklister + seizer) */
export const COMPLIANCE_PRESETS: string[] = [
    StablecoinPreset.SSS_2,
    StablecoinPreset.SSS_3,
];

export type ValidPreset  = typeof VALID_PRESETS[number];
export type ValidNetwork = typeof VALID_NETWORKS[number];

export interface CustomTokenConfig {
    name: string;
    symbol: string;
    uri: string;
    decimals: number;
    preset: ValidPreset;
    network: ValidNetwork;
    authorities: {
        keypair: string;
        minterAuthority?: string;
        burner?: string;
        pauser?: string;
        blacklister?: string;
        seizer?: string;
    };

    extensions?: {
        permanentDelegate?: boolean;
        transferHook?: boolean;
        defaultAccountFrozen?: boolean;
    };
}


export type ConfigValidationResult =
    | { ok: true;  config: CustomTokenConfig }
    | { ok: false; errors: string[] };

export function validateCustomConfig(raw: unknown): ConfigValidationResult {
    const errors: string[] = [];

    // Guard: must be a plain object
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return {
            ok: false,
            errors: ['Config must be a key-value object, not an array or primitive value'],
        };
    }

    const r = raw as Record<string, unknown>;
    if (!r.name || typeof r.name !== 'string' || r.name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }
    if (!r.symbol || typeof r.symbol !== 'string' || r.symbol.trim() === '') {
        errors.push('symbol is required and must be a non-empty string');
    }
    if (!r.uri || typeof r.uri !== 'string' || r.uri.trim() === '') {
        errors.push('uri is required (e.g. "https://example.com/metadata.json")');
    }
    if (r.decimals === undefined || r.decimals === null) {
        errors.push('decimals is required');
    } else if (
        typeof r.decimals !== 'number' ||
        !Number.isInteger(r.decimals) ||
        r.decimals < 0 ||
        r.decimals > 18
    ) {
        errors.push(
            `decimals must be a whole number between 0 and 18 — got ${JSON.stringify(r.decimals)}`
        );
    }
    if (!r.preset) {
        errors.push(
            `preset is required — accepted values: ${VALID_PRESETS.join(', ')}`
        );
    } else if (!VALID_PRESETS.includes(r.preset as ValidPreset)) {
        errors.push(
            `preset must be one of: ${VALID_PRESETS.join(', ')} — got "${r.preset}"`
        );
    }
    if (!r.network) {
        errors.push(
            `network is required — accepted values: ${VALID_NETWORKS.join(', ')}`
        );
    } else if (!VALID_NETWORKS.includes(r.network as ValidNetwork)) {
        errors.push(
            `network must be one of: ${VALID_NETWORKS.join(', ')} — got "${r.network}"`
        );
    }
    if (!r.authorities || typeof r.authorities !== 'object' || Array.isArray(r.authorities)) {
        errors.push('[authorities] block is required');
        errors.push('authorities.keypair is required — path to your authority keypair JSON file');
    } else {
        const a = r.authorities as Record<string, unknown>;
        if (!a.keypair || typeof a.keypair !== 'string' || a.keypair.trim() === '') {
            errors.push(
                'authorities.keypair is required — path to your authority keypair JSON file ' +
                '(e.g. "~/.config/solana/id.json")'
            );
        }
        const optionalRoles = [
            'minterAuthority',
            'burner',
            'pauser',
            'blacklister',
            'seizer',
        ] as const;

        for (const field of optionalRoles) {
            if (a[field] !== undefined) {
                if (typeof a[field] !== 'string' || (a[field] as string).trim() === '') {
                    errors.push(
                        `authorities.${field} must be a base58 public key string if provided`
                    );
                }
            }
        }
        if (COMPLIANCE_PRESETS.includes(r.preset as string)) {
            if (!a.blacklister) {
                errors.push(
                    `authorities.blacklister is required when preset is "${r.preset}"`
                );
            }
            if (!a.seizer) {
                errors.push(
                    `authorities.seizer is required when preset is "${r.preset}"`
                );
            }
        }
    }
    if (r.extensions !== undefined) {
        if (typeof r.extensions !== 'object' || Array.isArray(r.extensions)) {
            errors.push('[extensions] must be a key-value object if provided');
        } else {
            const ext = r.extensions as Record<string, unknown>;
            const boolFields = [
                'permanentDelegate',
                'transferHook',
                'defaultAccountFrozen',
            ] as const;

            for (const field of boolFields) {
                if (ext[field] !== undefined && typeof ext[field] !== 'boolean') {
                    errors.push(
                        `extensions.${field} must be true or false — got ${JSON.stringify(ext[field])}`
                    );
                }
            }
            const preset = r.preset as string;
            if (preset && preset !== StablecoinPreset.CUSTOM && VALID_PRESETS.includes(preset as ValidPreset)) {
                errors.push(
                    `[extensions] block is ignored when preset is "${preset}" — ` +
                    `the preset controls all extensions. ` +
                    `Change preset to "custom" if you need to override them.`
                );
            }
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return { ok: true, config: raw as CustomTokenConfig };
}


export function generateExampleConfig(preset: ValidPreset = StablecoinPreset.SSS_2): string {
    const isCompliance = COMPLIANCE_PRESETS.includes(preset);
    const isCustom     = preset === StablecoinPreset.CUSTOM;

    const complianceBlock = isCompliance
        ? `
# Required for ${preset.toUpperCase()} — compliance authority roles
blacklister = "Base58PublicKeyOfBlacklister"
seizer      = "Base58PublicKeyOfSeizer"`
        : `
# blacklister and seizer are only required for sss2 and sss3
# blacklister = "Base58PublicKeyOfBlacklister"
# seizer      = "Base58PublicKeyOfSeizer"`;

    const extensionsBlock = isCustom
        ? `
# Extensions — only applied when preset = "custom"
# When using sss1 / sss2 / sss3 this block is ignored
[extensions]
permanentDelegate    = false
transferHook         = false
defaultAccountFrozen = false`
        : `
# [extensions] is only used when preset = "custom"
# Remove or comment this block when using a fixed preset`;

    return `# SSS Token Config — generated by sss-token config example --preset ${preset}
# Edit the values below, then run:
#   sss-token init --custom config.toml
#
# Accepted preset values : ${VALID_PRESETS.join(' | ')}
# Accepted network values: ${VALID_NETWORKS.join(' | ')}

name     = "My Stablecoin"
symbol   = "MUSD"
uri      = "https://example.com/metadata.json"
decimals = 6
preset   = "${preset}"
network  = "devnet"

[authorities]
# Path to your authority keypair JSON (master key — pays for deployment)
keypair = "~/.config/solana/id.json"

# Optional roles — default to authority if omitted
# minterAuthority = "Base58PublicKey"
# burner          = "Base58PublicKey"
# pauser          = "Base58PublicKey"
${complianceBlock}
${extensionsBlock}
`;
}