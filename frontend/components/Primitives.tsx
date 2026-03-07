"use client";

import {
  useState, useEffect, useRef, ReactNode, CSSProperties, MouseEvent
} from "react";

/* ── Responsive breakpoint hook ─────────────────────────────────── */
export function useBreakpoint(bp = 767) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [bp]);
  return isMobile;
}
import {
  motion, AnimatePresence, useMotionValue, useSpring,
  useInView, animate as frameAnimate
} from "framer-motion";
import {
  Copy, CheckCircle, ExternalLink, ArrowUp, ArrowDown,
  RefreshCw, AlertTriangle
} from "lucide-react";

/* ── Easing / Spring constants ──────────────────────────────────── */
export const EASE_OUT_EXPO: [number,number,number,number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT:   [number,number,number,number] = [0.45, 0, 0.55, 1];
export const SPRING_SNAPPY = { type: "spring", stiffness: 400, damping: 35 } as const;
export const SPRING_BOUNCY = { type: "spring", stiffness: 300, damping: 22 } as const;
export const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const FADE_UP = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
};
export const FADE_RIGHT = {
  hidden: { opacity: 0, x: -16, filter: "blur(3px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
};

/* ── Fonts injector ─────────────────────────────────────────────── */
export const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist+Mono:wght@300;400;500;600&display=swap');
  `}</style>
);

/* ── Ambient background ─────────────────────────────────────────── */
export const AmbientBg = () => (
  <div style={{
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden"
  }}>
    <motion.div
      animate={{ opacity: [0.35, 0.5, 0.35], scale: [1, 1.08, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute", top: -200, left: -100, width: 700, height: 700,
        background: "radial-gradient(ellipse, rgba(124,92,255,0.12) 0%, transparent 70%)",
        borderRadius: "50%"
      }}
    />
    <motion.div
      animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.12, 1] }}
      transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      style={{
        position: "absolute", bottom: -150, right: 200, width: 500, height: 500,
        background: "radial-gradient(ellipse, rgba(0,229,160,0.08) 0%, transparent 70%)",
        borderRadius: "50%"
      }}
    />
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
      backgroundSize: "40px 40px"
    }} />
  </div>
);

/* ── Magnetic button ─────────────────────────────────────────────── */
interface MagneticBtnProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
export const MagneticBtn = ({ children, style, onClick, disabled }: MagneticBtnProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMove = (e: MouseEvent) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.3);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.3);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy, ...style, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}
      whileTap={{ scale: 0.96 }}
      onClick={!disabled ? onClick : undefined}
    >
      {children}
    </motion.button>
  );
};

/* ── Count-up number ─────────────────────────────────────────────── */
interface CountUpProps {
  to: number; duration?: number; decimals?: number; prefix?: string; suffix?: string;
}
export const CountUp = ({ to, duration = 1.2, decimals = 0, prefix = "", suffix = "" }: CountUpProps) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = frameAnimate(0, to, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: v => setVal(v),
    });
    return controls.stop;
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}{val.toLocaleString("en-US", { maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

/* ── Glowing tag / badge ─────────────────────────────────────────── */
type TagVariant = "green" | "red" | "purple" | "warn" | "dim";
interface TagProps { children: ReactNode; variant?: TagVariant; pulse?: boolean; style?: CSSProperties; }
export const Tag = ({ children, variant = "dim", pulse = false, style }: TagProps) => {
  const colors: Record<TagVariant, { bg: string; border: string; text: string }> = {
    green:  { bg: "rgba(0,229,160,0.08)",  border: "rgba(0,229,160,0.2)",   text: "#00E5A0" },
    red:    { bg: "rgba(255,64,96,0.08)",  border: "rgba(255,64,96,0.2)",   text: "#FF4060" },
    purple: { bg: "rgba(124,92,255,0.1)",  border: "rgba(124,92,255,0.25)", text: "#A88BFF" },
    warn:   { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)",  text: "#F59E0B" },
    dim:    { bg: "rgba(255,255,255,0.04)",border: "rgba(255,255,255,0.08)",text: "#8888A0" },
  };
  const c = colors[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
      borderRadius: 99, background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 10, fontFamily: "Geist Mono, monospace", fontWeight: 600,
      letterSpacing: "0.04em", ...style
    }}>
      {pulse && (
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: "50%", background: c.text, display: "inline-block" }}
        />
      )}
      {children}
    </span>
  );
};

/* ── Depth card ──────────────────────────────────────────────────── */
type AccentColor = "green" | "purple" | "red" | "warn";
interface DepthCardProps {
  children: ReactNode; style?: CSSProperties; accent?: AccentColor; onClick?: () => void;
}
export const DepthCard = ({ children, style, accent, onClick }: DepthCardProps) => {
  const accentMap: Record<string, string> = {
    green: "#00E5A0", purple: "#7C5CFF", red: "#FF4060", warn: "#F59E0B"
  };
  const accentColor = accent ? accentMap[accent] : null;
  return (
    <motion.div
      onClick={onClick}
      whileHover={{
        y: -2,
        boxShadow: accentColor
          ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.06)`
          : "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)"
      }}
      transition={SPRING_SNAPPY}
      style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 22, position: "relative", overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...(accentColor ? { borderTop: `1.5px solid ${accentColor}40` } : {}),
        ...style
      }}
    >
      {accentColor && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 60,
          background: `radial-gradient(ellipse at 50% -10%, ${accentColor}10 0%, transparent 70%)`,
          pointerEvents: "none"
        }} />
      )}
      {children}
    </motion.div>
  );
};

/* ── Stat card ───────────────────────────────────────────────────── */
interface StatCardProps {
  label: string; value: ReactNode; unit: string;
  icon: ReactNode; accent?: AccentColor; change?: number;
}
export const StatCard = ({ label, value, unit, icon, accent, change }: StatCardProps) => (
  <motion.div variants={FADE_UP} style={{ height: "100%" }}>
    <DepthCard accent={accent} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top row: label + icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", lineHeight: 1.4 }}>
          {label}
        </p>
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={SPRING_BOUNCY}
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 9,
            background: "var(--surface2)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--sub)"
          }}
        >
          {icon}
        </motion.div>
      </div>

      {/* Value + unit */}
      <div style={{ marginTop: 14, flex: 1 }}>
        <p style={{ fontFamily: "Geist Mono", fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </p>
        <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 6, fontFamily: "Geist Mono" }}>{unit}</p>
      </div>

      {/* Change badge — pushed to bottom so cards align */}
      <div style={{ marginTop: 12, minHeight: 20 }}>
        {change !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11,
            color: change > 0 ? "var(--accent)" : "var(--danger)" }}>
            {change > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            <span style={{ fontFamily: "Geist Mono" }}>{Math.abs(change)}%</span>
            <span style={{ color: "var(--sub)" }}>vs 24h</span>
          </div>
        )}
      </div>
    </DepthCard>
  </motion.div>
);


/* ── Tx link ─────────────────────────────────────────────────────── */
export const TxLink = ({ sig }: { sig: string }) => (
  <motion.a
    href={`https://solscan.io/tx/${sig}`}
    target="_blank"
    rel="noreferrer"
    whileHover={{ color: "#A88BFF" }}
    style={{
      color: "var(--primary)", display: "inline-flex", alignItems: "center",
      gap: 3, fontSize: 11, fontFamily: "Geist Mono, monospace", textDecoration: "none"
    }}
  >
    {sig.slice(0, 8)}… <ExternalLink size={9} />
  </motion.a>
);

/* ── Copy button ─────────────────────────────────────────────────── */
export const CopyBtn = ({ value }: { value: string }) => {
  const [done, setDone] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", color: done ? "var(--accent)" : "var(--dim)" }}
    >
      <AnimatePresence mode="wait">
        <motion.span key={done ? "check" : "copy"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
          {done ? <CheckCircle size={11} /> : <Copy size={11} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

/* ── Action badge ─────────────────────────────────────────────────── */
const ACTION_VARIANTS: Record<string, TagVariant> = {
  MINT: "green", BURN: "red", FREEZE: "warn", SEIZE: "red", UNFREEZE: "green"
};
export const ActionBadge = ({ action }: { action: string }) => (
  <Tag variant={ACTION_VARIANTS[action] ?? "dim"}>{action}</Tag>
);

/* ── Modal ───────────────────────────────────────────────────────── */
interface ModalProps {
  open: boolean; onClose: () => void; children: ReactNode; title?: string; subtitle?: string;
}
export const Modal = ({ open, onClose, children, title, subtitle }: ModalProps) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(4,4,8,0.85)", backdropFilter: "blur(12px)", zIndex: 200 }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1,    y: 0,  filter: "blur(0px)" }}
          exit={{   opacity: 0, scale: 0.96,  y: 10, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          style={{
            position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 460, zIndex: 201,
            background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: 18, padding: 28, boxShadow: "0 40px 120px rgba(0,0,0,0.7)"
          }}
        >
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

/* ── Button ──────────────────────────────────────────────────────── */
type BtnVariant = "primary" | "accent" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";
interface BtnProps {
  children: ReactNode; variant?: BtnVariant; onClick?: () => void;
  disabled?: boolean; style?: CSSProperties; size?: BtnSize; type?: "button" | "submit";
}
export const Btn = ({ children, variant = "primary", onClick, disabled, style, size = "md" }: BtnProps) => {
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: "var(--primary)", color: "#fff",          border: "none" },
    accent:  { background: "var(--accent)",  color: "#000",          border: "none", fontWeight: 700 },
    ghost:   { background: "transparent",    color: "var(--sub)",    border: "1px solid var(--border2)" },
    danger:  { background: "transparent",    color: "var(--danger)", border: "1px solid rgba(255,64,96,0.3)" },
  };
  const sizes: Record<BtnSize, CSSProperties> = {
    sm: { padding: "6px 12px",  fontSize: 11 },
    md: { padding: "9px 18px",  fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  };
  return (
    <MagneticBtn disabled={disabled} onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9,
        fontWeight: 600, cursor: "pointer",
        ...variants[variant], ...sizes[size], ...style
      }}
    >
      {children}
    </MagneticBtn>
  );
};

/* ── Spinner ─────────────────────────────────────────────────────── */
export const Spinner = () => (
  <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
);

/* ── Keypair warning inline ──────────────────────────────────────── */
export const KeypairWarning = () => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    style={{
      marginTop: 6, padding: "5px 9px",
      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
      borderRadius: 7, display: "flex", gap: 5, alignItems: "flex-start"
    }}
  >
    <AlertTriangle size={10} style={{ color: "var(--warn)", marginTop: 1, flexShrink: 0 }} />
    <span style={{ fontSize: 10, color: "var(--warn)", lineHeight: 1.5 }}>
      Never expose keypairs in public environments
    </span>
  </motion.div>
);

/* ── Pagination bar ──────────────────────────────────────────────── */
interface PaginationProps { page: number; total: number; pageSize: number; onChange: (p: number) => void; }
export const Pagination = ({ page, total, pageSize, onChange }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 6 }}>
      {["←", ...pages.map(String), "→"].map((l, i) => {
        const isNum = !isNaN(Number(l));
        const target = l === "←" ? page - 1 : l === "→" ? page + 1 : Number(l);
        const disabled = (l === "←" && page === 1) || (l === "→" && page >= totalPages);
        return (
          <motion.button key={i} whileHover={{ background: "var(--surface2)" }} whileTap={{ scale: 0.92 }}
            onClick={() => !disabled && onChange(target)}
            style={{
              width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border)",
              background: isNum && Number(l) === page ? "var(--surface2)" : "transparent",
              color: isNum && Number(l) === page ? "var(--text)" : "var(--sub)",
              cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
              fontSize: 12, fontFamily: "Geist Mono",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >{l}</motion.button>
        );
      })}
    </div>
  );
};
