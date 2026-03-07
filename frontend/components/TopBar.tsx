"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Zap, Bell, Menu } from "lucide-react";
import { EASE_OUT_EXPO } from "./Primitives";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -52, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 }}
      style={{
        height: 54, display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12, flexShrink: 0,
        background: "rgba(7,7,9,0.75)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)"
      }}
    >
      {/* Hamburger — mobile only */}
      {isMobile && (
        <motion.button
          whileHover={{ color: "var(--text)", background: "var(--surface2)" }}
          whileTap={{ scale: 0.92 }}
          onClick={onMenuClick}
          style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--sub)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}
        >
          <Menu size={15} />
        </motion.button>
      )}

      <div style={{ flex: 1 }} />

      {[
        { icon: <Globe size={11} />, label: "localhost:3000" },
        { icon: <Zap size={11} />,   label: "oracle:3003" },
      ].map(({ icon, label }) => (
        <motion.div
          key={label}
          whileHover={{ borderColor: "var(--border2)" }}
          style={{
            display: isMobile ? "none" : "flex", alignItems: "center", gap: 6, padding: "5px 11px",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 7, fontSize: 11, color: "var(--sub)",
            fontFamily: "Geist Mono", cursor: "default"
          }}
        >
          {icon}{label}
        </motion.div>
      ))}

      <motion.button
        whileHover={{ color: "var(--text)", background: "var(--surface2)" }}
        whileTap={{ scale: 0.92 }}
        style={{
          width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--surface)", color: "var(--sub)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        <Bell size={13} />
      </motion.button>
    </motion.header>
  );
}
