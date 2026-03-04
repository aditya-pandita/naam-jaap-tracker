/**
 * @file src/hooks/useEntries.ts
 * @description CRUD operations for entries via API.
 */

import { useState, useCallback } from 'react';
import { DailyEntryData, EntryUpsertRequest, EntryUpdateRequest, EntriesRangeResponse } from '@/types';

const API_BASE = '/api/entries';

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export function useEntries() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getEntry = useCallback(async (date?: string): Promise<DailyEntryData | null> => {
        setLoading(true);
        setError(null);
        try {
            const url = date ? `${API_BASE}?date=${date}` : API_BASE;
            const res = await fetch(url, { headers: getAuthHeaders() });
            
            if (!res.ok) {
                if (res.status === 404) return null;
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch entry');
            }
            
            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getEntriesRange = useCallback(async (from: string, to: string): Promise<DailyEntryData[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}?from=${from}&to=${to}`, {
                headers: getAuthHeaders(),
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch entries');
            }
            
            const data: EntriesRangeResponse = await res.json();
            return data.entries;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const saveEntry = useCallback(async (data: EntryUpsertRequest): Promise<DailyEntryData | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save entry');
            }
            
            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEntry = useCallback(async (date: string, data: EntryUpdateRequest): Promise<DailyEntryData | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/${date}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update entry');
            }
            
            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEntry = useCallback(async (date: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/${date}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete entry');
            }
            
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getEntry,
        getEntriesRange,
        saveEntry,
        updateEntry,
        deleteEntry,
    };
}
