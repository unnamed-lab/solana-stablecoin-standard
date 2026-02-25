"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaStablecoin = void 0;
const web3_js_1 = require("@solana/web3.js");
const types_1 = require("./types");
const compliance_1 = require("./modules/compliance");
class SolanaStablecoin {
    program;
    hookProgram;
    mintAddress;
    config;
    compliance; // SSS-2 only, throws if SSS-1
    preset;
    constructor(program, hookProgram, mint, config, preset) {
        this.program = program;
        this.hookProgram = hookProgram;
        this.mintAddress = mint;
        this.config = config;
        this.preset = preset;
        if (preset === types_1.StablecoinPreset.SSS_2) {
            this.compliance = new compliance_1.ComplianceModule(program, mint);
        }
        else {
            // Dummy or proxy that throws
            this.compliance = new Proxy({}, {
                get() {
                    throw new Error("Compliance module is only available on SSS-2 instances");
                }
            });
        }
    }
    static async create(connection, config, program, hookProgram) {
        const resolvedConfig = SolanaStablecoin.resolvePreset(config);
        // ... deploy on-chain, return initialized instance
        // Note: implementation depends on how anchor program is called to initialize.
        // For now, we stub the actual transaction and return a dummy instance.
        return new SolanaStablecoin(program, hookProgram, web3_js_1.Keypair.generate().publicKey, web3_js_1.Keypair.generate().publicKey, resolvedConfig.preset || types_1.StablecoinPreset.SSS_1);
    }
    static async load(connection, mint, authority, program, hookProgram) {
        // Fetch config PDA, reconstruct instance
        return new SolanaStablecoin(program, hookProgram, mint, web3_js_1.Keypair.generate().publicKey, types_1.StablecoinPreset.SSS_1);
    }
    async mint(params) {
        return "tx_signature";
    }
    async burn(params) {
        return "tx_signature";
    }
    async freeze(account) {
        return "tx_signature";
    }
    async thaw(account) {
        return "tx_signature";
    }
    async pause() {
        return "tx_signature";
    }
    async unpause() {
        return "tx_signature";
    }
    async getInfo() {
        return {
            mint: this.mintAddress,
            preset: this.preset,
            name: "Stub",
            symbol: "STUB",
            totalSupply: 0,
            paused: false
        };
    }
    async getTotalSupply() {
        return 0;
    }
    async isPaused() {
        return false;
    }
    async addMinter(minter, quota) {
        return "tx_signature";
    }
    async removeMinter(minter) {
        return "tx_signature";
    }
    static resolvePreset(config) {
        const presetDefaults = {
            [types_1.StablecoinPreset.SSS_1]: {
                permanentDelegate: false,
                transferHook: false,
                defaultAccountFrozen: false,
            },
            [types_1.StablecoinPreset.SSS_2]: {
                permanentDelegate: true,
                transferHook: true,
                defaultAccountFrozen: true,
            },
            [types_1.StablecoinPreset.CUSTOM]: {
                permanentDelegate: false,
                transferHook: false,
                defaultAccountFrozen: false,
            }
        };
        if (config.preset) {
            return { ...presetDefaults[config.preset], ...config };
        }
        return config;
    }
}
exports.SolanaStablecoin = SolanaStablecoin;
//# sourceMappingURL=SolanaStablecoin.js.map