export function RecentActivity({ logs }: { logs?: any[] }) {
    const defaultLogs = [
        { id: 1, action: 'FEED_UPDATE', symbol: 'SOL/USD', time: '10s ago', status: 'SUCCESS' },
        { id: 2, action: 'QUOTE_MINT', symbol: 'USDC -> sUSD', time: '1m ago', status: 'SUCCESS' },
        { id: 3, action: 'CONFIG_UPDATE', symbol: 'CPI_MULTIPLIER', time: '5m ago', status: 'WARNING' },
        { id: 4, action: 'FEED_STALE', symbol: 'BRL/USD', time: '12m ago', status: 'ERROR' },
    ];

    const displayLogs = logs || defaultLogs;

    const getStatusColor = (status: string) => {
        if (status === 'SUCCESS') return 'text-[#10B981]';
        if (status === 'ERROR') return 'text-[#EF4444]';
        if (status === 'WARNING') return 'text-[#A855F7]';
        return 'text-[#94A3B8]';
    };

    return (
        <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#111111]">
            <div className="border-b border-[#2A2A2A] bg-[#1A1A1A] px-6 py-4">
                <h3 className="m-0 text-base">SYSTEM EVENT LOG</h3>
            </div>
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="label border-b border-[#2A2A2A] text-xs text-[#94A3B8]">
                        <th className="px-6 py-4 font-normal">ACTION</th>
                        <th className="px-6 py-4 font-normal">TARGET</th>
                        <th className="px-6 py-4 font-normal">TIME</th>
                        <th className="px-6 py-4 text-right font-normal">STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    {displayLogs.map((log) => (
                        <tr key={log.id} className="border-b border-[#2A2A2A]">
                            <td className="px-6 py-4 font-medium">{log.action}</td>
                            <td className="px-6 py-4 text-[#94A3B8]">{log.symbol}</td>
                            <td className="px-6 py-4 text-sm text-[#94A3B8]">{log.time}</td>
                            <td className={`px-6 py-4 text-right text-sm font-bold ${getStatusColor(log.status)}`}>
                                {log.status === 'ERROR' ? `[ ${log.status} ]` : log.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
