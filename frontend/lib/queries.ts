"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, getBackendBase } from "./api";
import { oracleApi } from "./api";
import type { Supply, Info, AuditEntry, BlacklistEntry } from "@/types";

export interface BackendConfig {
  network: string;
  rpcEndpoint: string;
}

export interface BackendHealth {
  isHealthy: boolean;
  latencyMs?: number;
  status?: string;
}

const HEALTH_POLL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchBackendConfig() {
  return backendApi.get<BackendConfig>("/config");
}

async function fetchBackendHealth(): Promise<BackendHealth> {
  const base = getBackendBase();
  const start = Date.now();
  try {
    const res = await fetch(`${base}/health`, { method: "GET" });
    const latencyMs = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    const inner = data?.data ?? data;
    const ok = res.ok && (inner?.status === "ok" || inner?.status === "up");
    return {
      isHealthy: !!ok,
      latencyMs,
      status: inner?.status ?? data?.status,
    };
  } catch {
    return { isHealthy: false, latencyMs: Date.now() - start };
  }
}

const BACKEND_KEYS = {
  config: ["api", "config"] as const,
  health: ["api", "health"] as const,
  info: ["api", "info"] as const,
  supply: ["api", "supply"] as const,
  holdersCount: ["api", "holders", "count"] as const,
  holdersLargest: (minAmount?: string) => ["api", "holders", "largest", minAmount ?? ""] as const,
  recentActivity: (limit: number) => ["api", "recent-activity", limit] as const,
  auditLog: (params: { action?: string; actor?: string; mint?: string; page: number; pageSize: number }) =>
    ["api", "audit-log", params] as const,
  blacklist: ["api", "blacklist"] as const,
  webhooks: ["api", "webhooks"] as const,
  governanceProposals: ["api", "governance", "proposals"] as const,
  oracleFeeds: ["oracle", "feeds"] as const,
};

async function fetchInfo() {
  return backendApi.get<Info>("/info");
}

async function fetchSupply() {
  return backendApi.get<Supply>("/supply");
}

async function fetchHoldersCount() {
  const r = await backendApi.get<{ count: number }>("/holders/count");
  return r.count;
}

async function fetchHoldersLargest(minAmount?: string) {
  const q: Record<string, string> = {};
  if (minAmount) q.minAmount = minAmount;
  const r = Object.keys(q).length
    ? await backendApi.getWithQuery<unknown>("/holders/largest", q)
    : await backendApi.get<unknown>("/holders/largest");
  return Array.isArray(r) ? r : [];
}

async function fetchRecentActivity(limit: number) {
  const r = await backendApi.get<AuditEntry[]>(
    `/audit-log/recent?limit=${limit}`
  );
  return Array.isArray(r) ? r : [];
}

export interface AuditLogParams {
  action?: string;
  actor?: string;
  mint?: string;
  page: number;
  pageSize: number;
}

async function fetchAuditLog(params: AuditLogParams) {
  const q: Record<string, string> = {
    page: String(params.page),
    pageSize: String(params.pageSize),
  };
  if (params.action) q.action = params.action;
  if (params.actor) q.actor = params.actor;
  if (params.mint) q.mint = params.mint;
  const r = await backendApi.getWithQuery<{ data: AuditEntry[]; meta: { total: number } }>("/audit-log", q, true);
  return { data: r?.data ?? [], total: r?.meta?.total ?? 0 };
}

async function fetchBlacklist() {
  const r = await backendApi.get<BlacklistEntry[]>("/blacklist");
  return Array.isArray(r) ? r : [];
}

async function fetchWebhooks() {
  const r = await backendApi.get<{ id: string; url: string; events: string[]; active: boolean }[]>("/webhooks");
  return Array.isArray(r) ? r : [];
}

export interface Proposal {
  id: string;
  proposer: string;
  status: string;
  eta: number;
  approvalCount: number;
  threshold: number;
  action: { type: string; amount?: string; to?: string; from?: string; details?: string };
}

async function fetchGovernanceProposals() {
  const r = await backendApi.get<Proposal[] | { items: Proposal[] }>("/governance/proposals");
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "items" in r && Array.isArray((r as { items: Proposal[] }).items)) {
    return (r as { items: Proposal[] }).items;
  }
  return [];
}

export interface FeedEntry {
  symbol: string;
  feedType: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  decimals: number;
  switchboardFeed: string;
}

async function fetchOracleFeeds() {
  const r = await oracleApi.get<FeedEntry[]>("/feeds");
  return Array.isArray(r) ? r : [];
}

export function useBackendConfig() {
  return useQuery({
    queryKey: BACKEND_KEYS.config,
    queryFn: fetchBackendConfig,
    staleTime: 60_000,
  });
}

export function useBackendHealth() {
  return useQuery({
    queryKey: BACKEND_KEYS.health,
    queryFn: fetchBackendHealth,
    refetchInterval: HEALTH_POLL_MS,
    staleTime: HEALTH_POLL_MS,
  });
}

const DEFAULT_STALE_TIME = 10_000;
const DEFAULT_GC_TIME = 20_000;

export function useInfo() {
  return useQuery({
    queryKey: BACKEND_KEYS.info,
    queryFn: fetchInfo,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useSupply() {
  return useQuery({
    queryKey: BACKEND_KEYS.supply,
    queryFn: fetchSupply,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useHoldersCount() {
  return useQuery({
    queryKey: BACKEND_KEYS.holdersCount,
    queryFn: fetchHoldersCount,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useHoldersLargest(minAmount?: string) {
  return useQuery({
    queryKey: BACKEND_KEYS.holdersLargest(minAmount),
    queryFn: () => fetchHoldersLargest(minAmount),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useRecentActivity(limit = 6) {
  return useQuery({
    queryKey: BACKEND_KEYS.recentActivity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useAuditLog(params: AuditLogParams) {
  return useQuery({
    queryKey: BACKEND_KEYS.auditLog(params),
    queryFn: () => fetchAuditLog(params),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useBlacklist() {
  return useQuery({
    queryKey: BACKEND_KEYS.blacklist,
    queryFn: fetchBlacklist,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: BACKEND_KEYS.webhooks,
    queryFn: fetchWebhooks,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useGovernanceProposals() {
  return useQuery({
    queryKey: BACKEND_KEYS.governanceProposals,
    queryFn: fetchGovernanceProposals,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useOracleFeeds() {
  return useQuery({
    queryKey: BACKEND_KEYS.oracleFeeds,
    queryFn: fetchOracleFeeds,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["api"] });
  };
}

export function useInvalidateBlacklist() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: BACKEND_KEYS.blacklist });
  };
}

export function useInvalidateWebhooks() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: BACKEND_KEYS.webhooks });
  };
}

export function useInvalidateGovernance() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: BACKEND_KEYS.governanceProposals });
  };
}

export function useInvalidateOracleFeeds() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: BACKEND_KEYS.oracleFeeds });
  };
}
