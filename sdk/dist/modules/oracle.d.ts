import { PublicKey, Keypair } from '@solana/web3.js';
import { SolanaNetwork } from '../types';
export declare const PRICE_SCALE = 1000000;
export declare const CPI_SCALE = 1000000;
export declare const TOKEN_SCALE = 1000000;
/**
 * Price feed interpretation strategy.
 *
 * - `Direct`: price = USD per 1 unit of base currency (EUR, GBP, CHF).
 * - `Inverse`: price = base units per 1 USD (BRL, JPY, MXN).
 * - `CpiIndexed`: purchasing power token adjusted by stored CPI multiplier.
 * - `Custom`: arbitrary scaling for exotic pegs.
 */
export declare enum FeedType {
    Direct = "direct",
    Inverse = "inverse",
    CpiIndexed = "cpiIndexed",
    Custom = "custom"
}
export declare const KNOWN_FEEDS: Record<string, {
    devnet: string;
    mainnet: string;
    type: FeedType;
}>;
/** Parameters for registering a new price feed. */
export interface RegisterFeedParams {
    symbol: string;
    feedType: FeedType;
    baseCurrency: string;
    quoteCurrency: string;
    decimals: number;
    switchboardFeed: PublicKey;
}
/** Parameters for initializing oracle config for a mint. */
export interface InitializeOracleParams {
    mint: PublicKey;
    feedSymbol: string;
    description: string;
    maxStalenessSecs: number;
    mintFeeBps: number;
    redeemFeeBps: number;
    maxConfidenceBps: number;
    quoteValiditySecs: number;
    cpiMultiplier: number;
    cpiMinUpdateInterval: number;
    cpiDataSource: string;
}
/** Parameters for requesting a quote. */
export interface QuoteRequest {
    /** Input amount: USD cents for mint, token base units for redeem. */
    inputAmount: number;
    /** Minimum acceptable output (slippage floor). */
    minOutput: number;
    /** Unique nonce per quote — use Date.now() or random. */
    nonce: bigint;
}
/** Result of a quote request. */
export interface QuoteResult {
    outputAmount: number;
    feeAmount: number;
    priceUsed: number;
    priceHuman: number;
    validUntil: Date;
    quoteAccount: PublicKey;
}
/** Read-only snapshot of an oracle config. */
export interface OracleInfo {
    mint: PublicKey;
    feedSymbol: string;
    description: string;
    mintFeeBps: number;
    redeemFeeBps: number;
    cpiMultiplier: number;
    cpiLastUpdated: Date;
    paused: boolean;
    pauseReason: string;
    totalMintedUsd: bigint;
    totalRedeemedUsd: bigint;
    totalFees: bigint;
}
/** Read-only snapshot of a registered feed. */
export interface FeedInfo {
    symbol: string;
    switchboardFeed: PublicKey;
    feedType: string;
    baseCurrency: string;
    quoteCurrency: string;
    active: boolean;
    registeredAt: Date;
}
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
export declare class OracleModule {
    private connection;
    private network;
    constructor(network?: SolanaNetwork);
    /**
     * Derive the global FeedRegistry PDA.
     *
     * @example
     * ```ts
     * const [registryPda] = OracleModule.findRegistryPda(programId);
     * ```
     */
    static findRegistryPda(programId: PublicKey): [PublicKey, number];
    /**
     * Derive the OracleConfig PDA for a specific mint.
     *
     * @example
     * ```ts
     * const [oraclePda] = OracleModule.findOracleConfigPda(mintAddress, programId);
     * ```
     */
    static findOracleConfigPda(mint: PublicKey, programId: PublicKey): [PublicKey, number];
    /**
     * Derive the PendingQuote PDA.
     *
     * @example
     * ```ts
     * const nonce = BigInt(Date.now());
     * const [quotePda] = OracleModule.findQuotePda(mint, requester, nonce, programId);
     * ```
     */
    static findQuotePda(mint: PublicKey, requester: PublicKey, nonce: bigint, programId: PublicKey): [PublicKey, number];
    /**
     * Initialize the global feed registry. Called once per deployment.
     *
     * @example
     * ```ts
     * const txSig = await oracle.initializeRegistry(authority, programId);
     * console.log('Registry initialized:', txSig);
     * ```
     */
    initializeRegistry(authority: Keypair, programId: PublicKey): Promise<string>;
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
    registerFeed(authority: Keypair, programId: PublicKey, params: RegisterFeedParams): Promise<string>;
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
    initializeOracle(authority: Keypair, programId: PublicKey, params: InitializeOracleParams): Promise<string>;
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
    getMintQuote(requester: Keypair, programId: PublicKey, mint: PublicKey, params: QuoteRequest): Promise<QuoteResult>;
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
    getRedeemQuote(requester: Keypair, programId: PublicKey, mint: PublicKey, params: QuoteRequest): Promise<QuoteResult>;
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
    mintWithOracle(requester: Keypair, programId: PublicKey, mint: PublicKey, nonce: bigint): Promise<string>;
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
    updateCpiMultiplier(authority: Keypair, programId: PublicKey, mint: PublicKey, params: {
        newMultiplier: number;
        referenceMonth: string;
        dataSource: string;
    }): Promise<string>;
    /**
     * Fetch oracle config for a mint.
     *
     * @example
     * ```ts
     * const info = await oracle.getOracleInfo(programId, brlMint);
     * console.log(`Feed: ${info.feedSymbol}, Paused: ${info.paused}`);
     * ```
     */
    getOracleInfo(programId: PublicKey, mint: PublicKey): Promise<OracleInfo>;
    /**
     * List all registered feeds from the global registry.
     *
     * @example
     * ```ts
     * const feeds = await oracle.listFeeds(programId);
     * feeds.forEach(f => console.log(`${f.symbol}: ${f.feedType}`));
     * ```
     */
    listFeeds(programId: PublicKey): Promise<FeedInfo[]>;
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
    simulateMintQuote(usdCents: number, priceScaled: number, feedType: FeedType, mintFeeBps: number, cpiMultiplier?: number): {
        gross: number;
        fee: number;
        net: number;
        priceHuman: number;
    };
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
    simulateRedeemQuote(tokenAmount: number, priceScaled: number, feedType: FeedType, redeemFeeBps: number, cpiMultiplier?: number): {
        gross: number;
        fee: number;
        net: number;
        priceHuman: number;
    };
    private buildProgram;
    private readProgram;
    private encodeFeedType;
    private getFeedAddress;
}
/**
 * Convenience factory for common peg types.
 *
 * @example
 * ```ts
 * const brlOracle = OraclePresets.brl();
 * ```
 */
export declare const OraclePresets: {
    brl: (network?: SolanaNetwork) => OracleModule;
    eur: (network?: SolanaNetwork) => OracleModule;
    cpi: (network?: SolanaNetwork) => OracleModule;
};
export default OracleModule;
