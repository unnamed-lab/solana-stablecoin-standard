import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

const filePath = process.argv[2];

console.log('--- Base58 Keypair Generator ---\n');

/**
 * Saves keypair details to a text file in the ./output directory.
 */
function saveToOutputFile(referencePath: string | null, publicKey: string, secretKeyB58: string) {
    const outputDir = path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = referencePath
        ? `keypair-${path.basename(referencePath, '.json')}.txt`
        : `keypair-generated-${timestamp}.txt`;

    const outputPath = path.join(outputDir, fileName);

    const content = `
Keypair Details
===============
Reference Path: ${referencePath || 'Generated (No Save)'}
Public Key (Base58): ${publicKey}
Secret Key (Base58): ${secretKeyB58}
    `.trim();

    fs.writeFileSync(outputPath, content);
    console.log(`\n📄 Details saved to: ${outputPath}`);
}

if (filePath) {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);

    if (fs.existsSync(absolutePath)) {
        try {
            const secretKeyArray = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
            const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

            const pubkey = keypair.publicKey.toBase58();
            const secret = bs58.encode(keypair.secretKey);

            console.log('Loaded keypair from:', absolutePath);
            console.log('Public Key (Base58):', pubkey);
            console.log('Secret Key (Base58):', secret);

            saveToOutputFile(absolutePath, pubkey, secret);

            console.log('\n✅ Use this Secret Key (Base58) for your API requests.');
        } catch (e) {
            console.error('Error: Could not parse keypair JSON file. Make sure it is a valid Solana JSON keypair array.');
            console.error(e);
            process.exit(1);
        }
    } else {
        // Generate and save to new path
        console.log(`Path not found. Creating directory and generating new keypair at: ${absolutePath}`);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }

        const keypair = Keypair.generate();
        const secretKey = Array.from(keypair.secretKey);
        const pubkey = keypair.publicKey.toBase58();
        const secret = bs58.encode(keypair.secretKey);

        fs.writeFileSync(absolutePath, JSON.stringify(secretKey));

        console.log('✅ Generated and saved NEW Keypair.');
        console.log('Public Key (Base58):', pubkey);
        console.log('Secret Key (Base58):', secret);

        saveToOutputFile(absolutePath, pubkey, secret);

        console.log(`\n📄 Keypair JSON saved to: ${absolutePath}`);
        console.log('\n✅ Use the Secret Key (Base58) above for your API requests.');
    }
} else {
    // Generate new keypair only (no save to JSON)
    const keypair = Keypair.generate();
    const pubkey = keypair.publicKey.toBase58();
    const secret = bs58.encode(keypair.secretKey);

    console.log('Generated a NEW Random Keypair.');
    console.log('Public Key (Base58):', pubkey);
    console.log('Secret Key (Base58):', secret);

    saveToOutputFile(null, pubkey, secret);

    console.log('\n💡 Tip: You can also pass a file path to save or read a JSON keypair:');
    console.log('   npx ts-node scripts/generate-b58-keypair.ts <path-to-keypair.json>');
}
