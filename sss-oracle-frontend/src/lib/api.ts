export class ApiError extends Error {
    constructor(public status: number, public message: string, public body: any) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `/api${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        let body;
        const text = await response.text();
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
        throw new ApiError(
            response.status,
            body?.message || response.statusText,
            body
        );
    }

    const result = await response.json();
    if (result && typeof result === 'object' && 'status' in result && 'data' in result) {
        return result.data;
    }
    return result;
}

// Feeds
export const feedsApi = {
    list: () => fetchApi<any[]>('/feeds'),
    register: (payload: { symbol: string; feedType: string; baseCurrency: string; quoteCurrency: string; decimals: number; switchboardFeed: string }) =>
        fetchApi<any>('/feeds/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
};

// Config
export const configApi = {
    get: (mint: string) => fetchApi<any>(`/config/${mint}`),
    initialize: (payload: {
        mint: string;
        feedSymbol: string;
        description?: string;
        maxStalenessSecs: number;
        mintFeeBps: number;
        redeemFeeBps: number;
        maxConfidenceBps: number;
        quoteValiditySecs: number;
        cpiMultiplier?: number;
        cpiMinUpdateInterval?: number;
        cpiDataSource?: string;
    }) =>
        fetchApi<any>('/config/initialize', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    initializeRegistry: () =>
        fetchApi<any>('/config/initialize-registry', {
            method: 'POST',
        }),
};

// Quotes
export const quotesApi = {
    simulateMint: ({ usdAmount, mintAddress }: { usdAmount: number; mintAddress: string }) => {
        const params = new URLSearchParams({ usdAmount: usdAmount.toString(), mintAddress });
        return fetchApi<any>(`/quotes/mint/simulate?${params.toString()}`);
    },
    simulateRedeem: ({ tokenAmount, mintAddress }: { tokenAmount: number; mintAddress: string }) => {
        const params = new URLSearchParams({ tokenAmount: tokenAmount.toString(), mintAddress });
        return fetchApi<any>(`/quotes/redeem/simulate?${params.toString()}`);
    },
};

// CPI
export const cpiApi = {
    update: (payload: { mint: string; cpiMultiplier: number }) =>
        fetchApi<any>('/config/cpi/update', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
};
