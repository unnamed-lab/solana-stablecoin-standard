interface TokenEntry {
    name: string;
    symbol: string;
    preset: string;
    network: string;
    createdAt: string;
    keypairPath: string;
    mintAddress: string;
    decimals: number;
}
interface SSSConfig {
    activeToken: string;
    tokens: Record<string, TokenEntry>;
}
export declare function loadConfig(): SSSConfig;
export declare function saveToken(mintAddress: string, metadata: TokenEntry): void;
export declare function getActiveToken(): TokenEntry;
export declare function setActiveToken(mintAddress: string): void;
export {};
