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
exports.ComplianceModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const spl_token_1 = require("@solana/spl-token");
const types_1 = require("../types");
const sss_core_json_1 = __importDefault(require("../../../target/idl/sss_core.json"));
const NETWORK_RPC = {
    [types_1.SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [types_1.SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [types_1.SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [types_1.SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
};
/**
 * Sub-module for SSS-2 compliance operations: blacklisting and asset seizure.
 *
 * This module is automatically instantiated by {@link SolanaStablecoin} for
 * SSS-2 preset tokens. Accessing it on SSS-1 or CUSTOM tokens throws.
 *
 * All write operations build a fresh Anchor provider using the supplied
 * signer keypair, so each call is self-contained.
 *
 * @example
 * ```ts
 * // Blacklist a wallet
 * await sdk.compliance.blacklistAdd(authority, {
 *   address: suspiciousWallet,
 *   reason: "Suspicious activity",
 * });
 *
 * // Check blacklist status
 * const blocked = await sdk.compliance.isBlacklisted(suspiciousWallet);
 * ```
 */
class ComplianceModule {
    connection;
    programId;
    mint;
    config;
    constructor(connection, network, mint, config) {
        this.connection = connection;
        this.mint = mint;
        this.config = config;
        // Derive programId from IDL (it's embedded in the IDL address field)
        const readProgram = new anchor_1.Program(sss_core_json_1.default, { connection });
        this.programId = readProgram.programId;
    }
    // ✅ Build a program with a real provider for write operations
    buildProgram(signer) {
        const wallet = new nodewallet_1.default(signer);
        const provider = new anchor_1.AnchorProvider(this.connection, wallet, {
            commitment: "confirmed",
        });
        return new anchor_1.Program(sss_core_json_1.default, provider);
    }
    /**
     * Add a wallet address to the on-chain blacklist.
     *
     * The target's associated token account is automatically frozen as part
     * of the same transaction.
     *
     * @param authority - Keypair of the designated blacklister.
     * @param params    - Wallet address and reason for the blacklisting.
     * @returns Transaction signature.
     */
    async blacklistAdd(authority, params) {
        const program = this.buildProgram(authority);
        const [blacklistEntry] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-blacklist"), this.mint.toBuffer(), params.address.toBuffer()], this.programId);
        // Derive the target's token account for freezing
        const { getAssociatedTokenAddressSync } = await Promise.resolve().then(() => __importStar(require('@solana/spl-token')));
        const targetTokenAccount = getAssociatedTokenAddressSync(this.mint, params.address, false, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await program.methods
            .addToBlacklist(params.address, params.reason)
            .accounts({
            blacklister: authority.publicKey,
            config: this.config,
            blacklistEntry,
            mint: this.mint,
            targetTokenAccount,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([authority])
            .rpc();
    }
    /**
     * Remove a wallet address from the on-chain blacklist.
     *
     * The target's associated token account is automatically thawed.
     *
     * @param authority - Keypair of the designated blacklister.
     * @param address   - Wallet address to un-blacklist.
     * @returns Transaction signature.
     */
    async blacklistRemove(authority, address) {
        const program = this.buildProgram(authority);
        const [blacklistEntry] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-blacklist"), this.mint.toBuffer(), address.toBuffer()], this.programId);
        const { getAssociatedTokenAddressSync } = await Promise.resolve().then(() => __importStar(require('@solana/spl-token')));
        const targetTokenAccount = getAssociatedTokenAddressSync(this.mint, address, false, spl_token_1.TOKEN_2022_PROGRAM_ID);
        return await program.methods
            .removeFromBlacklist(address)
            .accounts({
            blacklister: authority.publicKey,
            config: this.config,
            blacklistEntry,
            mint: this.mint,
            targetTokenAccount,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
        })
            .signers([authority])
            .rpc();
    }
    /**
     * Seize (forcibly transfer) tokens from a **frozen** source account to
     * a destination account.
     *
     * Requires the permanent delegate extension (SSS-2). The source account
     * **must** be frozen before seizure.
     *
     * @param authority - Keypair of the designated seizer.
     * @param from      - Token account to seize from (must be frozen).
     * @param to        - Destination token account.
     * @param amount    - Number of tokens to seize (base units).
     * @param reason    - Human-readable reason (stored in on-chain event).
     * @returns Transaction signature.
     */
    async seize(authority, from, to, amount, reason) {
        const program = this.buildProgram(authority);
        return await program.methods
            .seize(new anchor_1.BN(amount), reason)
            .accounts({
            seizer: authority.publicKey,
            config: this.config,
            source: from,
            destination: to,
            mint: this.mint,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
        })
            .signers([authority])
            .rpc();
    }
    /**
     * Check whether a wallet address is currently blacklisted.
     *
     * @param address - Wallet public key to check.
     * @returns `true` if the address is actively blacklisted, `false` otherwise.
     */
    async isBlacklisted(address) {
        const readProgram = new anchor_1.Program(sss_core_json_1.default, { connection: this.connection });
        const [blacklistEntry] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-blacklist"), this.mint.toBuffer(), address.toBuffer()], this.programId);
        try {
            const entry = await readProgram.account.blacklistEntry.fetch(blacklistEntry);
            return !entry.removed;
        }
        catch {
            return false; // PDA doesn't exist = not blacklisted
        }
    }
    /**
     * Fetch all active (non-removed) blacklist entries for this mint.
     *
     * @returns Array of blacklist entries with address, reason, addedBy, and addedAt.
     */
    async getBlacklist() {
        const readProgram = new anchor_1.Program(sss_core_json_1.default, { connection: this.connection });
        const entries = await readProgram.account.blacklistEntry.all([
            { memcmp: { offset: 8, bytes: this.mint.toBase58() } },
        ]);
        return entries
            .filter(e => !e.account.removed)
            .map(e => ({
            address: e.account.address,
            reason: e.account.reason,
            addedBy: e.account.addedBy,
            addedAt: e.account.addedAt,
        }));
    }
}
exports.ComplianceModule = ComplianceModule;
//# sourceMappingURL=compliance.js.map