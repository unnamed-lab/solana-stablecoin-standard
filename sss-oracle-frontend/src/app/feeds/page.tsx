'use client';

import { useState } from 'react';
import { feedsApi, ApiError } from '@/lib/api';
import { useFeeds } from '@/hooks/use-oracle';
import { FeedCard } from '@/components/oracle/feed-card';
import { useWallet } from '@solana/wallet-adapter-react';

export default function PriceFeedsPage() {
    const { feeds, loading, error: fetchError, refetch } = useFeeds();
    const { connected } = useWallet();

    const [symbol, setSymbol] = useState('');
    const [feedType, setFeedType] = useState('0');
    const [baseCurrency, setBaseCurrency] = useState('USD');
    const [quoteCurrency, setQuoteCurrency] = useState('USD');
    const [decimals, setDecimals] = useState('8');
    const [switchboardFeed, setSwitchboardFeed] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!connected) {
            setError('Please connect your wallet to perform admin actions.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await feedsApi.register({
                symbol,
                feedType: parseInt(feedType, 10),
                baseCurrency,
                quoteCurrency,
                decimals: parseInt(decimals, 10),
                switchboardFeed,
            });
            setSuccess(`Feed ${symbol} registered successfully!`);
            setSymbol('');
            setSwitchboardFeed('');
            refetch();
        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(`Error ${err.status}: ${err.message}`);
            } else {
                setError(err.message || 'Unknown error occurred');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h2 className="m-0 mb-2 text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">PRICE FEEDS</h2>
                <p className="m-0 text-[#94A3B8]">Register and monitor Switchboard data feeds</p>
            </header>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Registration Form */}
                <div className="flex flex-col self-start rounded-lg border border-[#2A2A2A] bg-[#111111] p-8 md:col-span-1">
                    <h3 className="mb-6 border-b border-[#2A2A2A] pb-2 text-lg">REGISTER NEW FEED</h3>

                    {error && <div className="mb-4 rounded bg-[#EF4444]/15 p-3 text-sm text-[#EF4444]">{error}</div>}
                    {success && <div className="mb-4 rounded bg-[#10B981]/15 p-3 text-sm text-[#10B981]">{success}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="label mb-2 block text-xs text-[#94A3B8]">SYMBOL (e.g. BRLUSD)</label>
                            <input type="text" className="w-full" value={symbol} onChange={e => setSymbol(e.target.value)} required />
                        </div>
                        <div>
                            <label className="label mb-2 block text-xs text-[#94A3B8]">SWITCHBOARD FEED ADDRESS</label>
                            <input type="text" className="w-full font-mono" value={switchboardFeed} onChange={e => setSwitchboardFeed(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">BASE CURRENCY</label>
                                <input type="text" className="w-full" value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">QUOTE CURRENCY</label>
                                <input type="text" className="w-full" value={quoteCurrency} onChange={e => setQuoteCurrency(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">FEED TYPE</label>
                                <select className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-2 rounded" value={feedType} onChange={e => setFeedType(e.target.value)}>
                                    <option value="0">Pull Oracle</option>
                                    <option value="1">Push Oracle</option>
                                </select>
                            </div>
                            <div>
                                <label className="label mb-2 block text-xs text-[#94A3B8]">DECIMALS</label>
                                <input type="number" className="w-full" value={decimals} onChange={e => setDecimals(e.target.value)} required min="0" />
                            </div>
                        </div>
                        <button type="submit" className="primary mt-4" disabled={submitting || !connected}>
                            {!connected ? 'CONNECT WALLET TO REGISTER' : submitting ? 'REGISTERING...' : 'REGISTER FEED'}
                        </button>
                    </form>
                </div>

                {/* Existing Feeds */}
                <div className="md:col-span-2">
                    <h3 className="label mb-4 text-[#94A3B8]">ACTIVE FEEDS ({feeds.length})</h3>
                    {loading && !feeds.length ? (
                        <div className="p-8 text-center text-[#94A3B8]">Loading feeds...</div>
                    ) : fetchError ? (
                        <div className="rounded bg-[#EF4444]/15 p-4 text-[#EF4444]">
                            Could not load feeds. Backend might be offline.
                        </div>
                    ) : feeds.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#2A2A2A] p-12 text-center text-[#94A3B8]">
                            No feeds registered yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                            {feeds.map((feed, idx) => (
                                <FeedCard key={feed.address || idx} feed={feed} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
