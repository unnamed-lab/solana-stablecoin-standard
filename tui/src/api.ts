import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const api = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:3000/api/v1",
  timeout: 10_000,
});

/* ── Token Ops ────────────────────────────────────────────── */

export interface SupplyMetrics {
  totalSupply: string;
  maxSupply: string | null;
  burnSupply: string;
  decimals: number;
}

export interface Holder {
  address: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export const getSupply = () =>
  api.get<SupplyMetrics>("/supply").then((r) => r.data);

export const mint = (recipient: string, amount: number) =>
  api.post<{ success: boolean; txSignature: string }>("/mint", { recipient, amount, minterKeypair: process.env.MINTER_KEYPAIR }).then((r) => r.data);

export const burn = (amount: number) =>
  api.post<{ success: boolean; txSignature: string }>("/burn", { amount, burnerKeypair: process.env.BURNER_KEYPAIR }).then((r) => r.data);

export const getLargestHolders = (minAmount?: number) =>
  api.get<Holder[]>("/holders/largest", { params: { minAmount } }).then((r) => r.data);

/* ── Compliance ───────────────────────────────────────────── */

export interface BlacklistEntry {
  address: string;
  reason: string;
  createdAt: string;
}

export const getBlacklist = () =>
  api.get<BlacklistEntry[]>("/blacklist").then((r) => r.data);

export const addToBlacklist = (address: string, reason: string) =>
  api.post("/blacklist", { address, reason }).then((r) => r.data);

export const removeFromBlacklist = (address: string) =>
  api.delete(`/blacklist/${address}`).then((r) => r.data);

export const checkBlacklist = (address: string) =>
  api.get<{ blacklisted: boolean }>(`/blacklist/check/${address}`).then((r) => r.data);

export const seize = (source: string, destination: string, amount: number, reason: string) =>
  api.post("/seize", { source, destination, amount, reason }).then((r) => r.data);

/* ── Audit Log ────────────────────────────────────────────── */

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  mint: string;
  amount?: string;
  txSignature?: string;
  createdAt: string;
}

export interface PaginatedAuditLog {
  data: AuditEntry[];
  page: number;
  pageSize: number;
  total: number;
}

export const getAuditLog = (params: { action?: string; actor?: string; page?: number; pageSize?: number }) =>
  api.get<PaginatedAuditLog>("/audit-log", { params }).then((r) => r.data);

export const exportAuditCsv = (params?: { action?: string }) =>
  api.get<string>("/audit-log/export", { params, responseType: "text" as any }).then((r) => r.data);

/* ── Webhooks ─────────────────────────────────────────────── */

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

export const getWebhooks = () =>
  api.get<Webhook[]>("/webhooks").then((r) => r.data);

export const createWebhook = (url: string, secret: string, events: string[]) =>
  api.post<Webhook>("/webhooks", { url, secret, events }).then((r) => r.data);

export const updateWebhook = (id: string, data: Partial<{ url: string; events: string[]; active: boolean }>) =>
  api.put<Webhook>(`/webhooks/${id}`, data).then((r) => r.data);

export const deleteWebhook = (id: string) =>
  api.delete(`/webhooks/${id}`).then((r) => r.data);
