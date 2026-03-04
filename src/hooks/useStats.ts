/**
 * @file src/hooks/useStats.ts
 * @description Fetch and cache statistics.
 */

import { useState, useCallback } from 'react';
import { StatsResponse } from '@/types';

const API_BASE = '/api/stats';

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
    };
}

export function useStats() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StatsResponse | null>(null);

    const fetchStats = useCallback(async (): Promise<StatsResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_BASE, { headers: getAuthHeaders() });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch stats');
            }
            
            const data: StatsResponse = await res.json();
            setStats(data);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearStats = useCallback(() => {
        setStats(null);
    }, []);

    return {
        loading,
        error,
        stats,
        fetchStats,
        clearStats,
    };
}
