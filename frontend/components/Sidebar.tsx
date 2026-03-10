"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Shield, FileText,
  Webhook, Activity, CircleDot, LogOut, Landmark
} from "lucide-react";
import { useEffect, useState } from "react";
import { EASE_OUT_EXPO, SPRING_BOUNCY, Tag } from "./Primitives";
import Image from "next/image";
import { useBackendConfig, useBackendHealth } from "../lib/queries";
import { useKeyStore } from "./KeyStoreProvider";

const NAV_ITEMS = [
  { id: "dashboard", href: "/", label: "Overview", icon: <LayoutDashboard size={14} />, group: "ops" },
  { id: "holders", href: "/holders", label: "Holders", icon: <Users size={14} />, group: "ops" },
  { id: "compliance", href: "/compliance", label: "Compliance", icon: <Shield size={14} />, group: "ops", badge: "3" },
  { id: "governance", href: "/governance", label: "Governance", icon: <Landmark size={14} />, group: "ops" },
  { id: "audit", href: "/audit-log", label: "Audit Log", icon: <FileText size={14} />, group: "sys" },
  { id: "webhooks", href: "/webhooks", label: "Webhooks", icon: <Webhook size={14} />, group: "sys" },
  { id: "oracle", href: "/oracle", label: "Oracle", icon: <Activity size={14} />, group: "sys" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { data: config } = useBackendConfig();
  const { data: health } = useBackendHealth();
  const { lock, keys } = useKeyStore();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleNavClick = () => {
    if (isMobile) onClose();
  };

  const mobileStyle = isMobile
    ? {
      position: "fixed" as const,
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 60,
      width: 224,
    }
    : {};

  return (
    <motion.aside
      initial={isMobile ? { x: -240, opacity: 0 } : { x: -240, opacity: 0 }}
      animate={
        isMobile
          ? { x: open ? 0 : -240, opacity: open ? 1 : 0 }
          : { x: 0, opacity: 1 }
      }
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      style={{
        width: 224,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "rgba(11,11,14,0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border)",
        position: "relative",
        zIndex: 10,
        ...mobileStyle,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--border)" }}>
        <motion.div whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "default" }}>
          <motion.div
            animate={{ boxShadow: ["0 0 12px rgba(124,92,255,0.3)", "0 0 22px rgba(0,229,160,0.25)", "0 0 12px rgba(124,92,255,0.3)"] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              width: 40, height: 40, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}
          >
            <Image src={"/st-logo.svg"} width={36} height={36} alt="Superteam Logo" />
          </motion.div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.01em", lineHeight: 1 }}>SSS Admin</p>
            <p style={{ fontSize: 10, color: "var(--sub)", marginTop: 2, fontFamily: "Geist Mono" }}>Stablecoin Standard</p>
          </div>
        </motion.div>
      </div>

      {/* Network status */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "6px 10px",
            background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.12)",
            borderRadius: 7, cursor: "default"
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }}
          />
          <span style={{ fontSize: 10, fontFamily: "Geist Mono", fontWeight: 600, color: "var(--accent)" }}>
            {config?.network ?? "MAINNET-BETA"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--sub)", fontFamily: "Geist Mono" }}>
            {health?.latencyMs != null ? `≈ ${health.latencyMs}ms` : "—"}
          </span>
        </motion.div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {[{ key: "ops", label: "Operations" }, { key: "sys", label: "System" }].map(group => (
          <div key={group.key} style={{ marginBottom: 4 }}>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--dim)", padding: "8px 10px 5px" }}
            >
              {group.label}
            </motion.p>
            {NAV_ITEMS.filter(n => n.group === group.key).map((item, idx) => {
              const active = isActive(item.href);
              return (
                <Link key={item.id} href={item.href} style={{ textDecoration: "none" }} onClick={handleNavClick}>
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.06, ease: EASE_OUT_EXPO }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px",
                      borderRadius: 8,
                      border: active ? "1px solid rgba(0,229,160,0.15)" : "1px solid transparent",
                      background: active ? "rgba(0,229,160,0.06)" : "transparent",
                      color: active ? "var(--accent)" : "var(--sub)",
                      cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 500,
                      marginBottom: 2, position: "relative"
                    }}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 2.5, height: 16, borderRadius: 99, background: "var(--accent)" }}
                        transition={SPRING_BOUNCY}
                      />
                    )}
                    <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                    {item.label}
                    {item.badge && (
                      <motion.span
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{
                          marginLeft: "auto", background: "rgba(245,158,11,0.15)", color: "var(--warn)",
                          border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, fontSize: 9,
                          padding: "2px 6px", fontFamily: "Geist Mono", fontWeight: 700
                        }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}
      >
        <motion.div
          whileHover={{ background: "var(--surface2)" }}
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "default" }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg, rgba(124,92,255,0.27), rgba(0,229,160,0.27))",
            border: "1px solid var(--border2)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--text)"
          }}>A</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600 }}>Admin</p>
            <p style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--sub)" }}>7xKX…AsU</p>
          </div>
          <motion.div
            whileHover={{ color: keys ? "var(--danger)" : "var(--dim)" }}
            onClick={() => keys && lock()}
            style={{ color: "var(--dim)", cursor: keys ? "pointer" : "default" }}
            title={keys ? "Lock vault (log out)" : "Vault already locked"}
          >
            <LogOut size={12} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
