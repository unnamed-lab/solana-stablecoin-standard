import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import {
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
  seize,
} from "../api.js";
import type { BlacklistEntry } from "../api.js";

type SubView = "list" | "add" | "remove" | "check" | "seize";

export default function Compliance() {
  const [view, setView] = useState<SubView>("list");

  useInput((input) => {
    if (input === "l") setView("list");
    if (input === "a") setView("add");
    if (input === "r") setView("remove");
    if (input === "c") setView("check");
    if (input === "s") setView("seize");
  });

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <Text bold color="yellow">Compliance</Text>
        <Text dimColor>│</Text>
        <Tab active={view === "list"} label="[l] Blacklist" />
        <Tab active={view === "add"} label="[a] Add" />
        <Tab active={view === "remove"} label="[r] Remove" />
        <Tab active={view === "check"} label="[c] Check" />
        <Tab active={view === "seize"} label="[s] Seize" />
      </Box>

      {view === "list" && <BlacklistTable />}
      {view === "add" && <AddForm />}
      {view === "remove" && <RemoveForm />}
      {view === "check" && <CheckForm />}
      {view === "seize" && <SeizeForm />}
    </Box>
  );
}

function Tab({ active, label }: { active: boolean; label: string }) {
  return <Text color={active ? "yellow" : "gray"}>{label}</Text>;
}

/* ── Blacklist Table ─────────────────────────────────────────────── */
function BlacklistTable() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getBlacklist();
        setEntries(data);
      } catch {
        setError("Could not fetch blacklist");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="yellow">Blacklisted Addresses</Text>
      {loading && (
        <Text><Text color="yellow"><Spinner type="dots" /></Text> Loading…</Text>
      )}
      {error && <Text color="red">✖ {error}</Text>}
      {!loading && !error && entries.length === 0 && (
        <Text dimColor>No blacklisted addresses (or server not running)</Text>
      )}
      {entries.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text bold color="yellow">{"Address".padEnd(46)}</Text>
            <Text bold color="yellow">{"Reason".padEnd(24)}</Text>
            <Text bold color="yellow">{"Date".padEnd(12)}</Text>
          </Box>
          {entries.map((e, i) => (
            <Box key={i}>
              <Text>{e.address.padEnd(46)}</Text>
              <Text color="yellow">{e.reason.padEnd(24)}</Text>
              <Text dimColor>{e.createdAt.slice(0, 10)}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/* ── Add Form ────────────────────────────────────────────────────── */
function AddForm() {
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [field, setField] = useState<"address" | "reason">("address");
  const [result, setResult] = useState("");

  const submit = async () => {
    if (!address || !reason) return;
    try {
      await addToBlacklist(address, reason);
      setResult("✓ Address blacklisted successfully");
    } catch {
      setResult("✖ Failed to blacklist address");
    }
  };

  useInput((_input, key) => {
    if (key.tab) setField((f) => (f === "address" ? "reason" : "address"));
    if (key.return && field === "reason") submit();
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="magenta">Add to Blacklist</Text>
      <Box marginTop={1}>
        <Text color={field === "address" ? "yellow" : "gray"}>Address: </Text>
        {field === "address" ? (
          <TextInput value={address} onChange={setAddress} onSubmit={() => setField("reason")} />
        ) : (
          <Text>{address || "—"}</Text>
        )}
      </Box>
      <Box>
        <Text color={field === "reason" ? "yellow" : "gray"}>Reason:  </Text>
        {field === "reason" ? (
          <TextInput value={reason} onChange={setReason} onSubmit={submit} />
        ) : (
          <Text>{reason || "—"}</Text>
        )}
      </Box>
      <Text dimColor>Tab to switch fields · Enter to submit</Text>
      {result && <Text color={result.startsWith("✓") ? "yellow" : "red"}>{result}</Text>}
    </Box>
  );
}

/* ── Remove Form ─────────────────────────────────────────────────── */
function RemoveForm() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState("");

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="yellow">Remove from Blacklist</Text>
      <Box marginTop={1}>
        <Text color="yellow">Address: </Text>
        <TextInput
          value={address}
          onChange={setAddress}
          onSubmit={async () => {
            try {
              await removeFromBlacklist(address);
              setResult("✓ Address removed from blacklist");
            } catch {
              setResult("✖ Failed to remove address");
            }
          }}
        />
      </Box>
      {result && <Text color={result.startsWith("✓") ? "yellow" : "red"}>{result}</Text>}
    </Box>
  );
}

/* ── Check Form ──────────────────────────────────────────────────── */
function CheckForm() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState("");

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="yellow">Check Blacklist Status</Text>
      <Box marginTop={1}>
        <Text color="yellow">Address: </Text>
        <TextInput
          value={address}
          onChange={setAddress}
          onSubmit={async () => {
            try {
              const { blacklisted } = await checkBlacklist(address);
              setResult(blacklisted ? "⚠ Address IS blacklisted" : "✓ Address is NOT blacklisted");
            } catch {
              setResult("✖ Check failed");
            }
          }}
        />
      </Box>
      {result && (
        <Text color={result.startsWith("✓") ? "yellow" : result.startsWith("⚠") ? "yellow" : "red"}>
          {result}
        </Text>
      )}
    </Box>
  );
}

/* ── Seize Form ──────────────────────────────────────────────────── */
function SeizeForm() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [field, setField] = useState<"source" | "destination" | "amount" | "reason">("source");
  const [result, setResult] = useState("");

  const fields = ["source", "destination", "amount", "reason"] as const;
  const nextField = () => {
    const idx = fields.indexOf(field);
    if (idx < fields.length - 1) setField(fields[idx + 1]);
  };

  const submit = async () => {
    if (!source || !destination || !amount || !reason) return;
    try {
      await seize(source, destination, Number(amount), reason);
      setResult("✓ Tokens seized successfully");
    } catch {
      setResult("✖ Seize failed");
    }
  };

  useInput((_input, key) => {
    if (key.tab) nextField();
    if (key.return && field === "reason") submit();
  });

  const vals = { source, destination, amount, reason };
  const setters = { source: setSource, destination: setDestination, amount: setAmount, reason: setReason };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="yellow">Seize Tokens</Text>
      {fields.map((f) => (
        <Box key={f} marginTop={f === "source" ? 1 : 0}>
          <Text color={field === f ? "yellow" : "gray"}>
            {f.charAt(0).toUpperCase() + f.slice(1) + ":"}{" ".repeat(14 - f.length)}
          </Text>
          {field === f ? (
            <TextInput value={vals[f]} onChange={setters[f]} onSubmit={f === "reason" ? submit : nextField} />
          ) : (
            <Text>{vals[f] || "—"}</Text>
          )}
        </Box>
      ))}
      <Text dimColor>Tab to switch fields · Enter to submit</Text>
      {result && <Text color={result.startsWith("✓") ? "yellow" : "red"}>{result}</Text>}
    </Box>
  );
}
