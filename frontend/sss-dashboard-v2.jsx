import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView, animate } from "framer-motion";
import {
  LayoutDashboard, Users, Shield, FileText, Webhook, Activity,
  Flame, Coins, Copy, ExternalLink, Plus, Trash2, Search,
  Download, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Eye, EyeOff, Filter, Lock, Unlock, Zap, Globe, Bell,
  LogOut, ArrowDown, ArrowUp, CircleDot, BarChart3, ChevronRight,
  Sparkles, TrendingUp, Hash, Clock, MoreHorizontal
} from "lucide-react";

/* ── Fonts ─────────────────────────────────────────────────────────── */
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist+Mono:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #070709;
      --bg2:      #0C0C10;
      --surface:  #111116;
      --surface2: #18181F;
      --border:   rgba(255,255,255,0.06);
      --border2:  rgba(255,255,255,0.1);
      --primary:  #7C5CFF;
      --accent:   #00E5A0;
      --danger:   #FF4060;
      --warn:     #F59E0B;
      --text:     #F0F0F5;
      --sub:      #8888A0;
      --dim:      #444455;
    }

    html, body { height: 100%; overflow: hidden; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Syne', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .mono { font-family: 'Geist Mono', monospace; }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 99px; }

    button { font-family: 'Syne', sans-serif; }
    input, select { font-family: 'Geist Mono', monospace; }

    .input {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input:focus {
      border-color: rgba(124,92,255,0.5);
      box-shadow: 0 0 0 3px rgba(124,92,255,0.08);
    }
    .input::placeholder { color: var(--dim); }

    .label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--sub);
      margin-bottom: 7px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-6px); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}</style>
);

/* ── Design tokens / easing ────────────────────────────────────────── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
const EASE_IN_OUT  = [0.45, 0, 0.55, 1];
const SPRING_SNAPPY = { type: "spring", stiffness: 400, damping: 35 };
const SPRING_BOUNCY = { type: "spring", stiffness: 300, damping: 22 };
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const FADE_UP = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.55, ease: EASE_OUT_EXPO } }
};
const FADE_RIGHT = {
  hidden: { opacity: 0, x: -16, filter: "blur(3px)" },
  show:   { opacity: 1, x: 0,   filter: "blur(0px)", transition: { duration: 0.45, ease: EASE_OUT_EXPO } }
};

/* ── Ambient Background ─────────────────────────────────────────────── */
const AmbientBg = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    <motion.div
      animate={{ opacity: [0.35, 0.5, 0.35], scale: [1, 1.08, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      style={{ position: "absolute", top: -200, left: -100, width: 700, height: 700,
        background: "radial-gradient(ellipse, rgba(124,92,255,0.12) 0%, transparent 70%)", borderRadius: "50%" }}
    />
    <motion.div
      animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.12, 1] }}
      transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      style={{ position: "absolute", bottom: -150, right: 200, width: 500, height: 500,
        background: "radial-gradient(ellipse, rgba(0,229,160,0.08) 0%, transparent 70%)", borderRadius: "50%" }}
    />
    {/* Subtle grid */}
    <div style={{ position: "absolute", inset: 0,
      backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
      backgroundSize: "40px 40px" }} />
  </div>
);

/* ── Magnetic Button ────────────────────────────────────────────────── */
const MagneticBtn = ({ children, style, onClick, disabled, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMove = (e) => {
    if (disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.3);
    y.set((e.clientY - cy) * 0.3);
  };

  return (
    <motion.button ref={ref} onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy, ...style, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}
      whileTap={{ scale: 0.96 }} onClick={!disabled ? onClick : undefined} className={className}>
      {children}
    </motion.button>
  );
};

/* ── Counting Number ────────────────────────────────────────────────── */
const CountUp = ({ to, duration = 1.2, decimals = 0, prefix = "", suffix = "" }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => setVal(v),
    });
    return controls.stop;
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}{val.toLocaleString("en-US", { maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

/* ── Glowing Tag ────────────────────────────────────────────────────── */
const Tag = ({ children, variant = "dim", pulse = false }) => {
  const colors = {
    green:  { bg: "rgba(0,229,160,0.08)",  border: "rgba(0,229,160,0.2)",  text: "#00E5A0" },
    red:    { bg: "rgba(255,64,96,0.08)",   border: "rgba(255,64,96,0.2)",  text: "#FF4060" },
    purple: { bg: "rgba(124,92,255,0.1)",   border: "rgba(124,92,255,0.25)", text: "#A88BFF" },
    warn:   { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  text: "#F59E0B" },
    dim:    { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "#8888A0" },
  };
  const c = colors[variant];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 10, fontFamily: "Geist Mono, monospace", fontWeight: 600, letterSpacing: "0.04em" }}>
      {pulse && <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ width: 5, height: 5, borderRadius: "50%", background: c.text, display: "inline-block" }} />}
      {children}
    </span>
  );
};

/* ── Card with depth hover ─────────────────────────────────────────── */
const DepthCard = ({ children, style, accent, onClick }) => {
  const accentColors = { green: "#00E5A0", purple: "#7C5CFF", red: "#FF4060", warn: "#F59E0B" };
  const accentColor = accentColors[accent] || null;
  return (
    <motion.div onClick={onClick}
      whileHover={{ y: -2, boxShadow: accentColor
        ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.06)`
        : "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)" }}
      transition={SPRING_SNAPPY}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 22,
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...(accentColor ? { borderTop: `1.5px solid ${accentColor}40` } : {}),
        ...style
      }}>
      {accentColor && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60,
          background: `radial-gradient(ellipse at 50% -10%, ${accentColor}10 0%, transparent 70%)`,
          pointerEvents: "none" }} />
      )}
      {children}
    </motion.div>
  );
};

/* ── Stat Card ─────────────────────────────────────────────────────── */
const StatCard = ({ label, value, unit, icon, accent, change }) => (
  <motion.div variants={FADE_UP}>
    <DepthCard accent={accent}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>{label}</p>
          <p style={{ fontFamily: "Geist Mono", fontSize: 26, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</p>
          <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 6, fontFamily: "Geist Mono" }}>{unit}</p>
        </div>
        <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={SPRING_BOUNCY}
          style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface2)",
            border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sub)" }}>
          {icon}
        </motion.div>
      </div>
      {change && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: change > 0 ? "var(--accent)" : "var(--danger)" }}>
          {change > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          <span style={{ fontFamily: "Geist Mono" }}>{Math.abs(change)}%</span>
          <span style={{ color: "var(--sub)" }}>vs last 24h</span>
        </div>
      )}
    </DepthCard>
  </motion.div>
);

/* ── Tx Link ─────────────────────────────────────────────────────────── */
const TxLink = ({ sig }) => (
  <motion.a href={`https://solscan.io/tx/${sig}`} target="_blank" rel="noreferrer"
    whileHover={{ color: "#A88BFF" }}
    style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11, fontFamily: "Geist Mono, monospace", textDecoration: "none" }}>
    {sig.slice(0, 8)}… <ExternalLink size={9} />
  </motion.a>
);

/* ── Copy Button ──────────────────────────────────────────────────── */
const CopyBtn = ({ value }) => {
  const [done, setDone] = useState(false);
  return (
    <motion.button whileTap={{ scale: 0.85 }}
      onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px",
        color: done ? "var(--accent)" : "var(--dim)" }}>
      <AnimatePresence mode="wait">
        <motion.span key={done ? "check" : "copy"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
          {done ? <CheckCircle size={11} /> : <Copy size={11} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

/* ── Action Badge ─────────────────────────────────────────────────── */
const ActionBadge = ({ action }) => {
  const map = { MINT: "green", BURN: "red", FREEZE: "warn", SEIZE: "red", UNFREEZE: "green" };
  return <Tag variant={map[action] || "dim"}>{action}</Tag>;
};

/* ── Slide-in modal ─────────────────────────────────────────────────── */
const Modal = ({ open, onClose, children, title, subtitle }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(4,4,8,0.85)", backdropFilter: "blur(12px)", zIndex: 200 }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1,    y: 0,  filter: "blur(0px)" }}
          exit={{   opacity: 0, scale: 0.96,  y: 10, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 460, zIndex: 201,
            background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: 18, padding: 28, boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
          {title && (
            <div style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 4 }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/* ── Btn variants ─────────────────────────────────────────────────── */
const Btn = ({ children, variant = "primary", onClick, disabled, style, size = "md" }) => {
  const variants = {
    primary: { background: "var(--primary)", color: "#fff", border: "none" },
    accent:  { background: "var(--accent)",  color: "#000", border: "none", fontWeight: 700 },
    ghost:   { background: "transparent",    color: "var(--sub)", border: "1px solid var(--border2)" },
    danger:  { background: "transparent",    color: "var(--danger)", border: "1px solid rgba(255,64,96,0.3)" },
  };
  const sizes = { sm: { padding: "6px 12px", fontSize: 11 }, md: { padding: "9px 18px", fontSize: 13 }, lg: { padding: "12px 24px", fontSize: 14 } };
  return (
    <MagneticBtn disabled={disabled} onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9,
        fontWeight: 600, cursor: "pointer", ...variants[variant], ...sizes[size], ...style }}>
      {children}
    </MagneticBtn>
  );
};

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const fmt = (raw, dec = 6) => (Number(raw) / 10 ** dec).toLocaleString("en-US", { maximumFractionDigits: 2 });
const truncAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const MOCK_AUDIT = [
  { action: "MINT",   actor: "7xKXtg…AsU", amount: "5,000",  txSig: "5Kz7xYpQ1a", timestamp: "2025-01-22T15:04:00Z" },
  { action: "BURN",   actor: "3Kzg7p…BsP", amount: "1,200",  txSig: "3wCXURH82b", timestamp: "2025-01-22T14:32:00Z" },
  { action: "FREEZE", actor: "9mNXtg…CsQ", amount: "—",      txSig: "9pQkLMN23c", timestamp: "2025-01-22T13:15:00Z" },
  { action: "SEIZE",  actor: "5yLKtg…DtR", amount: "850",    txSig: "7rTmVWX44d", timestamp: "2025-01-22T12:00:00Z" },
  { action: "MINT",   actor: "2wMKtg…EuS", amount: "20,000", txSig: "2sPnYZ115e", timestamp: "2025-01-21T18:45:00Z" },
  { action: "BURN",   actor: "8nOKtg…FvT", amount: "300",    txSig: "8qUoAB556f", timestamp: "2025-01-21T16:22:00Z" },
];

const MOCK_HOLDERS = [
  { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", uiAmountString: "45,000.00", amount: "45000000000" },
  { address: "3Kzg7p3CW87d97TXJSDpbD5jBkhe3qA83TZRu9osgBsP", uiAmountString: "32,000.00", amount: "32000000000" },
  { address: "9mNXtg2CW87d97TXJSDpbD5jBkhe3qA83TZRuJosgCsQ", uiAmountString: "18,500.00", amount: "18500000000" },
  { address: "5yLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgDtR", uiAmountString: "12,750.00", amount: "12750000000" },
  { address: "2wMKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgEuS", uiAmountString:  "9,900.00", amount:  "9900000000" },
  { address: "8nOKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgFvT", uiAmountString:  "6,400.00", amount:  "6400000000" },
];

const MOCK_BLACKLIST = [
  { address: "Bad1xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRu", reason: "Sanctioned entity — OFAC list", timestamp: "2025-01-15T10:23:00Z" },
  { address: "Bad23Kzg7p3CW87d97TXJSDpbD5jBkhe3qA83TZ",  reason: "Suspected wash trading",        timestamp: "2025-01-18T14:05:00Z" },
  { address: "Bad39mNXtg2CW87d97TXJSDpbD5jBkhe3qA83TZ", reason: "KYC failure — frozen pending",   timestamp: "2025-01-22T09:11:00Z" },
];

const MOCK_WEBHOOKS = [
  { id: "wh_1", url: "https://api.myservice.com/solana/hook", events: ["Minted", "Burned"], active: true },
  { id: "wh_2", url: "https://monitor.example.io/events",    events: ["*"],                active: true },
  { id: "wh_3", url: "https://legacy.oldapp.com/webhook",    events: ["Seized"],           active: false },
];

const MOCK_FEEDS = [
  { symbol: "SOL/USD", feedType: "pull", decimals: 9, switchboardFeed: "GvDMxPzN8Hjgc3dqMkY7LtNbLR1VFphHJTkrc4JcFV3" },
  { symbol: "BTC/USD", feedType: "pull", decimals: 9, switchboardFeed: "8SXvChNYFhRq4EZuZvnhjrB3jF2E7iBxQCJtExV89c7" },
  { symbol: "ETH/USD", feedType: "pull", decimals: 9, switchboardFeed: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB" },
];

/* ══════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const [mintAmt, setMintAmt] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(null);
  const [txBanner, setTxBanner] = useState(null);

  const submit = (type) => {
    setLoading(type);
    setTimeout(() => { setLoading(null); setTxBanner({ type, sig: "5Kz7xYpQABCDfake" }); }, 1600);
  };

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Overview
          </h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>
            Token lifecycle · real-time
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Tag variant="green" pulse>LIVE</Tag>
          <Tag variant="dim">Mainnet-Beta</Tag>
        </div>
      </motion.div>

      {/* Stat grid */}
      <motion.div variants={STAGGER}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Total Supply" value={<CountUp to={125000000} decimals={0} />}
          unit="USDS" icon={<Coins size={15} />} accent="purple" change={2.4} />
        <StatCard label="Max Supply"   value={<CountUp to={500000000} decimals={0} />}
          unit="USDS" icon={<BarChart3 size={15} />} accent="dim" />
        <StatCard label="Total Burned" value={<CountUp to={3200000} decimals={0} />}
          unit="USDS" icon={<Flame size={15} />} accent="red" change={-0.8} />
        <StatCard label="Holders"      value={<CountUp to={1500} />}
          unit="accounts" icon={<Users size={15} />} accent="green" change={5.1} />
      </motion.div>

      {/* TX Banner */}
      <AnimatePresence>
        {txBanner && (
          <motion.div key="banner"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 10, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.5 }}>
                <CheckCircle size={15} style={{ color: "var(--accent)" }} />
              </motion.div>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{txBanner.type} confirmed</span>
              <span style={{ color: "var(--sub)" }}>·</span>
              <TxLink sig={txBanner.sig} />
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTxBanner(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sub)", fontSize: 18, lineHeight: 1 }}>×</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mint + Burn */}
      <motion.div variants={STAGGER} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
              <div>
                <label className="label">Recipient</label>
                <input className="input" placeholder="Base58 wallet address…" />
              </div>
              <div>
                <label className="label">Amount (base units)</label>
                <div style={{ position: "relative" }}>
                  <input className="input" type="number" placeholder="1000000" value={mintAmt}
                    onChange={e => setMintAmt(e.target.value)} style={{ paddingRight: 90 }} />
                  <AnimatePresence>
                    {mintAmt && (
                      <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          fontSize: 10, color: "var(--accent)", fontFamily: "Geist Mono", pointerEvents: "none" }}>
                        = {(Number(mintAmt)/1e6).toFixed(2)} USDS
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label className="label">Minter Keypair</label>
                <div style={{ position: "relative" }}>
                  <input className="input" type={showKey ? "text" : "password"} placeholder="Base58 keypair…" style={{ paddingRight: 40 }} />
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowKey(!showKey)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--sub)" }}>
                    {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </motion.button>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ marginTop: 6, padding: "5px 9px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 7,
                    display: "flex", gap: 5, alignItems: "flex-start" }}>
                  <AlertTriangle size={10} style={{ color: "var(--warn)", marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "var(--warn)", lineHeight: 1.5 }}>Never expose keypairs in public environments</span>
                </motion.div>
              </div>
              <Btn variant="accent" onClick={() => submit("MINT")} disabled={!!loading}
                style={{ justifyContent: "center", width: "100%", borderRadius: 9 }}>
                {loading === "MINT"
                  ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                  : <><Coins size={13} /> Mint Tokens</>}
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
              <div>
                <label className="label">Amount (base units)</label>
                <input className="input" type="number" placeholder="1000000" />
              </div>
              <div>
                <label className="label">Source Account <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--dim)" }}>(optional)</span></label>
                <input className="input" placeholder="Defaults to burner ATA…" />
              </div>
              <div>
                <label className="label">Burner Keypair</label>
                <input className="input" type="password" placeholder="Base58 keypair…" />
              </div>
              <div style={{ flex: 1 }} />
              <Btn variant="danger" onClick={() => submit("BURN")} disabled={!!loading}
                style={{ justifyContent: "center", width: "100%", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700 }}>
                {loading === "BURN"
                  ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                  : <><Flame size={13} /> Burn Tokens</>}
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
            <Tag variant="dim">6 events</Tag>
          </div>
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {MOCK_AUDIT.map((r, i) => (
              <motion.div key={i} variants={FADE_RIGHT}
                whileHover={{ x: 3, background: "rgba(255,255,255,0.02)" }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0",
                  borderBottom: i < MOCK_AUDIT.length - 1 ? "1px solid var(--border)" : "none", borderRadius: 6, paddingLeft: 4, paddingRight: 4 }}>
                <ActionBadge action={r.action} />
                <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)", flex: 1 }}>{r.actor}</span>
                <span style={{ fontFamily: "Geist Mono", fontSize: 11 }}>{r.amount !== "—" ? `${r.amount} USDS` : <span style={{ color: "var(--dim)" }}>—</span>}</span>
                <TxLink sig={r.txSig} />
                <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "Geist Mono", minWidth: 100, textAlign: "right" }}>
                  {new Date(r.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </DepthCard>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   HOLDERS PAGE
══════════════════════════════════════════════════════════ */
const HoldersPage = () => {
  const [minAmt, setMinAmt] = useState("");
  const filtered = MOCK_HOLDERS.filter(h => !minAmt || Number(h.amount) >= Number(minAmt));
  const totalSupply = 125000000000000;

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Holders</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Distribution by balance</p>
        </div>
        <DepthCard accent="green" style={{ padding: "12px 20px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span style={{ fontFamily: "Geist Mono", fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em" }}>
              <CountUp to={1500} />
            </span>
            <span style={{ color: "var(--sub)", fontSize: 12 }}>total holders</span>
          </div>
        </DepthCard>
      </motion.div>

      <motion.div variants={FADE_UP}>
        <DepthCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Leaderboard</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Filter size={12} style={{ color: "var(--sub)" }} />
              <input className="input" style={{ width: 180 }} placeholder="Min raw amount…" value={minAmt} onChange={e => setMinAmt(e.target.value)} />
            </div>
          </div>
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {filtered.map((h, i) => {
              const share = (Number(h.amount) / totalSupply * 100).toFixed(3);
              return (
                <motion.div key={i} variants={FADE_RIGHT}
                  whileHover={{ x: 4, background: "rgba(255,255,255,0.025)" }}
                  style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto", gap: 14, alignItems: "center",
                    padding: "13px 8px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", borderRadius: 8, cursor: "default" }}>
                  <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--dim)", fontWeight: 600 }}>
                    {i === 0 ? <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}># 1</motion.span> : `#${i+1}`}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Geist Mono", fontSize: 12 }}>{truncAddr(h.address)}</span>
                    <CopyBtn value={h.address} />
                    <motion.a whileHover={{ color: "var(--primary)" }} href={`https://solscan.io/account/${h.address}`} target="_blank" rel="noreferrer"
                      style={{ color: "var(--dim)" }}><ExternalLink size={10} /></motion.a>
                  </div>
                  <span style={{ fontFamily: "Geist Mono", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{h.uiAmountString}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100, justifyContent: "flex-end" }}>
                    <div style={{ width: 52, height: 3, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(parseFloat(share) * 500, 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06, ease: EASE_OUT_EXPO }}
                        style={{ height: "100%", background: i === 0 ? "var(--accent)" : "var(--primary)", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--sub)" }}>{share}%</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </DepthCard>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   COMPLIANCE PAGE
══════════════════════════════════════════════════════════ */
const CompliancePage = () => {
  const [tab, setTab] = useState("blacklist");
  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState(null);
  const [seizeModal, setSeizeModal] = useState(false);
  const [seizeText, setSeizeText] = useState("");
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState(null);

  const tabs = [
    { id: "blacklist", label: "Blacklist", count: 3 },
    { id: "check",     label: "Check Address" },
    { id: "seize",     label: "Seize Tokens" },
  ];

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Compliance</h1>
        <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>
          Blacklister & Permanent Delegate authority
        </p>
      </motion.div>

      {/* Tab bar */}
      <motion.div variants={FADE_UP}
        style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 5, border: "1px solid var(--border)", alignSelf: "flex-start" }}>
        {tabs.map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: tab === t.id ? "var(--surface2)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--sub)",
              display: "flex", alignItems: "center", gap: 6 }}
            whileTap={{ scale: 0.97 }}
            layout>
            {t.label}
            {t.count && <Tag variant={tab === t.id ? "warn" : "dim"}>{t.count}</Tag>}
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
                {MOCK_BLACKLIST.map((e, i) => (
                  <motion.div key={i} variants={FADE_RIGHT} layout
                    whileHover={{ x: 3 }}
                    style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 16, alignItems: "center",
                      padding: "13px 4px", borderBottom: i < MOCK_BLACKLIST.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <motion.div animate={{ opacity: [1,0.4,1] }} transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: "Geist Mono", fontSize: 12 }}>{truncAddr(e.address)}</span>
                        <CopyBtn value={e.address} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--sub)" }}>{e.reason}</span>
                    </div>
                    <span style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--dim)" }}>
                      {new Date(e.timestamp).toLocaleDateString()}
                    </span>
                    <Btn variant="ghost" size="sm" onClick={() => setRemoveModal(e.address)}><Unlock size={10} /> Remove</Btn>
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
                <input className="input" placeholder="Base58 address…" value={checkAddr}
                  onChange={e => { setCheckAddr(e.target.value); setCheckResult(null); }} />
                <Btn variant="primary" onClick={() => setCheckResult(MOCK_BLACKLIST.some(b => b.address === checkAddr) ? "blacklisted" : "clean")}>
                  <Search size={13} />
                </Btn>
              </div>
              <AnimatePresence>
                {checkResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{ marginTop: 16, padding: "16px 18px", borderRadius: 10,
                      background: checkResult === "clean" ? "rgba(0,229,160,0.06)" : "rgba(255,64,96,0.06)",
                      border: `1px solid ${checkResult === "clean" ? "rgba(0,229,160,0.25)" : "rgba(255,64,96,0.25)"}`,
                      display: "flex", alignItems: "center", gap: 10 }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                      {checkResult === "clean"
                        ? <CheckCircle size={18} style={{ color: "var(--accent)" }} />
                        : <XCircle size={18} style={{ color: "var(--danger)" }} />}
                    </motion.div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: checkResult === "clean" ? "var(--accent)" : "var(--danger)" }}>
                        {checkResult === "clean" ? "Address is clean" : "Address is blacklisted"}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>
                        {checkResult === "clean" ? "No blacklist entry found for this address." : "Token account is currently frozen."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </DepthCard>
          )}

          {tab === "seize" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <DepthCard accent="red">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                  <motion.div animate={{ boxShadow: ["0 0 0px rgba(255,64,96,0)", "0 0 16px rgba(255,64,96,0.3)", "0 0 0px rgba(255,64,96,0)"] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,64,96,0.1)", border: "1px solid rgba(255,64,96,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={14} style={{ color: "var(--danger)" }} />
                  </motion.div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--danger)" }}>Seize Tokens</p>
                    <p style={{ fontSize: 11, color: "var(--sub)", fontFamily: "Geist Mono" }}>Permanent Delegate required</p>
                  </div>
                </div>
                {[
                  { label: "From (frozen account)", ph: "Frozen token account…" },
                  { label: "To (destination)", ph: "Destination account…" },
                  { label: "Amount (base units)", ph: "e.g. 1000000", type: "number" },
                  { label: "Reason (max 200 chars)", ph: "Legal justification…" },
                  { label: "Seizer Keypair", ph: "Base58 keypair…", type: "password" },
                ].map((f, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <label className="label">{f.label}</label>
                    <input className="input" placeholder={f.ph} type={f.type || "text"} />
                  </div>
                ))}
                <Btn variant="danger" onClick={() => setSeizeModal(true)} style={{ width: "100%", justifyContent: "center", marginTop: 4, borderRadius: 9, padding: "10px" }}>
                  <AlertTriangle size={12} /> Proceed to Seize
                </Btn>
              </DepthCard>
              <div style={{ padding: "20px", background: "rgba(255,64,96,0.03)", border: "1px solid rgba(255,64,96,0.1)", borderRadius: 14 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  <AlertTriangle size={13} style={{ color: "var(--danger)" }} />
                  <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: 12 }}>High-risk · Irreversible</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.8 }}>
                  Token seizure is a permanent on-chain action that cannot be undone. All legal and compliance requirements must be satisfied. A typed-confirmation dialog will appear. This action is permanently logged.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add to Blacklist" subtitle="Token account will be frozen immediately.">
        {[{ l: "Wallet Address", p: "Base58 wallet address…" },
          { l: "Reason (max 100 chars)", p: "OFAC sanctioned entity…" },
          { l: "Blacklister Keypair", p: "Base58 keypair…", t: "password" }].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <label className="label">{f.l}</label>
            <input className="input" placeholder={f.p} type={f.t || "text"} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => setAddModal(false)}><Lock size={11} /> Confirm</Btn>
        </div>
      </Modal>

      <Modal open={!!removeModal} onClose={() => setRemoveModal(null)} title="Remove from Blacklist?" subtitle="This will thaw the associated token account.">
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8 }}>
          <p style={{ fontFamily: "Geist Mono", fontSize: 11, wordBreak: "break-all", color: "var(--sub)" }}>{removeModal}</p>
        </div>
        <label className="label">Blacklister Keypair</label>
        <input className="input" type="password" placeholder="Base58 keypair…" style={{ marginBottom: 18 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setRemoveModal(null)}>Cancel</Btn>
          <Btn variant="accent" onClick={() => setRemoveModal(null)}><Unlock size={11} /> Remove & Thaw</Btn>
        </div>
      </Modal>

      <Modal open={seizeModal} onClose={() => { setSeizeModal(false); setSeizeText(""); }} title="⚠ Confirm Token Seizure">
        <p style={{ fontSize: 12, color: "var(--sub)", marginBottom: 16, lineHeight: 1.7 }}>
          This action is <strong style={{ color: "var(--danger)" }}>irreversible</strong>. Type <strong style={{ color: "var(--text)" }}>SEIZE</strong> below to confirm execution.
        </p>
        <label className="label">Type confirmation</label>
        <input className="input" placeholder="SEIZE" value={seizeText} onChange={e => setSeizeText(e.target.value)}
          style={{ borderColor: seizeText === "SEIZE" ? "rgba(255,64,96,0.6)" : undefined,
            boxShadow: seizeText === "SEIZE" ? "0 0 0 3px rgba(255,64,96,0.1)" : undefined }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <Btn variant="ghost" onClick={() => { setSeizeModal(false); setSeizeText(""); }}>Cancel</Btn>
          <Btn variant="danger" disabled={seizeText !== "SEIZE"} onClick={() => { setSeizeModal(false); setSeizeText(""); }}
            style={{ padding: "9px 18px", borderRadius: 9, fontWeight: 700 }}>
            <Lock size={11} /> Execute Seizure
          </Btn>
        </div>
      </Modal>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   AUDIT PAGE
══════════════════════════════════════════════════════════ */
const AuditPage = () => {
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const filtered = MOCK_AUDIT.filter(r => (!actionFilter || r.action === actionFilter) && (!actorFilter || r.actor.includes(actorFilter)));

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Audit Log</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Immutable admin action history</p>
        </div>
        <Btn variant="ghost" size="sm"><Download size={11} /> Export CSV</Btn>
      </motion.div>

      <motion.div variants={FADE_UP}>
        <DepthCard style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="label">Action</label>
              <select className="input" value={actionFilter} onChange={e => setActionFilter(e.target.value)}
                style={{ background: "var(--surface2)" }}>
                <option value="">All actions</option>
                {["MINT","BURN","SEIZE","FREEZE","UNFREEZE"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label className="label">Actor address</label>
              <input className="input" placeholder="Filter by actor…" value={actorFilter} onChange={e => setActorFilter(e.target.value)} />
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label className="label">Mint address</label>
              <input className="input" placeholder="Filter by mint…" />
            </div>
            <AnimatePresence>
              {(actionFilter || actorFilter) && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Btn variant="ghost" size="sm" onClick={() => { setActionFilter(""); setActorFilter(""); }}>Clear</Btn>
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
            <Tag variant="dim">{filtered.length} results</Tag>
          </div>
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {filtered.map((r, i) => (
              <motion.div key={i} variants={FADE_RIGHT}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.02)", x: 2 }}
                style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 16, padding: "13px 20px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
                <ActionBadge action={r.action} />
                <span style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)" }}>{r.actor}</span>
                <span style={{ fontFamily: "Geist Mono", fontSize: 11 }}>{r.amount !== "—" ? `${r.amount} USDS` : <span style={{ color: "var(--dim)" }}>—</span>}</span>
                <TxLink sig={r.txSig} />
                <span style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--dim)" }}>{new Date(r.timestamp).toLocaleString()}</span>
              </motion.div>
            ))}
          </motion.div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 6 }}>
            {["←", "1", "2", "3", "→"].map((l, i) => (
              <motion.button key={i} whileHover={{ background: "var(--surface2)" }} whileTap={{ scale: 0.92 }}
                style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border)", background: "transparent",
                  color: l === "1" ? "var(--text)" : "var(--sub)", cursor: "pointer", fontSize: 12, fontFamily: "Geist Mono",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                {l}
              </motion.button>
            ))}
          </div>
        </DepthCard>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   WEBHOOKS PAGE
══════════════════════════════════════════════════════════ */
const WebhooksPage = () => {
  const [hooks, setHooks] = useState(MOCK_WEBHOOKS);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const toggleActive = (id) => setHooks(h => h.map(w => w.id === id ? { ...w, active: !w.active } : w));

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Webhooks</h1>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>Event-driven subscriptions</p>
        </div>
        <Btn variant="primary" onClick={() => setCreateModal(true)}><Plus size={13} /> Register</Btn>
      </motion.div>

      <motion.div variants={STAGGER} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {hooks.map((w, i) => (
          <motion.div key={w.id} variants={FADE_UP} layout>
            <DepthCard accent={w.active ? "green" : undefined} onClick={() => setExpanded(expanded === w.id ? null : w.id)}
              style={{ cursor: "pointer", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <motion.div animate={{ opacity: w.active ? [1,0.4,1] : 0.3 }} transition={{ duration: 2, repeat: w.active ? Infinity : 0 }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: w.active ? "var(--accent)" : "var(--dim)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "Geist Mono", fontSize: 12, color: "var(--text)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.url}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {w.events.map(e => <Tag key={e} variant="purple">{e === "*" ? "ALL" : e}</Tag>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                  {/* Toggle */}
                  <motion.div onClick={() => toggleActive(w.id)} whileTap={{ scale: 0.92 }}
                    style={{ width: 38, height: 22, borderRadius: 99, cursor: "pointer", position: "relative",
                      background: w.active ? "rgba(0,229,160,0.25)" : "var(--surface2)",
                      border: `1px solid ${w.active ? "rgba(0,229,160,0.4)" : "var(--border)"}` }}>
                    <motion.div animate={{ x: w.active ? 18 : 2 }} transition={SPRING_SNAPPY}
                      style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%",
                        background: w.active ? "var(--accent)" : "var(--dim)" }} />
                  </motion.div>
                  <Btn variant="ghost" size="sm" onClick={() => setDeleteModal(w.id)} style={{ padding: "5px 8px" }}>
                    <Trash2 size={11} />
                  </Btn>
                </div>
                <motion.div animate={{ rotate: expanded === w.id ? 90 : 0 }} transition={SPRING_SNAPPY}>
                  <ChevronRight size={14} style={{ color: "var(--sub)" }} />
                </motion.div>
              </div>

              {/* Edit panel */}
              <AnimatePresence>
                {expanded === w.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                    style={{ overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                    <div style={{ paddingTop: 20, marginTop: 20, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

      {/* Payload reference */}
      <motion.div variants={FADE_UP}>
        <DepthCard>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Event Payload Reference</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <p className="label">Supported events</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                {["Minted","Burned","Seized","PausedEvent"].map(e => <Tag key={e} variant="dim">{e}</Tag>)}
              </div>
            </div>
            <div>
              <p className="label">Signature header</p>
              <p style={{ fontFamily: "Geist Mono", fontSize: 11, color: "var(--sub)", marginTop: 4, lineHeight: 1.9 }}>
                X-SSS-Event: Minted<br />
                X-SSS-Signature: sha256=&lt;HMAC&gt;
              </p>
            </div>
          </div>
        </DepthCard>
      </motion.div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Register Webhook">
        <div><label className="label">URL</label><input className="input" placeholder="https://your-endpoint.com/hook" style={{ marginBottom: 14 }} /></div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Events</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {["Minted","Burned","Seized","PausedEvent"].map(e => (
              <motion.label key={e} whileHover={{ scale: 1.02 }}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer", padding: "5px 10px",
                  background: "var(--surface2)", borderRadius: 7, border: "1px solid var(--border)" }}>
                <input type="checkbox" style={{ accentColor: "var(--primary)" }} /> {e}
              </motion.label>
            ))}
          </div>
        </div>
        <div><label className="label">HMAC Secret</label><input className="input" type="password" placeholder="Signing secret…" /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <Btn variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => setCreateModal(false)}><Plus size={11} /> Register</Btn>
        </div>
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Webhook?" subtitle="This webhook will stop receiving events immediately.">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={() => { setHooks(h => h.filter(w => w.id !== deleteModal)); setDeleteModal(null); }}
            style={{ borderRadius: 9, padding: "9px 18px", fontWeight: 700 }}>
            <Trash2 size={11} /> Delete
          </Btn>
        </div>
      </Modal>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   ORACLE PAGE
══════════════════════════════════════════════════════════ */
const OraclePage = () => {
  const [tab, setTab] = useState("feeds");
  const [mintQ, setMintQ] = useState({ usdCents: "", priceScaled: "", mintFeeBps: "30" });
  const [mintR, setMintR] = useState(null);
  const [redeemQ, setRedeemQ] = useState({ tokenAmount: "", priceScaled: "", redeemFeeBps: "30" });
  const [redeemR, setRedeemR] = useState(null);

  const simulateMint = () => {
    const cents = Number(mintQ.usdCents), price = Number(mintQ.priceScaled) || 1e8, fee = Number(mintQ.mintFeeBps);
    const gross = (cents * 1e6) / price;
    setMintR({ gross: gross.toFixed(4), fee: (gross * fee / 10000).toFixed(4), net: (gross - gross * fee / 10000).toFixed(4) });
  };

  const simulateRedeem = () => {
    const tokens = Number(redeemQ.tokenAmount), price = Number(redeemQ.priceScaled) || 1e8, fee = Number(redeemQ.redeemFeeBps);
    const gross = (tokens * price) / 1e6;
    setRedeemR({ gross: gross.toFixed(2), fee: (gross * fee / 10000).toFixed(2), net: (gross - gross * fee / 10000).toFixed(2) });
  };

  const tabs = [{ id: "feeds", l: "Price Feeds" }, { id: "config", l: "Oracle Config" }, { id: "simulator", l: "Simulator" }];

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div variants={FADE_UP}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Oracle</h1>
        <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>
          Switchboard feeds · localhost:3003
        </p>
      </motion.div>

      <motion.div variants={FADE_UP} style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 5, border: "1px solid var(--border)", alignSelf: "flex-start" }}>
        {tabs.map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)} whileTap={{ scale: 0.97 }} layout
            style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: tab === t.id ? "var(--surface2)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--sub)" }}>
            {t.l}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}>

          {tab === "feeds" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <motion.div variants={STAGGER} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {MOCK_FEEDS.map((f, i) => (
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[["Symbol","SOL/USD"],["Feed Type","pull"],["Base Currency","SOL"],["Quote Currency","USD"],["Decimals","9"],["Switchboard Feed","Base58 pubkey…"]].map(([l,p],i) => (
                    <div key={i}><label className="label">{l}</label><input className="input" placeholder={p} /></div>
                  ))}
                </div>
                <Btn variant="primary" size="sm" style={{ marginTop: 16 }}><Plus size={11} /> Register Feed</Btn>
              </DepthCard>
            </div>
          )}

          {tab === "config" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <DepthCard>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Fetch Config</p>
                <label className="label">Mint Address</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input className="input" placeholder="Base58 mint address…" />
                  <Btn variant="primary"><Search size={12} /></Btn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["Mint Fee","30 bps (0.30%)"],["Redeem Fee","30 bps (0.30%)"],["Max Staleness","60 secs"],["Max Confidence","200 bps"],["Quote Validity","30 secs"],["Feed Symbol","SOL/USD"]].map(([k,v],i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <p className="label" style={{ marginBottom: 4 }}>{k}</p>
                      <p style={{ fontFamily: "Geist Mono", fontSize: 12 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </DepthCard>
              <DepthCard>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Initialize Config</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[["Mint Address","Base58…"],["Feed Symbol","SOL/USD"],["Max Staleness (secs)","60"],["Mint Fee (bps)","30"],["Redeem Fee (bps)","30"],["Max Confidence (bps)","200"],["Quote Validity (secs)","30"]].map(([l,p],i) => (
                    <div key={i}><label className="label">{l}</label><input className="input" placeholder={p} /></div>
                  ))}
                </div>
                <Btn variant="accent" style={{ marginTop: 16, justifyContent: "center", width: "100%", borderRadius: 9 }}><Zap size={12} /> Initialize</Btn>
              </DepthCard>
            </div>
          )}

          {tab === "simulator" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Mint simulator */}
              <DepthCard accent="green">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <ArrowUp size={13} style={{ color: "var(--accent)" }} />
                  <p style={{ fontWeight: 700, fontSize: 14 }}>Mint Quote</p>
                  <Tag variant="dim" style={{ marginLeft: "auto" }}>no RPC</Tag>
                </div>
                {[["USD (cents)","usdCents","e.g. 10000"],["Price Scaled","priceScaled","e.g. 100000000"],["Mint Fee (bps)","mintFeeBps","30"]].map(([l,k,p]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label className="label">{l}</label>
                    <input className="input" placeholder={p} value={mintQ[k]} onChange={e => { setMintQ(q => ({...q,[k]:e.target.value})); setMintR(null); }} />
                  </div>
                ))}
                <Btn variant="accent" onClick={simulateMint} style={{ width: "100%", justifyContent: "center", borderRadius: 9, marginBottom: 14 }}><Zap size={12} /> Simulate</Btn>
                <AnimatePresence>
                  {mintR && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ padding: 14, background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.15)", borderRadius: 10 }}>
                      {[["Gross", mintR.gross+" tokens"], ["Fee", "− "+mintR.fee+" tokens"], ["Net", mintR.net+" tokens"]].map(([l,v],i) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                          borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span style={{ fontSize: 11, color: "var(--sub)" }}>{l}</span>
                          <span style={{ fontFamily: "Geist Mono", fontSize: 12, color: i === 2 ? "var(--accent)" : "var(--text)", fontWeight: i === 2 ? 700 : 400 }}>{v}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </DepthCard>

              {/* Redeem simulator */}
              <DepthCard accent="purple">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <ArrowDown size={13} style={{ color: "var(--primary)" }} />
                  <p style={{ fontWeight: 700, fontSize: 14 }}>Redeem Quote</p>
                  <Tag variant="dim" style={{ marginLeft: "auto" }}>no RPC</Tag>
                </div>
                {[["Token Amount","tokenAmount","e.g. 1000"],["Price Scaled","priceScaled","e.g. 100000000"],["Redeem Fee (bps)","redeemFeeBps","30"]].map(([l,k,p]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label className="label">{l}</label>
                    <input className="input" placeholder={p} value={redeemQ[k]} onChange={e => { setRedeemQ(q => ({...q,[k]:e.target.value})); setRedeemR(null); }} />
                  </div>
                ))}
                <Btn variant="primary" onClick={simulateRedeem} style={{ width: "100%", justifyContent: "center", borderRadius: 9, marginBottom: 14 }}><Zap size={12} /> Simulate</Btn>
                <AnimatePresence>
                  {redeemR && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ padding: 14, background: "rgba(124,92,255,0.05)", border: "1px solid rgba(124,92,255,0.2)", borderRadius: 10 }}>
                      {[["Gross", "$"+(redeemR.gross/100).toFixed(2)], ["Fee", "− $"+(redeemR.fee/100).toFixed(2)], ["Net", "$"+(redeemR.net/100).toFixed(2)]].map(([l,v],i) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                          borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
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
};

/* ══════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: "dashboard",  label: "Overview",    icon: <LayoutDashboard size={14} />, group: "ops" },
  { id: "holders",    label: "Holders",     icon: <Users size={14} />,           group: "ops" },
  { id: "compliance", label: "Compliance",  icon: <Shield size={14} />,          group: "ops", badge: "3" },
  { id: "audit",      label: "Audit Log",   icon: <FileText size={14} />,        group: "sys" },
  { id: "webhooks",   label: "Webhooks",    icon: <Webhook size={14} />,         group: "sys" },
  { id: "oracle",     label: "Oracle",      icon: <Activity size={14} />,        group: "sys" },
];

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [prevPage, setPrevPage] = useState(null);

  const goTo = (id) => { setPrevPage(page); setPage(id); };

  const PAGES = {
    dashboard: <DashboardPage />,
    holders:   <HoldersPage />,
    compliance: <CompliancePage />,
    audit:     <AuditPage />,
    webhooks:  <WebhooksPage />,
    oracle:    <OraclePage />,
  };

  return (
    <>
      <Fonts />
      <AmbientBg />

      <div style={{ display: "flex", height: "100vh", position: "relative", zIndex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <motion.aside
          initial={{ x: -240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          style={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column",
            background: "rgba(11,11,14,0.85)", backdropFilter: "blur(20px)",
            borderRight: "1px solid var(--border)", position: "relative", zIndex: 10 }}>

          {/* Logo */}
          <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--border)" }}>
            <motion.div whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "default" }}>
              <motion.div
                animate={{ boxShadow: ["0 0 12px rgba(124,92,255,0.3)", "0 0 22px rgba(0,229,160,0.25)", "0 0 12px rgba(124,92,255,0.3)"] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CircleDot size={15} style={{ color: "#fff" }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.01em", lineHeight: 1 }}>SSS Admin</p>
                <p style={{ fontSize: 10, color: "var(--sub)", marginTop: 2, fontFamily: "Geist Mono" }}>Stablecoin Standard</p>
              </div>
            </motion.div>
          </div>

          {/* Network status */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
            <motion.div whileHover={{ scale: 1.02 }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px",
                background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.12)", borderRadius: 7, cursor: "default" }}>
              <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.8, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontFamily: "Geist Mono", fontWeight: 600, color: "var(--accent)" }}>MAINNET-BETA</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--sub)", fontFamily: "Geist Mono" }}>≈ 248ms</span>
            </motion.div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
            {[{ key: "ops", label: "Operations" }, { key: "sys", label: "System" }].map(group => (
              <div key={group.key} style={{ marginBottom: 4 }}>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "var(--dim)", padding: "8px 10px 5px" }}>
                  {group.label}
                </motion.p>
                {NAV_ITEMS.filter(n => n.group === group.key).map((item, idx) => (
                  <motion.button key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.06, ease: EASE_OUT_EXPO }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => goTo(item.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px",
                      borderRadius: 8, border: page === item.id ? "1px solid rgba(0,229,160,0.15)" : "1px solid transparent",
                      background: page === item.id ? "rgba(0,229,160,0.06)" : "transparent",
                      color: page === item.id ? "var(--accent)" : "var(--sub)",
                      cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: page === item.id ? 600 : 500,
                      marginBottom: 2, position: "relative" }}>
                    {page === item.id && (
                      <motion.div layoutId="activeIndicator"
                        style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 2.5, height: 16, borderRadius: 99, background: "var(--accent)" }}
                        transition={SPRING_BOUNCY} />
                    )}
                    <span style={{ opacity: page === item.id ? 1 : 0.6 }}>{item.icon}</span>
                    {item.label}
                    {item.badge && (
                      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                        style={{ marginLeft: "auto", background: "rgba(245,158,11,0.15)", color: "var(--warn)",
                          border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, fontSize: 9,
                          padding: "2px 6px", fontFamily: "Geist Mono", fontWeight: 700 }}>
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            ))}
          </nav>

          {/* User footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
            <motion.div whileHover={{ background: "var(--surface2)" }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "default" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, var(--primary)44, var(--accent)44)",
                border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "var(--text)" }}>A</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600 }}>Admin</p>
                <p style={{ fontFamily: "Geist Mono", fontSize: 10, color: "var(--sub)" }}>7xKX…AsU</p>
              </div>
              <motion.div whileHover={{ color: "var(--danger)" }} style={{ color: "var(--dim)", cursor: "pointer" }}>
                <LogOut size={12} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top bar */}
          <motion.header
            initial={{ y: -52, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 }}
            style={{ height: 54, display: "flex", alignItems: "center", padding: "0 28px", gap: 12, flexShrink: 0,
              background: "rgba(7,7,9,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }} />
            {[
              { icon: <Globe size={11} />, label: "localhost:3000" },
              { icon: <Zap size={11} />, label: "oracle:3003" },
            ].map(({ icon, label }) => (
              <motion.div key={label} whileHover={{ borderColor: "var(--border2)" }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px",
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7,
                  fontSize: 11, color: "var(--sub)", fontFamily: "Geist Mono", cursor: "default" }}>
                {icon}{label}
              </motion.div>
            ))}
            <motion.button whileHover={{ color: "var(--text)", background: "var(--surface2)" }} whileTap={{ scale: 0.92 }}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--sub)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={13} />
            </motion.button>
          </motion.header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: "auto", padding: "30px 32px" }}>
            <AnimatePresence mode="wait">
              <motion.div key={page}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                exit={{   opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}>
                {PAGES[page]}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}
