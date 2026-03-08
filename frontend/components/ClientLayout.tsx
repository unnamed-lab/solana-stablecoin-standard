"use client";

import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { AmbientBg, Fonts, EASE_OUT_EXPO, ToastContainer } from "./Primitives";

import { KeyStoreProvider } from "./KeyStoreProvider";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close sidebar when navigating (or when switching to desktop)
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <KeyStoreProvider>
      <Fonts />
      <AmbientBg />

      <div style={{ display: "flex", height: "100vh", position: "relative", zIndex: 1, overflow: "hidden" }}>
        {/* Mobile backdrop — sits between content and sidebar */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 55,
                background: "rgba(4,4,8,0.75)", backdropFilter: "blur(4px)",
              }}
            />
          )}
        </AnimatePresence>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />

          <main style={{ flex: 1, overflowY: "auto", padding: "clamp(16px, 4vw, 30px) clamp(16px, 4vw, 32px)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <ToastContainer />
    </KeyStoreProvider>
  );
}
