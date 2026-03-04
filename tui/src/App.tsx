import { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TokenOps from "./screens/TokenOps.js";
import Compliance from "./screens/Compliance.js";
import AuditLog from "./screens/AuditLog.js";
import WebhookManager from "./screens/WebhookManager.js";
import LiveFeed from "./screens/LiveFeed.js";

const SCREENS = [
  { key: "1", label: "Token Ops", Component: TokenOps },
  { key: "2", label: "Compliance", Component: Compliance },
  { key: "3", label: "Audit Log", Component: AuditLog },
  { key: "4", label: "Webhooks", Component: WebhookManager },
  { key: "5", label: "Live Feed", Component: LiveFeed },
] as const;

export default function App() {
  const { exit } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);

  useInput((input, key) => {
    if (input === "q") { exit(); return; }
    const idx = SCREENS.findIndex((s) => s.key === input);
    if (idx !== -1) setActiveIdx(idx);

    // Also support left/right arrow navigation
    if (key.leftArrow) setActiveIdx((i) => Math.max(0, i - 1));
    if (key.rightArrow) setActiveIdx((i) => Math.min(SCREENS.length - 1, i + 1));
  });

  const ActiveScreen = SCREENS[activeIdx].Component;

  return (
    <Box flexDirection="column" padding={1}>
      {/* ── Header ─────────────────────────────────── */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ◆ SSS Terminal{" "}
        </Text>
        <Text dimColor>— Solana Stablecoin Standard</Text>
      </Box>

      {/* ── Tab Bar ────────────────────────────────── */}
      <Box gap={1} marginBottom={1}>
        {SCREENS.map((s, i) => (
          <Box key={s.key}>
            <Text
              bold={i === activeIdx}
              color={i === activeIdx ? "green" : "gray"}
              inverse={i === activeIdx}
            >
              {" "}[{s.key}] {s.label}{" "}
            </Text>
          </Box>
        ))}
        <Box marginLeft={2}>
          <Text dimColor>[q] Quit</Text>
        </Box>
      </Box>

      {/* ── Divider ────────────────────────────────── */}
      <Box marginBottom={1}>
        <Text dimColor>{"─".repeat(72)}</Text>
      </Box>

      {/* ── Active Screen ──────────────────────────── */}
      <ActiveScreen />
    </Box>
  );
}
