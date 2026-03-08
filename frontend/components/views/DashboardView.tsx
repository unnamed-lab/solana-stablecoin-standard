"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, BarChart3, Flame, Users, Eye, EyeOff, ArrowUp, CheckCircle } from "lucide-react";
import {
  STAGGER, FADE_UP, SPRING_BOUNCY,
  StatCard, CountUp, DepthCard, Tag, TxLink, Btn,
  ActionBadge, KeypairWarning, Spinner, useBreakpoint
} from "../Primitives";
import { backendApi } from "../../lib/api";
import { fmt, fmtTime } from "../../lib/utils";
import { useKeyStore } from "../KeyStoreProvider";

interface Supply { totalSupply: string; maxSupply: string | null; burnSupply: string; decimals: number; }
interface AuditEntry { action: string; actor: string; amount?: string; txSignature?: string; timestamp: string; }
interface Info { name: string; symbol: string; mint: string; paused: boolean; preset: string; }

const MOCK_AUDIT: AuditEntry[] = [
  { action: "MINT", actor: "7xKXtg…AsU", amount: "5000", txSignature: "5Kz7xYpQ1a", timestamp: "2025-01-22T15:04:00Z" },
  { action: "BURN", actor: "3Kzg7p…BsP", amount: "1200", txSignature: "3wCXURH82b", timestamp: "2025-01-22T14:32:00Z" },
  { action: "FREEZE", actor: "9mNXtg…CsQ", txSignature: "9pQkLMN23c", timestamp: "2025-01-22T13:15:00Z" },
  { action: "SEIZE", actor: "5yLKtg…DtR", amount: "850", txSignature: "7rTmVWX44d", timestamp: "2025-01-22T12:00:00Z" },
  { action: "MINT", actor: "2wMKtg…EuS", amount: "20000", txSignature: "2sPnYZ115e", timestamp: "2025-01-21T18:45:00Z" },
  { action: "BURN", actor: "8nOKtg…FvT", amount: "300", txSignature: "8qUoAB556f", timestamp: "2025-01-21T16:22:00Z" },
];

export default function DashboardView() {
  const isMobile = useBreakpoint();
  const { keys } = useKeyStore();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [holderCount, setHolderCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>(MOCK_AUDIT);
  const [mintAmt, setMintAmt] = useState("");
  const [showMintKey, setShowMintKey] = useState(false);
  const [loading, setLoading] = useState<"MINT" | "BURN" | null>(null);
  const [txBanner, setTxBanner] = useState<{ type: string; sig: string } | null>(null);
  const [mintRecipient, setMintRecipient] = useState("");
  const [mintKeypair, setMintKeypair] = useState("");
  const [burnAmt, setBurnAmt] = useState("");
  const [burnSource, setBurnSource] = useState("");
  const [burnKeypair, setBurnKeypair] = useState("");

  useEffect(() => {
    backendApi.get<Info>("/info").then(setInfo).catch(() => { });
    backendApi.get<Supply>("/supply").then(setSupply).catch(() => { });
    backendApi.get<{ count: number }>("/holders/count").then(r => setHolderCount(r.count)).catch(() => { });
    backendApi.getWithQuery<{ items: AuditEntry[] }>("/audit-log", { pageSize: "6" })
      .then(r => { if (r?.items?.length) setRecentActivity(r.items); }).catch(() => { });
  }, []);

  const dec = supply?.decimals ?? 6;
  const symbol = info?.symbol ?? "USDS";
  const totalSupplyNum = supply ? Number(fmt(supply.totalSupply, dec).replace(/,/g, "")) : 0;
  const maxSupplyNum = supply?.maxSupply ? Number(fmt(supply.maxSupply, dec).replace(/,/g, "")) : 0;
  const burnedNum = supply ? Number(fmt(supply.burnSupply, dec).replace(/,/g, "")) : 0;

  const submitMint = async () => {
    const finalKeypair = keys?.minterKeypair || mintKeypair;
    if (!finalKeypair) return;
    setLoading("MINT");
    try {
      const res = await backendApi.post<{ txSignature: string }>("/mint", { recipient: mintRecipient, amount: Number(mintAmt), minterKeypair: finalKeypair });
      setTxBanner({ type: "MINT", sig: res.txSignature });
    } catch { setTxBanner({ type: "MINT", sig: "error" }); } finally { setLoading(null); }
  };

  const submitBurn = async () => {
    const finalKeypair = keys?.burnerKeypair || burnKeypair;
    if (!finalKeypair) return;
    setLoading("BURN");
    try {
      const res = await backendApi.post<{ txSignature: string }>("/burn", { amount: Number(burnAmt), burnerKeypair: finalKeypair, ...(burnSource ? { source: burnSource } : {}) });
      setTxBanner({ type: "BURN", sig: res.txSignature });
    } catch { setTxBanner({ type: "BURN", sig: "error" }); } finally { setLoading(null); }
  };

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{info?.name ?? "Overview"}</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>{info?.symbol ?? "Token"} lifecycle · real-time</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Tag variant="green" pulse>LIVE</Tag>
          <Tag variant="dim">Mainnet-Beta</Tag>
        </div>
      </motion.div>

      <motion.div variants={STAGGER} style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 14, alignItems: "stretch" }}>
        <StatCard label="Total Supply" value={<CountUp to={totalSupplyNum} />} unit={symbol} icon={<Coins size={15} />} accent="purple" change={2.4} />
        <StatCard label="Max Supply" value={<CountUp to={maxSupplyNum} />} unit={symbol} icon={<BarChart3 size={15} />} />
        <StatCard label="Total Burned" value={<CountUp to={burnedNum} />} unit={symbol} icon={<Flame size={15} />} accent="red" change={-0.8} />
        <StatCard label="Holders" value={<CountUp to={holderCount} />} unit="accounts" icon={<Users size={15} />} accent="green" change={5.1} />
      </motion.div>

      <AnimatePresence>
        {txBanner && (
          <motion.div key="banner" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 10, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.5 }}><CheckCircle size={15} style={{ color: "var(--accent)" }} /></motion.div>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{txBanner.type} confirmed</span>
              <span style={{ color: "var(--sub)" }}>·</span>
              {txBanner.sig !== "error" ? <TxLink sig={txBanner.sig} /> : <span style={{ color: "var(--danger)", fontSize: 11 }}>Transaction failed</span>}
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTxBanner(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sub)", fontSize: 18, lineHeight: 1 }}>×</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={STAGGER} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* MINT */}
        <motion.div variants={FADE_UP}>
          <DepthCard accent="green">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <motion.div whileHover={{ scale: 1.15, rotate: -5 }} transition={SPRING_BOUNCY}
                style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowUp size={14} style={{ color: "var(--accent)" }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>Mint Tokens</p>
                <p style={{ color: "var(--sub)", fontSize: 11, fontFamily: "Geist Mono" }}>10 req / min</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="label">Recipient</label><input className="input" placeholder="Base58 wallet address…" value={mintRecipient} onChange={e => setMintRecipient(e.target.value)} /></div>
              <div>
                <label className="label">Amount (base units)</label>
                <div style={{ position: "relative" }}>
                  <input className="input" type="number" placeholder="1000000" value={mintAmt} onChange={e => setMintAmt(e.target.value)} style={{ paddingRight: 90 }} />
                  <AnimatePresence>
                    {mintAmt && (
                      <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--accent)", fontFamily: "Geist Mono", pointerEvents: "none" }}>
                        = {(Number(mintAmt) / Math.pow(10, dec)).toFixed(2)} {symbol}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label className="label">Minter Keypair</label>
                {keys?.minterKeypair ? (
                  <div style={{ padding: "10px 14px", background: "rgba(0,229,160,0.1)", color: "var(--accent)", borderRadius: 8, fontSize: 13, border: "1px solid rgba(0,229,160,0.2)" }}>
                    ✓ Provided by Secure Vault
                  </div>
                ) : (
                  <>
                    <div style={{ position: "relative" }}>
                      <input className="input" type={showMintKey ? "text" : "password"} placeholder="Base58 keypair…" style={{ paddingRight: 40 }} value={mintKeypair} onChange={e => setMintKeypair(e.target.value)} />
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowMintKey(!showMintKey)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--sub)" }}>
                        {showMintKey ? <EyeOff size={12} /> : <Eye size={12} />}
                      </motion.button>
                    </div>
                    <KeypairWarning />
                  </>
                )}
              </div>
              <Btn variant="accent" onClick={submitMint} disabled={!!loading} style={{ justifyContent: "center", width: "100%", borderRadius: 9 }}>
                {loading === "MINT" ? <><Spinner /> Processing…</> : <><Coins size={13} /> Mint Tokens</>}
              </Btn>
            </div>
          </DepthCard>
        </motion.div>

        {/* BURN */}
        <motion.div variants={FADE_UP}>
          <DepthCard accent="red">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <motion.div whileHover={{ scale: 1.15, rotate: 5 }} transition={SPRING_BOUNCY}
                style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,64,96,0.1)", border: "1px solid rgba(255,64,96,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Flame size={14} style={{ color: "var(--danger)" }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>Burn Tokens</p>
                <p style={{ color: "var(--sub)", fontSize: 11, fontFamily: "Geist Mono" }}>10 req / min</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="label">Amount (base units)</label><input className="input" type="number" placeholder="1000000" value={burnAmt} onChange={e => setBurnAmt(e.target.value)} /></div>
              <div><label className="label">Source Account <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--dim)" }}>(optional)</span></label><input className="input" placeholder="Defaults to burner ATA…" value={burnSource} onChange={e => setBurnSource(e.target.value)} /></div>
              <div>
                <label className="label">Burner Keypair</label>
                {keys?.burnerKeypair ? (
                  <div style={{ padding: "10px 14px", background: "rgba(255,64,96,0.1)", color: "var(--danger)", borderRadius: 8, fontSize: 13, border: "1px solid rgba(255,64,96,0.2)" }}>
                    ✓ Provided by Secure Vault
                  </div>
                ) : (
                  <>
                    <input className="input" type="password" placeholder="Base58 keypair…" value={burnKeypair} onChange={e => setBurnKeypair(e.target.value)} />
                    <KeypairWarning />
                  </>
                )}
              </div>
              <Btn variant="danger" onClick={submitBurn} disabled={!!loading} style={{ justifyContent: "center", width: "100%", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700 }}>
                {loading === "BURN" ? <><Spinner /> Processing…</> : <><Flame size={13} /> Burn Tokens</>}
              </Btn>
            </div>
          </DepthCard>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={FADE_UP}>
        <DepthCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</p>
            <Tag variant="dim">{recentActivity.length} events</Tag>
          </div>
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {recentActivity.map((r, i) => (
              <motion.div key={i} whileHover={{ x: 3, background: "rgba(255,255,255,0.02)" }}
                style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, padding: "11px 4px", borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : "none", borderRadius: 6 }}>
                <ActionBadge action={r.action} />
                {!isMobile && <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)", flex: 1 }}>{r.actor}</span>}
                <span style={{ fontFamily: "Geist Mono", fontSize: 11, flex: isMobile ? 1 : undefined }}>{r.amount ? `${Number(r.amount).toLocaleString()} ${symbol}` : <span style={{ color: "var(--dim)" }}>—</span>}</span>
                {r.txSignature && <TxLink sig={r.txSignature} />}
                {!isMobile && <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "Geist Mono", minWidth: 100, textAlign: "right" }}>{fmtTime(r.timestamp)}</span>}
              </motion.div>
            ))}
          </motion.div>
        </DepthCard>
      </motion.div>
    </motion.div>
  );
}
