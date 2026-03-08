"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import { STAGGER, FADE_UP, FADE_RIGHT, DepthCard, Tag, TxLink, ActionBadge, Btn, Pagination, useBreakpoint } from "../Primitives";
import { backendApi, downloadCsv } from "../../lib/api";
import { fmtTime } from "../../lib/utils";

interface AuditEntry { action: string; actor: string; amount?: string; txSignature?: string; timestamp: string; }

const MOCK_AUDIT: AuditEntry[] = [
  { action: "MINT", actor: "7xKXtg2CW87…AsU", amount: "5000", txSignature: "5Kz7xYpQ1a", timestamp: "2025-01-22T15:04:00Z" },
  { action: "BURN", actor: "3Kzg7p3CW87…BsP", amount: "1200", txSignature: "3wCXURH82b", timestamp: "2025-01-22T14:32:00Z" },
  { action: "FREEZE", actor: "9mNXtg2CW87…CsQ", txSignature: "9pQkLMN23c", timestamp: "2025-01-22T13:15:00Z" },
  { action: "SEIZE", actor: "5yLKtg2CW87…DtR", amount: "850", txSignature: "7rTmVWX44d", timestamp: "2025-01-22T12:00:00Z" },
  { action: "MINT", actor: "2wMKtg2CW87…EuS", amount: "20000", txSignature: "2sPnYZ115e", timestamp: "2025-01-21T18:45:00Z" },
  { action: "BURN", actor: "8nOKtg2CW87…FvT", amount: "300", txSignature: "8qUoAB556f", timestamp: "2025-01-21T16:22:00Z" },
];

export default function AuditLogView() {
  const isMobile = useBreakpoint();
  const [entries, setEntries] = useState<AuditEntry[]>(MOCK_AUDIT);
  const [total, setTotal] = useState(6);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [mintFilter, setMintFilter] = useState("");
  const [page, setPage] = useState(1);
  const [symbol, setSymbol] = useState("USDS");
  const PAGE_SIZE = 50;

  useEffect(() => {
    backendApi.get<{ symbol: string }>("/info").then(i => setSymbol(i.symbol)).catch(() => { });
  }, []);

  useEffect(() => {
    const q: Record<string, string> = { page: String(page), pageSize: String(PAGE_SIZE) };
    if (actionFilter) q.action = actionFilter;
    if (actorFilter) q.actor = actorFilter;
    if (mintFilter) q.mint = mintFilter;
    backendApi.getWithQuery<{ items: AuditEntry[]; total: number }>("/audit-log", q)
      .then(r => { if (r?.items?.length) { setEntries(r.items); setTotal(r.total ?? r.items.length); } })
      .catch(() => { });
  }, [actionFilter, actorFilter, mintFilter, page]);

  const handleExport = () => {
    const q: Record<string, string> = {};
    if (actionFilter) q.action = actionFilter;
    if (mintFilter) q.mint = mintFilter;
    downloadCsv("/audit-log/export", q);
  };

  const displayEntries = entries.length > MOCK_AUDIT.length ? entries
    : MOCK_AUDIT.filter(r => (!actionFilter || r.action === actionFilter) && (!actorFilter || r.actor.includes(actorFilter)));

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Audit Log</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Immutable admin action history</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={handleExport}><Download size={11} /> Export CSV</Btn>
      </motion.div>

      <motion.div variants={FADE_UP}>
        <DepthCard style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="label">Action</label>
              <select className="input" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={{ background: "var(--surface2)" }}>
                <option value="">All actions</option>
                {["MINT", "BURN", "SEIZE", "FREEZE", "UNFREEZE"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label className="label">Actor address</label>
              <input className="input" placeholder="Filter by actor…" value={actorFilter} onChange={e => { setActorFilter(e.target.value); setPage(1); }} />
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label className="label">Mint address</label>
              <input className="input" placeholder="Filter by mint…" value={mintFilter} onChange={e => { setMintFilter(e.target.value); setPage(1); }} />
            </div>
            <AnimatePresence>
              {(actionFilter || actorFilter || mintFilter) && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Btn variant="ghost" size="sm" onClick={() => { setActionFilter(""); setActorFilter(""); setMintFilter(""); setPage(1); }}>Clear</Btn>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DepthCard>
      </motion.div>

      <motion.div variants={FADE_UP}>
        <DepthCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontWeight: 700, fontSize: 13 }}>Events</p>
            <Tag variant="dim">{displayEntries.length} results</Tag>
          </div>
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {displayEntries.map((r, i) => (
              <motion.div key={i} variants={FADE_RIGHT} whileHover={{ backgroundColor: "rgba(255,255,255,0.02)", x: 2 }}
                style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr auto auto auto", gap: isMobile ? 10 : 16, padding: isMobile ? "11px 14px" : "13px 20px", borderBottom: i < displayEntries.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
                <ActionBadge action={r.action} />
                <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.actor}</span>
                {!isMobile && <span style={{ fontFamily: "Geist Mono", fontSize: 11 }}>{r.amount ? `${Number(r.amount).toLocaleString()} ${symbol}` : <span style={{ color: "var(--dim)" }}>—</span>}</span>}
                {r.txSignature ? <TxLink sig={r.txSignature} /> : <span style={{ color: "var(--dim)", fontSize: 11, fontFamily: "Geist Mono" }}>—</span>}
                {!isMobile && <span style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--dim)" }}>{fmtTime(r.timestamp)}</span>}
              </motion.div>
            ))}
          </motion.div>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </DepthCard>
      </motion.div>
    </motion.div>
  );
}
