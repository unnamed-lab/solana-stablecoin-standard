"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Zap, ArrowUp, ArrowDown } from "lucide-react";
import { STAGGER, FADE_UP, EASE_OUT_EXPO, DepthCard, Tag, CopyBtn, Btn, Spinner, useBreakpoint } from "../Primitives";
import { oracleApi } from "../../lib/api";
import { truncAddr } from "../../lib/utils";

interface FeedEntry { symbol: string; feedType: string; baseCurrency?: string; quoteCurrency?: string; decimals: number; switchboardFeed: string; }
interface OracleConfig { feedSymbol: string; maxStalenessSecs: number; mintFeeBps: number; redeemFeeBps: number; maxConfidenceBps: number; quoteValiditySecs: number; }
interface QuoteResult { gross: number; fee: number; net: number; }

const MOCK_FEEDS: FeedEntry[] = [
  { symbol: "SOL/USD", feedType: "pull", decimals: 9, switchboardFeed: "GvDMxPzN8Hjgc3dqMkY7LtNbLR1VFphHJTkrc4JcFV3" },
  { symbol: "BTC/USD", feedType: "pull", decimals: 9, switchboardFeed: "8SXvChNYFhRq4EZuZvnhjrB3jF2E7iBxQCJtExV89c7" },
  { symbol: "ETH/USD", feedType: "pull", decimals: 9, switchboardFeed: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB" },
];

export default function OracleView() {
  const isMobile = useBreakpoint();
  const [tab, setTab] = useState<"feeds" | "config" | "simulator">("feeds");
  const [feeds, setFeeds] = useState<FeedEntry[]>(MOCK_FEEDS);
  const [config, setConfig] = useState<OracleConfig | null>(null);
  const [configMint, setConfigMint] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [rSymbol, setRSymbol] = useState(""); const [rType, setRType] = useState("");
  const [rBase, setRBase] = useState("");   const [rQuote, setRQuote] = useState("");
  const [rDecimals, setRDecimals] = useState(""); const [rFeed, setRFeed] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [iMint, setIMint] = useState("");   const [iSymbol, setISymbol] = useState("");
  const [iStaleness, setIStaleness] = useState("60"); const [iMintFee, setIMintFee] = useState("30");
  const [iRedeemFee, setIRedeemFee] = useState("30"); const [iConf, setIConf] = useState("200");
  const [iValidity, setIValidity] = useState("30"); const [initLoading, setInitLoading] = useState(false);
  const [mintQ, setMintQ] = useState({ usdCents: "", priceScaled: "", feedType: "pull", mintFeeBps: "30" });
  const [mintR, setMintR] = useState<QuoteResult | null>(null);
  const [redeemQ, setRedeemQ] = useState({ tokenAmount: "", priceScaled: "", feedType: "pull", redeemFeeBps: "30" });
  const [redeemR, setRedeemR] = useState<QuoteResult | null>(null);

  useEffect(() => { oracleApi.get<FeedEntry[]>("/feeds").then(d => { if (d?.length) setFeeds(d); }).catch(() => {}); }, []);

  const fetchConfig = async () => {
    if (!configMint) return;
    setLoadingConfig(true);
    try { setConfig(await oracleApi.get<OracleConfig>(`/config/${configMint}`)); } catch { } finally { setLoadingConfig(false); }
  };
  const handleRegisterFeed = async () => {
    setRegLoading(true);
    try {
      await oracleApi.post("/feeds/register", { symbol: rSymbol, feedType: rType, baseCurrency: rBase, quoteCurrency: rQuote, decimals: Number(rDecimals), switchboardFeed: rFeed });
      setFeeds(f => [...f, { symbol: rSymbol, feedType: rType, baseCurrency: rBase, quoteCurrency: rQuote, decimals: Number(rDecimals), switchboardFeed: rFeed }]);
    } catch { } finally { setRegLoading(false); }
  };
  const handleInitConfig = async () => {
    setInitLoading(true);
    try { await oracleApi.post("/config/initialize", { mint: iMint, feedSymbol: iSymbol, maxStalenessSecs: Number(iStaleness), mintFeeBps: Number(iMintFee), redeemFeeBps: Number(iRedeemFee), maxConfidenceBps: Number(iConf), quoteValiditySecs: Number(iValidity) }); }
    catch { } finally { setInitLoading(false); }
  };
  const simulateMint = async () => {
    try { setMintR(await oracleApi.getWithQuery<QuoteResult>("/quotes/mint/simulate", { usdCents: mintQ.usdCents, priceScaled: mintQ.priceScaled, feedType: mintQ.feedType, mintFeeBps: mintQ.mintFeeBps })); }
    catch { const cents = Number(mintQ.usdCents), price = Number(mintQ.priceScaled) || 1e8, fee = Number(mintQ.mintFeeBps); const gross = (cents * 1e6) / price; setMintR({ gross, fee: gross * fee / 10000, net: gross - gross * fee / 10000 }); }
  };
  const simulateRedeem = async () => {
    try { setRedeemR(await oracleApi.getWithQuery<QuoteResult>("/quotes/redeem/simulate", { tokenAmount: redeemQ.tokenAmount, priceScaled: redeemQ.priceScaled, feedType: redeemQ.feedType, redeemFeeBps: redeemQ.redeemFeeBps })); }
    catch { const tokens = Number(redeemQ.tokenAmount), price = Number(redeemQ.priceScaled) || 1e8, fee = Number(redeemQ.redeemFeeBps); const gross = (tokens * price) / 1e6; setRedeemR({ gross, fee: gross * fee / 10000, net: gross - gross * fee / 10000 }); }
  };

  const TABS = [{ id: "feeds" as const, l: "Price Feeds" }, { id: "config" as const, l: "Oracle Config" }, { id: "simulator" as const, l: "Simulator" }];

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Oracle</h1>
        <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Switchboard feeds · localhost:3003</p>
      </motion.div>
      <motion.div variants={FADE_UP} style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 5, border: "1px solid var(--border)", alignSelf: "flex-start", overflowX: "auto", maxWidth: "100%" }}>
        {TABS.map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)} whileTap={{ scale: 0.97 }} layout
            style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: tab === t.id ? "var(--surface2)" : "transparent", color: tab === t.id ? "var(--text)" : "var(--sub)" }}>
            {t.l}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}>

          {tab === "feeds" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <motion.div variants={STAGGER} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
                {feeds.map(f => (
                  <motion.div key={f.symbol} variants={FADE_UP}>
                    <DepthCard accent="purple">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <p style={{ fontFamily: "Geist Mono", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{f.symbol}</p>
                        <Tag variant="purple">{f.feedType}</Tag>
                      </div>
                      <p className="label" style={{ marginBottom: 5 }}>Feed address</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)" }}>{truncAddr(f.switchboardFeed)}</span>
                        <CopyBtn value={f.switchboardFeed} />
                      </div>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                        <span className="label" style={{ margin: 0 }}>Decimals</span>
                        <span style={{ fontFamily: "Geist Mono", fontSize: 11 }}>{f.decimals}</span>
                      </div>
                    </DepthCard>
                  </motion.div>
                ))}
              </motion.div>
              <DepthCard>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Register Price Feed</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
                  {[["Symbol", "SOL/USD", rSymbol, setRSymbol], ["Feed Type", "pull", rType, setRType], ["Base Currency", "SOL", rBase, setRBase],
                    ["Quote Currency", "USD", rQuote, setRQuote], ["Decimals", "9", rDecimals, setRDecimals], ["Switchboard Feed", "Base58 pubkey…", rFeed, setRFeed]
                  ].map(([l, p, v, s]: any, i) => (
                    <div key={i}><label className="label">{l}</label><input className="input" placeholder={p} value={v} onChange={e => s(e.target.value)} /></div>
                  ))}
                </div>
                <Btn variant="primary" size="sm" style={{ marginTop: 16 }} onClick={handleRegisterFeed} disabled={regLoading}>
                  {regLoading ? <><Spinner /> Registering…</> : <><Plus size={11} /> Register Feed</>}
                </Btn>
              </DepthCard>
            </div>
          )}

          {tab === "config" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              <DepthCard>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Fetch Config</p>
                <label className="label">Mint Address</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input className="input" placeholder="Base58 mint address…" value={configMint} onChange={e => setConfigMint(e.target.value)} />
                  <Btn variant="primary" onClick={fetchConfig} disabled={loadingConfig}>{loadingConfig ? <Spinner /> : <Search size={12} />}</Btn>
                </div>
                {config && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[["Feed Symbol", config.feedSymbol], ["Mint Fee", `${config.mintFeeBps} bps`], ["Redeem Fee", `${config.redeemFeeBps} bps`],
                      ["Max Staleness", `${config.maxStalenessSecs}s`], ["Max Confidence", `${config.maxConfidenceBps} bps`], ["Quote Validity", `${config.quoteValiditySecs}s`]
                    ].map(([k, v], i) => (
                      <div key={i} style={{ padding: "10px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <p className="label" style={{ marginBottom: 4 }}>{k}</p>
                        <p style={{ fontFamily: "Geist Mono", fontSize: 12 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </DepthCard>
              <DepthCard>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Initialize Config</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[["Mint Address", "Base58…", iMint, setIMint], ["Feed Symbol", "SOL/USD", iSymbol, setISymbol],
                    ["Max Staleness (secs)", "60", iStaleness, setIStaleness], ["Mint Fee (bps)", "30", iMintFee, setIMintFee],
                    ["Redeem Fee (bps)", "30", iRedeemFee, setIRedeemFee], ["Max Confidence (bps)", "200", iConf, setIConf],
                    ["Quote Validity (secs)", "30", iValidity, setIValidity],
                  ].map(([l, p, v, s]: any, i) => (
                    <div key={i}><label className="label">{l}</label><input className="input" placeholder={p} value={v} onChange={e => s(e.target.value)} /></div>
                  ))}
                </div>
                <Btn variant="accent" style={{ marginTop: 16, justifyContent: "center", width: "100%", borderRadius: 9 }} onClick={handleInitConfig} disabled={initLoading}>
                  {initLoading ? <><Spinner /> Initializing…</> : <><Zap size={12} /> Initialize</>}
                </Btn>
              </DepthCard>
            </div>
          )}

          {tab === "simulator" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              <DepthCard accent="green">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <ArrowUp size={13} style={{ color: "var(--accent)" }} />
                  <p style={{ fontWeight: 700, fontSize: 14 }}>Mint Quote</p>
                  <Tag variant="dim" style={{ marginLeft: "auto" }}>no RPC</Tag>
                </div>
                {([ ["USD (cents)", "usdCents", "e.g. 10000"], ["Price Scaled", "priceScaled", "e.g. 100000000"], ["Mint Fee (bps)", "mintFeeBps", "30"] ] as [string, string, string][]).map(([l, k, p]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label className="label">{l}</label>
                    <input className="input" placeholder={p} value={mintQ[k as keyof typeof mintQ]} onChange={e => { setMintQ(q => ({ ...q, [k]: e.target.value })); setMintR(null); }} />
                  </div>
                ))}
                <Btn variant="accent" onClick={simulateMint} style={{ width: "100%", justifyContent: "center", borderRadius: 9, marginBottom: 14 }}><Zap size={12} /> Simulate</Btn>
                <AnimatePresence>
                  {mintR && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: 14, background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.15)", borderRadius: 10 }}>
                      {([ ["Gross", mintR.gross.toFixed(4) + " tokens"], ["Fee", "− " + mintR.fee.toFixed(4) + " tokens"], ["Net", mintR.net.toFixed(4) + " tokens"] ] as [string, string][]).map(([l, v], i) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span style={{ fontSize: 11, color: "var(--sub)" }}>{l}</span>
                          <span style={{ fontFamily: "Geist Mono", fontSize: 12, color: i === 2 ? "var(--accent)" : "var(--text)", fontWeight: i === 2 ? 700 : 400 }}>{v}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </DepthCard>

              <DepthCard accent="purple">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <ArrowDown size={13} style={{ color: "var(--primary)" }} />
                  <p style={{ fontWeight: 700, fontSize: 14 }}>Redeem Quote</p>
                  <Tag variant="dim" style={{ marginLeft: "auto" }}>no RPC</Tag>
                </div>
                {([ ["Token Amount", "tokenAmount", "e.g. 1000"], ["Price Scaled", "priceScaled", "e.g. 100000000"], ["Redeem Fee (bps)", "redeemFeeBps", "30"] ] as [string, string, string][]).map(([l, k, p]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label className="label">{l}</label>
                    <input className="input" placeholder={p} value={redeemQ[k as keyof typeof redeemQ]} onChange={e => { setRedeemQ(q => ({ ...q, [k]: e.target.value })); setRedeemR(null); }} />
                  </div>
                ))}
                <Btn variant="primary" onClick={simulateRedeem} style={{ width: "100%", justifyContent: "center", borderRadius: 9, marginBottom: 14 }}><Zap size={12} /> Simulate</Btn>
                <AnimatePresence>
                  {redeemR && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: 14, background: "rgba(124,92,255,0.05)", border: "1px solid rgba(124,92,255,0.2)", borderRadius: 10 }}>
                      {([ ["Gross", "$" + (redeemR.gross / 100).toFixed(2)], ["Fee", "− $" + (redeemR.fee / 100).toFixed(2)], ["Net", "$" + (redeemR.net / 100).toFixed(2)] ] as [string, string][]).map(([l, v], i) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span style={{ fontSize: 11, color: "var(--sub)" }}>{l}</span>
                          <span style={{ fontFamily: "Geist Mono", fontSize: 12, color: i === 2 ? "#A88BFF" : "var(--text)", fontWeight: i === 2 ? 700 : 400 }}>{v}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </DepthCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
