import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { getSupply, mint, getLargestHolders, burn } from "../api.js";
import type { SupplyMetrics, Holder } from "../api.js";

type SubView = "dashboard" | "mint" | "burn" | "holders";

export default function TokenOps() {
  const [view, setView] = useState<SubView>("dashboard");

  useInput((input) => {
    if (input === "d") setView("dashboard");
    if (input === "m") setView("mint");
    if (input === "b") setView("burn");
    if (input === "h") setView("holders");
  });

  return (
    <Box flexDirection="column">
      {/* Sub-nav */}
      <Box gap={1} marginBottom={1}>
        <Text bold color="yellow">Token Ops</Text>
        <Text dimColor>│</Text>
        <TabLabel active={view === "dashboard"} label="[d] Dashboard" />
        <TabLabel active={view === "mint"} label="[m] Mint" />
        <TabLabel active={view === "burn"} label="[b] Burn" />
        <TabLabel active={view === "holders"} label="[h] Holders" />
      </Box>

      {view === "dashboard" && <SupplyDashboard />}
      {view === "mint" && <MintForm />}
      {view === "burn" && <BurnForm />}
      {view === "holders" && <HoldersTable />}
    </Box>
  );
}

/* ── Small helper --------------------------------------------------- */
function TabLabel({ active, label }: { active: boolean; label: string }) {
  return <Text color={active ? "green" : "gray"}>{label}</Text>;
}

/* ── Supply Dashboard ─────────────────────────────────────────────── */
function SupplyDashboard() {
  const [supply, setSupply] = useState<SupplyMetrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSupply = async () => {
    setLoading(true);
    try {
      const data = await getSupply();
      setSupply(data);
      setError("");
    } catch {
      setError("Could not reach API — is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupply();
    const interval = setInterval(fetchSupply, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text bold color="cyan">Supply Metrics</Text>
      <Text dimColor>(auto-refreshes every 10s)</Text>
      <Box marginTop={1} flexDirection="column">
        {loading && !supply && (
          <Text>
            <Text color="green"><Spinner type="dots" /></Text> Fetching supply…
          </Text>
        )}
        {error && <Text color="red">✖ {error}</Text>}
        {supply && (
          <>
            <Text>Total Supply:  <Text bold color="white">{supply.totalSupply}</Text></Text>
            <Text>Max Supply:    <Text bold color="white">{supply.maxSupply ?? "∞"}</Text></Text>
            <Text>Burned:        <Text bold color="red">{supply.burnSupply}</Text></Text>
            <Text>Decimals:      <Text bold color="white">{supply.decimals}</Text></Text>
          </>
        )}
      </Box>
    </Box>
  );
}

/* ── Mint Form ────────────────────────────────────────────────────── */
function MintForm() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");
  const [field, setField] = useState<"recipient" | "amount">("recipient");

  const handleSubmit = async () => {
    if (!recipient || !amount) return;
    try {
      const res = await mint(recipient, Number(amount));
      setResult(`✓ Minted! tx: ${res.txSignature}`);
    } catch {
      setResult("✖ Mint failed — check the server log");
    }
  };

  useInput((_input, key) => {
    if (key.tab) setField((f) => (f === "recipient" ? "amount" : "recipient"));
    if (key.return && field === "amount") handleSubmit();
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="magenta">Mint Tokens</Text>
      <Box marginTop={1}>
        <Text color={field === "recipient" ? "green" : "gray"}>Recipient: </Text>
        {field === "recipient" ? (
          <TextInput value={recipient} onChange={setRecipient} onSubmit={() => setField("amount")} />
        ) : (
          <Text>{recipient || "—"}</Text>
        )}
      </Box>
      <Box>
        <Text color={field === "amount" ? "green" : "gray"}>Amount:    </Text>
        {field === "amount" ? (
          <TextInput value={amount} onChange={setAmount} onSubmit={handleSubmit} />
        ) : (
          <Text>{amount || "—"}</Text>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Tab to switch fields · Enter to submit</Text>
      </Box>
      {result && (
        <Box marginTop={1}>
          <Text color={result.startsWith("✓") ? "green" : "red"}>{result}</Text>
        </Box>
      )}
    </Box>
  );
}

/* ── Burn Form ────────────────────────────────────────────────────── */
function BurnForm() {
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
      <Text bold color="red">Burn Tokens</Text>
      <Box marginTop={1}>
        <Text color="green">Amount: </Text>
        <TextInput
          value={amount}
          onChange={setAmount}
          onSubmit={async () => {
            try {
              const res = await burn(Number(amount));
              setResult(`✓ Burned! tx: ${res.txSignature}`);
            } catch {
              setResult("✖ Burn failed — check the server log");
            }
          }}
        />
      </Box>
      {result && (
        <Box marginTop={1}>
          <Text color={result.startsWith("✓") ? "green" : "red"}>{result}</Text>
        </Box>
      )}
    </Box>
  );
}

/* ── Largest Holders Table ────────────────────────────────────────── */
function HoldersTable() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getLargestHolders();
        setHolders(data);
      } catch {
        setError("Could not fetch holders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={2} paddingY={1}>
      <Text bold color="blue">Largest Holders</Text>
      {loading && (
        <Text><Text color="green"><Spinner type="dots" /></Text> Loading…</Text>
      )}
      {error && <Text color="red">✖ {error}</Text>}
      {!loading && !error && holders.length === 0 && (
        <Text dimColor>No holders found (is the server running?)</Text>
      )}
      {holders.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text bold color="cyan">{"Address".padEnd(46)}</Text>
            <Text bold color="cyan">{"Amount".padStart(16)}</Text>
          </Box>
          {holders.slice(0, 10).map((h, i) => (
            <Box key={i}>
              <Text>{h.address.padEnd(46)}</Text>
              <Text color="white">{h.uiAmountString.padStart(16)}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
