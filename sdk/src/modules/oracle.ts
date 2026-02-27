import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
} from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import { SolanaNetwork } from '../types';
import oracleIdl from '../idl/sss_oracle.json';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { parseProgramError } from '../errors';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PRICE_SCALE = 1_000_000;
export const CPI_SCALE   = 1_000_000;
export const TOKEN_SCALE  = 1_000_000;

const NETWORK_RPC: Record<SolanaNetwork, string> = {
    [SolanaNetwork.DEVNET]:   "https://api.devnet.solana.com",
    [SolanaNetwork.MAINNET]:  "https://api.mainnet-beta.solana.com",
    [SolanaNetwork.TESTNET]:  "https://api.testnet.solana.com",
    [SolanaNetwork.LOCALNET]: "http://127.0.0.1:8899",
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
export enum FeedType {
    Direct      = 'direct',
    Inverse     = 'inverse',
    CpiIndexed  = 'cpiIndexed',
    Custom      = 'custom',
}

// ─── Known Switchboard feed addresses on devnet ──────────────────────────────

export const KNOWN_FEEDS: Record<string, { devnet: string; mainnet: string; type: FeedType }> = {
    BRLUSD: {
        devnet:  "8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb",
        mainnet: "",
        type:    FeedType.Inverse,
    },
    EURUSD: {
        devnet:  "9VADNiXpGFhQaMGV8dfXBnmhbX2LHVW3FRGpYMH4vW8q",
        mainnet: "",
        type:    FeedType.Direct,
    },
};

/** Parameters for registering a new price feed. */
export interface RegisterFeedParams {
    symbol:          string;
    feedType:        FeedType;
    baseCurrency:    string;
    quoteCurrency:   string;
    decimals:        number;
    switchboardFeed: PublicKey;
}

/** Parameters for initializing oracle config for a mint. */
export interface InitializeOracleParams {
    mint:                   PublicKey;
    feedSymbol:             string;
    description:            string;
    maxStalenessSecs:       number;
    mintFeeBps:             number;
    redeemFeeBps:           number;
    maxConfidenceBps:       number;
    quoteValiditySecs:      number;
    cpiMultiplier:          number;
    cpiMinUpdateInterval:   number;
    cpiDataSource:          string;
}

/** Parameters for requesting a quote. */
export interface QuoteRequest {
    /** Input amount: USD cents for mint, token base units for redeem. */
    inputAmount: number;
    /** Minimum acceptable output (slippage floor). */
    minOutput:   number;
    /** Unique nonce per quote — use Date.now() or random. */
    nonce:       bigint;
}

/** Result of a quote request. */
export interface QuoteResult {
    outputAmount:  number;
    feeAmount:     number;
    priceUsed:     number;
    priceHuman:    number;
    validUntil:    Date;
    quoteAccount:  PublicKey;
}

/** Read-only snapshot of an oracle config. */
export interface OracleInfo {
    mint:              PublicKey;
    feedSymbol:        string;
    description:       string;
    mintFeeBps:        number;
    redeemFeeBps:      number;
    cpiMultiplier:     number;
    cpiLastUpdated:    Date;
    paused:            boolean;
    pauseReason:       string;
    totalMintedUsd:    bigint;
    totalRedeemedUsd:  bigint;
    totalFees:         bigint;
}

/** Read-only snapshot of a registered feed. */
export interface FeedInfo {
    symbol:          string;
    switchboardFeed: PublicKey;
    feedType:        string;
    baseCurrency:    string;
    quoteCurrency:   string;
    active:          boolean;
    registeredAt:    Date;
}

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
export class OracleModule {
    private connection: Connection;
    private network: SolanaNetwork;

    constructor(network: SolanaNetwork = SolanaNetwork.DEVNET) {
        this.network    = network;
        this.connection = new Connection(NETWORK_RPC[network], 'confirmed');
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
    static findRegistryPda(programId: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("sss-feed-registry")],
            programId,
        );
    }

    /**
     * Derive the OracleConfig PDA for a specific mint.
     *
     * @example
     * ```ts
     * const [oraclePda] = OracleModule.findOracleConfigPda(mintAddress, programId);
     * ```
     */
    static findOracleConfigPda(mint: PublicKey, programId: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("sss-oracle"), mint.toBuffer()],
            programId,
        );
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
    static findQuotePda(
        mint:       PublicKey,
        requester:  PublicKey,
        nonce:      bigint,
        programId:  PublicKey,
    ): [PublicKey, number] {
        const nonceBuffer = Buffer.alloc(8);
        nonceBuffer.writeBigUInt64LE(nonce);
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("sss-quote"),
                mint.toBuffer(),
                requester.toBuffer(),
                nonceBuffer,
            ],
            programId,
        );
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
    async initializeRegistry(authority: Keypair, programId: PublicKey): Promise<string> {
        const program = this.buildProgram(authority, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);

        try {
            return await program.methods
                .initializeRegistry()
                .accounts({
                    payer:         authority.publicKey,
                    authority:     authority.publicKey,
                    registry:      registryPda,
                    systemProgram: SystemProgram.programId,
                } as any)
                .signers([authority])
                .rpc();
        } catch (e) {
            throw parseProgramError(e, true);
        }
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
    async registerFeed(
        authority:  Keypair,
        programId:  PublicKey,
        params:     RegisterFeedParams,
    ): Promise<string> {
        const program = this.buildProgram(authority, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);

        try {
            return await program.methods
                .registerFeed({
                    symbol:         params.symbol,
                    feedType:       this.encodeFeedType(params.feedType),
                    baseCurrency:   params.baseCurrency,
                    quoteCurrency:  params.quoteCurrency,
                    decimals:       params.decimals,
                })
                .accounts({
                    payer:           authority.publicKey,
                    authority:       authority.publicKey,
                    registry:        registryPda,
                    switchboardFeed: params.switchboardFeed,
                    systemProgram:   SystemProgram.programId,
                } as any)
                .signers([authority])
                .rpc();
        } catch (e) {
            throw parseProgramError(e, true);
        }
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
    async initializeOracle(
        authority:  Keypair,
        programId:  PublicKey,
        params:     InitializeOracleParams,
    ): Promise<string> {
        const program = this.buildProgram(authority, programId);
        const [oraclePda]   = OracleModule.findOracleConfigPda(params.mint, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);

        try {
            return await program.methods
                .initializeOracle({
                    feedSymbol:            params.feedSymbol,
                    description:           params.description,
                    maxStalenessSecs:      new BN(params.maxStalenessSecs),
                    mintFeeBps:            params.mintFeeBps,
                    redeemFeeBps:          params.redeemFeeBps,
                    maxConfidenceBps:      params.maxConfidenceBps,
                    quoteValiditySecs:     new BN(params.quoteValiditySecs),
                    cpiMultiplier:         new BN(params.cpiMultiplier),
                    cpiMinUpdateInterval:  new BN(params.cpiMinUpdateInterval),
                    cpiDataSource:         params.cpiDataSource,
                })
                .accounts({
                    payer:         authority.publicKey,
                    authority:     authority.publicKey,
                    mint:          params.mint,
                    oracleConfig:  oraclePda,
                    registry:      registryPda,
                    systemProgram: SystemProgram.programId,
                } as any)
                .signers([authority])
                .rpc();
        } catch (e) {
            throw parseProgramError(e, true);
        }
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
    async getMintQuote(
        requester:  Keypair,
        programId:  PublicKey,
        mint:       PublicKey,
        params:     QuoteRequest,
    ): Promise<QuoteResult> {
        const program = this.buildProgram(requester, programId);
        const [oraclePda]   = OracleModule.findOracleConfigPda(mint, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        const [quotePda]    = OracleModule.findQuotePda(mint, requester.publicKey, params.nonce, programId);

        const oracleInfo  = await this.getOracleInfo(programId, mint);
        const feedAddress = await this.getFeedAddress(programId, oracleInfo.feedSymbol);

        try {
            await program.methods
                .getMintQuote({
                    inputAmount: new BN(params.inputAmount),
                    minOutput:   new BN(params.minOutput),
                    nonce:       new BN(params.nonce.toString()),
                })
                .accounts({
                    requester:       requester.publicKey,
                    oracleConfig:    oraclePda,
                    registry:        registryPda,
                    switchboardFeed: feedAddress,
                    quote:           quotePda,
                    systemProgram:   SystemProgram.programId,
                } as any)
                .signers([requester])
                .rpc();
        } catch (e) {
            throw parseProgramError(e, true);
        }

        const quoteData = await (program.account as any).pendingQuote.fetch(quotePda);

        return {
            outputAmount: quoteData.outputAmount.toNumber(),
            feeAmount:    quoteData.feeAmount.toNumber(),
            priceUsed:    quoteData.priceSnapshot.toNumber(),
            priceHuman:   quoteData.priceSnapshot.toNumber() / PRICE_SCALE,
            validUntil:   new Date(quoteData.validUntil.toNumber() * 1000),
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
    async getRedeemQuote(
        requester:  Keypair,
        programId:  PublicKey,
        mint:       PublicKey,
        params:     QuoteRequest,
    ): Promise<QuoteResult> {
        const program = this.buildProgram(requester, programId);
        const [oraclePda]   = OracleModule.findOracleConfigPda(mint, programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        const [quotePda]    = OracleModule.findQuotePda(mint, requester.publicKey, params.nonce, programId);

        const oracleInfo  = await this.getOracleInfo(programId, mint);
        const feedAddress = await this.getFeedAddress(programId, oracleInfo.feedSymbol);

        try {
            await program.methods
                .getRedeemQuote({
                    inputAmount: new BN(params.inputAmount),
                    minOutput:   new BN(params.minOutput),
                    nonce:       new BN(params.nonce.toString()),
                })
                .accounts({
                    requester:       requester.publicKey,
                    oracleConfig:    oraclePda,
                    registry:        registryPda,
                    switchboardFeed: feedAddress,
                    quote:           quotePda,
                    systemProgram:   SystemProgram.programId,
                } as any)
                .signers([requester])
                .rpc();
        } catch (e) {
            throw parseProgramError(e, true);
        }

        const quoteData = await (program.account as any).pendingQuote.fetch(quotePda);

        return {
            outputAmount: quoteData.outputAmount.toNumber(),
            feeAmount:    quoteData.feeAmount.toNumber(),
            priceUsed:    quoteData.priceSnapshot.toNumber(),
            priceHuman:   quoteData.priceSnapshot.toNumber() / PRICE_SCALE,
            validUntil:   new Date(quoteData.validUntil.toNumber() * 1000),
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
    async mintWithOracle(
        requester:  Keypair,
        programId:  PublicKey,
        mint:       PublicKey,
        nonce:      bigint,
    ): Promise<string> {
        const program = this.buildProgram(requester, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        const [quotePda]  = OracleModule.findQuotePda(mint, requester.publicKey, nonce, programId);

        return await program.methods
            .mintWithOracle()
            .accounts({
                requester:    requester.publicKey,
                oracleConfig: oraclePda,
                quote:        quotePda,
            } as any)
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
    async updateCpiMultiplier(
        authority:  Keypair,
        programId:  PublicKey,
        mint:       PublicKey,
        params: {
            newMultiplier:   number;
            referenceMonth:  string;
            dataSource:      string;
        },
    ): Promise<string> {
        const program = this.buildProgram(authority, programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);

        return await program.methods
            .updateCpiMultiplier({
                newMultiplier:   new BN(params.newMultiplier),
                referenceMonth:  params.referenceMonth,
                dataSource:      params.dataSource,
            })
            .accounts({
                authority:    authority.publicKey,
                oracleConfig: oraclePda,
            } as any)
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
    async getOracleInfo(programId: PublicKey, mint: PublicKey): Promise<OracleInfo> {
        const program = this.readProgram(programId);
        const [oraclePda] = OracleModule.findOracleConfigPda(mint, programId);
        const data = await (program.account as any).oracleConfig.fetch(oraclePda);

        return {
            mint:             data.mint,
            feedSymbol:       data.feedSymbol,
            description:      data.description,
            mintFeeBps:       data.mintFeeBps,
            redeemFeeBps:     data.redeemFeeBps,
            cpiMultiplier:    data.cpiMultiplier.toNumber(),
            cpiLastUpdated:   new Date(data.cpiLastUpdated.toNumber() * 1000),
            paused:           data.paused,
            pauseReason:      data.pauseReason,
            totalMintedUsd:   BigInt(data.totalMintedUsd.toString()),
            totalRedeemedUsd: BigInt(data.totalRedeemedUsd.toString()),
            totalFees:        BigInt(data.totalFeesCollected.toString()),
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
    async listFeeds(programId: PublicKey): Promise<FeedInfo[]> {
        const program = this.readProgram(programId);
        const [registryPda] = OracleModule.findRegistryPda(programId);
        const registry = await (program.account as any).feedRegistry.fetch(registryPda);

        return registry.feeds
            .filter((f: any) => f.active)
            .map((f: any) => ({
                symbol:          f.symbol,
                switchboardFeed: f.switchboardFeed,
                feedType:        Object.keys(f.feedType)[0],
                baseCurrency:    f.baseCurrency,
                quoteCurrency:   f.quoteCurrency,
                active:          f.active,
                registeredAt:    new Date(f.registeredAt.toNumber() * 1000),
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
    simulateMintQuote(
        usdCents:       number,
        priceScaled:    number,
        feedType:       FeedType,
        mintFeeBps:     number,
        cpiMultiplier:  number = CPI_SCALE,
    ): { gross: number; fee: number; net: number; priceHuman: number } {
        let gross: number;

        switch (feedType) {
            case FeedType.Direct:
                gross = (usdCents * TOKEN_SCALE * PRICE_SCALE) / (priceScaled * 100);
                break;

            case FeedType.Inverse:
                gross = (usdCents * priceScaled * TOKEN_SCALE) / (PRICE_SCALE * 100);
                break;

            case FeedType.CpiIndexed:
                gross = (usdCents * TOKEN_SCALE * CPI_SCALE) / (100 * cpiMultiplier);
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
            priceHuman: priceScaled / PRICE_SCALE,
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
    simulateRedeemQuote(
        tokenAmount:    number,
        priceScaled:    number,
        feedType:       FeedType,
        redeemFeeBps:   number,
        cpiMultiplier:  number = CPI_SCALE,
    ): { gross: number; fee: number; net: number; priceHuman: number } {
        let gross: number;

        switch (feedType) {
            case FeedType.Direct:
                gross = (tokenAmount * priceScaled * 100) / (TOKEN_SCALE * PRICE_SCALE);
                break;

            case FeedType.Inverse:
                gross = (tokenAmount * PRICE_SCALE * 100) / (TOKEN_SCALE * priceScaled);
                break;

            case FeedType.CpiIndexed:
                gross = (tokenAmount * cpiMultiplier * 100) / (TOKEN_SCALE * CPI_SCALE);
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
            priceHuman: priceScaled / PRICE_SCALE,
        };
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private buildProgram(signer: Keypair, _programId: PublicKey): any {
        const wallet   = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, { commitment: 'confirmed' });
        return new Program(oracleIdl as any, provider);
    }

    private readProgram(_programId: PublicKey): any {
        return new Program(oracleIdl as any, { connection: this.connection });
    }

    private encodeFeedType(feedType: FeedType): any {
        switch (feedType) {
            case FeedType.Direct:     return { direct: {} };
            case FeedType.Inverse:    return { inverse: {} };
            case FeedType.CpiIndexed: return { cpiIndexed: {} };
            case FeedType.Custom:     return { custom: { numerator: new BN(1), denominator: new BN(1), baseType: 0 } };
            default:                  return { direct: {} };
        }
    }

    private async getFeedAddress(programId: PublicKey, symbol: string): Promise<PublicKey> {
        const feeds = await this.listFeeds(programId);
        const feed  = feeds.find(f => f.symbol === symbol);
        if (!feed) throw new Error(`Feed not found in registry: ${symbol}`);
        return feed.switchboardFeed;
    }
}

/**
 * Convenience factory for common peg types.
 *
 * @example
 * ```ts
 * const brlOracle = OraclePresets.brl();
 * ```
 */
export const OraclePresets = {
    brl: (network: SolanaNetwork = SolanaNetwork.DEVNET) => new OracleModule(network),
    eur: (network: SolanaNetwork = SolanaNetwork.DEVNET) => new OracleModule(network),
    cpi: (network: SolanaNetwork = SolanaNetwork.DEVNET) => new OracleModule(network),
};

export default OracleModule;
