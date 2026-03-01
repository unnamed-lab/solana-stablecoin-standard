import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from "../api.js";
import type { Webhook } from "../api.js";

type SubView = "list" | "add" | "delete";

export default function WebhookManager() {
  const [view, setView] = useState<SubView>("list");

  useInput((input) => {
    if (input === "l") setView("list");
    if (input === "a") setView("add");
    if (input === "x") setView("delete");
  });

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <Text bold color="yellow">Webhook Manager</Text>
        <Text dimColor>│</Text>
        <Tab active={view === "list"} label="[l] List" />
        <Tab active={view === "add"} label="[a] Add" />
        <Tab active={view === "delete"} label="[x] Delete" />
      </Box>

      {view === "list" && <WebhookList />}
      {view === "add" && <AddWebhookForm />}
      {view === "delete" && <DeleteWebhook />}
    </Box>
  );
}

function Tab({ active, label }: { active: boolean; label: string }) {
  return <Text color={active ? "green" : "gray"}>{label}</Text>;
}

/* ── Webhook List ────────────────────────────────────────────────── */
function WebhookList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await getWebhooks();
        setWebhooks(data);
      } catch {
        setError("Could not fetch webhooks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useInput((_input, key) => {
    if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIdx((i) => Math.min(webhooks.length - 1, i + 1));
    if (key.return && webhooks[selectedIdx]) handleToggle(webhooks[selectedIdx]);
  });

  const handleToggle = async (wh: Webhook) => {
    try {
      await updateWebhook(wh.id, { active: !wh.active });
      setWebhooks((prev) =>
        prev.map((w) => (w.id === wh.id ? { ...w, active: !w.active } : w))
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text bold color="cyan">Registered Webhooks</Text>
      <Text dimColor>↑↓ navigate · Enter to toggle active/paused</Text>
      {loading && (
        <Text><Text color="green"><Spinner type="dots" /></Text> Loading…</Text>
      )}
      {error && <Text color="red">✖ {error}</Text>}
      {!loading && !error && webhooks.length === 0 && (
        <Text dimColor>No webhooks registered</Text>
      )}
      {webhooks.map((wh, i) => (
        <Box key={wh.id} marginTop={i === 0 ? 1 : 0}>
          <Text color={i === selectedIdx ? "green" : "white"}>
            {i === selectedIdx ? "▸ " : "  "}
          </Text>
          <Text color={wh.active ? "green" : "yellow"}>
            {wh.active ? "● " : "○ "}
          </Text>
          <Text>{wh.url.padEnd(40)}</Text>
          <Text dimColor>{wh.events.join(", ")}</Text>
        </Box>
      ))}
    </Box>
  );
}

/* ── Add Webhook Form ────────────────────────────────────────────── */
function AddWebhookForm() {
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState("");
  const [field, setField] = useState<"url" | "secret" | "events">("url");
  const [result, setResult] = useState("");

  const fields = ["url", "secret", "events"] as const;
  const nextField = () => {
    const idx = fields.indexOf(field);
    if (idx < fields.length - 1) setField(fields[idx + 1]);
  };

  const submit = async () => {
    if (!url || !secret || !events) return;
    try {
      const evtArr = events.split(",").map((s) => s.trim());
      await createWebhook(url, secret, evtArr);
      setResult("✓ Webhook created");
    } catch {
      setResult("✖ Failed to create webhook");
    }
  };

  useInput((_input, key) => {
    if (key.tab) nextField();
    if (key.return && field === "events") submit();
  });

  const vals: Record<string, string> = { url, secret, events };
  const setters: Record<string, (v: string) => void> = { url: setUrl, secret: setSecret, events: setEvents };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="magenta">Register New Webhook</Text>
      {fields.map((f) => (
        <Box key={f} marginTop={f === "url" ? 1 : 0}>
          <Text color={field === f ? "green" : "gray"}>
            {(f.charAt(0).toUpperCase() + f.slice(1) + ":").padEnd(10)}
          </Text>
          {field === f ? (
            <TextInput value={vals[f]} onChange={setters[f]} onSubmit={f === "events" ? submit : nextField} />
          ) : (
            <Text>{vals[f] || "—"}</Text>
          )}
        </Box>
      ))}
      <Text dimColor>Events: comma-separated (e.g. Minted,Burned,Seized)</Text>
      <Text dimColor>Tab to switch fields · Enter to submit</Text>
      {result && <Text color={result.startsWith("✓") ? "green" : "red"}>{result}</Text>}
    </Box>
  );
}

/* ── Delete Webhook ──────────────────────────────────────────────── */
function DeleteWebhook() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getWebhooks();
        setWebhooks(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useInput((input, key) => {
    if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIdx((i) => Math.min(webhooks.length - 1, i + 1));
    if (key.return && !confirm) setConfirm(true);
    if (input === "y" && confirm) handleDelete();
    if (input === "n" && confirm) setConfirm(false);
  });

  const handleDelete = async () => {
    const wh = webhooks[selectedIdx];
    if (!wh) return;
    try {
      await deleteWebhook(wh.id);
      setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
      setResult(`✓ Deleted ${wh.url}`);
      setConfirm(false);
    } catch {
      setResult("✖ Delete failed");
      setConfirm(false);
    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
      <Text bold color="red">Delete Webhook</Text>
      <Text dimColor>↑↓ select · Enter to delete</Text>
      {loading && (
        <Text><Text color="green"><Spinner type="dots" /></Text> Loading…</Text>
      )}
      {webhooks.map((wh, i) => (
        <Box key={wh.id}>
          <Text color={i === selectedIdx ? "red" : "white"}>
            {i === selectedIdx ? "▸ " : "  "}{wh.url}
          </Text>
        </Box>
      ))}
      {confirm && (
        <Box marginTop={1}>
          <Text bold color="red">
            Delete {webhooks[selectedIdx]?.url}? [y/n]
          </Text>
        </Box>
      )}
      {result && <Text color={result.startsWith("✓") ? "green" : "red"}>{result}</Text>}
    </Box>
  );
}
