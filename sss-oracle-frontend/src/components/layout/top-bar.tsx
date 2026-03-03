'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function TopBar() {
    const pathname = usePathname();

    const getPageTitle = () => {
        switch (pathname) {
            case '/': return 'DASHBOARD';
            case '/feeds': return 'PRICE_FEEDS';
            case '/config': return 'ORACLE_CONFIG';
            case '/quotes': return 'QUOTE_SIMULATOR';
            case '/cpi': return 'CPI_INDEX';
            case '/registry': return 'FEED_REGISTRY';
            default: return pathname?.substring(1).toUpperCase() || 'SYS_UNKNOWN';
        }
    };

    return (
        <div className="border-[#2A2A2A] bg-[#0A0A0A] flex h-16 items-center justify-between border-b px-8">
            <div className="flex items-center gap-4">
                <span className="label text-[#94A3B8]">SYS {'>'}</span>
                <span className="label text-[#A855F7]">{getPageTitle()}</span>
            </div>

            <div>
                <WalletMultiButtonDynamic className="!bg-[#1A1A1A] !text-[#F8FAFC] !border !border-[#2A2A2A] hover:!border-[#A855F7] !transition-colors !rounded !px-4 !py-2 !h-auto !font-normal" />
            </div>
        </div>
    );
}
