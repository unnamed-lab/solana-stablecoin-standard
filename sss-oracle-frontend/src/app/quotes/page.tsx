'use client';

import { useState } from 'react';
import { useMintQuote, useRedeemQuote } from '@/hooks/use-oracle';

export default function QuotesPage() {
    const [activeTab, setActiveTab] = useState<'MINT' | 'REDEEM'>('MINT');
    const [mintAddress, setMintAddress] = useState('GvpepA4CQSRCBzAGt2cARL5A92zP2KqSt2K12fX5S2E'); // Default placeholder

    // Mint state
    const [usdAmount, setUsdAmount] = useState('100');
    const { result: mintQuote, loading: mintLoading, error: mintError } = useMintQuote(
        usdAmount ? parseFloat(usdAmount) * 100 : 0,
        mintAddress
    );

    // Redeem state
    const [tokenAmount, setTokenAmount] = useState('100');
    const { result: redeemQuote, loading: redeemLoading, error: redeemError } = useRedeemQuote(
        tokenAmount ? parseFloat(tokenAmount) * 1000000 : 0, // Assuming 6 decimals for token base units placeholder
        mintAddress
    );

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h2 className="m-0 mb-2 text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">QUOTE SIMULATOR</h2>
                <p className="m-0 text-[#94A3B8]">Live simulation of mint and redeem rates powered by oracle feeds</p>
            </header>

            <div className="max-w-[600px] overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#111111]">

                {/* Tabs */}
                <div className="flex border-b border-[#2A2A2A]">
                    <button
                        className={`flex-1 rounded-none border-0 border-b-2 p-4 transition-all ${activeTab === 'MINT'
                            ? 'border-[#A855F7] bg-[#1A1A1A] font-bold text-[#A855F7]'
                            : 'border-transparent bg-transparent font-normal text-[#94A3B8]'
                            }`}
                        onClick={() => setActiveTab('MINT')}
                    >
                        MINT STABLECOIN
                    </button>
                    <button
                        className={`flex-1 rounded-none border-0 border-b-2 p-4 transition-all ${activeTab === 'REDEEM'
                            ? 'border-[#A855F7] bg-[#1A1A1A] font-bold text-[#A855F7]'
                            : 'border-transparent bg-transparent font-normal text-[#94A3B8]'
                            }`}
                        onClick={() => setActiveTab('REDEEM')}
                    >
                        REDEEM STABLECOIN
                    </button>
                </div>

                <div className="p-8">
                    <div className="mb-6">
                        <label className="label mb-2 block text-xs text-[#94A3B8]">STABLECOIN MINT ADDRESS</label>
                        <input
                            type="text"
                            className="w-full font-mono"
                            value={mintAddress}
                            onChange={e => setMintAddress(e.target.value)}
                        />
                    </div>

                    {activeTab === 'MINT' ? (
                        <div>
                            <div className="mb-6">
                                <label className="label mb-2 block text-xs text-[#94A3B8]">COLLATERAL AMOUNT (USD)</label>
                                <div className="flex items-center rounded border border-[#2A2A2A] bg-[#0A0A0A]">
                                    <span className="px-4 py-3 text-[#94A3B8]">$</span>
                                    <input
                                        type="number"
                                        className="flex-1 border-none bg-transparent pl-0 text-xl focus:shadow-none focus:ring-0"
                                        value={usdAmount}
                                        onChange={e => setUsdAmount(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="relative rounded border border-[#2A2A2A] bg-[#0A0A0A] p-6">
                                <div className="label mb-2 text-xs text-[#94A3B8]">EXPECTED RETURN</div>

                                {mintLoading ? (
                                    <div className="opacity-70 text-[#A855F7]">Simulating...</div>
                                ) : mintError ? (
                                    <div className="text-sm text-[#EF4444]">Error: {(mintError as any).message || 'Calculation failed'}</div>
                                ) : mintQuote ? (
                                    <div>
                                        <div className="text-3xl font-bold text-[#10B981] [font-family:var(--font-syne)]">
                                            {(mintQuote.expectedTokens / 1000000).toFixed(6)} SSS
                                        </div>
                                        <div className="label mt-2 text-xs text-[#94A3B8]">
                                            FEE: ${(mintQuote.feeCents / 100).toFixed(2)} | EXCHANGE RATE: {mintQuote.exchangeRate}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[#94A3B8]">Enter amount to simulate</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-6">
                                <label className="label mb-2 block text-xs text-[#94A3B8]">STABLECOIN AMOUNT TO REDEEM</label>
                                <div className="flex items-center rounded border border-[#2A2A2A] bg-[#0A0A0A]">
                                    <input
                                        type="number"
                                        className="flex-1 border-none bg-transparent text-xl focus:shadow-none focus:ring-0"
                                        value={tokenAmount}
                                        onChange={e => setTokenAmount(e.target.value)}
                                        min="0"
                                        step="1"
                                    />
                                    <span className="px-4 py-3 text-[#94A3B8]">SSS</span>
                                </div>
                            </div>

                            <div className="rounded border border-[#2A2A2A] bg-[#0A0A0A] p-6">
                                <div className="label mb-2 text-xs text-[#94A3B8]">EXPECTED RETURN (USD)</div>

                                {redeemLoading ? (
                                    <div className="opacity-70 text-[#A855F7]">Simulating...</div>
                                ) : redeemError ? (
                                    <div className="text-sm text-[#EF4444]">Error: {(redeemError as any).message || 'Calculation failed'}</div>
                                ) : redeemQuote ? (
                                    <div>
                                        <div className="text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">
                                            ${(redeemQuote.expectedUsdCents / 100).toFixed(2)}
                                        </div>
                                        <div className="label mt-2 text-xs text-[#94A3B8]">
                                            FEE: ${(redeemQuote.feeCents / 100).toFixed(2)} | EXCHANGE RATE: {redeemQuote.exchangeRate}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[#94A3B8]">Enter amount to simulate</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
