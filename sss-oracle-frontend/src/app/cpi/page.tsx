'use client';

import { useState } from 'react';
import { cpiApi, ApiError } from '@/lib/api';

export default function CpiAdminPage() {
    const [mint, setMint] = useState('');
    const [multiplier, setMultiplier] = useState('1.05'); // E.g., 5% inflation
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await cpiApi.update({
                mint,
                cpiMultiplier: parseFloat(multiplier),
            });
            setSuccess(`CPI Multiplier updated for mint ${mint}`);
            setMint('');
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
                <h2 className="m-0 mb-2 text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">CPI INDEX ADMIN</h2>
                <p className="m-0 text-[#94A3B8]">Broadcast official CPI multiplier updates to the on-chain config</p>
            </header>

            <div className="max-w-[600px] rounded-lg border border-[#2A2A2A] bg-[#111111] p-8">
                <h3 className="mb-6 border-b border-[#2A2A2A] pb-2 text-lg text-[#F8FAFC]">UPDATE CONSUMER PRICE INDEX</h3>

                {error && <div className="mb-4 rounded bg-[#EF4444]/15 p-3 text-sm text-[#EF4444]">{error}</div>}
                {success && <div className="mb-4 rounded bg-[#10B981]/15 p-3 text-sm text-[#10B981]">{success}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="label mb-2 block text-xs text-[#94A3B8]">MINT ADDRESS</label>
                        <input
                            type="text"
                            className="w-full font-mono"
                            value={mint}
                            onChange={e => setMint(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label mb-2 block text-xs text-[#94A3B8]">NEW MULTIPLIER (e.g., 1.05 for +5%)</label>
                        <input
                            type="number"
                            className="w-full"
                            value={multiplier}
                            onChange={e => setMultiplier(e.target.value)}
                            required
                            step="0.0001"
                            min="0.1"
                        />
                    </div>
                    <button type="submit" className="primary mt-2" disabled={submitting}>
                        {submitting ? 'TRANSMITTING...' : 'UPDATE & BROADCAST'}
                    </button>
                </form>
            </div>
        </div>
    );
}
