export function FeedCard({ feed }: { feed: any }) {
    // A dark terminal style card for feed status
    const isHealthy = feed.healthy !== false; // placeholder logic

    return (
        <div className="relative overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#111111] p-6">
            <div className={`absolute left-0 top-0 h-full w-1 ${isHealthy ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />

            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="mb-2 mt-0 text-2xl text-[#A855F7]">
                        {feed.symbol || 'UNKNOWN'}
                    </h3>
                    <div className="label text-xs text-[#94A3B8]">
                        {feed.address ? `${feed.address.slice(0, 8)}...${feed.address.slice(-8)}` : 'N/A'}
                    </div>
                </div>
                <div className={`label rounded px-2 py-1 text-xs font-bold ${isHealthy ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'}`}>
                    {isHealthy ? 'ACTIVE' : 'STALE'}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                    <div className="label text-[0.7rem] text-[#94A3B8]">CONFIDENCE INT.</div>
                    <div className="font-semibold">{feed.confidenceInterval != null ? `±$${feed.confidenceInterval}` : '--'}</div>
                </div>
                <div>
                    <div className="label text-[0.7rem] text-[#94A3B8]">MAX STALENESS</div>
                    <div className="font-semibold">{feed.maxStaleness != null ? `${feed.maxStaleness}s` : '--'}</div>
                </div>
            </div>
        </div>
    );
}
