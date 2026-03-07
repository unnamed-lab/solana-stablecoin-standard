import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "../components/ClientLayout";

export const metadata: Metadata = {
  title: "SSS Admin — Solana Stablecoin Standard",
  description: "Admin dashboard for the Solana Stablecoin Standard protocol",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
