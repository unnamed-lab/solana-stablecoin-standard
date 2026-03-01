import { useState, useEffect, useCallback } from 'react';
import { feedsApi, configApi, quotesApi } from '@/lib/api';

export function useFeeds() {
    const [feeds, setFeeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchFeeds = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await feedsApi.list();
            setFeeds(data);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeeds();
        const interval = setInterval(fetchFeeds, 30000);
        return () => clearInterval(interval);
    }, [fetchFeeds]);

    return { feeds, loading, error, refetch: fetchFeeds };
}

export function useOracleConfig(mint: string) {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!mint) return;

        let isCancelled = false;

        const fetchConfig = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await configApi.get(mint);
                if (!isCancelled) setConfig(data);
            } catch (err: any) {
                if (!isCancelled) setError(err);
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };

        fetchConfig();

        return () => {
            isCancelled = true;
        };
    }, [mint]);

    return { config, loading, error };
}

export function useMintQuote(usdCents: number, mintAddress: string) {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!usdCents || !mintAddress) {
            setResult(null);
            return;
        }

        setLoading(true);
        const handler = setTimeout(async () => {
            try {
                setError(null);
                const data = await quotesApi.simulateMint({ usdAmount: usdCents, mintAddress });
                setResult(data);
            } catch (err: any) {
                setError(err);
                setResult(null);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(handler);
    }, [usdCents, mintAddress]);

    return { result, loading, error };
}

export function useRedeemQuote(tokenUnits: number, mintAddress: string) {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!tokenUnits || !mintAddress) {
            setResult(null);
            return;
        }

        setLoading(true);
        const handler = setTimeout(async () => {
            try {
                setError(null);
                const data = await quotesApi.simulateRedeem({ tokenAmount: tokenUnits, mintAddress });
                setResult(data);
            } catch (err: any) {
                setError(err);
                setResult(null);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(handler);
    }, [tokenUnits, mintAddress]);

    return { result, loading, error };
}
