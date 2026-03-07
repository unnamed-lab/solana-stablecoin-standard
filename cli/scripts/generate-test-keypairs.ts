import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const outDir = path.join(__dirname, '..', '..', 'test-keys');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function generateAndSave(name: string) {
    const kp = Keypair.generate();
    const filePath = path.join(outDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)));
    console.log(`Generated ${name} keypair: ${kp.publicKey.toBase58()}`);
    console.log(`Saved to ${filePath}`);
    console.log();
}

console.log('--- Generating Test Keypairs ---');
['admin', 'minter', 'owner', 'burner', 'user1', 'user2'].forEach(generateAndSave);
console.log('Done.');
