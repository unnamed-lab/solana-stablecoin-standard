export function StatCard({ title, value, status = 'neutral' }: { title: string, value: React.ReactNode, status?: 'positive' | 'negative' | 'warning' | 'neutral' }) {
    const getStatusColor = () => {
        switch (status) {
            case 'positive': return 'text-[#10B981]';
            case 'negative': return 'text-[#EF4444]';
            case 'warning': return 'text-[#A855F7]';
            default: return 'text-[#F8FAFC]';
        }
    };

    return (
        <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-6">
            <div className="label mb-2 text-[#94A3B8]">{title}</div>
            <div className={`text-3xl font-bold [font-family:var(--font-syne)] ${getStatusColor()}`}>
                {value}
            </div>
        </div>
    );
}
