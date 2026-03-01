/**
 * deploy-stablecoin.ts
*
 * One-shot script that deploys a new stablecoin to localnet (or devnet)
 * using the SSS SDK, then prints the mint address + authority keypair in
 * base58 so you can paste them straight into .env and API requests.
 *
 * Prerequisites:
 *   1. `solana-test-validator` running (for localnet)
 *   2. Anchor programs deployed:  `anchor build && anchor deploy`
 *
 * Usage:
 *   npx ts-node scripts/deploy-stablecoin.ts
 */
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork, StablecoinPreset } from '@stbr/sss-token';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const network = SolanaNetwork.LOCALNET;
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

  // ── 1. Generate (or load) the authority keypair ──────────────────────
  const authority = Keypair.generate();
  console.log('🔑 Authority public key:', authority.publicKey.toBase58());

  // ── 2. Airdrop SOL to authority (localnet only) ──────────────────────
  console.log('💧 Requesting airdrop...');
  const airdropSig = await connection.requestAirdrop(
    authority.publicKey,
    2 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(airdropSig, 'confirmed');
  console.log('✅ Airdrop confirmed');

  // ── 3. Deploy the stablecoin ─────────────────────────────────────────
  console.log('🚀 Deploying stablecoin...');
  const { txSig, mintAddress } = await SolanaStablecoin.create(
    {
      name: 'Test USD',
      symbol: 'TUSD',
      uri: 'https://example.com/tusd.json',
      decimals: 6,
      preset: StablecoinPreset.SSS_2, // full-featured: blacklist, seize, freeze, hooks
      authority,
      blacklister: authority.publicKey,
      seizer: authority.publicKey,
    },
    network,
  );

  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅  STABLECOIN DEPLOYED SUCCESSFULLY');
  console.log('══════════════════════════════════════════════════════');
  console.log('Tx signature :', txSig);
  console.log('Mint address :', mintAddress.toBase58());
  console.log('Authority key:', authority.publicKey.toBase58());

  // ── 4. Encode authority secret key as base58 ─────────────────────────
  const encode =
    bs58.encode ||
    (bs58 as unknown as { default: { encode: (a: Uint8Array) => string } })
      .default.encode;
  const authoritySecretB58 = encode(authority.secretKey);

  console.log('\n── Paste these into your backend .env ──────────────');
  console.log(`MINT_ADDRESS=${mintAddress.toBase58()}`);
  console.log('\n── Use this as minterKeypair / burnerKeypair in API requests ──');
  console.log(`Authority Secret (base58): ${authoritySecretB58}`);

  // ── 5. Add the authority as a minter so you can mint via API ─────────
  console.log('\n🔧 Adding authority as minter (quota: 1 billion tokens)...');
  const sdk = await SolanaStablecoin.load(network, mintAddress);
  const addMinterTx = await sdk.addMinter(authority, authority.publicKey, {
    amount: 1_000_000_000,
  });
  console.log('✅ addMinter tx:', addMinterTx);

  console.log('\n══════════════════════════════════════════════════════');
  console.log('🎉  ALL DONE!  You can now mint via the backend API.');
  console.log('══════════════════════════════════════════════════════');
  console.log(`
Next steps:
  1. Update your .env:
       MINT_ADDRESS=${mintAddress.toBase58()}

  2. Restart the backend:  npm run start:dev

  3. Mint tokens via API:
       POST http://localhost:3000/api/v1/mint
       {
         "recipient": "<any wallet address>",
         "amount": 1000000,
         "minterKeypair": "${authoritySecretB58}"
       }
  `);

  // ── 6. Export data to text file ──────────────────────────────────────

  // Replace the file writing section with:
  const outputDir = path.join(__dirname, '..', 'output');
  const outputFileName = path.join(outputDir, 'deployment-info.txt');

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileContent = `
Stablecoin Deployment Info
==========================
Network: ${network}
Tx signature: ${txSig}
Mint address: ${mintAddress.toBase58()}
Authority public key: ${authority.publicKey.toBase58()}
Authority secret (base58): ${authoritySecretB58}
  `;
  fs.writeFileSync(outputFileName, fileContent.trim());
  console.log(`\n📄 Deployment info saved to ${outputFileName}\n`);
}

main().catch((err) => {
  console.error('❌ Deployment failed:', err);
  process.exit(1);
});
