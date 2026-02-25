"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaNetwork = exports.StablecoinPreset = void 0;
/**
 * Predefined stablecoin configuration presets.
 *
 * - **SSS_1** — Lightweight preset: basic mint/burn/pause, no compliance features.
 * - **SSS_2** — Full-featured preset: adds permanent delegate, transfer hook,
 *   default-frozen accounts, blacklisting, and asset seizure.
 * - **CUSTOM** — Start with SSS-1 defaults but allow per-extension overrides.
 */
var StablecoinPreset;
(function (StablecoinPreset) {
    StablecoinPreset["SSS_1"] = "sss1";
    StablecoinPreset["SSS_2"] = "sss2";
    StablecoinPreset["CUSTOM"] = "custom";
})(StablecoinPreset || (exports.StablecoinPreset = StablecoinPreset = {}));
/**
 * Supported Solana network clusters.
 *
 * Used to select the RPC endpoint for all SDK operations.
 */
var SolanaNetwork;
(function (SolanaNetwork) {
    SolanaNetwork["DEVNET"] = "devnet";
    SolanaNetwork["MAINNET"] = "mainnet";
    SolanaNetwork["TESTNET"] = "testnet";
    SolanaNetwork["LOCALNET"] = "localnet";
})(SolanaNetwork || (exports.SolanaNetwork = SolanaNetwork = {}));
//# sourceMappingURL=types.js.map