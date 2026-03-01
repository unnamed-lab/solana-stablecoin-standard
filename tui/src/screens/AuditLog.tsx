import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import { getAuditLog, exportAuditCsv } from "../api.js";
import type { AuditEntry } from "../api.js";

const ACTION_FILTERS = [
  { label: "All", value: "" },
  { label: "MINT", value: "MINT" },
  { label: "BURN", value: "BURN" },
  { label: "SEIZE", value: "SEIZE" },
  { label: "FREEZE", value: "FREEZE" },
];

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  const pageSize = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLog({
        action: filter || undefined,
        page,
        pageSize,
      });
      setEntries(res.data);
      setTotal(res.total);
      setError("");
    } catch {
      setError("Could not fetch audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, page]);

  useInput((input, key) => {
    if (input === "f") setFilterOpen((v) => !v);
    if (input === "e") handleExport();
    if (key.leftArrow && page > 1) setPage((p) => p - 1);
    if (key.rightArrow && page * pageSize < total) setPage((p) => p + 1);
  });

  const handleExport = async () => {
    try {
      setExportMsg("Exporting…");
      await exportAuditCsv({ action: filter || undefined });
      setExportMsg("✓ CSV exported successfully");
    } catch {
      setExportMsg("✖ Export failed");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <Text bold color="yellow">Audit Log</Text>
        <Text dimColor>│</Text>
        <Text color="gray">[f] Filter</Text>
        <Text color="gray">[←/→] Page</Text>
        <Text color="gray">[e] Export CSV</Text>
        {exportMsg && (
          <Text color={exportMsg.startsWith("✓") ? "green" : exportMsg.startsWith("✖") ? "red" : "yellow"}>
            {exportMsg}
          </Text>
        )}
      </Box>

      {/* Filter dropdown */}
      {filterOpen && (
        <Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
          <SelectInput
            items={ACTION_FILTERS}
            onSelect={(item) => {
              setFilter(item.value);
              setFilterOpen(false);
              setPage(1);
            }}
          />
        </Box>
      )}

      {/* Current filter indicator */}
      {filter && (
        <Box marginBottom={1}>
          <Text dimColor>Filtered by: </Text>
          <Text bold color="cyan">{filter}</Text>
        </Box>
      )}

      {/* Table */}
      <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={2} paddingY={1}>
        {loading && (
          <Text><Text color="green"><Spinner type="dots" /></Text> Loading…</Text>
        )}
        {error && <Text color="red">✖ {error}</Text>}
        {!loading && !error && (
          <>
            <Box>
              <Text bold color="cyan">{"Action".padEnd(10)}</Text>
              <Text bold color="cyan">{"Actor".padEnd(46)}</Text>
              <Text bold color="cyan">{"Amount".padStart(14)}</Text>
              <Text bold color="cyan">{"  Date"}</Text>
            </Box>
            {entries.length === 0 && <Text dimColor>No entries found</Text>}
            {entries.map((e, i) => (
              <Box key={i}>
                <Text color={actionColor(e.action)}>{e.action.padEnd(10)}</Text>
                <Text>{(e.actor || "—").padEnd(46)}</Text>
                <Text color="white">{(e.amount || "—").padStart(14)}</Text>
                <Text dimColor>{"  " + e.createdAt.slice(0, 10)}</Text>
              </Box>
            ))}
          </>
        )}

        {/* Pagination */}
        <Box marginTop={1} gap={2}>
          <Text dimColor>
            Page {page}/{totalPages} ({total} total)
          </Text>
          {page > 1 && <Text color="green">← prev</Text>}
          {page < totalPages && <Text color="green">next →</Text>}
        </Box>
      </Box>
    </Box>
  );
}

function actionColor(action: string): string {
  switch (action) {
    case "MINT": return "green";
    case "BURN": return "red";
    case "SEIZE": return "yellow";
    case "FREEZE": return "blue";
    default: return "white";
  }
}
