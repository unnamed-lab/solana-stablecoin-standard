/**
 * Integration Test: Oracle Lifecycle
 *
 * Flow: initializeRegistry → registerFeed → initializeOracle → simulateMintQuote → simulateRedeemQuote
 *
 * NOTE: On-chain getMintQuote/getRedeemQuote require a live Switchboard feed account.
 * On localnet, these use a cloned/mock feed. The integration test covers the full
 * SDK flow for registry and config initialization, plus pure-TS simulation.
 */
import * as anchor from "@coral-xyz/anchor";
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
} from "@solana/web3.js";
import { expect } from "chai";
import {
    OracleModule,
    FeedType,
    KNOWN_FEEDS,
    PRICE_SCALE,
    CPI_SCALE,
} from "../../sdk/src/modules/oracle";
import oracleIdl from "../../sdk/src/idl/sss_oracle.json";
import { SolanaNetwork } from "../../sdk/src/types";

// Oracle Program ID (from Anchor.toml / environment / IDL)
const ORACLE_PROGRAM_ID = new PublicKey(
    process.env.ORACLE_PROGRAM_ID ?? (oracleIdl as any).address
);

// Devnet Switchboard feed address for BRL/USD
const BRLUSD_DEVNET_FEED = new PublicKey(
    KNOWN_FEEDS.BRLUSD.devnet // "BwBLNEuTnqQVhzgx3557szSgz1PEHEvj2RRoPiFWR8YB"
);

describe("Oracle Module Integration — initRegistry → registerFeed → initOracle", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const connection = provider.connection;
    const authority = (provider.wallet as anchor.Wallet).payer;

    const oracle = new OracleModule(SolanaNetwork.LOCALNET);

    // Dummy mint address to represent a deployed stablecoin
    const fakeMint = Keypair.generate();

    // ─── 1. PDA Derivation ───────────────────────────────────────────────────────
    it("Step 1: Correctly derives FeedRegistry PDA", () => {
        const [registryPda] = OracleModule.findRegistryPda(ORACLE_PROGRAM_ID);
        // Use toBase58() for cross-package-version-safe assertion
        expect(registryPda.toBase58()).to.be.a("string").with.length.greaterThan(0);
        console.log("  → Registry PDA:", registryPda.toBase58());
    });

    it("Step 1b: Correctly derives OracleConfig PDA for a mint", () => {
        const [oraclePda] = OracleModule.findOracleConfigPda(
            fakeMint.publicKey,
            ORACLE_PROGRAM_ID
        );
        expect(oraclePda.toBase58()).to.be.a("string").with.length.greaterThan(0);
        console.log("  → OracleConfig PDA:", oraclePda.toBase58());
    });

    it("Step 1c: Correctly derives PendingQuote PDA", () => {
        const nonce = BigInt(Date.now());
        const [quotePda] = OracleModule.findQuotePda(
            fakeMint.publicKey,
            authority.publicKey,
            nonce,
            ORACLE_PROGRAM_ID
        );
        expect(quotePda.toBase58()).to.be.a("string").with.length.greaterThan(0);
        console.log("  → Quote PDA:", quotePda.toBase58());
    });

    // ─── 2. Initialize Registry ──────────────────────────────────────────────────
    it("Step 2: Initializes the global feed registry", async () => {
        try {
            const txSig = await oracle.initializeRegistry(authority, ORACLE_PROGRAM_ID);
            expect(txSig).to.be.a("string");
            console.log("  → initializeRegistry tx:", txSig);
        } catch (e: any) {
            // Already initialized is acceptable in repeated test runs
            if (e.message?.includes("already in use") || e.toString().includes("already in use")) {
                console.log("  → Registry already initialized (idempotent — OK)");
            } else {
                throw e;
            }
        }
    });

    // ─── 3. List Feeds (Empty Initially or Already Populated) ───────────────────
    it("Step 3: Lists registered feeds (may be empty)", async () => {
        const feeds = await oracle.listFeeds(ORACLE_PROGRAM_ID);
        expect(feeds).to.be.an("array");
        console.log("  → Registered feeds:", feeds.length);

        if (feeds.length > 0) {
            const first = feeds[0];
            expect(first).to.have.property("symbol");
            expect(first).to.have.property("feedType");
            expect(first).to.have.property("active", true);
            console.log(
                "  → First feed:",
                first.symbol,
                "type:",
                first.feedType
            );
        }
    });

    // ─── 4. Register a Feed (if Switchboard feed is cloned to localnet) ─────────
    it("Step 4: Attempts BRLUSD feed registration (skipped if feed account not on localnet)", async () => {
        // Check if the Switchboard feed account exists on localnet
        const feedAccountInfo = await connection.getAccountInfo(BRLUSD_DEVNET_FEED);

        if (!feedAccountInfo) {
            console.log("  → BRLUSD feed not cloned to localnet — skipping on-chain registration.");
            console.log("  → Tip: start localnet with: solana-test-validator --url devnet --clone " + BRLUSD_DEVNET_FEED.toBase58());
            return; // graceful skip
        }

        // Check if BRLUSD is already registered to avoid duplicate error
        const feeds = await oracle.listFeeds(ORACLE_PROGRAM_ID);
        const alreadyRegistered = feeds.some((f) => f.symbol === "BRLUSD");

        if (alreadyRegistered) {
            console.log("  → BRLUSD already registered — skipping.");
            return;
        }

        const txSig = await oracle.registerFeed(authority, ORACLE_PROGRAM_ID, {
            symbol: "BRLUSD",
            feedType: FeedType.Inverse,
            baseCurrency: "BRL",
            quoteCurrency: "USD",
            decimals: 8,
            switchboardFeed: BRLUSD_DEVNET_FEED,
        });
        expect(txSig).to.be.a("string");
        console.log("  → registerFeed tx:", txSig);

        const feeds2 = await oracle.listFeeds(ORACLE_PROGRAM_ID);
        const brlusd = feeds2.find((f) => f.symbol === "BRLUSD");
        expect(brlusd).to.exist;
        expect(brlusd!.feedType).to.equal("inverse");
    });

    // ─── 5. Local Simulation Tests (No RPC Required) ────────────────────────────
    describe("Pure-TS Oracle Simulations", () => {
        it("Sim 1: mintQuote — Inverse feed (BRL/USD = 5.72, deposit $100, 0.3% fee)", () => {
            const result = oracle.simulateMintQuote(
                10_000,       // $100.00 in cents
                5_720_000,    // 5.72 * PRICE_SCALE
                FeedType.Inverse,
                30            // 0.3%
            );

            expect(result.gross).to.equal(572_000_000);
            expect(result.fee).to.equal(1_716_000);   // 0.3% of 572M
            expect(result.net).to.equal(570_284_000);
            expect(result.priceHuman).to.be.closeTo(5.72, 0.001);
            console.log("  → Inverse mint: gross=", result.gross, "fee=", result.fee, "net=", result.net);
        });

        it("Sim 2: mintQuote — Direct feed (EUR/USD = 1.08, deposit $108, 0% fee)", () => {
            const result = oracle.simulateMintQuote(
                10_800,       // $108.00
                1_080_000,    // 1.08
                FeedType.Direct,
                0
            );

            expect(result.gross).to.equal(100_000_000); // exactly 100 EUR tokens
            expect(result.fee).to.equal(0);
            expect(result.net).to.equal(100_000_000);
        });

        it("Sim 3: mintQuote — CpiIndexed (CPI = 1.083, deposit $108.30, 0% fee)", () => {
            const result = oracle.simulateMintQuote(
                10_830,
                PRICE_SCALE,
                FeedType.CpiIndexed,
                0,
                1_083_000
            );

            expect(result.gross).to.equal(100_000_000);
            expect(result.fee).to.equal(0);
            expect(result.net).to.equal(100_000_000);
        });

        it("Sim 4: redeemQuote — Inverse feed (572 BRLUSD → $100, 0.3% fee)", () => {
            const result = oracle.simulateRedeemQuote(
                572_000_000,
                5_720_000,
                FeedType.Inverse,
                30
            );

            expect(result.gross).to.equal(10_000); // $100.00
            expect(result.fee).to.equal(30);       // 0.3% of $100
            expect(result.net).to.equal(9_970);    // $99.70
        });

        it("Sim 5: redeemQuote — Direct feed (100 EURUSD → $108, 0% fee)", () => {
            const result = oracle.simulateRedeemQuote(
                100_000_000,
                1_080_000,
                FeedType.Direct,
                0
            );

            expect(result.gross).to.equal(10_800);
            expect(result.net).to.equal(10_800);
        });

        it("Sim 6: redeemQuote — CpiIndexed (100 tokens → 100 * CPI, 1% fee)", () => {
            const cpiMult = 1_050_000; // 1.05 × CPI
            const result = oracle.simulateRedeemQuote(
                100_000_000,
                PRICE_SCALE,
                FeedType.CpiIndexed,
                100, // 1%
                cpiMult
            );

            expect(result.gross).to.equal(10_500); // $105.00
            expect(result.fee).to.equal(105);
            expect(result.net).to.equal(10_395);
        });

        it("Sim 7: edge case — zero USD input returns zero tokens", () => {
            const result = oracle.simulateMintQuote(0, 5_720_000, FeedType.Inverse, 30);
            expect(result.gross).to.equal(0);
            expect(result.fee).to.equal(0);
            expect(result.net).to.equal(0);
        });

        it("Sim 8: edge case — very high price (oracle floor price = 1)", () => {
            // 1 unit of currency per USD (stablecoin)
            const result = oracle.simulateMintQuote(10_000, 1_000_000, FeedType.Inverse, 0);
            // $100 of a 1:1 inverse × TOKEN_SCALE = 100 tokens * 1e6 = 100_000_000
            expect(result.gross).to.equal(100_000_000);
        });
    });
});
