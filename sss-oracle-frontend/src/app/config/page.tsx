'use client';

import { useState } from 'react';
import { configApi, ApiError } from '@/lib/api';
import { useOracleConfig } from '@/hooks/use-oracle';
import { useWallet } from '@solana/wallet-adapter-react';

export default function ConfigPage() {
    // Config Init State
    const { connected } = useWallet();
    const [mint, setMint] = useState('');
    const [feedSymbol, setFeedSymbol] = useState('');
    const [description, setDescription] = useState('');
    const [maxStalenessSecs, setMaxStalenessSecs] = useState('120');
    const [mintFeeBps, setMintFeeBps] = useState('30');
    const [redeemFeeBps, setRedeemFeeBps] = useState('30');
    const [maxConfidenceBps, setMaxConfidenceBps] = useState('50');
    const [quoteValiditySecs, setQuoteValiditySecs] = useState('60');
    const [cpiMultiplier, setCpiMultiplier] = useState('');
    const [cpiMinUpdateInterval, setCpiMinUpdateInterval] = useState('');
    const [cpiDataSource, setCpiDataSource] = useState('');

    const [initSubmitting, setInitSubmitting] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [initSuccess, setInitSuccess] = useState<string | null>(null);

    // Config Lookup State
    const [lookupMint, setLookupMint] = useState('');
    const [activeMint, setActiveMint] = useState('');

    const { config, loading: lookupLoading, error: lookupError } = useOracleConfig(activeMint);

    const handleInitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connected) {
            setInitError('Please connect your wallet to initialize config.');
            return;
        }

        setInitSubmitting(true);
        setInitError(null);
        setInitSuccess(null);

        try {
            await configApi.initialize({
                mint,
                feedSymbol,
                description: description || undefined,
                maxStalenessSecs: parseInt(maxStalenessSecs, 10),
                mintFeeBps: parseInt(mintFeeBps, 10),
                redeemFeeBps: parseInt(redeemFeeBps, 10),
                maxConfidenceBps: parseInt(maxConfidenceBps, 10),
                quoteValiditySecs: parseInt(quoteValiditySecs, 10),
                cpiMultiplier: cpiMultiplier ? parseInt(cpiMultiplier, 10) : undefined,
                cpiMinUpdateInterval: cpiMinUpdateInterval ? parseInt(cpiMinUpdateInterval, 10) : undefined,
                cpiDataSource: cpiDataSource || undefined,
            });
            setInitSuccess(`Config initialized for mint ${mint}`);
            setMint('');
            setFeedSymbol('');
            setDescription('');
        } catch (err: any) {
            if (err instanceof ApiError) {
                setInitError(`Error ${err.status}: ${err.message}`);
            } else {
                setInitError(err.message || 'Unknown error occurred');
            }
        } finally {
            setInitSubmitting(false);
        }
    };

    const handleLookupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveMint(lookupMint);
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h2 className="m-0 mb-2 text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">ORACLE CONFIGURATION</h2>
                <p className="m-0 text-[#94A3B8]">Initialize and inspect program configurations</p>
            </header>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Init Config */}
                <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-8">
                    <h3 className="mb-6 border-b border-[#2A2A2A] pb-2 text-lg text-[#F8FAFC]">INITIALIZE CONFIG</h3>

                    {initError && <div className="mb-4 rounded bg-[#EF4444]/15 p-3 text-sm text-[#EF4444]">{initError}</div>}
                    {initSuccess && <div className="mb-4 rounded bg-[#10B981]/15 p-3 text-sm text-[#10B981]">{initSuccess}</div>}

                    <form onSubmit={handleInitSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label mb-2 block text-xs text-[#94A3B8]">MINT ADDRESS</label>
                                <input type="text" className="w-full font-mono" value={mint} onChange={e => setMint(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">FEED SYMBOL</label>
                                <input type="text" className="w-full" value={feedSymbol} onChange={e => setFeedSymbol(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">DESCRIPTION</label>
                                <input type="text" className="w-full" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">MAX STALENESS (s)</label>
                                <input type="number" className="w-full" value={maxStalenessSecs} onChange={e => setMaxStalenessSecs(e.target.value)} required min="1" />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">VALIDITY (s)</label>
                                <input type="number" className="w-full" value={quoteValiditySecs} onChange={e => setQuoteValiditySecs(e.target.value)} required min="1" />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">MINT FEE (BPS)</label>
                                <input type="number" className="w-full" value={mintFeeBps} onChange={e => setMintFeeBps(e.target.value)} required min="0" />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">REDEEM FEE (BPS)</label>
                                <input type="number" className="w-full" value={redeemFeeBps} onChange={e => setRedeemFeeBps(e.target.value)} required min="0" />
                            </div>
                            <div className="col-span-2">
                                <label className="label mb-2 block text-xs text-[#94A3B8]">MAX CONFIDENCE (BPS)</label>
                                <input type="number" className="w-full" value={maxConfidenceBps} onChange={e => setMaxConfidenceBps(e.target.value)} required min="0" />
                            </div>
                        </div>

                        <div className="border-t border-[#2A2A2A] pt-4 mt-2">
                            <h4 className="text-sm font-semibold text-[#F8FAFC] mb-4">OPTIONAL CPI SETTINGS</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label mb-2 block text-xs text-[#94A3B8]">MULTIPLIER (* 10^6)</label>
                                    <input type="number" className="w-full" value={cpiMultiplier} onChange={e => setCpiMultiplier(e.target.value)} />
                                </div>
                                <div>
                                    <label className="label mb-2 block text-xs text-[#94A3B8]">MIN UPDATE INT. (s)</label>
                                    <input type="number" className="w-full" value={cpiMinUpdateInterval} onChange={e => setCpiMinUpdateInterval(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="label mb-2 block text-xs text-[#94A3B8]">DATA SOURCE</label>
                                    <input type="text" className="w-full" value={cpiDataSource} onChange={e => setCpiDataSource(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="primary mt-4" disabled={initSubmitting || !connected}>
                            {!connected ? 'CONNECT WALLET TO INIT' : initSubmitting ? 'INITIALIZING...' : 'INITIALIZE CONFIG'}
                        </button>
                    </form>
                </div>

                {/* Lookup Config */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-8">
                        <h3 className="mb-6 border-b border-[#2A2A2A] pb-2 text-lg text-[#F8FAFC]">INSPECT CONFIG</h3>

                        <form onSubmit={handleLookupSubmit} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Enter Mint Address"
                                className="flex-1 font-mono"
                                value={lookupMint}
                                onChange={e => setLookupMint(e.target.value)}
                                required
                            />
                            <button type="submit" className="primary">LOOKUP</button>
                        </form>
                    </div>

                    {(activeMint || lookupLoading || lookupError) && (
                        <div className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-6">
                            <h4 className="label mb-4 text-[#A855F7]">RESULTS FOR: {activeMint.slice(0, 8)}...</h4>

                            {lookupLoading ? (
                                <div className="text-[#94A3B8]">Querying on-chain data...</div>
                            ) : lookupError ? (
                                <div className="text-[#EF4444]">
                                    Error fetching config: {(lookupError as any).message || 'Not found'}
                                </div>
                            ) : config ? (
                                <pre className="m-0 overflow-x-auto rounded bg-[#111111] p-4 text-sm">
                                    {JSON.stringify(config, null, 2)}
                                </pre>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
