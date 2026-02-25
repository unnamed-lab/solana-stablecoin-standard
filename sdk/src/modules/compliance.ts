import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SssCore } from '../types/sss_core';
import { SolanaNetwork } from '../types';
import idl from '../../../target/idl/sss_core.json';

const NETWORK_RPC: Record<SolanaNetwork, string> = {
    [SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
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
export class ComplianceModule {
    private connection: Connection;
    private programId: PublicKey;
    private mint: PublicKey;
    private config: PublicKey;

    constructor(
        connection: Connection,
        network: SolanaNetwork,
        mint: PublicKey,
        config: PublicKey,
    ) {
        this.connection = connection;
        this.mint = mint;
        this.config = config;

        // Derive programId from IDL (it's embedded in the IDL address field)
        const readProgram = new Program(idl as SssCore, { connection });
        this.programId = readProgram.programId;
    }

    // ✅ Build a program with a real provider for write operations
    private buildProgram(signer: Keypair): Program<SssCore> {
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, {
            commitment: "confirmed",
        });
        return new Program(idl as SssCore, provider);
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
    async blacklistAdd(
        authority: Keypair,
        params: { address: PublicKey; reason: string },
    ): Promise<string> {
        const program = this.buildProgram(authority);

        const [blacklistEntry] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-blacklist"), this.mint.toBuffer(), params.address.toBuffer()],
            this.programId,
        );

        // Derive the target's token account for freezing
        const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
        const targetTokenAccount = getAssociatedTokenAddressSync(
            this.mint,
            params.address,
            false,
            TOKEN_2022_PROGRAM_ID,
        );

        return await program.methods
            .addToBlacklist(params.address, params.reason)
            .accounts({
                blacklister: authority.publicKey,
                config: this.config,
                blacklistEntry,
                targetAccount: targetTokenAccount,
                mint: this.mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            } as any)
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
    async blacklistRemove(authority: Keypair, address: PublicKey): Promise<string> {
        const program = this.buildProgram(authority);

        const [blacklistEntry] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-blacklist"), this.mint.toBuffer(), address.toBuffer()],
            this.programId,
        );

        const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
        const targetTokenAccount = getAssociatedTokenAddressSync(
            this.mint,
            address,
            false,
            TOKEN_2022_PROGRAM_ID,
        );

        return await program.methods
            .removeFromBlacklist(address)
            .accounts({
                blacklister: authority.publicKey,
                config: this.config,
                blacklistEntry,
                targetAccount: targetTokenAccount,
                mint: this.mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
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
    async seize(
        authority: Keypair,
        from: PublicKey,
        to: PublicKey,
        amount: number,
        reason: string,
    ): Promise<string> {
        const program = this.buildProgram(authority);

        const [seizureRecord] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-seizure"), this.mint.toBuffer(), from.toBuffer()],
            this.programId,
        );

        return await program.methods
            .seize(new BN(amount), reason)
            .accounts({
                seizer: authority.publicKey,
                config: this.config,
                seizureRecord,
                sourceAccount: from,
                destinationAccount: to,
                mint: this.mint,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Check whether a wallet address is currently blacklisted.
     *
     * @param address - Wallet public key to check.
     * @returns `true` if the address is actively blacklisted, `false` otherwise.
     */
    async isBlacklisted(address: PublicKey): Promise<boolean> {
        const readProgram = new Program(idl as SssCore, { connection: this.connection });

        const [blacklistEntry] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-blacklist"), this.mint.toBuffer(), address.toBuffer()],
            this.programId,
        );

        try {
            const entry = await readProgram.account.blacklistEntry.fetch(blacklistEntry);
            return !entry.removed;
        } catch {
            return false; // PDA doesn't exist = not blacklisted
        }
    }

    /**
     * Fetch all active (non-removed) blacklist entries for this mint.
     *
     * @returns Array of blacklist entries with address, reason, addedBy, and addedAt.
     */
    async getBlacklist(): Promise<any[]> {
        const readProgram = new Program(idl as SssCore, { connection: this.connection });
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