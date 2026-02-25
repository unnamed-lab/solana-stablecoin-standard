"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferHookModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const types_1 = require("../types");
const sss_transfer_hook_json_1 = __importDefault(require("../../../target/idl/sss_transfer_hook.json"));
const NETWORK_RPC = {
    [types_1.SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [types_1.SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [types_1.SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [types_1.SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
};
/**
 * Sub-module for managing the Token-2022 transfer hook (sss-transfer-hook program).
 *
 * The transfer hook intercepts every Token-2022 transfer, checking whether
 * the sender or recipient is blacklisted, and blocking the transfer if so.
 *
 * This module is automatically instantiated by {@link SolanaStablecoin} for
 * SSS-2 preset tokens. Accessing it on SSS-1 or CUSTOM tokens throws.
 *
 * @example
 * ```ts
 * // Initialize the hook after creating an SSS-2 stablecoin
 * await sdk.transferHook.initializeHook(payer, authority, true);
 * await sdk.transferHook.initializeExtraAccountMetaList(payer, authority);
 *
 * // Check hook status
 * const config = await sdk.transferHook.getHookConfig();
 * console.log(config.enabled, config.transferCount);
 * ```
 */
class TransferHookModule {
    connection;
    programId;
    mint;
    sssConfigPda;
    constructor(connection, network, mint, sssConfigPda) {
        this.connection = connection;
        this.mint = mint;
        this.sssConfigPda = sssConfigPda;
        const readProgram = new anchor_1.Program(sss_transfer_hook_json_1.default, { connection });
        this.programId = readProgram.programId;
    }
    /**
     * @internal Builds an Anchor `Program<SssTransferHook>` backed by the
     * given signer for write operations.
     */
    buildProgram(signer) {
        const wallet = new nodewallet_1.default(signer);
        const provider = new anchor_1.AnchorProvider(this.connection, wallet, {
            commitment: "confirmed",
        });
        return new anchor_1.Program(sss_transfer_hook_json_1.default, provider);
    }
    /** @internal Derives the hook config PDA: `["hook-config", mint]`. */
    getHookConfigPda() {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("hook-config"), this.mint.toBuffer()], this.programId);
    }
    /** @internal Derives the extra account meta list PDA: `["extra-account-metas", mint]`. */
    getExtraAccountMetaListPda() {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), this.mint.toBuffer()], this.programId);
    }
    /**
     * Initialize the transfer hook configuration for this mint.
     *
     * Creates the on-chain `HookConfig` PDA. Must be called once after the
     * stablecoin is created.
     *
     * @param payer          - Keypair that pays for account creation.
     * @param authority      - Hook authority (must match sss-core config authority).
     * @param defaultEnabled - Whether the hook starts enabled (`true`) or disabled.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.transferHook.initializeHook(
     *   payer,
     *   authority,
     *   true, // start enabled
     * );
     * // txSig → "4BHi5...DMBy" (base-58 transaction signature)
     * // Hook config PDA created; hook is now active.
     * ```
     */
    async initializeHook(payer, authority, defaultEnabled = true) {
        const program = this.buildProgram(payer);
        const [hookConfigPda] = this.getHookConfigPda();
        const signers = payer.publicKey.equals(authority.publicKey)
            ? [payer]
            : [payer, authority];
        return await program.methods
            .initializeHook(defaultEnabled)
            .accounts({
            payer: payer.publicKey,
            hookConfig: hookConfigPda,
            mint: this.mint,
            sssConfig: this.sssConfigPda,
            authority: authority.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers(signers)
            .rpc();
    }
    /**
     * Register the extra account metas required by Token-2022 for hook execution.
     *
     * Must be called once after {@link initializeHook}. Configures the extra
     * accounts Token-2022 will automatically resolve during every transfer.
     *
     * @param payer     - Keypair that pays for account creation.
     * @param authority - Hook authority.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.transferHook.initializeExtraAccountMetaList(
     *   payer,
     *   authority,
     * );
     * // txSig → "44s5H...yYS" (base-58 transaction signature)
     * // Extra account meta list PDA created; Token-2022 transfers
     * // will now invoke the hook automatically.
     * ```
     */
    async initializeExtraAccountMetaList(payer, authority) {
        const program = this.buildProgram(payer);
        const [hookConfigPda] = this.getHookConfigPda();
        const [extraAccountMetaListPda] = this.getExtraAccountMetaListPda();
        const signers = payer.publicKey.equals(authority.publicKey)
            ? [payer]
            : [payer, authority];
        return await program.methods
            .initializeExtraAccountMetaList()
            .accounts({
            payer: payer.publicKey,
            extraAccountMetaList: extraAccountMetaListPda,
            mint: this.mint,
            hookConfig: hookConfigPda,
            authority: authority.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers(signers)
            .rpc();
    }
    /**
     * Enable the transfer hook, allowing it to enforce blacklist checks.
     *
     * @param authority - Keypair of the hook authority.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.transferHook.enableHook(authority);
     * // txSig → "2cmV9...fJQ" (base-58 transaction signature)
     *
     * const config = await sdk.transferHook.getHookConfig();
     * // config.enabled → true
     * ```
     */
    async enableHook(authority) {
        const program = this.buildProgram(authority);
        const [hookConfigPda] = this.getHookConfigPda();
        return await program.methods
            .enableHook()
            .accounts({
            authority: authority.publicKey,
            hookConfig: hookConfigPda,
        })
            .signers([authority])
            .rpc();
    }
    /**
     * Disable the transfer hook without un-registering it.
     *
     * While disabled, all transfers proceed without blacklist checks.
     *
     * @param authority - Keypair of the hook authority.
     * @returns Transaction signature.
     *
     * @example
     * ```ts
     * const txSig = await sdk.transferHook.disableHook(authority);
     * // txSig → "4JpSs...QYzR" (base-58 transaction signature)
     *
     * const config = await sdk.transferHook.getHookConfig();
     * // config.enabled → false
     * // Transfers now proceed without blacklist enforcement.
     * ```
     */
    async disableHook(authority) {
        const program = this.buildProgram(authority);
        const [hookConfigPda] = this.getHookConfigPda();
        return await program.methods
            .disableHook()
            .accounts({
            authority: authority.publicKey,
            hookConfig: hookConfigPda,
        })
            .signers([authority])
            .rpc();
    }
    /**
     * Fetch the current hook configuration from the chain.
     *
     * @returns A {@link HookConfigInfo} with enabled state, transfer/blocked counts, etc.
     *
     * @example
     * ```ts
     * const config = await sdk.transferHook.getHookConfig();
     * // config → {
     * //   mint: PublicKey("BWuc..."),
     * //   authority: PublicKey("AyMj..."),
     * //   enabled: true,
     * //   transferCount: 0,
     * //   blockedCount: 0
     * // }
     * ```
     */
    async getHookConfig() {
        const readProgram = new anchor_1.Program(sss_transfer_hook_json_1.default, {
            connection: this.connection,
        });
        const [hookConfigPda] = this.getHookConfigPda();
        const data = await readProgram.account.hookConfig.fetch(hookConfigPda);
        return {
            mint: data.mint,
            authority: data.authority,
            enabled: data.enabled,
            transferCount: data.transferCount.toNumber(),
            blockedCount: data.blockedCount.toNumber(),
        };
    }
}
exports.TransferHookModule = TransferHookModule;
//# sourceMappingURL=transfer-hook.js.map