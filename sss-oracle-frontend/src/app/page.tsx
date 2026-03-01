'use client';

import { useFeeds } from '@/hooks/use-oracle';
import { StatCard } from '@/components/oracle/stat-card';
import { RecentActivity } from '@/components/oracle/recent-activity';

export default function Dashboard() {
  const { feeds, loading, error } = useFeeds();

  const activeFeedsCount = feeds.filter(f => f.healthy !== false).length;
  const totalFeedsCount = feeds.length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="m-0 mb-2 text-3xl font-bold text-[#A855F7] [font-family:var(--font-syne)]">SYSTEM OVERVIEW</h2>
        <p className="m-0 text-[#94A3B8]">Real-time status of the SSS Oracle Infrastructure</p>
      </header>

      {error && (
        <div className="rounded border-l-4 border-l-[#EF4444] bg-[#EF4444]/15 p-4 text-[#EF4444]">
          <strong>Error connecting to backend:</strong> {error.message}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        <StatCard
          title="ACTIVE FEEDS"
          value={loading ? '...' : `${activeFeedsCount} / ${totalFeedsCount}`}
          status={activeFeedsCount > 0 && activeFeedsCount === totalFeedsCount ? 'positive' : totalFeedsCount > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          title="NETWORK"
          value={process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toUpperCase() || 'DEVNET'}
          status="positive"
        />
        <StatCard
          title="SYSTEM HEALTH"
          value={loading ? '...' : error ? 'DEGRADED' : 'OPTIMAL'}
          status={error ? 'negative' : loading ? 'neutral' : 'positive'}
        />
        <StatCard
          title="LAST SYNC"
          value={loading ? '...' : new Date().toLocaleTimeString()}
          status="neutral"
        />
      </div>

      <div>
        <RecentActivity />
      </div>
    </div>
  );
}
