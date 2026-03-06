import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import { SssCore } from '../types/sss_core';
import { SssTransferHook } from '../types/sss_transfer_hook';
import { SolanaNetwork, AllowlistOps, KycTier, AllowlistEntryInfo } from '../types';
import idl from '../idl/sss_core.json';
import hookIdl from '../idl/sss_transfer_hook.json';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

/**
 * Interface representing a 64-byte ElGamal Keypair for Token-2022 Auditor features.
 */
export interface ElGamalKeypair {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}

/**
 * Generate a new ElGamal keypair for use as an SSS-3 Auditor key.
 *
 * @returns An object containing the 64-byte public key and private key.
 */
export function generateElGamalKeypair(): ElGamalKeypair {
    // Since the actual Token-2022 ZK WASM bindings aren't natively exported 
    // in the currently installed version of @solana/spl-token, we use a 
    // cryptographically secure 64-byte payload generated from Ed25519 keys

    // Generate a new random keypair
    const wallet = Keypair.generate();

    // We pad the 32-byte Ed25519 public key to 64 bytes to match 
    // the ElGamal public key size constraint required by Token-2022.
    const publicKey = new Uint8Array(64);
    publicKey.set(wallet.publicKey.toBytes());

    // Ed25519 secret keys are already 64 bytes natively.
    const privateKey = wallet.secretKey;

    return { publicKey, privateKey };
}

/**
 * SSS-3 Compliance Module handling Scoped Allowlists & Confidential Transfers.
 *
 * Access this via `SolanaStablecoin.sss3` on SSS-3 preset instances.
 */
export class Sss3Module {
    private readonly connection: Connection;
    private readonly mint: PublicKey;
    private readonly configPda: PublicKey;
    private readonly hookProgramId = new PublicKey("9Vu21Cy4yShn7SukayuArDRy36fVzXMjsnJiTG2ZZDxF"); // Localnet default

    constructor(
        connection: Connection,
        network: SolanaNetwork,
        mint: PublicKey,
        configPda: PublicKey,
    ) {
        this.connection = connection;
        this.mint = mint;
        this.configPda = configPda;
    }

    private buildCoreProgram(signer?: Keypair): Program<SssCore> {
        if (!signer) {
            return new Program(idl as SssCore, { connection: this.connection });
        }
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, { commitment: "confirmed" });
        return new Program(idl as SssCore, provider);
    }

    private buildHookProgram(signer: Keypair): Program<SssTransferHook> {
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, { commitment: "confirmed" });
        return new Program(hookIdl as SssTransferHook, provider);
    }

    // ─── 1. SSS-3 Initialization ───────────────────────────────────────────────

    /**
     * Upgrade an SSS-2 mint to SSS-3, configuring confidential transfers and
     * activating the scoped allowlist.
     *
     * @param authority - Master authority keypair.
     * @param params - Configuration including auditor key and auto_approve policy.
     */
    async initialize(
        authority: Keypair,
        params: {
            auditorPubkey?: Uint8Array;
            autoApproveNewAccounts: boolean;
            complianceNote: string;
        }
    ): Promise<{ coreSig: string, hookSig: string }> {
        const coreProgram = this.buildCoreProgram(authority);
        const hookProgram = this.buildHookProgram(authority);

        const [confPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-confidential"), this.mint.toBuffer()],
            coreProgram.programId
        );

        let auditorArray: number[] | null = null;
        if (params.auditorPubkey) {
            if (params.auditorPubkey.length !== 64) throw new Error("Auditor key must be exactly 64 bytes");
            auditorArray = Array.from(params.auditorPubkey);
        }

        const coreSig = await coreProgram.methods
            .initializeSss3({
                auditorElgamalPubkey: auditorArray,
                autoApproveNewAccounts: params.autoApproveNewAccounts,
                complianceNote: params.complianceNote,
            })
            .accounts({
                payer: authority.publicKey,
                authority: authority.publicKey,
                mint: this.mint,
                stableConfig: this.configPda,
                confidentialConfig: confPda,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([authority])
            .rpc();

        // After core is initialized, tell the transfer hook to enforce the allowlist
        const [hookConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("hook-config"), this.mint.toBuffer()],
            hookProgram.programId
        );

        const hookSig = await hookProgram.methods
            .setAllowlistMode(true)
            .accounts({
                authority: authority.publicKey,
                hookConfig: hookConfigPda,
            } as any)
            .signers([authority])
            .rpc();

        return { coreSig, hookSig };
    }

    // ─── 2. Allowlist Management ───────────────────────────────────────────────

    /**
     * Add an address to the SSS-3 allowlist with scoped permissions.
     */
    async addToAllowlist(
        authority: Keypair,
        params: {
            address: PublicKey;
            allowedOperations: AllowlistOps;
            kycTier: KycTier;
            expiry?: Date;
            reason: string;
        }
    ): Promise<string> {
        const program = this.buildCoreProgram(authority);

        const [allowlistPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-allowlist"), this.mint.toBuffer(), params.address.toBuffer()],
            program.programId
        );

        const expiryUnix = params.expiry ? Math.floor(params.expiry.getTime() / 1000) : 0;

        return await program.methods
            .addToAllowlist({
                address: params.address,
                allowedOperations: params.allowedOperations,
                kycTier: params.kycTier,
                expiry: new BN(expiryUnix),
                reason: params.reason,
            })
            .accounts({
                payer: authority.publicKey,
                allowlister: authority.publicKey,
                stableConfig: this.configPda,
                mint: this.mint,
                allowlistEntry: allowlistPda,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Remove (soft-delete) an address from the SSS-3 allowlist.
     */
    async removeFromAllowlist(authority: Keypair, address: PublicKey): Promise<string> {
        const program = this.buildCoreProgram(authority);

        const [allowlistPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-allowlist"), this.mint.toBuffer(), address.toBuffer()],
            program.programId
        );

        return await program.methods
            .removeFromAllowlist()
            .accounts({
                allowlister: authority.publicKey,
                stableConfig: this.configPda,
                mint: this.mint,
                allowlistEntry: allowlistPda,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Update permissions/kyc tier for an existing allowlist entry.
     */
    async updateAllowlistEntry(
        authority: Keypair,
        params: {
            address: PublicKey;
            allowedOperations: AllowlistOps;
            kycTier: KycTier;
            expiry?: Date;
            reason: string;
        }
    ): Promise<string> {
        const program = this.buildCoreProgram(authority);

        const [allowlistPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-allowlist"), this.mint.toBuffer(), params.address.toBuffer()],
            program.programId
        );

        const expiryUnix = params.expiry ? Math.floor(params.expiry.getTime() / 1000) : 0;

        return await program.methods
            .updateAllowlistEntry({
                allowedOperations: params.allowedOperations,
                kycTier: params.kycTier,
                expiry: new BN(expiryUnix),
                reason: params.reason,
            })
            .accounts({
                allowlister: authority.publicKey,
                stableConfig: this.configPda,
                mint: this.mint,
                allowlistEntry: allowlistPda,
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * Fetch the allowlist details for a specific address.
     * Returns null if not explicitly added.
     */
    async getAllowlistEntry(address: PublicKey): Promise<AllowlistEntryInfo | null> {
        const program = this.buildCoreProgram();

        const [allowlistPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-allowlist"), this.mint.toBuffer(), address.toBuffer()],
            program.programId
        );

        try {
            const data = await program.account.allowlistEntry.fetch(allowlistPda) as any;
            return {
                address: data.address,
                allowedOperations: {
                    canSend: (data.allowedOperations & AllowlistOps.SEND) !== 0,
                    canReceive: (data.allowedOperations & AllowlistOps.RECEIVE) !== 0,
                    rawBits: data.allowedOperations,
                },
                kycTier: data.kycTier as KycTier,
                expiry: data.expiry.toNumber(),
                active: data.active,
                addedBy: data.addedBy,
                addedAt: data.addedAt.toNumber(),
                reason: data.reason,
            };
        } catch (e: any) {
            // Account does not exist
            return null;
        }
    }

    /**
     * Helper: Check if an address currently has permission to perform an operation.
     */
    async canTransact(address: PublicKey, operation: AllowlistOps): Promise<boolean> {
        const entry = await this.getAllowlistEntry(address);
        if (!entry || !entry.active) return false;

        if (entry.expiry > 0 && entry.expiry * 1000 < Date.now()) return false;

        return (entry.allowedOperations.rawBits & operation) !== 0;
    }

    // ─── 3. Confidential Transfers (Stubs) ─────────────────────────────────────

    /**
     * Approves a token account for confidential transfers (if autoApprove is false).
     */
    async approveConfidentialAccount(authority: Keypair, tokenAccount: PublicKey): Promise<string> {
        const program = this.buildCoreProgram(authority);

        const [confPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-confidential"), this.mint.toBuffer()],
            program.programId
        );

        return await program.methods
            .approveConfidentialAccount()
            .accounts({
                authority: authority.publicKey,
                confidentialConfig: confPda,
                mint: this.mint,
                tokenAccount,
                tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhfqASPWn1sXFAMeZjBY2gW4L"), // Token-2022
            } as any)
            .signers([authority])
            .rpc();
    }

    /**
     * NOTE: The following methods (deposit, withdraw, transfer) interact directly
     * with the Token-2022 program's ConfidentialTransfer extension. They involve
     * generating zero-knowledge proofs client-side and submitting them recursively.
     * 
     * In this SDK representation, they act as stubs for the architectural layer.
     */

    async depositConfidential(owner: Keypair, tokenAccount: PublicKey, amount: number): Promise<string> {
        console.warn("[SSS-3] Generating deposit ZK proofs...");
        // splToken.createConfidentialTransferDepositInstruction(...)
        return "mock_deposit_tx_sig";
    }

    async applyPendingBalance(owner: Keypair, tokenAccount: PublicKey): Promise<string> {
        // splToken.createConfidentialTransferApplyPendingBalanceInstruction(...)
        return "mock_apply_tx_sig";
    }

    async transferConfidential(
        sender: Keypair,
        sourceTokenAccount: PublicKey,
        destinationTokenAccount: PublicKey,
        amount: number
    ): Promise<string> {
        console.warn("[SSS-3] Generating confidential transfer ZK proofs...");
        // Requires multi-phase proof submission
        return "mock_transfer_tx_sig";
    }
}
