import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SssCore } from '../types/sss_core';
import { SolanaNetwork } from '../types';
import idl from '../../../target/idl/sss_core.json';

const NETWORK_RPC: Record<SolanaNetwork, string> = {
    [SolanaNetwork.DEVNET]:   "https://api.devnet.solana.com",
    [SolanaNetwork.MAINNET]:  "https://api.mainnet-beta.solana.com",
    [SolanaNetwork.TESTNET]:  "https://api.testnet.solana.com",
    [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
};

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
        this.mint       = mint;
        this.config     = config;

        // Derive programId from IDL (it's embedded in the IDL address field)
        const readProgram = new Program(idl as SssCore, { connection });
        this.programId  = readProgram.programId;
    }

    // ✅ Build a program with a real provider for write operations
    private buildProgram(signer: Keypair): Program<SssCore> {
        const wallet   = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, {
            commitment: "confirmed",
        });
        return new Program(idl as SssCore, provider);
    }

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
                blacklister:         authority.publicKey,
                config:              this.config,
                blacklistEntry,
                mint:                this.mint,
                targetTokenAccount,
                tokenProgram:        TOKEN_2022_PROGRAM_ID,
                systemProgram:       SystemProgram.programId,
            } as any)
            .signers([authority])
            .rpc();
    }

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
                blacklister:         authority.publicKey,
                config:              this.config,
                blacklistEntry,
                mint:                this.mint,
                targetTokenAccount,
                tokenProgram:        TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

    async seize(
        authority: Keypair,
        from:      PublicKey,
        to:        PublicKey,
        amount:    number,
        reason:    string,
    ): Promise<string> {
        const program = this.buildProgram(authority);

        return await program.methods
            .seize(new BN(amount), reason)
            .accounts({
                seizer:       authority.publicKey,
                config:       this.config,
                source:       from,
                destination:  to,
                mint:         this.mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .signers([authority])
            .rpc();
    }

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

    async getBlacklist(): Promise<any[]> {
        const readProgram = new Program(idl as SssCore, { connection: this.connection });
        const entries = await readProgram.account.blacklistEntry.all([
            { memcmp: { offset: 8, bytes: this.mint.toBase58() } },
        ]);
        return entries
            .filter(e => !e.account.removed)
            .map(e => ({
                address:   e.account.address,
                reason:    e.account.reason,
                addedBy:   e.account.addedBy,
                addedAt:   e.account.addedAt,
            }));
    }
}