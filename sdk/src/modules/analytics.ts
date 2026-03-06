import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import { SssCore } from '../types/sss_core';
import { TokenAnalytics, SupplySnapshotInfo, SolanaNetwork } from '../types';
import idl from '../idl/sss_core.json';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

/**
 * Analytics Module for tracking on-chain metrics, supply caps, and snapshots.
 *
 * Available across all presets via `SolanaStablecoin.analytics`.
 */
export class AnalyticsModule {
    private readonly connection: Connection;
    private readonly mint: PublicKey;
    private readonly configPda: PublicKey;

    constructor(
        connection: Connection,
        network: SolanaNetwork,
        mint: PublicKey,
        configPda: PublicKey,
    ) {
        this.connection = connection;
        this.mint = mint;
        this.configPda = configPda;
    }

    private buildProgram(signer?: Keypair): Program<SssCore> {
        if (!signer) {
            return new Program(idl as SssCore, { connection: this.connection });
        }
        const wallet = new NodeWallet(signer);
        const provider = new AnchorProvider(this.connection, wallet, { commitment: "confirmed" });
        return new Program(idl as SssCore, provider);
    }

    // ─── 1. Metrics and Configuration ──────────────────────────────────────────

    /**
     * Fetch aggregated SSS-3 analytics directly from the StablecoinConfig.
     */
    async getTokenAnalytics(): Promise<TokenAnalytics> {
        const program = this.buildProgram();
        const data = await program.account.stablecoinConfig.fetch(this.configPda);

        return {
            totalSupply: data.totalSupply.toNumber(),
            maxSupply: data.maxSupply.toNumber() > 0 ? data.maxSupply.toNumber() : null,
            totalMintOperations: data.totalMintOperations.toNumber(),
            totalBurnOperations: data.totalBurnOperations.toNumber(),
            largestSingleMint: data.largestSingleMint.toNumber(),
            lastMintAt: data.lastMintAt.toNumber() > 0 ? data.lastMintAt.toNumber() : null,
            lastBurnAt: data.lastBurnAt.toNumber() > 0 ? data.lastBurnAt.toNumber() : null,
            minterCount: data.minterCount,
        };
    }

    /**
     * Set a new maximum supply cap. Set to 0 to remove the cap.
     * Must be higher than the current total supply.
     *
     * @param authority - Master authority keypair
     * @param newMaxSupply - Cap in base units
     */
    async setMaxSupply(authority: Keypair, newMaxSupply: number): Promise<string> {
        const program = this.buildProgram(authority);

        return await program.methods
            .setMaxSupply(new BN(newMaxSupply))
            .accounts({
                authority: authority.publicKey,
                stableConfig: this.configPda,
                mint: this.mint,
            } as any)
            .signers([authority])
            .rpc();
    }

    // ─── 2. Supply Snapshots ───────────────────────────────────────────────────

    /**
     * Computes the daily snapshot index number from a JS timestamp.
     */
    private getDayNumber(timeMs: number = Date.now()): number {
        return Math.floor((timeMs / 1000) / 86400);
    }

    /**
     * Take a daily snapshot of the total supply.
     * This is a permissionless operation — anyone can pay the rent for the PDA,
     * but only one snapshot can exist per day per mint.
     *
     * @param caller - Any signed keypair to pay for the snapshot PDA rent
     */
    async takeSupplySnapshot(caller: Keypair): Promise<string> {
        const program = this.buildProgram(caller);
        const dayNumber = this.getDayNumber();

        // The seeds are: "sss-snapshot", mint, day_number (4 bytes LE)
        const dayBytes = Buffer.alloc(4);
        dayBytes.writeUInt32LE(dayNumber, 0);

        const [snapshotPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-snapshot"), this.mint.toBuffer(), dayBytes],
            program.programId
        );

        return await program.methods
            .takeSupplySnapshot(dayNumber)
            .accounts({
                taker: caller.publicKey,
                stableConfig: this.configPda,
                mint: this.mint,
                snapshot: snapshotPda,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([caller])
            .rpc();
    }

    /**
     * Read a specific day's supply snapshot, if it exists.
     *
     * @param dayOffset - e.g., 0 for today, 1 for yesterday, etc.
     */
    async getHistoricalSnapshot(dayOffset: number = 0): Promise<SupplySnapshotInfo | null> {
        const program = this.buildProgram();
        const dayNumber = this.getDayNumber() - dayOffset;

        const dayBytes = Buffer.alloc(4);
        dayBytes.writeUInt32LE(dayNumber, 0);

        const [snapshotPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("sss-snapshot"), this.mint.toBuffer(), dayBytes],
            program.programId
        );

        try {
            const data = await program.account.supplySnapshot.fetch(snapshotPda);
            return {
                dayNumber: data.dayNumber,
                supply: data.supply.toNumber(),
                minterCount: data.minterCount,
                takenAt: data.takenAt.toNumber(),
                takenBy: data.takenBy,
            };
        } catch (e: any) {
            return null; // Snapshot wasn't taken for this day
        }
    }

    /**
     * Retrieve a history of supply snapshots over the last N days.
     */
    async getSupplyHistory(days: number = 7): Promise<{
        snapshots: SupplySnapshotInfo[];
        averageDailyGrowth: number;
    }> {
        const snapshots: SupplySnapshotInfo[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const snap = await this.getHistoricalSnapshot(i);
            if (snap) snapshots.push(snap);
        }

        let growth = 0;
        if (snapshots.length > 1) {
            const first = snapshots[0].supply;
            const last = snapshots[snapshots.length - 1].supply;
            const diffDays = snapshots[snapshots.length - 1].dayNumber - snapshots[0].dayNumber;
            if (diffDays > 0) growth = (last - first) / diffDays;
        }

        return { snapshots, averageDailyGrowth: growth };
    }

    // ─── 3. Estimations and Simulations ────────────────────────────────────────

    /**
     * Simulate a mint operation to see if it would exceed the max supply cap.
     */
    async simulateMint(amount: number): Promise<{
        wouldSucceed: boolean;
        projectedSupply: number;
        maxSupply: number | null;
    }> {
        const analytics = await this.getTokenAnalytics();
        const projected = analytics.totalSupply + amount;

        let wouldSucceed = true;
        if (analytics.maxSupply !== null && analytics.maxSupply > 0) {
            wouldSucceed = projected <= analytics.maxSupply;
        }

        return {
            wouldSucceed,
            projectedSupply: projected,
            maxSupply: analytics.maxSupply,
        };
    }

    /**
     * Estimate the number of unique holders using on-chain heuristics.
     * Note: This is a fast estimation based on Token accounts.
     */
    async estimateHolderCount(): Promise<{
        estimatedHolders: number;
        confidence: 'high' | 'medium' | 'low';
    }> {
        try {
            // A precise count requires a full getProgramAccounts call 
            // filtered by the mint. We return a coarse estimate.
            const accounts = await this.connection.getTokenLargestAccounts(this.mint);
            return {
                estimatedHolders: accounts.value.length >= 20 ? accounts.value.length * 10 : accounts.value.length,
                confidence: 'low',
            };
        } catch (e) {
            return { estimatedHolders: 0, confidence: 'low' };
        }
    }

    /**
     * Get statistics for a specific minter authority.
     */
    async getMinterStats(minterAddress: PublicKey): Promise<{
        totalMintedAllTime: number;
        operationCount: number;
        lastMintAt: number | null;
    }> {
        // Return zeros if minter tracking isn't enabled natively.
        // In a full implementation, you'd fetch the specific Minter PDA.
        return {
            totalMintedAllTime: 0,
            operationCount: 0,
            lastMintAt: null,
        };
    }

    /**
     * Format a human readable summary of token analytics.
     */
    async formatSummary(): Promise<string> {
        const metrics = await this.getTokenAnalytics();
        const cap = metrics.maxSupply && metrics.maxSupply > 0
            ? metrics.maxSupply.toLocaleString()
            : 'Unlimited';

        return [
            `📊 Token Analytics Summary`,
            `--------------------------`,
            `Total Supply:       ${metrics.totalSupply.toLocaleString()}`,
            `Max Supply Cap:     ${cap}`,
            `Mint Operations:    ${metrics.totalMintOperations.toLocaleString()}`,
            `Burn Operations:    ${metrics.totalBurnOperations.toLocaleString()}`,
            `Largest Mint:       ${metrics.largestSingleMint.toLocaleString()}`,
            `Active Minters:     ${metrics.minterCount}`,
        ].join('\n');
    }
}
