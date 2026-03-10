import 'dotenv/config';
import { Keypair, PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { OracleModule, SolanaNetwork } from '@stbr/sss-token';

async function run() {
    // 1. Setup Connection & Network
    const network = (process.env.SOLANA_NETWORK as SolanaNetwork) || SolanaNetwork.LOCALNET;
    const rpcUrl = network === SolanaNetwork.LOCALNET ? 'http://127.0.0.1:8899' : 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // 2. Load Authority from .env
    const secretKey = process.env.ADMIN_WALLET_SECRET_KEY;
    if (!secretKey) {
        throw new Error('ADMIN_WALLET_SECRET_KEY not found in .env');
    }
    const authority = Keypair.fromSecretKey(bs58.decode(secretKey));

    // 3. Load Program ID from .env
    const programIdStr = process.env.ORACLE_PROGRAM_ID || 'CUKfNWS1uWT29GccLKtGMoRB1sqascAjH7GoEddHSfEi';
    const programId = new PublicKey(programIdStr);

    console.log(`Target Network: ${network}`);
    console.log(`Authority: ${authority.publicKey.toBase58()}`);
    console.log(`Program ID: ${programId.toBase58()}`);

    // 4. Airdrop if on localnet/devnet
    if (network === SolanaNetwork.LOCALNET || network === SolanaNetwork.DEVNET) {
        const balance = await connection.getBalance(authority.publicKey);
        if (balance < 1 * LAMPORTS_PER_SOL) {
            console.log('Airdropping 2 SOL to authority...');
            try {
                const sig = await connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL);
                await connection.confirmTransaction(sig);
            } catch (e) {
                console.log('Airdrop failed (account might already have balance or limit reached)');
            }
        }
    }

    // 5. Initialize Oracle via SDK
    const oracle = new OracleModule(network);

    try {
        const [registryPda] = OracleModule.findRegistryPda(programId);
        console.log(`Initializing Registry... PDA: ${registryPda.toBase58()}`);

        const txSig = await oracle.initializeRegistry(authority, programId);
        console.log(`Success! Transaction Signature: ${txSig}`);
    } catch (e: any) {
        if (e.message?.includes('already in use') || e.toString().includes('already in use')) {
            console.log('Registry already initialized.');
        } else {
            console.error('Initialization failed:', e);
        }
    }
}

run().catch(console.error);

