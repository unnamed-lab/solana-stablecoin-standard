import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';

const filePath = process.argv[2];

console.log('--- Base58 Keypair Generator ---\n');

if (filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at path: ${filePath}`);
        process.exit(1);
    }
    try {
        const secretKeyArray = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
        
        console.log('Loaded keypair from:', filePath);
        console.log('Public Key (Base58):', keypair.publicKey.toBase58());
        console.log('Secret Key (Base58):', bs58.encode(keypair.secretKey));
        console.log('\n✅ Use this Secret Key (Base58) for your API requests.');
    } catch (e) {
        console.error('Error: Could not parse keypair JSON file. Make sure it is a valid Solana JSON keypair array.');
        console.error(e);
        process.exit(1);
    }
} else {
    // Generate new keypair
    const keypair = Keypair.generate();
    
    console.log('Generated a NEW Random Keypair.');
    console.log('Public Key (Base58):', keypair.publicKey.toBase58());
    console.log('Secret Key (Base58):', bs58.encode(keypair.secretKey));
    console.log('\n💡 Tip: You can also pass a file path to read an existing JSON keypair:');
    console.log('   npx ts-node scripts/generate-b58-keypair.ts <path-to-keypair.json>');
}
