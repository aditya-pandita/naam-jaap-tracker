/**
 * @file src/app/api/stats/route.ts
 * @description Statistics endpoint - computes full stats from all entries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { computeStats } from '@/lib/stats-calculator';
import { resolveClientToday } from '@/lib/date-helpers';

export async function GET(request: NextRequest) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;

    try {
        // Use the user's local date (sent by the client) so streaks and averages
        // are counted against their "today", not the server's UTC date.
        const today = resolveClientToday(new URL(request.url).searchParams.get('today'));

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
