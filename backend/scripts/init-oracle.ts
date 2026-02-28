import 'dotenv/config';
import { Connection, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { OracleIdl as idl } from '@stbr/sss-token';

async function run() {
    const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
    // Using the secret key from the backend .env
    const secret = bs58.decode(process.env.ADMIN_WALLET_SECRET_KEY!);
    const authority = Keypair.fromSecretKey(secret);

    // Airdrop SOL
    console.log('Airdropping 10 SOL to authority...');
    const sig = await connection.requestAirdrop(authority.publicKey, 10 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);

    // Load Program
    const provider = new AnchorProvider(connection, new Wallet(authority), { commitment: 'confirmed' });
    const programId = new PublicKey('Brj7RU6jcmWXqCSfBa6o3v5bHS48Z6uDyKZUfG8ZbQoD');
    const program = new Program(idl as any, provider);

    const [registryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('sss-feed-registry')],
        programId
    );

    try {
        console.log('Initializing Oracle Feed Registry... PDA:', registryPda.toBase58());
        const tx = await program.methods.initializeRegistry()
            .accounts({
                authority: authority.publicKey,
                feedRegistry: registryPda,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([authority])
            .rpc();

        console.log('Success! Tx:', tx);
    } catch (e: any) {
        if (e.message.includes('already in use')) {
            console.log('Registry already initialized.');
        } else {
            console.error(e);
        }
    }
}
run();
