"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, Unlock, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  STAGGER, FADE_UP, FADE_RIGHT, EASE_OUT_EXPO,
  DepthCard, Tag, CopyBtn, Modal, Btn, Spinner, useBreakpoint
} from "../Primitives";
import { backendApi } from "../../lib/api";
import { truncAddr, fmtTime } from "../../lib/utils";
import { useKeyStore } from "../KeyStoreProvider";

interface BlacklistEntry { address: string; reason: string; timestamp: string; }

const MOCK_BLACKLIST: BlacklistEntry[] = [
  { address: "Bad1xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", reason: "Sanctioned entity — OFAC list", timestamp: "2025-01-15T10:23:00Z" },
  { address: "Bad23Kzg7p3CW87d97TXJSDpbD5jBkhe3qA83TZRuJosgBs", reason: "Suspected wash trading", timestamp: "2025-01-18T14:05:00Z" },
  { address: "Bad39mNXtg2CW87d97TXJSDpbD5jBkhe3qA83TZRuJosgCs", reason: "KYC failure — frozen pending", timestamp: "2025-01-22T09:11:00Z" },
];

export default function ComplianceView() {
  const isMobile = useBreakpoint();
  const { keys } = useKeyStore();
  const [tab, setTab] = useState<"blacklist" | "check" | "seize">("blacklist");
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>(MOCK_BLACKLIST);
  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<string | null>(null);
  const [seizeModal, setSeizeModal] = useState(false);
  const [seizeText, setSeizeText] = useState("");
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState<"clean" | "blacklisted" | null>(null);
  const [loading, setLoading] = useState(false);
  const [addAddress, setAddAddress] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addKeypair, setAddKeypair] = useState("");
  const [seizeFrom, setSeizeFrom] = useState("");
  const [seizeTo, setSeizeTo] = useState("");
  const [seizeAmt, setSeizeAmt] = useState("");
  const [seizeReason, setSeizeReason] = useState("");
  const [seizeKeypair, setSeizeKeypair] = useState("");
  const [removeKeypair, setRemoveKeypair] = useState("");

  useEffect(() => {
    backendApi.get<BlacklistEntry[]>("/blacklist").then(d => { if (d?.length) setBlacklist(d); }).catch(() => { });
  }, []);

  const handleCheck = async () => {
    try { const r = await backendApi.get<{ blacklisted: boolean }>(`/blacklist/check/${checkAddr}`); setCheckResult(r.blacklisted ? "blacklisted" : "clean"); }
    catch { setCheckResult("clean"); }
  };
  const handleAdd = async () => {
    const finalKeypair = keys?.blacklisterKeypair || addKeypair;
    if (!finalKeypair) return;
    setLoading(true);
    try {
      await backendApi.post("/blacklist", { address: addAddress, reason: addReason, blacklisterKeypair: finalKeypair });
      setBlacklist(b => [...b, { address: addAddress, reason: addReason, timestamp: new Date().toISOString() }]);
      setAddModal(false); setAddAddress(""); setAddReason(""); setAddKeypair("");
    } catch { } finally { setLoading(false); }
  };
  const handleRemove = async () => {
    const finalKeypair = keys?.blacklisterKeypair || removeKeypair;
    if (!finalKeypair) return;
    setLoading(true);
    try {
      await backendApi.delete(`/blacklist/${removeModal}`, { blacklisterKeypair: finalKeypair });
      setBlacklist(b => b.filter(e => e.address !== removeModal));
      setRemoveModal(null); setRemoveKeypair("");
    } catch { } finally { setLoading(false); }
  };
  const handleSeize = async () => {
    const finalKeypair = keys?.seizerKeypair || seizeKeypair;
    if (!finalKeypair) return;
    setLoading(true);
    try {
      await backendApi.post("/seize", { from: seizeFrom, to: seizeTo, amount: Number(seizeAmt), reason: seizeReason, seizerKeypair: finalKeypair });
      setSeizeModal(false); setSeizeText("");
    } catch { } finally { setLoading(false); }
  };

  const TABS = [
    { id: "blacklist" as const, label: "Blacklist", count: blacklist.length },
    { id: "check" as const, label: "Check Address" },
    { id: "seize" as const, label: "Seize Tokens" },
  ];

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Compliance</h1>
        <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Blacklister &amp; Permanent Delegate authority</p>
      </motion.div>

      <motion.div variants={FADE_UP} style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 5, border: "1px solid var(--border)", alignSelf: "flex-start", overflowX: "auto", maxWidth: "100%" }}>
        {TABS.map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)} whileTap={{ scale: 0.97 }} layout
            style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: tab === t.id ? "var(--surface2)" : "transparent", color: tab === t.id ? "var(--text)" : "var(--sub)",
              display: "flex", alignItems: "center", gap: 6
            }}>
            {t.label}
            {t.count !== undefined && <Tag variant={tab === t.id ? "warn" : "dim"}>{t.count}</Tag>}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}>

          {tab === "blacklist" && (
            <DepthCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Active Entries</p>
                <Btn variant="primary" size="sm" onClick={() => setAddModal(true)}><Plus size={11} /> Add Address</Btn>
              </div>
              <motion.div variants={STAGGER} initial="hidden" animate="show">
                {blacklist.map((e, i) => (
                  <motion.div key={i} variants={FADE_RIGHT} layout whileHover={{ x: 3 }}
                    style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr auto auto", gap: isMobile ? 10 : 16, alignItems: "center", padding: "13px 4px", borderBottom: i < blacklist.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: "Geist Mono", fontSize: 12 }}>{truncAddr(e.address)}</span>
                        <CopyBtn value={e.address} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--sub)" }}>{e.reason}</span>
                    </div>
                    <span style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--dim)" }}>{fmtTime(e.timestamp)}</span>
                    {!isMobile && <Btn variant="ghost" size="sm" onClick={() => setRemoveModal(e.address)}><Unlock size={10} /> Remove</Btn>}
                  </motion.div>
                ))}
              </motion.div>
            </DepthCard>
          )}

          {tab === "check" && (
            <DepthCard style={{ maxWidth: 520 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Check Address Status</p>
              <label className="label">Wallet Address</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="Base58 address…" value={checkAddr} onChange={e => { setCheckAddr(e.target.value); setCheckResult(null); }} />
                <Btn variant="primary" onClick={handleCheck}><Search size={13} /></Btn>
              </div>
              <AnimatePresence>
                {checkResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{
                      marginTop: 16, padding: "16px 18px", borderRadius: 10,
                      background: checkResult === "clean" ? "rgba(0,229,160,0.06)" : "rgba(255,64,96,0.06)",
                      border: `1px solid ${checkResult === "clean" ? "rgba(0,229,160,0.25)" : "rgba(255,64,96,0.25)"}`,
                      display: "flex", alignItems: "center", gap: 10
                    }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                      {checkResult === "clean" ? <CheckCircle size={18} style={{ color: "var(--accent)" }} /> : <XCircle size={18} style={{ color: "var(--danger)" }} />}
                    </motion.div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: checkResult === "clean" ? "var(--accent)" : "var(--danger)" }}>
                        {checkResult === "clean" ? "Address is clean" : "Address is blacklisted"}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>{checkResult === "clean" ? "No blacklist entry found." : "Token account is currently frozen."}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </DepthCard>
          )}

          {tab === "seize" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              <DepthCard accent="red">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                  <motion.div animate={{ boxShadow: ["0 0 0px rgba(255,64,96,0)", "0 0 16px rgba(255,64,96,0.3)", "0 0 0px rgba(255,64,96,0)"] }} transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,64,96,0.1)", border: "1px solid rgba(255,64,96,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={14} style={{ color: "var(--danger)" }} />
                  </motion.div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--danger)" }}>Seize Tokens</p>
                    <p style={{ fontSize: 11, color: "var(--sub)", fontFamily: "Geist Mono" }}>Permanent Delegate required</p>
                  </div>
                </div>
                {[{ label: "From (frozen account)", ph: "Frozen token account…", val: seizeFrom, set: setSeizeFrom },
                { label: "To (destination)", ph: "Destination account…", val: seizeTo, set: setSeizeTo },
                { label: "Amount (base units)", ph: "e.g. 1000000", val: seizeAmt, set: setSeizeAmt, type: "number" },
                { label: "Reason (max 200 chars)", ph: "Legal justification…", val: seizeReason, set: setSeizeReason },
                ].map((f, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <label className="label">{f.label}</label>
                    <input className="input" placeholder={f.ph} type={f.type || "text"} value={f.val} onChange={e => f.set(e.target.value)} />
                  </div>
                ))}
                <div style={{ marginBottom: 12 }}>
                  <label className="label">Seizer Keypair</label>
                  {keys?.seizerKeypair ? (
                    <div style={{ padding: "10px 14px", background: "rgba(255,64,96,0.1)", color: "var(--danger)", borderRadius: 8, fontSize: 13, border: "1px solid rgba(255,64,96,0.2)" }}>
                      ✓ Provided by Secure Vault
                    </div>
                  ) : (
                    <input className="input" type="password" placeholder="Base58 keypair…" value={seizeKeypair} onChange={e => setSeizeKeypair(e.target.value)} />
                  )}
                </div>
                <Btn variant="danger" onClick={() => setSeizeModal(true)} style={{ width: "100%", justifyContent: "center", marginTop: 4, borderRadius: 9, padding: "10px" }}>
                  <AlertTriangle size={12} /> Proceed to Seize
                </Btn>
              </DepthCard>
              <div style={{ padding: 20, background: "rgba(255,64,96,0.03)", border: "1px solid rgba(255,64,96,0.1)", borderRadius: 14 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  <AlertTriangle size={13} style={{ color: "var(--danger)" }} />
                  <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: 12 }}>High-risk · Irreversible</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.8 }}>Token seizure is a permanent on-chain action that cannot be undone. All legal and compliance requirements must be satisfied before proceeding. This action is permanently logged.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add to Blacklist" subtitle="Token account will be frozen immediately.">
        {[{ l: "Wallet Address", p: "Base58 wallet address…", t: "text", val: addAddress, set: setAddAddress },
        { l: "Reason (max 100 chars)", p: "OFAC sanctioned entity…", t: "text", val: addReason, set: setAddReason },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <label className="label">{f.l}</label>
            <input className="input" placeholder={f.p} type={f.t} value={f.val} onChange={e => f.set(e.target.value)} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label className="label">Blacklister Keypair</label>
          {keys?.blacklisterKeypair ? (
            <div style={{ padding: "10px 14px", background: "rgba(0,229,160,0.1)", color: "var(--accent)", borderRadius: 8, fontSize: 13, border: "1px solid rgba(0,229,160,0.2)" }}>
              ✓ Provided by Secure Vault
            </div>
          ) : (
            <input className="input" type="password" placeholder="Base58 keypair…" value={addKeypair} onChange={e => setAddKeypair(e.target.value)} />
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleAdd} disabled={loading}>{loading ? <><Spinner /> Adding…</> : <><Lock size={11} /> Confirm</>}</Btn>
        </div>
      </Modal>

      <Modal open={!!removeModal} onClose={() => setRemoveModal(null)} title="Remove from Blacklist?" subtitle="This will thaw the associated token account.">
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8 }}>
          <p style={{ fontFamily: "Geist Mono", fontSize: 11, wordBreak: "break-all", color: "var(--sub)" }}>{removeModal}</p>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="label">Blacklister Keypair</label>
          {keys?.blacklisterKeypair ? (
            <div style={{ padding: "10px 14px", background: "rgba(0,229,160,0.1)", color: "var(--accent)", borderRadius: 8, fontSize: 13, border: "1px solid rgba(0,229,160,0.2)" }}>
              ✓ Provided by Secure Vault
            </div>
          ) : (
            <input className="input" type="password" placeholder="Base58 keypair…" value={removeKeypair} onChange={e => setRemoveKeypair(e.target.value)} />
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setRemoveModal(null)}>Cancel</Btn>
          <Btn variant="accent" onClick={handleRemove} disabled={loading}>{loading ? <><Spinner /> Removing…</> : <><Unlock size={11} /> Remove &amp; Thaw</>}</Btn>
        </div>
      </Modal>

      <Modal open={seizeModal} onClose={() => { setSeizeModal(false); setSeizeText(""); }} title="⚠ Confirm Token Seizure">
        <p style={{ fontSize: 12, color: "var(--sub)", marginBottom: 16, lineHeight: 1.7 }}>
          This action is <strong style={{ color: "var(--danger)" }}>irreversible</strong>. Type <strong style={{ color: "var(--text)" }}>SEIZE</strong> below to confirm.
        </p>
        <label className="label">Type confirmation</label>
        <input className="input" placeholder="SEIZE" value={seizeText} onChange={e => setSeizeText(e.target.value)}
          style={{ borderColor: seizeText === "SEIZE" ? "rgba(255,64,96,0.6)" : undefined, boxShadow: seizeText === "SEIZE" ? "0 0 0 3px rgba(255,64,96,0.1)" : undefined }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <Btn variant="ghost" onClick={() => { setSeizeModal(false); setSeizeText(""); }}>Cancel</Btn>
          <Btn variant="danger" disabled={seizeText !== "SEIZE" || loading} onClick={handleSeize} style={{ borderRadius: 9, padding: "9px 18px", fontWeight: 700 }}>
            <Lock size={11} /> Execute Seizure
          </Btn>
        </div>
      </Modal>
    </motion.div>
  );
}
