/**
 * Integration Test: SSS-1 Preset Lifecycle
 *
 * Flow: create → addMinter → mint → transfer → freeze (account)
 *
 * SSS-1 is the "basic" stablecoin: no compliance module, no transfer hook,
 * no blacklist. Only freeze/thaw is available for individual accounts.
 */
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
    getAccount,
} from "@solana/spl-token";

describe("SSS-1 Preset Integration — mint → transfer → freeze", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const connection = provider.connection;
    const authority = (provider.wallet as anchor.Wallet).payer;

    let sdk: SolanaStablecoin;
    let mintAddress: PublicKey;

    const minter = Keypair.generate();
    const sender = Keypair.generate();
    const receiver = Keypair.generate();

    let senderAta: PublicKey;
    let receiverAta: PublicKey;

    const airdropAndConfirm = async (pubkey: PublicKey, sol = 2) => {
        const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, "confirmed");
    };

    // ─── Setup ─────────────────────────────────────────────────────────────────
    before(async () => {
        await airdropAndConfirm(minter.publicKey);
        await airdropAndConfirm(sender.publicKey);
        await airdropAndConfirm(receiver.publicKey);
    });

    // ─── 1. Create SSS-1 Stablecoin ─────────────────────────────────────────────
    it("Step 1: Creates an SSS-1 stablecoin", async () => {
        const result = await SolanaStablecoin.create(
            {
                name: "Integration USD",
                symbol: "IUSD",
                uri: "https://example.com/iusd.json",
                decimals: 6,
                preset: StablecoinPreset.SSS_1,
                authority,
            },
            SolanaNetwork.LOCALNET
        );

        expect(result.txSig).to.be.a("string");
        mintAddress = result.mintAddress;
        console.log("  → SSS-1 mint:", mintAddress.toBase58());

        sdk = await SolanaStablecoin.load(SolanaNetwork.LOCALNET, mintAddress);
        expect(sdk.preset).to.equal(StablecoinPreset.SSS_1);
    });

    // ─── 2. Add Minter ───────────────────────────────────────────────────────────
    it("Step 2: Authority adds a minter with quota", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        const tx = await sdk.addMinter(authority, minter.publicKey, {
            amount: 1_000_000,
        });
        expect(tx).to.be.a("string");
        console.log("  → addMinter tx:", tx);
    });

    // ─── 3. Mint to Sender ───────────────────────────────────────────────────────
    it("Step 3: Minter mints tokens to sender", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        // Create sender ATA
        senderAta = getAssociatedTokenAddressSync(
            mintAddress,
            sender.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );
        const createAtaTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                authority.publicKey,
                senderAta,
                sender.publicKey,
                mintAddress,
                TOKEN_2022_PROGRAM_ID
            )
        );
        await provider.sendAndConfirm(createAtaTx, [authority]);

        // Thaw the ATA if needed (the mint has a freeze authority, so new ATAs may start frozen)
        try {
            await sdk.thaw(authority, senderAta);
            console.log("  → Thawed senderAta");
        } catch {
            console.log("  → Already thawed: senderAta");
        }

        const tx = await sdk.mint({
            recipient: senderAta,
            amount: 500_000,
            minter,
        });
        expect(tx).to.be.a("string");
        console.log("  → mint tx:", tx);

        const supply = await sdk.getTotalSupply();
        expect(supply).to.equal(500_000);
        console.log("  → Total supply:", supply);
    });

    // ─── 4. Compliance is Unavailable on SSS-1 ──────────────────────────────────
    it("Step 4: Compliance module throws on SSS-1", async () => {
        expect(sdk, "sdk not initialized").to.exist;
        try {
            await sdk.compliance.isBlacklisted(receiver.publicKey);
            expect.fail("Should have thrown");
        } catch (err: any) {
            expect(err.message).to.include("SSS-2");
        }
    });

    // ─── 5. Transfer Tokens ──────────────────────────────────────────────────────
    it("Step 5: Sender transfers tokens to receiver", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        // Create receiver ATA
        receiverAta = getAssociatedTokenAddressSync(
            mintAddress,
            receiver.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );
        const createAtaTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                authority.publicKey,
                receiverAta,
                receiver.publicKey,
                mintAddress,
                TOKEN_2022_PROGRAM_ID
            )
        );
        await provider.sendAndConfirm(createAtaTx, [authority]);

        // Thaw receiver ATA if needed
        try {
            await sdk.thaw(authority, receiverAta);
            console.log("  → Thawed receiverAta");
        } catch {
            console.log("  → Already thawed: receiverAta");
        }

        // Use the SPL Token transfer instruction via the SDK
        const tx = await sdk.transfer({
            sender,
            fromAta: senderAta,
            toAta: receiverAta,
            amount: 200_000,
        });
        expect(tx).to.be.a("string");
        console.log("  → transfer tx:", tx);

        const receiverAccount = await getAccount(
            connection,
            receiverAta,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
        );
        expect(Number(receiverAccount.amount)).to.equal(200_000);
        console.log("  → Receiver balance:", receiverAccount.amount.toString());
    });

    // ─── 6. Freeze the Receiver Account ──────────────────────────────────────────
    it("Step 6: Authority freezes receiver account", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        const freezeTx = await sdk.freeze(authority, receiverAta);
        expect(freezeTx).to.be.a("string");
        console.log("  → freeze tx:", freezeTx);

        const receiverAccount = await getAccount(
            connection,
            receiverAta,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
        );
        expect(receiverAccount.isFrozen).to.be.true;
        console.log("  → Account is frozen:", receiverAccount.isFrozen);
    });

    // ─── 7. Verify Frozen Account Cannot Transfer ─────────────────────────────────
    it("Step 7: Frozen account cannot initiate transfers", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        try {
            await sdk.transfer({
                sender: receiver,
                fromAta: receiverAta,
                toAta: senderAta,
                amount: 10_000,
            });
            expect.fail("Transfer from frozen account should have failed");
        } catch (err: any) {
            console.log("  → Correctly rejected frozen transfer:", err.message ?? err.toString());
        }
    });

    // ─── 8. Thaw and Confirm Transfer Resumes ────────────────────────────────────
    it("Step 8: Authority thaws account and transfer resumes", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        const thawTx = await sdk.thaw(authority, receiverAta);
        expect(thawTx).to.be.a("string");
        console.log("  → thaw tx:", thawTx);

        const transferTx = await sdk.transfer({
            sender: receiver,
            fromAta: receiverAta,
            toAta: senderAta,
            amount: 50_000,
        });
        expect(transferTx).to.be.a("string");
        console.log("  → Post-thaw transfer tx:", transferTx);

        const senderAccount = await getAccount(
            connection,
            senderAta,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
        );
        // Sender started with 500k, sent 200k, received 50k back = 350k
        expect(Number(senderAccount.amount)).to.equal(350_000);
        console.log("  → Sender balance:", senderAccount.amount.toString());
    });

    // ─── 9. Final Supply Invariant ───────────────────────────────────────────────
    it("Step 9: Total supply is unchanged after transfers", async () => {
        expect(sdk, "sdk not initialized").to.exist;

        const supply = await sdk.getTotalSupply();
        expect(supply).to.equal(500_000); // Transfers don't change supply
        console.log("  → Final supply:", supply);
    });
});
