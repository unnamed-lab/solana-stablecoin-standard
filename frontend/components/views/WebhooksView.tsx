"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { STAGGER, FADE_UP, SPRING_SNAPPY, EASE_OUT_EXPO, DepthCard, Tag, Modal, Btn, Spinner, useBreakpoint } from "../Primitives";
import { backendApi } from "../../lib/api";
import { useWebhooks, useInvalidateWebhooks } from "../../lib/queries";

interface Webhook { id: string; url: string; events: string[]; active: boolean; }
const ALL_EVENTS = ["Minted", "Burned", "Seized", "PausedEvent"];

export default function WebhooksView() {
  const isMobile = useBreakpoint();
  const invalidateWebhooks = useInvalidateWebhooks();
  const { data: hooks = [] } = useWebhooks();

  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const toggleActive = async (id: string) => {
    const wh = hooks.find((w: Webhook) => w.id === id);
    if (!wh) return;
    try {
      await backendApi.put(`/webhooks/${id}`, { active: !wh.active });
      invalidateWebhooks();
    } catch { }
  };
  const handleCreate = async () => {
    setLoading(true);
    try {
      const events = newEvents.length === 0 ? ["*"] : newEvents;
      await backendApi.post<Webhook>("/webhooks", { url: newUrl, events, secret: newSecret, active: true });
      invalidateWebhooks();
      setCreateModal(false); setNewUrl(""); setNewSecret(""); setNewEvents([]);
    } catch { } finally { setLoading(false); }
  };
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await backendApi.delete(`/webhooks/${id}`);
      invalidateWebhooks();
    } catch { }
    setLoading(false); setDeleteModal(null);
  };
  const toggleEvent = (e: string) => setNewEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Webhooks</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Event-driven subscriptions</p>
        </div>
        <Btn variant="primary" onClick={() => setCreateModal(true)}><Plus size={13} /> Register</Btn>
      </motion.div>

      <motion.div variants={STAGGER} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {hooks.map((w) => (
          <motion.div key={w.id} variants={FADE_UP} layout>
            <DepthCard accent={w.active ? "green" : undefined} onClick={() => setExpanded(expanded === w.id ? null : w.id)} style={{ cursor: "pointer", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <motion.div animate={{ opacity: w.active ? [1, 0.4, 1] : 0.3 }} transition={{ duration: 2, repeat: w.active ? Infinity : 0 }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: w.active ? "var(--accent)" : "var(--dim)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "Geist Mono", fontSize: 12, color: "var(--text)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.url}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{w.events.map(e => <Tag key={e} variant="purple">{e === "*" ? "ALL" : e}</Tag>)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                  <motion.div onClick={() => toggleActive(w.id)} whileTap={{ scale: 0.92 }}
                    style={{ width: 38, height: 22, borderRadius: 99, cursor: "pointer", position: "relative",
                      background: w.active ? "rgba(0,229,160,0.25)" : "var(--surface2)", border: `1px solid ${w.active ? "rgba(0,229,160,0.4)" : "var(--border)"}` }}>
                    <motion.div animate={{ x: w.active ? 18 : 2 }} transition={SPRING_SNAPPY}
                      style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: w.active ? "var(--accent)" : "var(--dim)" }} />
                  </motion.div>
                  <Btn variant="ghost" size="sm" onClick={() => setDeleteModal(w.id)} style={{ padding: "5px 8px" }}><Trash2 size={11} /></Btn>
                </div>
                <motion.div animate={{ rotate: expanded === w.id ? 90 : 0 }} transition={SPRING_SNAPPY}><ChevronRight size={14} style={{ color: "var(--sub)" }} /></motion.div>
              </div>
              <AnimatePresence>
                {expanded === w.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }} style={{ overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                    <div style={{ paddingTop: 20, marginTop: 20, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <div><label className="label">URL</label><input className="input" defaultValue={w.url} /></div>
                      <div><label className="label">HMAC Secret</label><input className="input" type="password" placeholder="New secret…" /></div>
                      <div><label className="label">Events</label><input className="input" defaultValue={w.events.join(", ")} /></div>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                      <Btn variant="primary" size="sm">Save</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setExpanded(null)}>Cancel</Btn>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </DepthCard>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={FADE_UP}>
        <DepthCard>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Event Payload Reference</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            <div>
              <p className="label">Supported events</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>{ALL_EVENTS.map(e => <Tag key={e} variant="dim">{e}</Tag>)}</div>
            </div>
            <div>
              <p className="label">Signature headers</p>
              <p style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)", marginTop: 4, lineHeight: 1.9 }}>
                X-SSS-Event: Minted<br />
                X-SSS-Signature: sha256=&lt;HMAC&gt;
              </p>
            </div>
          </div>
        </DepthCard>
      </motion.div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Register Webhook">
        <div style={{ marginBottom: 14 }}><label className="label">URL</label><input className="input" placeholder="https://your-endpoint.com/hook" value={newUrl} onChange={e => setNewUrl(e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Events</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {ALL_EVENTS.map(e => (
              <motion.label key={e} whileHover={{ scale: 1.02 }}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer", padding: "5px 10px",
                  background: newEvents.includes(e) ? "rgba(124,92,255,0.12)" : "var(--surface2)",
                  borderRadius: 7, border: newEvents.includes(e) ? "1px solid rgba(124,92,255,0.3)" : "1px solid var(--border)" }}>
                <input type="checkbox" checked={newEvents.includes(e)} onChange={() => toggleEvent(e)} style={{ accentColor: "var(--primary)" }} /> {e}
              </motion.label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}><label className="label">HMAC Secret</label><input className="input" type="password" placeholder="Signing secret…" value={newSecret} onChange={e => setNewSecret(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={loading || !newUrl} onClick={handleCreate}>{loading ? <><Spinner /> Registering…</> : <><Plus size={11} /> Register</>}</Btn>
        </div>
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Webhook?" subtitle="This webhook will stop receiving events immediately.">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={() => deleteModal && handleDelete(deleteModal)} style={{ borderRadius: 9, padding: "9px 18px", fontWeight: 700 }}><Trash2 size={11} /> Delete</Btn>
        </div>
      </Modal>
    </motion.div>
  );
}
