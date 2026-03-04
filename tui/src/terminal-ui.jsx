import { useState, useEffect, useRef } from "react";

const history = [
  { type: "cmd", text: "anchor build" },
  { type: "err", text: "error: failed to parse lock file at: .../Cargo.lock" },
  { type: "err", text: "  lock file version 4 requires `-Znext-lockfile-bump`" },
  { type: "cmd", text: "rustup show" },
  { type: "out", text: "Default host: x86_64-unknown-linux-gnu" },
  { type: "out", text: "active toolchain: 1.89.0 (overridden by rust-toolchain.toml)" },
  { type: "cmd", text: "anchor --version" },
  { type: "out", text: "anchor-cli 0.32.1" },
  { type: "info", text: "→ Anchor 0.32.1 expects Rust ~1.79. Downgrading toolchain..." },
  { type: "cmd", text: "nano rust-toolchain.toml  # set channel = \"1.79.0\"" },
  { type: "cmd", text: "rustup toolchain install 1.79.0" },
  { type: "out", text: "  1.79.0-x86_64-unknown-linux-gnu installed ✓" },
  { type: "cmd", text: "rm Cargo.lock && anchor build" },
  { type: "err", text: "error: edition2024 requires nightly (Cargo 1.79 is stable)" },
  { type: "info", text: "→ edition 2024 stabilized in Rust 1.85. Trying 1.85.0..." },
  { type: "cmd", text: "rustup toolchain install 1.85.0" },
  { type: "out", text: "  1.85.0-x86_64-unknown-linux-gnu installed ✓" },
  { type: "cmd", text: "rm Cargo.lock && anchor build" },
  { type: "err", text: "error: failed to parse lock file — lock file version 4" },
  { type: "info", text: "→ Root cause: Solana 1.18.26 bundles rustc 1.75.0. Must upgrade Solana CLI." },
  { type: "cmd", text: "cargo-build-sbf --version" },
  { type: "out", text: "solana-cargo-build-sbf 1.18.26 / platform-tools v1.41 / rustc 1.75.0" },
  { type: "cmd", text: 'sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.0/install)"' },
  { type: "out", text: "  ✨ 2.1.0 initialized" },
  { type: "cmd", text: 'export PATH="/home/frank/.local/share/solana/install/active_release/bin:$PATH"' },
  { type: "cmd", text: "solana --version" },
  { type: "out", text: "solana-cli 2.1.0 (client:Agave) ✓" },
  { type: "cmd", text: "rm Cargo.lock && anchor build" },
  { type: "err", text: "error: edition2024 required — Cargo 1.79.0 still active" },
  { type: "info", text: "→ rust-toolchain.toml still pinned to 1.79. Forcing override..." },
  { type: "cmd", text: "rustup override set 1.85.0" },
  { type: "cmd", text: "rustup show active-toolchain" },
  { type: "out", text: "1.85.0-x86_64-unknown-linux-gnu (directory override)" },
  { type: "cmd", text: "rm Cargo.lock && anchor build" },
  { type: "pending", text: "Building... ⏳" },
];

const typeColor = {
  cmd: "#7dd3fc",
  out: "#d1d5db",
  err: "#f87171",
  info: "#fbbf24",
  pending: "#34d399",
};

const typePrefix = {
  cmd: "$ ",
  out: "  ",
  err: "✖ ",
  info: "◆ ",
  pending: "  ",
};

export default function Terminal() {
  const [visible, setVisible] = useState(0);
  const [running, setRunning] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    if (visible >= history.length) { setRunning(false); return; }
    const delay = history[visible].type === "cmd" ? 180 : 60;
    const t = setTimeout(() => setVisible(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [visible, running]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "820px",
        background: "#111118",
        border: "1px solid #1e1e2e",
        borderRadius: "12px",
        boxShadow: "0 0 0 1px #1e1e2e, 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.06)",
        overflow: "hidden",
      }}>
        {/* Title bar */}
        <div style={{
          background: "#16161f",
          borderBottom: "1px solid #1e1e2e",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          <span style={{
            marginLeft: "auto",
            marginRight: "auto",
            color: "#4b5563",
            fontSize: "12px",
            letterSpacing: "0.05em",
          }}>
            frank@DESKTOP-T6LANVT — solana-stablecoin-standard
          </span>
          <button
            onClick={() => { setVisible(0); setRunning(true); }}
            style={{
              background: "none",
              border: "1px solid #2d2d3d",
              color: "#6b7280",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: "11px",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >replay</button>
        </div>

        {/* Terminal body */}
        <div style={{
          padding: "20px 24px 28px",
          maxHeight: "520px",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#2d2d3d #111118",
        }}>
          {/* Prompt path */}
          <div style={{ color: "#4b5563", fontSize: "12px", marginBottom: "16px" }}>
            <span style={{ color: "#818cf8" }}>~/projects/solana-stablecoin-standard</span>
          </div>

          {history.slice(0, visible).map((line, i) => (
            <div key={i} style={{
              display: "flex",
              gap: "0",
              marginBottom: line.type === "info" ? "12px" : "4px",
              animation: "fadeIn 0.15s ease",
            }}>
              {line.type === "cmd" && (
                <span style={{ color: "#818cf8", marginRight: "6px", flexShrink: 0 }}>
                  <span style={{ color: "#34d399" }}>frank</span>
                  <span style={{ color: "#6b7280" }}>@desktop</span>
                  <span style={{ color: "#6b7280" }}> ❯ </span>
                </span>
              )}
              <span style={{
                color: typeColor[line.type],
                fontSize: "13px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                fontWeight: line.type === "cmd" ? "500" : "400",
                fontStyle: line.type === "info" ? "italic" : "normal",
                opacity: line.type === "out" ? 0.75 : 1,
                paddingLeft: line.type !== "cmd" ? "20px" : "0",
              }}>
                {line.type !== "cmd" && (
                  <span style={{ marginRight: "6px" }}>{typePrefix[line.type]}</span>
                )}
                {line.text}
              </span>
            </div>
          ))}

          {/* Blinking cursor */}
          {running && (
            <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
              <span style={{ color: "#34d399", fontSize: "13px" }}>
                frank<span style={{ color: "#6b7280" }}>@desktop ❯ </span>
              </span>
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "15px",
                background: "#818cf8",
                marginLeft: "2px",
                animation: "blink 1s step-end infinite",
              }} />
            </div>
          )}

          {!running && (
            <div style={{
              marginTop: "20px",
              padding: "12px 16px",
              background: "#0f2318",
              border: "1px solid #166534",
              borderRadius: "6px",
              color: "#4ade80",
              fontSize: "12px",
              letterSpacing: "0.04em",
            }}>
              ✓ Fix: Upgrade Solana CLI to 2.1.0 + set rust-toolchain.toml to 1.85.0 + rustup override set 1.85.0
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111118; }
        ::-webkit-scrollbar-thumb { background: #2d2d3d; border-radius: 3px; }
      `}</style>
    </div>
  );
}
