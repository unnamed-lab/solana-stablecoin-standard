import type { Metadata } from 'next';
import { Syne, IBM_Plex_Mono, Space_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/top-bar';
import StatusTicker from '@/components/layout/status-ticker';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: 'SSS Oracle Dashboard',
  description: 'Oracle financial dashboard for SSS token operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${ibmPlexMono.variable} ${spaceMono.variable}`}>
        <div className="scanlines"></div>
        <div className="flex h-screen flex-col bg-super-bg">
          <StatusTicker />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
