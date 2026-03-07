"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, ExternalLink } from "lucide-react";
import { STAGGER, FADE_UP, FADE_RIGHT, EASE_OUT_EXPO, CountUp, DepthCard, Tag, CopyBtn, useBreakpoint } from "../Primitives";
import { backendApi } from "../../lib/api";
import { truncAddr } from "../../lib/utils";

interface Holder { address: string; amount: string; decimals: number; uiAmount: number; uiAmountString: string; }

const MOCK_HOLDERS: Holder[] = [
  { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", uiAmountString: "45,000.00", amount: "45000000000", decimals: 6, uiAmount: 45000 },
  { address: "3Kzg7p3CW87d97TXJSDpbD5jBkhe3qA83TZRu9osgBsP", uiAmountString: "32,000.00", amount: "32000000000", decimals: 6, uiAmount: 32000 },
  { address: "9mNXtg2CW87d97TXJSDpbD5jBkhe3qA83TZRuJosgCsQ", uiAmountString: "18,500.00", amount: "18500000000", decimals: 6, uiAmount: 18500 },
  { address: "5yLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgDtR", uiAmountString: "12,750.00", amount: "12750000000", decimals: 6, uiAmount: 12750 },
  { address: "2wMKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgEuS", uiAmountString:  "9,900.00", amount:  "9900000000", decimals: 6, uiAmount: 9900 },
  { address: "8nOKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgFvT", uiAmountString:  "6,400.00", amount:  "6400000000", decimals: 6, uiAmount: 6400 },
];

export default function HoldersView() {
  const isMobile = useBreakpoint();
  const [minAmt, setMinAmt] = useState("");
  const [holders, setHolders] = useState<Holder[]>(MOCK_HOLDERS);
  const [count, setCount] = useState(1500);
  const totalSupply = 125000000000000;

  useEffect(() => {
    const q: Record<string, string> = {};
    if (minAmt) q.minAmount = minAmt;
    backendApi.getWithQuery<Holder[]>("/holders/largest", q).then(d => { if (d?.length) setHolders(d); }).catch(() => {});
    backendApi.get<{ count: number }>("/holders/count").then(r => setCount(r.count)).catch(() => {});
  }, [minAmt]);

  const filtered = minAmt ? holders.filter(h => Number(h.amount) >= Number(minAmt)) : holders;

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Holders</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Distribution by balance</p>
        </div>
        <DepthCard accent="green" style={{ padding: "12px 20px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span style={{ fontFamily: "Geist Mono", fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em" }}><CountUp to={count} /></span>
            <span style={{ color: "var(--sub)", fontSize: 12 }}>total holders</span>
          </div>
        </DepthCard>
      </motion.div>

      <motion.div variants={FADE_UP}>
        <DepthCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Leaderboard</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flex: isMobile ? 1 : undefined }}>
              <Filter size={12} style={{ color: "var(--sub)", flexShrink: 0 }} />
              <input className="input" style={{ width: isMobile ? "100%" : 180 }} placeholder="Min raw amount…" value={minAmt} onChange={e => setMinAmt(e.target.value)} />
            </div>
          </div>
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {filtered.map((h, i) => {
              const share = (Number(h.amount) / totalSupply * 100).toFixed(3);
              return (
                <motion.div key={i} variants={FADE_RIGHT} whileHover={{ x: 4, background: "rgba(255,255,255,0.025)" }}
                  style={{ display: "grid", gridTemplateColumns: isMobile ? "32px 1fr auto" : "32px 1fr auto auto", gap: isMobile ? 8 : 14, alignItems: "center", padding: "13px 8px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", borderRadius: 8 }}>
                  <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--dim)", fontWeight: 600 }}>
                    {i === 0 ? <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}># 1</motion.span> : `#${i + 1}`}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Geist Mono", fontSize: 12 }}>{truncAddr(h.address)}</span>
                    <CopyBtn value={h.address} />
                    <motion.a whileHover={{ color: "var(--primary)" }} href={`https://solscan.io/account/${h.address}`} target="_blank" rel="noreferrer" style={{ color: "var(--dim)" }}>
                      <ExternalLink size={10} />
                    </motion.a>
                  </div>
                  <span style={{ fontFamily: "Geist Mono", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{h.uiAmountString}</span>
                  {!isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100, justifyContent: "flex-end" }}>
                      <div style={{ width: 52, height: 3, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(parseFloat(share) * 500, 100)}%` }}
                          transition={{ duration: 0.8, delay: i * 0.06, ease: EASE_OUT_EXPO }} style={{ height: "100%", background: i === 0 ? "var(--accent)" : "var(--primary)", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--sub)" }}>{share}%</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </DepthCard>
      </motion.div>
    </motion.div>
  );
}
