"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import { STAGGER, FADE_UP, FADE_RIGHT, DepthCard, Tag, TxLink, ActionBadge, Btn, Pagination, useBreakpoint } from "../Primitives";
import { backendApi, downloadCsv } from "../../lib/api";
import { fmt, fmtTime } from "../../lib/utils";
import { Supply, Info } from "@/types";

interface AuditEntry { action: string; actor: string; amount?: string; txSignature?: string; timestamp: string; }

export default function AuditLogView() {
  const isMobile = useBreakpoint();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(6);
  const [supply, setSupply] = useState<Supply | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [mintFilter, setMintFilter] = useState("");
  const [page, setPage] = useState(1);
  const [symbol, setSymbol] = useState("USDS");
  const PAGE_SIZE = 50;

  useEffect(() => {
    backendApi.get<{ symbol: string }>("/info").then(i => { setSymbol(i.symbol); }).catch(() => { });
    backendApi.get<Supply>("/supply").then(setSupply).catch(() => { });
  }, []);

  const dec = supply?.decimals ?? 6;

  useEffect(() => {
    const q: Record<string, string> = { page: String(page), pageSize: String(PAGE_SIZE) };
    if (actionFilter) q.action = actionFilter;
    if (actorFilter) q.actor = actorFilter;
    if (mintFilter) q.mint = mintFilter;
    backendApi.getWithQuery<{ data: AuditEntry[], meta: { total: number } }>("/audit-log", q, true)
      .then(r => { if (r?.data?.length) { setEntries(r.data); setTotal(r.meta.total); } })
      .catch(() => { });
  }, [actionFilter, actorFilter, mintFilter, page]);

  const handleExport = () => {
    const q: Record<string, string> = {};
    if (actionFilter) q.action = actionFilter;
    if (mintFilter) q.mint = mintFilter;
    downloadCsv("/audit-log/export", q);
  };

  const displayEntries = entries.length > 0 ? entries
    : [];

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
                <ActionBadge action={r.action.replaceAll("_", " ")} />
                <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.actor}</span>
                {!isMobile && <span style={{ fontFamily: "Geist Mono", fontSize: 11 }}>{r.amount ? `${fmt(r.amount, dec).replace(/,/g, "")} ${symbol}` : <span style={{ color: "var(--dim)" }}>—</span>}</span>}
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
