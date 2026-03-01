'use client';

import { useState } from 'react';
import { useFeeds } from '@/hooks/use-oracle';
import { configApi } from '@/lib/api';

export default function RegistryPage() {
    const { feeds, loading, error, refetch } = useFeeds();
    const [initializing, setInitializing] = useState(false);

    const isUninitializedError = error && (
        (error as any).message?.includes('Account does not exist') ||
        (error as any).message?.includes('AccountNotInitialized')
    );

    const handleInitialize = async () => {
        setInitializing(true);
        try {
            await configApi.initializeRegistry();
            await refetch();
        } catch (err: any) {
            alert(`Failed to initialize registry: ${err.message || String(err)}`);
        } finally {
            setInitializing(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h2 className="m-0 mb-2 text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">FEED REGISTRY</h2>
                <p className="m-0 text-[#94A3B8]">Master list of all authorized oracle feeds</p>
            </header>

            <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#111111]">
                {loading && <div className="p-8 text-center text-[#94A3B8]">Loading registry...</div>}

                {error && !isUninitializedError && (
                    <div className="p-8 text-center text-[#EF4444]">
                        Error fetching feed registry: {(error as any).message || 'Connection failed'}
                    </div>
                )}

                {error && isUninitializedError && (
                    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center text-[#94A3B8]">
                        <p>The global feed registry has not been initialized for this network.</p>
                        <button
                            onClick={handleInitialize}
                            disabled={initializing}
                            className="rounded bg-[#A855F7] px-6 py-3 font-bold text-white transition-colors hover:bg-[#9333EA] disabled:opacity-50"
                        >
                            {initializing ? 'INITIALIZING...' : 'INITIALIZE REGISTRY'}
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="label border-b border-[#2A2A2A] bg-[#1A1A1A] text-xs text-[#94A3B8]">
                                <th className="px-6 py-4 font-normal">SYMBOL</th>
                                <th className="px-6 py-4 font-normal">FEED ADDRESS</th>
                                <th className="px-6 py-4 font-normal">CONF. INT</th>
                                <th className="px-6 py-4 font-normal">MAX STALENESS</th>
                                <th className="px-6 py-4 text-right font-normal">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeds.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[#94A3B8]">No feeds registered</td>
                                </tr>
                            ) : (
                                feeds.map((feed, idx) => (
                                    <tr key={feed.address || idx} className="border-b border-[#2A2A2A]">
                                        <td className="px-6 py-4 font-semibold text-[#A855F7]">{feed.symbol || 'UNKNOWN'}</td>
                                        <td className="px-6 py-4 font-mono text-sm">{feed.address}</td>
                                        <td className="px-6 py-4 text-[#94A3B8]">{feed.confidenceInterval != null ? `±$${feed.confidenceInterval}` : '--'}</td>
                                        <td className="px-6 py-4 text-[#94A3B8]">{feed.maxStaleness != null ? `${feed.maxStaleness}s` : '--'}</td>
                                        <td className={`label px-6 py-4 text-right text-sm font-bold ${feed.healthy !== false ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                                            {feed.healthy !== false ? 'ACTIVE' : 'STALE'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
