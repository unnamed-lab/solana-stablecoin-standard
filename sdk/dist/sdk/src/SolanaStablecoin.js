"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaStablecoin = void 0;
const web3_js_1 = require("@solana/web3.js");
const core_1 = require("@anchor-lang/core");
const spl_token_1 = require("@solana/spl-token");
const types_1 = require("./types");
const compliance_1 = require("./modules/compliance");
const sss_core_json_1 = __importDefault(require("../../target/idl/sss_core.json"));
class SolanaStablecoin {
    program;
    hookProgram;
    mintAddress;
    config;
    compliance; // SSS-2 only, throws if SSS-1
    preset;
    connection;
    constructor(network = types_1.SolanaNetwork.DEVNET, program, hookProgram, mint, config, preset) {
        const networkRpc = {
            [types_1.SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
            [types_1.SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
            [types_1.SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
            [types_1.SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
        };
        // Set up a connection to the cluster
        const connection = new web3_js_1.Connection(networkRpc[network], "confirmed");
        this.connection = connection;
        // Create a Program instance using the IDL and connection
        this.program = new core_1.Program(sss_core_json_1.default, {
            connection,
        });
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
        const mint = web3_js_1.Keypair.generate();
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), mint.publicKey.toBuffer()], program.programId);
        let presetEnum = { sss1: {} };
        if (resolvedConfig.preset === types_1.StablecoinPreset.SSS_2) {
            presetEnum = { sss2: {} };
        }
        else if (resolvedConfig.preset === types_1.StablecoinPreset.CUSTOM) {
            presetEnum = { custom: {} };
        }
        const params = {
            name: resolvedConfig.name,
            symbol: resolvedConfig.symbol,
            uri: resolvedConfig.uri,
            decimals: resolvedConfig.decimals,
            preset: presetEnum,
            pauser: resolvedConfig.pauser || config.authority.publicKey,
            minterAuthority: resolvedConfig.minterAuthority || config.authority.publicKey,
            burner: resolvedConfig.burner || config.authority.publicKey,
            enablePermanentDelegate: resolvedConfig.permanentDelegate || false,
            enableTransferHook: resolvedConfig.transferHook || false,
            defaultAccountFrozen: resolvedConfig.defaultAccountFrozen || false,
            blacklister: resolvedConfig.blacklister || null,
            seizer: resolvedConfig.seizer || null,
            hookProgramId: hookProgram?.programId || null
        };
        return await program.methods
            .initialize(params)
            .accounts({
            payer: config.authority.publicKey,
            masterAuthority: config.authority.publicKey,
            mint: mint.publicKey,
            config: configPda,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY
        })
            .signers([config.authority, mint])
            .rpc();
    }
    static async load(network = types_1.SolanaNetwork.DEVNET, mint, program, hookProgram) {
        const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-config"), mint.toBuffer()], program.programId);
        const configData = await program.account.stablecoinConfig.fetch(configPda);
        let presetStr = types_1.StablecoinPreset.SSS_1;
        if (configData.preset.sss2)
            presetStr = types_1.StablecoinPreset.SSS_2;
        if (configData.preset.custom)
            presetStr = types_1.StablecoinPreset.CUSTOM;
        return new SolanaStablecoin(network, program, hookProgram, mint, configPda, presetStr);
    }
    async mint(params) {
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mintAddress.toBuffer(), params.minter.publicKey.toBuffer()], this.program.programId);
        return await this.program.methods
            .mint(new core_1.BN(params.amount))
            .accounts({
            minter: params.minter.publicKey,
            config: this.config,
            minterConfig,
            mint: this.mintAddress,
            destination: params.recipient,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([params.minter])
            .rpc();
    }
    async burn(params) {
        const source = params.source || (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, params.burner.publicKey, false, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await this.program.methods
            .burn(new core_1.BN(params.amount))
            .accounts({
            burner: params.burner.publicKey,
            config: this.config,
            source,
            mint: this.mintAddress,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([params.burner])
            .rpc();
    }
    async freeze(authority, account) {
        return await this.program.methods
            .freezeAccount()
            .accounts({
            authority: authority.publicKey,
            config: this.config,
            account,
            mint: this.mintAddress,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([authority])
            .rpc();
    }
    async thaw(authority, account) {
        return await this.program.methods
            .thawAccount()
            .accounts({
            authority: authority.publicKey,
            config: this.config,
            account,
            mint: this.mintAddress,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID
        })
            .signers([authority])
            .rpc();
    }
    async pause(pauser) {
        return await this.program.methods
            .pause()
            .accounts({
            pauser: pauser.publicKey,
            config: this.config,
            mint: this.mintAddress
        })
            .signers([pauser])
            .rpc();
    }
    async unpause(pauser) {
        return await this.program.methods
            .unpause()
            .accounts({
            pauser: pauser.publicKey,
            config: this.config,
            mint: this.mintAddress
        })
            .signers([pauser])
            .rpc();
    }
    async getInfo() {
        const configData = await this.program.account.stablecoinConfig.fetch(this.config);
        return {
            mint: this.mintAddress,
            preset: this.preset,
            name: configData.name,
            symbol: configData.symbol,
            totalSupply: configData.totalSupply.toNumber(),
            paused: configData.paused,
            blacklistCount: configData.blacklistCount
        };
    }
    async getTotalSupply() {
        const configData = await this.program.account.stablecoinConfig.fetch(this.config);
        return configData.totalSupply.toNumber();
    }
    async isPaused() {
        const configData = await this.program.account.stablecoinConfig.fetch(this.config);
        return configData.paused;
    }
    async addMinter(authority, minter, quota) {
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()], this.program.programId);
        return await this.program.methods
            .addMinter(minter, new core_1.BN(quota?.amount || 0), new core_1.BN(0) // Default period seconds
        )
            .accounts({
            minterAuthority: authority.publicKey,
            config: this.config,
            minterConfig,
            mint: this.mintAddress,
            systemProgram: web3_js_1.SystemProgram.programId
        })
            .signers([authority])
            .rpc();
    }
    async removeMinter(authority, minter) {
        const [minterConfig] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-minter"), this.mintAddress.toBuffer(), minter.toBuffer()], this.program.programId);
        return await this.program.methods
            .removeMinter(minter)
            .accounts({
            minterAuthority: authority.publicKey,
            config: this.config,
            minterConfig,
            mint: this.mintAddress
        })
            .signers([authority])
            .rpc();
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