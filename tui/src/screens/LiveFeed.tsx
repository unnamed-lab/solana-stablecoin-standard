import { useState, useEffect, useRef } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { getAuditLog } from "../api.js";
import type { AuditEntry } from "../api.js";

const EVENT_STYLES: Record<string, { emoji: string; color: string }> = {
  MINT:   { emoji: "🟢", color: "green" },
  BURN:   { emoji: "🔴", color: "red" },
  SEIZE:  { emoji: "🟡", color: "yellow" },
  FREEZE: { emoji: "🔵", color: "blue" },
};

const POLL_INTERVAL = 3_000;
const MAX_VISIBLE = 20;

export default function LiveFeed() {
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState("");
  const lastSeenId = useRef<string | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getAuditLog({ pageSize: 20, page: 1 });
        const newEntries = res.data;

        if (lastSeenId.current) {
          // Find events newer than what we've seen
          const idx = newEntries.findIndex((e) => e.id === lastSeenId.current);
          const fresh = idx > 0 ? newEntries.slice(0, idx) : idx === -1 ? newEntries : [];
          if (fresh.length > 0) {
            setEvents((prev) => [...fresh, ...prev].slice(0, MAX_VISIBLE));
          }
        } else if (newEntries.length > 0) {
          setEvents(newEntries.slice(0, MAX_VISIBLE));
        }

        if (newEntries.length > 0) {
          lastSeenId.current = newEntries[0].id;
        }

        pollCount.current++;
        setError("");
      } catch {
        setError("Polling failed — is the server running?");
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <Text bold color="yellow">Live Event Feed</Text>
        <Text dimColor>│</Text>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        <Text dimColor>Polling every 3s…</Text>
      </Box>

      {/* Legend */}
      <Box gap={2} marginBottom={1}>
        {Object.entries(EVENT_STYLES).map(([action, { emoji }]) => (
          <Text key={action} dimColor>
            {emoji} {action}
          </Text>
        ))}
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">✖ {error}</Text>
        </Box>
      )}

      {/* Event List */}
      <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
        {events.length === 0 && !error && (
          <Text dimColor>Waiting for events…</Text>
        )}
        {events.map((evt, i) => {
          const style = EVENT_STYLES[evt.action] || { emoji: "⚪", color: "white" };
          const truncAddr = evt.actor
            ? evt.actor.slice(0, 6) + "…" + evt.actor.slice(-4)
            : "—";
          const truncTx = evt.txSignature
            ? evt.txSignature.slice(0, 8) + "…"
            : "—";
          const time = evt.createdAt?.slice(11, 19) || "—";

          return (
            <Box key={evt.id || i} gap={1}>
              <Text>{style.emoji}</Text>
              <Text bold color={style.color}>
                {evt.action.padEnd(7)}
              </Text>
              <Text dimColor>by</Text>
              <Text color="cyan">{truncAddr.padEnd(14)}</Text>
              <Text color="white">{(evt.amount || "—").padStart(12)}</Text>
              <Text dimColor> tx:</Text>
              <Text>{truncTx.padEnd(12)}</Text>
              <Text dimColor>{time}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
