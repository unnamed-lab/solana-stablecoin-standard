import { CreateStablecoinConfig, StablecoinPreset } from '../types';

/**
 * Factory for creating an SSS-3 stablecoin configuration.
 *
 * SSS-3 extends SSS-2 by introducing Token-2022 Confidential Transfers
 * and an inverse scoped Allowlist (default-deny).
 *
 * By default, this preset enables:
 * - Permanent Delegate (SSS-2)
 * - Transfer Hook (SSS-2)
 * - Default Account State (SSS-2)
 * - Confidential Transfers (SSS-3)
 * - Scoped Allowlists (SSS-3)
 *
 * @param config - Base configuration (name, symbol, etc.)
 * @returns A configuration object ready to be passed to `SolanaStablecoin.create`
 *
 * @example
 * ```ts
 * const config = defineSss3Config({
 *   name: "Confidential USD",
 *   symbol: "CUSD",
 *   uri: "https://example.com/cusd.json",
 *   decimals: 6,
 *   authority: myKeypair,
 *   // Roles automatically default to the authority if not specified
 * });
 *
 * const { txSig, mintAddress } = await SolanaStablecoin.create(config);
 * ```
 */
export function defineSss3Config(
    config: Omit<CreateStablecoinConfig, 'preset'>
): CreateStablecoinConfig {
    return {
        ...config,
        preset: StablecoinPreset.SSS_3,
        extensions: {
            ...config.extensions,
            permanentDelegate: config.extensions?.permanentDelegate ?? true,
            transferHook: config.extensions?.transferHook ?? true,
            defaultAccountFrozen: config.extensions?.defaultAccountFrozen ?? true,
        },
    };
}
