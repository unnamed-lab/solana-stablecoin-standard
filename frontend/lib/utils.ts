/** Convert raw base-units to a human-readable number string */
export function fmt(raw: string | number, decimals = 6): string {
  return (Number(raw) / 10 ** decimals).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

/** Truncate a base58 address for display */
export function truncAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format an ISO timestamp to locale string */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
