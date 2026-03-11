"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Zap, Bell, Menu, Lock, Unlock, ShieldCheck } from "lucide-react";
import { EASE_OUT_EXPO } from "./Primitives";
import { useKeyStore } from "./KeyStoreProvider";
import KeyManagerModal from "./KeyManagerModal";
import { useBackendConfig, useRecentActivity, useGovernanceProposals } from "../lib/queries";
import { getOracleDisplayHost } from "../lib/api";
import { fmtTime } from "../lib/utils";
import Link from "next/link";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { keys, hasVault, lock } = useKeyStore();
  const { data: config } = useBackendConfig();
  const { data: recentActivity = [] } = useRecentActivity(3);
  const { data: proposals = [] } = useGovernanceProposals();

  const pendingProposals = proposals.filter((p: any) => p.status === "PENDING");
  const unreadCount = pendingProposals.length; // Can be adjusted based on actual 'read' state logic

  const rpcLabel = config?.rpcEndpoint ?? "api.solana.com";
  const oracleLabel = getOracleDisplayHost();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
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
          { icon: <Globe size={11} />, label: rpcLabel },
          { icon: <Zap size={11} />, label: oracleLabel },
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

        {/* Key Store Button */}
        <motion.button
          onClick={() => keys ? lock() : setShowModal(true)}
          whileHover={{ color: "var(--text)", background: "var(--surface2)" }}
          whileTap={{ scale: 0.92 }}
          style={{
            minWidth: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
            background: keys ? "rgba(0, 229, 160, 0.1)" : hasVault ? "rgba(255, 64, 96, 0.1)" : "var(--surface)",
            color: keys ? "var(--accent)" : hasVault ? "var(--danger)" : "var(--sub)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", gap: 6, fontSize: 12, fontWeight: 700
          }}
        >
          {keys ? <Unlock size={13} /> : hasVault ? <Lock size={13} /> : <ShieldCheck size={13} />}
          {!isMobile && (keys ? "Vault Unlocked" : hasVault ? "Vault Locked" : "Setup Vault")}
        </motion.button>

        <div style={{ position: "relative" }}>
          <motion.button
            whileHover={{ color: "var(--text)", background: "var(--surface2)" }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
              background: showNotifs ? "var(--surface2)" : "var(--surface)", color: showNotifs ? "var(--text)" : "var(--sub)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
            }}
          >
            <Bell size={13} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "#fff",
                fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--bg)"
              }}>
                {unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowNotifs(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 90 }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  style={{
                    position: "absolute", top: 44, right: 0, width: 320, background: "var(--surface)",
                    border: "1px solid var(--border2)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column"
                  }}
                >
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                    {unreadCount > 0 && <span style={{ fontSize: 10, color: "var(--sub)" }}>{unreadCount} unread</span>}
                  </div>

                  <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {pendingProposals.length > 0 && (
                      <div style={{ padding: "8px 12px", background: "rgba(245,158,11,0.06)", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action Required</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                          {pendingProposals.map((p: any) => (
                            <Link href="/governance" key={p.id} onClick={() => setShowNotifs(false)} style={{ textDecoration: "none" }}>
                              <div style={{ display: "flex", gap: 10, padding: "8px 10px", background: "var(--surface2)", borderRadius: 8, cursor: "pointer" }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn)", marginTop: 6, flexShrink: 0 }} />
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Pending: {p.action.type}</p>
                                  <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>{p.approvalCount} / {p.threshold} Approvals</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Activity</span>
                      {recentActivity.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--sub)", textAlign: "center", padding: "10px 0" }}>No recent activity</p>
                      ) : (
                        recentActivity.map((r: any, i: number) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--dim)", marginTop: 6, flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", lineHeight: 1.4 }}>{r.action.replaceAll("_", " ")}</p>
                              <p style={{ fontSize: 10, color: "var(--sub)", fontFamily: "Geist Mono", marginTop: 2 }}>{fmtTime(r.timestamp ?? r.createdAt ?? "")}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <AnimatePresence>
        {showModal && <KeyManagerModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
