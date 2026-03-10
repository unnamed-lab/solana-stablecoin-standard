export interface Supply { totalSupply: string; maxSupply: string | null; burnSupply: string; decimals: number; }
export interface AuditEntry { action: string; actor: string; amount?: string; txSignature?: string; timestamp: string; }
export interface Info { name: string; symbol: string; mint: string; paused: boolean; preset: string; }
export interface BlacklistEntry { address: string; reason: string; timestamp: string; }
interface BlacklistEntry { address: string; reason: string; timestamp: string; }
