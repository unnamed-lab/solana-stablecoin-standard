'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Dashboard', path: '/' },
        { label: 'Price Feeds', path: '/feeds' },
        { label: 'Oracle Config', path: '/config' },
        { label: 'Quote Simulator', path: '/quotes' },
        { label: 'Feed Registry', path: '/registry' },
        { label: 'CPI Index', path: '/cpi' },
    ];

    return (
        <aside className="border-[#2A2A2A] bg-[#0A0A0A] flex w-[250px] flex-col border-r">
            <div className="border-[#2A2A2A] px-6 py-8 border-b">
                <div className='flex items-center gap-2'>
                    <Image src={"/st-logo.svg"} width={200} height={200} className='h-8 w-8' alt='Superteam Logo' />
                    <h1 className="text-[#A855F7] m-0 text-xl font-bold">SSS ORACLE</h1>
                </div>
                <div className="label text-[#94A3B8] mt-2 text-[0.7rem]">Terminal v1.0.0</div>
            </div>
            <nav className="flex-1 py-4">
                <ul className="m-0 list-none p-0">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
                        return (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`flex items-center px-6 py-3 text-sm no-underline transition-all duration-200 border-r-4 ${isActive
                                        ? 'border-[#A855F7] bg-[#111111] font-semibold text-[#A855F7]'
                                        : 'border-transparent font-normal text-[#F8FAFC]'
                                        }`}
                                >
                                    <span className="label text-xs">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="border-[#2A2A2A] text-[#94A3B8] border-t p-6 text-xs">
                <div className="mb-2 flex items-center gap-2">
                    <span className="live-indicator"></span>
                    <span>System Online</span>
                </div>
                <div>Network: {process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}</div>
            </div>
        </aside>
    );
}
