/**
 * @file src/app/api/stats/route.ts
 * @description Statistics endpoint - computes full stats from all entries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { computeStats } from '@/lib/stats-calculator';
import { getTodayString } from '@/lib/date-helpers';

export async function GET(request: NextRequest) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;

    try {
        const today = getTodayString();

        // Fetch all entries for the user
        const entries = await firestore.getAllEntries();

        const entriesForCalc = entries.map((doc: Record<string, unknown>) => ({
            date: doc.date as string,
            maalas: doc.maalas as number,
        }));

        // Compute stats
        const stats = computeStats(entriesForCalc, undefined, today);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Stats GET error:', error);
        return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
    }
}
