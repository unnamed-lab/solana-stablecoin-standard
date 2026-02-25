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
import { SssTransferHook } from "../../target/types/sss_transfer_hook";
import {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

describe("sss-transfer-hook via SDK", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const coreProgram = anchor.workspace.SssCore as Program<SssCore>;
    const hookProgram = anchor.workspace
        .SssTransferHook as Program<SssTransferHook>;
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

    // ─── Setup ────────────────────────────────────────────────────────────────
    before(async () => {
        const airdropAndConfirm = async (pubkey: PublicKey) => {
            const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig, "confirmed");
        };

        await airdropAndConfirm(minter.publicKey);
        await airdropAndConfirm(user1.publicKey);
        await airdropAndConfirm(user2.publicKey);
    });

    // ─── 1. Create SSS-2 token (transfer hook enabled) ────────────────────────
    it("Creates an SSS-2 token with transfer hook enabled", async () => {
        const config = {
            name: "Hook USD",
            symbol: "HUSD",
            uri: "https://example.com/husd.json",
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
            coreProgram.programId
        );

        // Load SDK
        sdk = await SolanaStablecoin.load(SolanaNetwork.LOCALNET, mintAddress);
        expect(sdk.preset).to.equal(StablecoinPreset.SSS_2);

        // Derive & create ATAs
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

        // Thaw ATAs (SSS-2 defaults to frozen) — skip if already thawed
        for (const ata of [user1Ata, user2Ata]) {
            try {
                await coreProgram.methods
                    .thawAccount()
                    .accounts({
                        authority: authority.publicKey,
                        config: configPda,
                        account: ata,
                        mint: mintAddress,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    } as any)
                    .signers([authority])
                    .rpc();
            } catch (err: any) {
                // 0xd = InvalidAccountState — account is not frozen, skip
                console.log("  → Thaw skipped (account not frozen):", ata.toBase58());
            }
        }

        // Add minter & mint some tokens for later tests
        await sdk.addMinter(authority, minter.publicKey, { amount: 1_000_000 });
        await sdk.mint({ recipient: user1Ata, amount: 500_000, minter });
        console.log("  → Test setup complete");
    });

    // ─── 2. Initialize hook ───────────────────────────────────────────────────
    it("Can initialize the transfer hook via SDK", async () => {
        const txSig = await sdk.transferHook.initializeHook(
            authority,
            authority,
            true
        );
        expect(txSig).to.be.a("string");
        console.log("  → initializeHook tx:", txSig);
    });

    // ─── 3. Initialize extra account meta list ────────────────────────────────
    it("Can initialize extra account meta list via SDK", async () => {
        const txSig = await sdk.transferHook.initializeExtraAccountMetaList(
            authority,
            authority
        );
        expect(txSig).to.be.a("string");
        console.log("  → initializeExtraAccountMetaList tx:", txSig);
    });

    // ─── 4. Get hook config ───────────────────────────────────────────────────
    it("Can read hook config via SDK", async () => {
        const hookConfig = await sdk.transferHook.getHookConfig();

        expect(hookConfig.mint.toBase58()).to.equal(mintAddress.toBase58());
        expect(hookConfig.authority.toBase58()).to.equal(
            authority.publicKey.toBase58()
        );
        expect(hookConfig.enabled).to.be.true;
        expect(hookConfig.transferCount).to.equal(0);
        expect(hookConfig.blockedCount).to.equal(0);
        console.log(
            "  → Hook config:",
            JSON.stringify(
                {
                    ...hookConfig,
                    mint: hookConfig.mint.toBase58(),
                    authority: hookConfig.authority.toBase58(),
                },
                null,
                2
            )
        );
    });

    // ─── 5. Disable / Enable hook ─────────────────────────────────────────────
    it("Can disable and re-enable the hook via SDK", async () => {
        // Disable
        const disableTx = await sdk.transferHook.disableHook(authority);
        expect(disableTx).to.be.a("string");
        console.log("  → disableHook tx:", disableTx);

        let hookConfig = await sdk.transferHook.getHookConfig();
        expect(hookConfig.enabled).to.be.false;

        // Re-enable
        const enableTx = await sdk.transferHook.enableHook(authority);
        expect(enableTx).to.be.a("string");
        console.log("  → enableHook tx:", enableTx);

        hookConfig = await sdk.transferHook.getHookConfig();
        expect(hookConfig.enabled).to.be.true;
    });

    // ─── 6. Hook config stats after operations ────────────────────────────────
    it("Hook config reflects initial zero counts", async () => {
        const hookConfig = await sdk.transferHook.getHookConfig();

        // No transfers have gone through the hook yet (mint bypasses hook)
        expect(hookConfig.transferCount).to.equal(0);
        expect(hookConfig.blockedCount).to.equal(0);
        console.log(
            "  → transfer_count:",
            hookConfig.transferCount,
            "blocked_count:",
            hookConfig.blockedCount
        );
    });
});
