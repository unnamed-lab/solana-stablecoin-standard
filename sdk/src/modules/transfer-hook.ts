import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SssTransferHook } from '../types/sss_transfer_hook';
import { SolanaNetwork, HookConfigInfo } from '../types';
import hookIdl from '../idl/sss_transfer_hook.json';

const NETWORK_RPC: Record<SolanaNetwork, string> = {
    [SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
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
export class TransferHookModule {
    private connection: Connection;
    private programId: PublicKey;
    private mint: PublicKey;
    private sssConfigPda: PublicKey;

    constructor(
        connection: Connection,
        network: SolanaNetwork,
        mint: PublicKey,
        sssConfigPda: PublicKey,
    ) {
        this.connection = connection;
        this.mint = mint;
        this.sssConfigPda = sssConfigPda;

        const readProgram = new Program(hookIdl as SssTransferHook, { connection });
        this.programId = readProgram.programId;
    }

    /**
     * @internal Builds an Anchor `Program<SssTransferHook>` backed by the
     * given signer for write operations.
     */
    private buildProgram(signer: Keypair): Program<SssTransferHook> {
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, {
            commitment: "confirmed",
        });
        return new Program(hookIdl as SssTransferHook, provider);
    }

    /** @internal Derives the hook config PDA: `["hook-config", mint]`. */
    private getHookConfigPda(): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("hook-config"), this.mint.toBuffer()],
            this.programId,
        );
    }

    /** @internal Derives the extra account meta list PDA: `["extra-account-metas", mint]`. */
    private getExtraAccountMetaListPda(): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("extra-account-metas"), this.mint.toBuffer()],
            this.programId,
        );
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
    async initializeHook(
        payer: Keypair,
        authority: Keypair,
        defaultEnabled: boolean = true,
    ): Promise<string> {
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
                systemProgram: SystemProgram.programId,
            } as any)
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
    async initializeExtraAccountMetaList(
        payer: Keypair,
        authority: Keypair,
    ): Promise<string> {
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
                systemProgram: SystemProgram.programId,
            } as any)
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
    async enableHook(authority: Keypair): Promise<string> {
        const program = this.buildProgram(authority);
        const [hookConfigPda] = this.getHookConfigPda();

        return await program.methods
            .enableHook()
            .accounts({
                authority: authority.publicKey,
                hookConfig: hookConfigPda,
            } as any)
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
    async disableHook(authority: Keypair): Promise<string> {
        const program = this.buildProgram(authority);
        const [hookConfigPda] = this.getHookConfigPda();

        return await program.methods
            .disableHook()
            .accounts({
                authority: authority.publicKey,
                hookConfig: hookConfigPda,
            } as any)
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
    async getHookConfig(): Promise<HookConfigInfo> {
        const readProgram = new Program(hookIdl as SssTransferHook, {
            connection: this.connection,
        });
        const [hookConfigPda] = this.getHookConfigPda();

        const data = await readProgram.account.hookConfig.fetch(hookConfigPda);
        return {
            mint: data.mint,
            authority: data.authority,
            enabled: data.enabled,
            transferCount: (data.transferCount as any).toNumber(),
            blockedCount: (data.blockedCount as any).toNumber(),
        };
    }
}
