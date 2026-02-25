import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import { SolanaStablecoin } from "../sdk/src/SolanaStablecoin";
import { StablecoinPreset, SolanaNetwork } from "../sdk/src/types";
import { SssCore } from "../target/types/sss_core";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

describe("SolanaStablecoin SDK via anchor test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SssCore as Program<SssCore>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const authority = (provider.wallet as anchor.Wallet).payer;

  let sdk: SolanaStablecoin;
  let mintAddress: PublicKey;

  const minter = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  let user1Ata: PublicKey;
  let user2Ata: PublicKey;

  // ─── Setup: airdrop SOL to all test wallets before any test runs ───────────
  before(async () => {
    const airdropAndConfirm = async (pubkey: PublicKey) => {
      const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
    };

    await airdropAndConfirm(minter.publicKey);
    await airdropAndConfirm(user1.publicKey);
    await airdropAndConfirm(user2.publicKey);
  });

  // ─── 1. Create ─────────────────────────────────────────────────────────────
  it("Can create an SSS-2 token via SDK", async () => {
    const config = {
      name: "Test USD",
      symbol: "TUSD",
      uri: "https://example.com/tusd.json",
      decimals: 6,
      preset: StablecoinPreset.SSS_2,
      authority,
      blacklister: authority.publicKey,
      seizer: authority.publicKey,
    };

    const txSig = await SolanaStablecoin.create(config, SolanaNetwork.LOCALNET);
    expect(txSig).to.be.a("string");
    console.log("  → Init tx:", txSig);

    // Fetch the config PDA that was just created
    const configs = await program.account.stablecoinConfig.all();
    expect(configs.length).to.be.greaterThan(0);

    mintAddress = configs[configs.length - 1].account.mint;
    console.log("  → Mint address:", mintAddress.toBase58());

    // Derive ATAs for test users
    user1Ata = getAssociatedTokenAddressSync(
      mintAddress,
      user1.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    user2Ata = getAssociatedTokenAddressSync(
      mintAddress,
      user2.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Create ATAs — authority pays, since SSS-2 defaults accounts to frozen
    // we thaw them immediately after creation
    const createAtaTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        user1Ata,
        user1.publicKey,
        mintAddress,
        TOKEN_2022_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        user2Ata,
        user2.publicKey,
        mintAddress,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await provider.sendAndConfirm(createAtaTx, [authority]);

    // SSS-2 default_account_frozen=true means ATAs start frozen — thaw them
    // so subsequent mint/transfer tests work
    const thawTx1 = await program.methods
      .thawAccount()
      .accounts({
        authority: authority.publicKey,
        config: configs[configs.length - 1].publicKey,
        account: user1Ata,
        mint: mintAddress,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      } as any)
      .signers([authority])
      .rpc();
    console.log("  → Thawed user1Ata:", thawTx1);

    const thawTx2 = await program.methods
      .thawAccount()
      .accounts({
        authority: authority.publicKey,
        config: configs[configs.length - 1].publicKey,
        account: user2Ata,
        mint: mintAddress,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      } as any)
      .signers([authority])
      .rpc();
    console.log("  → Thawed user2Ata:", thawTx2);
  });

  // ─── 2. Load ───────────────────────────────────────────────────────────────
  it("Can load the SDK from an existing mint", async () => {
    expect(mintAddress, "mintAddress not set — did previous test pass?").to.exist;

    sdk = await SolanaStablecoin.load(SolanaNetwork.LOCALNET, mintAddress);

    expect(sdk.mintAddress.toBase58()).to.equal(mintAddress.toBase58());
    expect(sdk.preset).to.equal(StablecoinPreset.SSS_2);
    console.log("  → SDK loaded for preset:", sdk.preset);
  });

  // ─── 3. Add minter ────────────────────────────────────────────────────────
  it("Can add a minter", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const tx = await sdk.addMinter(authority, minter.publicKey, {
      amount: 1_000_000,
    });
    expect(tx).to.be.a("string");
    console.log("  → Add minter tx:", tx);
  });

  // ─── 4. Mint ───────────────────────────────────────────────────────────────
  it("Can mint tokens to user1", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const tx = await sdk.mint({
      recipient: user1Ata,
      amount: 100_000,
      minter,
    });
    expect(tx).to.be.a("string");
    console.log("  → Mint tx:", tx);

    const supply = await sdk.getTotalSupply();
    expect(supply).to.equal(100_000);
    console.log("  → Total supply:", supply);
  });

  // ─── 5. Burn ──────────────────────────────────────────────────────────────
  it("Can burn tokens from user1", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const tx = await sdk.burn({
      amount: 50_000,
      burner: user1,
      source: user1Ata,
    });
    expect(tx).to.be.a("string");
    console.log("  → Burn tx:", tx);

    const supply = await sdk.getTotalSupply();
    expect(supply).to.equal(50_000);
    console.log("  → Total supply after burn:", supply);
  });

  // ─── 6. Freeze / Thaw ────────────────────────────────────────────────────
  it("Can freeze and thaw user1Ata", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const freezeTx = await sdk.freeze(authority, user1Ata);
    expect(freezeTx).to.be.a("string");
    console.log("  → Freeze tx:", freezeTx);

    const thawTx = await sdk.thaw(authority, user1Ata);
    expect(thawTx).to.be.a("string");
    console.log("  → Thaw tx:", thawTx);
  });

  // ─── 7. Blacklist add / remove ───────────────────────────────────────────
  it("Can add and remove user2 from blacklist", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const addTx = await sdk.compliance.blacklistAdd(authority, {
      address: user2.publicKey, // ← wallet address, not ATA
      reason: "suspicious activity",
    });
    expect(addTx).to.be.a("string");
    console.log("  → Blacklist add tx:", addTx);

    const isBlacklisted = await sdk.compliance.isBlacklisted(user2.publicKey);
    expect(isBlacklisted).to.be.true;

    const removeTx = await sdk.compliance.blacklistRemove(
      authority,
      user2.publicKey
    );
    expect(removeTx).to.be.a("string");
    console.log("  → Blacklist remove tx:", removeTx);

    const isStillBlacklisted = await sdk.compliance.isBlacklisted(
      user2.publicKey
    );
    expect(isStillBlacklisted).to.be.false;
  });

  // ─── 8. Seize ────────────────────────────────────────────────────────────
  // Seize requires the source account to be FROZEN first.
  // Flow: freeze user1Ata → seize from user1Ata → treasury (user2Ata)
  it("Can seize tokens from a frozen account", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    // user1Ata still has 50_000 tokens (100_000 minted − 50_000 burned)
    // It was thawed in test 6 — we need to freeze it again before seizing
    const freezeTx = await sdk.freeze(authority, user1Ata);
    expect(freezeTx).to.be.a("string");
    console.log("  → Pre-seize freeze tx:", freezeTx);

    const seizeTx = await sdk.compliance.seize(
      authority,
      user1Ata,   // from — frozen source
      user2Ata,   // to   — treasury destination
      10_000,
      "court order #1234"
    );
    expect(seizeTx).to.be.a("string");
    console.log("  → Seize tx:", seizeTx);

    // Supply is unchanged — seize just moves tokens, doesn't burn them
    const supply = await sdk.getTotalSupply();
    expect(supply).to.equal(50_000);
  });

  // ─── 9. Pause / Unpause ──────────────────────────────────────────────────
  it("Can pause and unpause the token", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const pauseTx = await sdk.pause(authority);
    expect(pauseTx).to.be.a("string");
    console.log("  → Pause tx:", pauseTx);

    const paused = await sdk.isPaused();
    expect(paused).to.be.true;

    const unpauseTx = await sdk.unpause(authority);
    expect(unpauseTx).to.be.a("string");
    console.log("  → Unpause tx:", unpauseTx);

    const stillPaused = await sdk.isPaused();
    expect(stillPaused).to.be.false;
  });

  // ─── 10. getInfo ─────────────────────────────────────────────────────────
  it("Can fetch stablecoin info", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const info = await sdk.getInfo();
    expect(info.name).to.equal("Test USD");
    expect(info.symbol).to.equal("TUSD");
    expect(info.preset).to.equal(StablecoinPreset.SSS_2);
    expect(info.paused).to.be.false;
    expect(info.totalSupply).to.equal(50_000);
    console.log("  → Info:", JSON.stringify(info, null, 2));
  });
});