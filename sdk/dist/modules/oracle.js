"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OraclePresets = exports.OracleModule = exports.KNOWN_FEEDS = exports.FeedType = exports.TOKEN_SCALE = exports.CPI_SCALE = exports.PRICE_SCALE = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const types_1 = require("../types");
// ─── Constants ────────────────────────────────────────────────────────────────
exports.PRICE_SCALE = 1_000_000;
exports.CPI_SCALE = 1_000_000;
exports.TOKEN_SCALE = 1_000_000;
const NETWORK_RPC = {
    [types_1.SolanaNetwork.DEVNET]: "https://api.devnet.solana.com",
    [types_1.SolanaNetwork.MAINNET]: "https://api.mainnet-beta.solana.com",
    [types_1.SolanaNetwork.TESTNET]: "https://api.testnet.solana.com",
    [types_1.SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
};
// ─── Types ────────────────────────────────────────────────────────────────────
/**
 * Price feed interpretation strategy.
 *
 * - `Direct`: price = USD per 1 unit of base currency (EUR, GBP, CHF).
 * - `Inverse`: price = base units per 1 USD (BRL, JPY, MXN).
 * - `CpiIndexed`: purchasing power token adjusted by stored CPI multiplier.
 * - `Custom`: arbitrary scaling for exotic pegs.
 */
var FeedType;
(function (FeedType) {
    FeedType["Direct"] = "direct";
    FeedType["Inverse"] = "inverse";
    FeedType["CpiIndexed"] = "cpiIndexed";
    FeedType["Custom"] = "custom";
})(FeedType || (exports.FeedType = FeedType = {}));
// ─── Known Switchboard feed addresses on devnet ──────────────────────────────
exports.KNOWN_FEEDS = {
    BRLUSD: {
        devnet: "8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb",
        mainnet: "",
        type: FeedType.Inverse,
    },
    EURUSD: {
        devnet: "9VADNiXpGFhQaMGV8dfXBnmhbX2LHVW3FRGpYMH4vW8q",
        mainnet: "",
        type: FeedType.Direct,
    },
};
// ─── OracleModule ─────────────────────────────────────────────────────────────
/**
 * TypeScript SDK module for interacting with the sss-oracle Anchor program.
 *
 * Provides PDA derivation, registry operations, quote operations, CPI
 * multiplier updates, and a pure-JS `simulateMintQuote()` for live UI previews.
 *
 * @example
 * ```ts
 * import { OracleModule, FeedType, SolanaNetwork } from '@stbr/sss-token';
 *
 * const oracle = new OracleModule(SolanaNetwork.DEVNET);
 *
 * // Simulate a mint quote locally (no RPC call)
 * const preview = oracle.simulateMintQuote(
 *   10_000,      // $100 in cents
 *   5_720_000,   // BRL/USD = 5.72
 *   FeedType.Inverse,
 *   30,          // 0.3% fee
 * );
 * console.log(`≈ ${preview.net / 1e6} BRLUSD tokens`);
 * ```
 */
class OracleModule {
    connection;
    network;
    constructor(network = types_1.SolanaNetwork.DEVNET) {
        this.network = network;
        this.connection = new web3_js_1.Connection(NETWORK_RPC[network], 'confirmed');
    }
    // ── PDA derivation ────────────────────────────────────────────────────────
    /**
     * Derive the global FeedRegistry PDA.
     *
     * @example
     * ```ts
     * const [registryPda] = OracleModule.findRegistryPda(programId);
     * ```
     */
    static findRegistryPda(programId) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-feed-registry")], programId);
    }
    /**
     * Derive the OracleConfig PDA for a specific mint.
     *
     * @example
     * ```ts
     * const [oraclePda] = OracleModule.findOracleConfigPda(mintAddress, programId);
     * ```
     */
    static findOracleConfigPda(mint, programId) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sss-oracle"), mint.toBuffer()], programId);
    }
    /**
     * Derive the PendingQuote PDA.
     *
     * @example
     * ```ts
     * const nonce = BigInt(Date.now());
     * const [quotePda] = OracleModule.findQuotePda(mint, requester, nonce, programId);
     * ```
     */
    static findQuotePda(mint, requester, nonce, programId) {
        const nonceBuffer = Buffer.alloc(8);
        nonceBuffer.writeBigUInt64LE(nonce);
        return web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("sss-quote"),
            mint.toBuffer(),
            requester.toBuffer(),
            nonceBuffer,
        ], programId);
    }
    // ── Registry operations ───────────────────────────────────────────────────
    /**
     * Initialize the global feed registry. Called once per deployment.
     *
     * @example
     * ```ts
     * const txSig = await oracle.initializeRegistry(authority, programId);
     * console.log('Registry initialized:', txSig);
     * ```
     */
    async initializeRegistry(authority, programId) {
        const program = this.buildProgram(authority, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        return await program.methods
            .initializeRegistry()
            .accounts({
            payer: authority.publicKey,
            authority: authority.publicKey,
            registry: registryPda,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([authority])
            .rpc();
    }
    /**
     * Register a new price feed in the global registry.
     *
     * @example
     * ```ts
     * await oracle.registerFeed(authority, programId, {
     *   symbol:          'BRLUSD',
     *   feedType:        FeedType.Inverse,
     *   baseCurrency:    'BRL',
     *   quoteCurrency:   'USD',
     *   decimals:        8,
     *   switchboardFeed: new PublicKey(KNOWN_FEEDS.BRLUSD.devnet),
     * });
     * ```
     */
    async registerFeed(authority, programId, params) {
        const program = this.buildProgram(authority, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        return await program.methods
            .registerFeed({
            symbol: params.symbol,
            feedType: this.encodeFeedType(params.feedType),
            baseCurrency: params.baseCurrency,
            quoteCurrency: params.quoteCurrency,
            decimals: params.decimals,
        })
            .accounts({
            payer: authority.publicKey,
            authority: authority.publicKey,
            registry: registryPda,
            switchboardFeed: params.switchboardFeed,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([authority])
            .rpc();
    }
    // ── Oracle config ─────────────────────────────────────────────────────────
    /**
     * Initialize an oracle config for a specific SSS token mint.
     *
     * @example
     * ```ts
     * await oracle.initializeOracle(authority, programId, {
     *   mint:                  brlusdMint,
     *   feedSymbol:            'BRLUSD',
     *   description:           'Brazilian Real Stablecoin — 1 BRLUSD = 1 BRL',
     *   maxStalenessSecs:      120,
     *   mintFeeBps:            30,
     *   redeemFeeBps:          30,
     *   maxConfidenceBps:      50,
     *   quoteValiditySecs:     60,
     *   cpiMultiplier:         1_000_000,
     *   cpiMinUpdateInterval:  0,
     *   cpiDataSource:         '',
     * });
     * ```
     */
    async initializeOracle(authority, programId, params) {
        const program = this.buildProgram(authority, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(params.mint, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        return await program.methods
            .initializeOracle({
            feedSymbol: params.feedSymbol,
            description: params.description,
            maxStalenessSecs: new anchor_1.BN(params.maxStalenessSecs),
            mintFeeBps: params.mintFeeBps,
            redeemFeeBps: params.redeemFeeBps,
            maxConfidenceBps: params.maxConfidenceBps,
            quoteValiditySecs: new anchor_1.BN(params.quoteValiditySecs),
            cpiMultiplier: new anchor_1.BN(params.cpiMultiplier),
            cpiMinUpdateInterval: new anchor_1.BN(params.cpiMinUpdateInterval),
            cpiDataSource: params.cpiDataSource,
        })
            .accounts({
            payer: authority.publicKey,
            authority: authority.publicKey,
            mint: params.mint,
            oracleConfig: oraclePda,
            registry: registryPda,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([authority])
            .rpc();
    }
    // ── Quote operations ──────────────────────────────────────────────────────
    /**
     * Get a mint quote — how many tokens for a USD input.
     *
     * @returns QuoteResult with the on-chain quote account for atomic execution.
     *
     * @example
     * ```ts
     * const quote = await oracle.getMintQuote(user, programId, brlMint, {
     *   inputAmount: 10_000,         // $100.00
     *   minOutput:   570_000_000,    // min 570 BRLUSD
     *   nonce:       BigInt(Date.now()),
     * });
     * console.log(`${quote.outputAmount / 1e6} BRLUSD at rate ${quote.priceHuman}`);
     * ```
     */
    async getMintQuote(requester, programId, mint, params) {
        const program = this.buildProgram(requester, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        const [quotePda] = OracleModule.findQuotePda(mint, requester.publicKey, params.nonce, programId);
        const oracleInfo = await this.getOracleInfo(programId, mint);
        const feedAddress = await this.getFeedAddress(programId, oracleInfo.feedSymbol);
        await program.methods
            .getMintQuote({
            inputAmount: new anchor_1.BN(params.inputAmount),
            minOutput: new anchor_1.BN(params.minOutput),
            nonce: new anchor_1.BN(params.nonce.toString()),
        })
            .accounts({
            requester: requester.publicKey,
            oracleConfig: oraclePda,
            registry: registryPda,
            switchboardFeed: feedAddress,
            quote: quotePda,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([requester])
            .rpc();
        const quoteData = await program.account.pendingQuote.fetch(quotePda);
        return {
            outputAmount: quoteData.outputAmount.toNumber(),
            feeAmount: quoteData.feeAmount.toNumber(),
            priceUsed: quoteData.priceSnapshot.toNumber(),
            priceHuman: quoteData.priceSnapshot.toNumber() / exports.PRICE_SCALE,
            validUntil: new Date(quoteData.validUntil.toNumber() * 1000),
            quoteAccount: quotePda,
        };
    }
    /**
     * Get a redeem quote — how many USD cents for burning tokens.
     *
     * @example
     * ```ts
     * const quote = await oracle.getRedeemQuote(user, programId, brlMint, {
     *   inputAmount: 572_000_000,    // 572 BRLUSD tokens
     *   minOutput:   9_500,          // min $95.00
     *   nonce:       BigInt(Date.now()),
     * });
     * console.log(`$${quote.outputAmount / 100} USD`);
     * ```
     */
    async getRedeemQuote(requester, programId, mint, params) {
        const program = this.buildProgram(requester, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        const [quotePda] = OracleModule.findQuotePda(mint, requester.publicKey, params.nonce, programId);
        const oracleInfo = await this.getOracleInfo(programId, mint);
        const feedAddress = await this.getFeedAddress(programId, oracleInfo.feedSymbol);
        await program.methods
            .getRedeemQuote({
            inputAmount: new anchor_1.BN(params.inputAmount),
            minOutput: new anchor_1.BN(params.minOutput),
            nonce: new anchor_1.BN(params.nonce.toString()),
        })
            .accounts({
            requester: requester.publicKey,
            oracleConfig: oraclePda,
            registry: registryPda,
            switchboardFeed: feedAddress,
            quote: quotePda,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([requester])
            .rpc();
        const quoteData = await program.account.pendingQuote.fetch(quotePda);
        return {
            outputAmount: quoteData.outputAmount.toNumber(),
            feeAmount: quoteData.feeAmount.toNumber(),
            priceUsed: quoteData.priceSnapshot.toNumber(),
            priceHuman: quoteData.priceSnapshot.toNumber() / exports.PRICE_SCALE,
            validUntil: new Date(quoteData.validUntil.toNumber() * 1000),
            quoteAccount: quotePda,
        };
    }
    /**
     * Execute a stored mint quote atomically.
     * Must be called within quote validity window or transaction reverts.
     *
     * @example
     * ```ts
     * const txSig = await oracle.mintWithOracle(
     *   user, programId, brlMint,
     *   BigInt(Date.now()),  // same nonce used in getMintQuote
     * );
     * ```
     */
    async mintWithOracle(requester, programId, mint, nonce) {
        const program = this.buildProgram(requester, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        const [quotePda] = OracleModule.findQuotePda(mint, requester.publicKey, nonce, programId);
        return await program.methods
            .mintWithOracle()
            .accounts({
            requester: requester.publicKey,
            oracleConfig: oraclePda,
            quote: quotePda,
        })
            .signers([requester])
            .rpc();
    }
    // ── CPI operations ────────────────────────────────────────────────────────
    /**
     * Update the CPI multiplier for inflation-indexed tokens.
     * Admin-only, call once per month with official CPI data.
     *
     * @example
     * ```ts
     * await oracle.updateCpiMultiplier(authority, programId, brlCpiMint, {
     *   newMultiplier:  1_083_000,    // 1.083 * CPI_SCALE
     *   referenceMonth: '2026-01',
     *   dataSource:     'IBGE - IPCA',
     * });
     * ```
     */
    async updateCpiMultiplier(authority, programId, mint, params) {
        const program = this.buildProgram(authority, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        return await program.methods
            .updateCpiMultiplier({
            newMultiplier: new anchor_1.BN(params.newMultiplier),
            referenceMonth: params.referenceMonth,
            dataSource: params.dataSource,
        })
            .accounts({
            authority: authority.publicKey,
            oracleConfig: oraclePda,
        })
            .signers([authority])
            .rpc();
    }
    // ── Read-only queries ─────────────────────────────────────────────────────
    /**
     * Fetch oracle config for a mint.
     *
     * @example
     * ```ts
     * const info = await oracle.getOracleInfo(programId, brlMint);
     * console.log(`Feed: ${info.feedSymbol}, Paused: ${info.paused}`);
     * ```
     */
    async getOracleInfo(programId, mint) {
        const program = this.readProgram(programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        const data = await program.account.oracleConfig.fetch(oraclePda);
        return {
            mint: data.mint,
            feedSymbol: data.feedSymbol,
            description: data.description,
            mintFeeBps: data.mintFeeBps,
            redeemFeeBps: data.redeemFeeBps,
            cpiMultiplier: data.cpiMultiplier.toNumber(),
            cpiLastUpdated: new Date(data.cpiLastUpdated.toNumber() * 1000),
            paused: data.paused,
            pauseReason: data.pauseReason,
            totalMintedUsd: BigInt(data.totalMintedUsd.toString()),
            totalRedeemedUsd: BigInt(data.totalRedeemedUsd.toString()),
            totalFees: BigInt(data.totalFeesCollected.toString()),
        };
    }
    /**
     * List all registered feeds from the global registry.
     *
     * @example
     * ```ts
     * const feeds = await oracle.listFeeds(programId);
     * feeds.forEach(f => console.log(`${f.symbol}: ${f.feedType}`));
     * ```
     */
    async listFeeds(programId) {
        const program = this.readProgram(programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        const registry = await program.account.feedRegistry.fetch(registryPda);
        return registry.feeds
            .filter((f) => f.active)
            .map((f) => ({
            symbol: f.symbol,
            switchboardFeed: f.switchboardFeed,
            feedType: Object.keys(f.feedType)[0],
            baseCurrency: f.baseCurrency,
            quoteCurrency: f.quoteCurrency,
            active: f.active,
            registeredAt: new Date(f.registeredAt.toNumber() * 1000),
        }));
    }
    // ── Utility: local quote simulation (no RPC) ──────────────────────────────
    /**
     * Simulate a mint quote locally without hitting the blockchain.
     * Useful for UI price previews — call this on every keystroke,
     * then call `getMintQuote` only on form submit.
     *
     * @param usdCents      - USD amount in cents (e.g. 10_000 = $100)
     * @param priceScaled   - Price * PRICE_SCALE (e.g. 5_720_000 = 5.72)
     * @param feedType      - Feed interpretation strategy
     * @param mintFeeBps    - Mint fee in basis points (e.g. 30 = 0.3%)
     * @param cpiMultiplier - CPI multiplier * CPI_SCALE (default 1_000_000 = 1.0)
     *
     * @returns Object with gross, fee, net token amounts, and human-readable price.
     *
     * @example
     * ```ts
     * // BRL/USD = 5.72, deposit $100, 0.3% fee
     * const preview = oracle.simulateMintQuote(10_000, 5_720_000, FeedType.Inverse, 30);
     * // preview.net ≈ 570_284_000 (570.284 BRLUSD tokens)
     * ```
     */
    simulateMintQuote(usdCents, priceScaled, feedType, mintFeeBps, cpiMultiplier = exports.CPI_SCALE) {
        let gross;
        switch (feedType) {
            case FeedType.Direct:
                gross = (usdCents * exports.TOKEN_SCALE * exports.PRICE_SCALE) / (priceScaled * 100);
                break;
            case FeedType.Inverse:
                gross = (usdCents * priceScaled * exports.TOKEN_SCALE) / (exports.PRICE_SCALE * 100);
                break;
            case FeedType.CpiIndexed:
                gross = (usdCents * exports.TOKEN_SCALE * exports.CPI_SCALE) / (100 * cpiMultiplier);
                break;
            default:
                throw new Error(`Unsupported feed type for simulation: ${feedType}`);
        }
        const fee = Math.floor(gross * mintFeeBps / 10_000);
        const net = Math.floor(gross - fee);
        return {
            gross: Math.floor(gross),
            fee,
            net,
            priceHuman: priceScaled / exports.PRICE_SCALE,
        };
    }
    /**
     * Simulate a redeem quote locally without hitting the blockchain.
     *
     * @param tokenAmount   - Token amount in base units (e.g. 572_000_000 = 572 tokens)
     * @param priceScaled   - Price * PRICE_SCALE
     * @param feedType      - Feed interpretation strategy
     * @param redeemFeeBps  - Redeem fee in basis points
     * @param cpiMultiplier - CPI multiplier * CPI_SCALE
     *
     * @example
     * ```ts
     * const preview = oracle.simulateRedeemQuote(572_000_000, 5_720_000, FeedType.Inverse, 30);
     * // preview.net ≈ 9_970 ($99.70 after 0.3% fee)
     * ```
     */
    simulateRedeemQuote(tokenAmount, priceScaled, feedType, redeemFeeBps, cpiMultiplier = exports.CPI_SCALE) {
        let gross;
        switch (feedType) {
            case FeedType.Direct:
                gross = (tokenAmount * priceScaled * 100) / (exports.TOKEN_SCALE * exports.PRICE_SCALE);
                break;
            case FeedType.Inverse:
                gross = (tokenAmount * exports.PRICE_SCALE * 100) / (exports.TOKEN_SCALE * priceScaled);
                break;
            case FeedType.CpiIndexed:
                gross = (tokenAmount * cpiMultiplier * 100) / (exports.TOKEN_SCALE * exports.CPI_SCALE);
                break;
            default:
                throw new Error(`Unsupported feed type for simulation: ${feedType}`);
        }
        const fee = Math.floor(gross * redeemFeeBps / 10_000);
        const net = Math.floor(gross - fee);
        return {
            gross: Math.floor(gross),
            fee,
            net,
            priceHuman: priceScaled / exports.PRICE_SCALE,
        };
    }
    // ── Private helpers ────────────────────────────────────────────────────────
    buildProgram(signer, _programId) {
        // After `anchor build` generates the IDL, uncomment:
        // import oracleIdl from '../../target/idl/sss_oracle.json';
        // const wallet   = new NodeWallet(signer);
        // const provider = new AnchorProvider(this.connection, wallet, { commitment: 'confirmed' });
        // return new Program(oracleIdl as any, provider);
        // Placeholder — replace with real Program init after IDL generation
        return { methods: {}, account: {} };
    }
    readProgram(_programId) {
        // After IDL generation:
        // return new Program(oracleIdl as any, { connection: this.connection });
        return { account: {} };
    }
    encodeFeedType(feedType) {
        switch (feedType) {
            case FeedType.Direct: return { direct: {} };
            case FeedType.Inverse: return { inverse: {} };
            case FeedType.CpiIndexed: return { cpiIndexed: {} };
            case FeedType.Custom: return { custom: { numerator: new anchor_1.BN(1), denominator: new anchor_1.BN(1), baseType: 0 } };
            default: return { direct: {} };
        }
    }
    async getFeedAddress(programId, symbol) {
        const feeds = await this.listFeeds(programId);
        const feed = feeds.find(f => f.symbol === symbol);
        if (!feed)
            throw new Error(`Feed not found in registry: ${symbol}`);
        return feed.switchboardFeed;
    }
}
exports.OracleModule = OracleModule;
/**
 * Convenience factory for common peg types.
 *
 * @example
 * ```ts
 * const brlOracle = OraclePresets.brl();
 * ```
 */
exports.OraclePresets = {
    brl: (network = types_1.SolanaNetwork.DEVNET) => new OracleModule(network),
    eur: (network = types_1.SolanaNetwork.DEVNET) => new OracleModule(network),
    cpi: (network = types_1.SolanaNetwork.DEVNET) => new OracleModule(network),
};
exports.default = OracleModule;
//# sourceMappingURL=oracle.js.map