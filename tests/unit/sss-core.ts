import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import { SolanaStablecoin } from "../../sdk/src/SolanaStablecoin";
import { StablecoinPreset, SolanaNetwork } from "../../sdk/src/types";
import { SssCore } from "../../target/types/sss_core";
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

    const result = await SolanaStablecoin.create(config, SolanaNetwork.LOCALNET);
    expect(result.txSig).to.be.a("string");
    console.log("  → Init tx:", result.txSig);

    mintAddress = result.mintAddress;
    console.log("  → Mint address:", mintAddress.toBase58());

    // Derive the configPda from the mint
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sss-config"), mintAddress.toBuffer()],
      program.programId
    );

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
        config: configPda,
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
        config: configPda,
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
      burner: authority,
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

  // ─── 11. Update roles ───────────────────────────────────────────────────
  it("Can update roles via SDK", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const newPauser = Keypair.generate();
    const tx = await sdk.updateRoles(authority, {
      newPauser: newPauser.publicKey,
    });
    expect(tx).to.be.a("string");
    console.log("  → updateRoles tx:", tx);

    // Restore original pauser for subsequent tests
    const restoreTx = await sdk.updateRoles(authority, {
      newPauser: authority.publicKey,
    });
    expect(restoreTx).to.be.a("string");
    console.log("  → Restored pauser, tx:", restoreTx);
  });

  // ─── 12. Propose + accept authority transfer ────────────────────────────
  it("Can propose and accept authority transfer via SDK", async () => {
    expect(sdk, "SDK not initialized").to.exist;

    const newAuthority = Keypair.generate();
    // Fund the new authority so it can sign the accept tx
    const sig = await connection.requestAirdrop(
      newAuthority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(sig, "confirmed");

    // Propose
    const proposeTx = await sdk.proposeAuthorityTransfer(
      authority,
      newAuthority.publicKey
    );
    expect(proposeTx).to.be.a("string");
    console.log("  → proposeAuthorityTransfer tx:", proposeTx);

    // Accept
    const acceptTx = await sdk.acceptAuthorityTransfer(newAuthority);
    expect(acceptTx).to.be.a("string");
    console.log("  → acceptAuthorityTransfer tx:", acceptTx);

    // Transfer back to original authority for subsequent tests
    const proposeBackTx = await sdk.proposeAuthorityTransfer(
      newAuthority,
      authority.publicKey
    );
    expect(proposeBackTx).to.be.a("string");

    const acceptBackTx = await sdk.acceptAuthorityTransfer(authority);
    expect(acceptBackTx).to.be.a("string");
    console.log("  → Authority restored");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SSS-1 Preset Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe("SolanaStablecoin SDK — SSS-1 preset", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SssCore as Program<SssCore>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const authority = (provider.wallet as anchor.Wallet).payer;

  let sdk1: SolanaStablecoin;
  let mintAddress1: PublicKey;

  const minter1 = Keypair.generate();
  const recipient1 = Keypair.generate();
  let recipientAta: PublicKey;

  before(async () => {
    const airdropAndConfirm = async (pubkey: PublicKey) => {
      const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
    };
    await airdropAndConfirm(minter1.publicKey);
    await airdropAndConfirm(recipient1.publicKey);
  });

  // ─── 1. Create SSS-1 token ─────────────────────────────────────────────
  it("Can create an SSS-1 token via SDK", async () => {
    const config = {
      name: "Simple USD",
      symbol: "SUSD",
      uri: "https://example.com/susd.json",
      decimals: 6,
      preset: StablecoinPreset.SSS_1,
      authority,
    };

    const result = await SolanaStablecoin.create(config, SolanaNetwork.LOCALNET);
    expect(result.txSig).to.be.a("string");
    console.log("  → SSS-1 init tx:", result.txSig);

    mintAddress1 = result.mintAddress;

    sdk1 = await SolanaStablecoin.load(SolanaNetwork.LOCALNET, mintAddress1);
    expect(sdk1.preset).to.equal(StablecoinPreset.SSS_1);
    console.log("  → SSS-1 loaded, mint:", mintAddress1.toBase58());
  });

  // ─── 2. Compliance module should throw on SSS-1 ─────────────────────────
  it("Compliance module is unavailable on SSS-1", async () => {
    expect(sdk1, "SDK not initialized").to.exist;

    try {
      await sdk1.compliance.isBlacklisted(recipient1.publicKey);
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.message).to.include("SSS-2");
      console.log("  → Correctly threw:", err.message);
    }
  });

  // ─── 3. Transfer hook module should throw on SSS-1 ──────────────────────
  it("Transfer hook module is unavailable on SSS-1", async () => {
    expect(sdk1, "SDK not initialized").to.exist;

    try {
      await sdk1.transferHook.getHookConfig();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.message).to.include("SSS-2");
      console.log("  → Correctly threw:", err.message);
    }
  });

  // ─── 4. Basic mint/burn on SSS-1 ───────────────────────────────────────
  it("Can mint and burn on SSS-1", async () => {
    expect(sdk1, "SDK not initialized").to.exist;

    // Create ATA
    recipientAta = getAssociatedTokenAddressSync(
      mintAddress1,
      recipient1.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const createAtaTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        recipientAta,
        recipient1.publicKey,
        mintAddress1,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await provider.sendAndConfirm(createAtaTx, [authority]);

    // Add minter
    await sdk1.addMinter(authority, minter1.publicKey, { amount: 500_000 });

    // Mint
    const mintTx = await sdk1.mint({
      recipient: recipientAta,
      amount: 100_000,
      minter: minter1,
    });
    expect(mintTx).to.be.a("string");
    console.log("  → SSS-1 mint tx:", mintTx);

    let supply = await sdk1.getTotalSupply();
    expect(supply).to.equal(100_000);

    // Burn
    const burnTx = await sdk1.burn({
      amount: 30_000,
      burner: authority,
      source: recipientAta,
    });
    expect(burnTx).to.be.a("string");
    console.log("  → SSS-1 burn tx:", burnTx);

    supply = await sdk1.getTotalSupply();
    expect(supply).to.equal(70_000);
    console.log("  → SSS-1 final supply:", supply);
  });

  // ─── 5. getInfo on SSS-1 ───────────────────────────────────────────────
  it("Can fetch SSS-1 stablecoin info", async () => {
    expect(sdk1, "SDK not initialized").to.exist;

    const info = await sdk1.getInfo();
    expect(info.name).to.equal("Simple USD");
    expect(info.symbol).to.equal("SUSD");
    expect(info.preset).to.equal(StablecoinPreset.SSS_1);
    expect(info.totalSupply).to.equal(70_000);
    console.log("  → SSS-1 Info:", JSON.stringify(info, null, 2));
  });
});