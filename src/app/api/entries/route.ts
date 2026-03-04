/**
 * @file src/app/api/entries/route.ts
 * @description Entries API - handles GET queries and POST creation/upsert.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, FirestoreClient } from '@/lib/auth-middleware';
import { validateDate, validateMaalas, validateNote } from '@/lib/validators';
import { getTodayString, daysAgo } from '@/lib/date-helpers';
import { CHANTING } from '@/lib/constants';
import { EntryUpsertRequest, DailyEntryData, EntriesRangeResponse } from '@/types';

function toEntryData(doc: Record<string, unknown>): DailyEntryData {
    const date = (doc.date as string) || '';
    const maalas = (doc.maalas as number) || 0;
    return {
        date,
        maalas,
        totalNames: maalas * CHANTING.NAMES_PER_MAALA,
        note: doc.note as string | undefined,
        createdAt: (doc.createdAt as string) || new Date().toISOString(),
        updatedAt: (doc.updatedAt as string) || new Date().toISOString(),
    };
}

export async function GET(request: NextRequest) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    try {
        if (date) {
            const dateValidation = validateDate(date);
            if (!dateValidation.valid) {
                return NextResponse.json({ error: dateValidation.error }, { status: 400 });
            }

            const doc = await firestore.getEntry(date);
            
            if (!doc) {
                return NextResponse.json({ error: `No entry found for ${date}` }, { status: 404 });
            }

            return NextResponse.json(toEntryData(doc));
        }

        if (from && to) {
            const fromValidation = validateDate(from);
            const toValidation = validateDate(to);
            
            if (!fromValidation.valid) {
                return NextResponse.json({ error: fromValidation.error }, { status: 400 });
            }
            if (!toValidation.valid) {
                return NextResponse.json({ error: toValidation.error }, { status: 400 });
            }

            const entries = await firestore.queryEntries(from, to);
            const entryData = entries.map(toEntryData);

            const response: EntriesRangeResponse = {
                entries: entryData,
                count: entryData.length,
            };

            return NextResponse.json(response);
        }

        // No params - default to today
        const today = getTodayString();
        const doc = await firestore.getEntry(today);

        if (!doc) {
            return NextResponse.json({ error: `No entry found for ${today}` }, { status: 404 });
        }

        return NextResponse.json(toEntryData(doc));
    } catch (error) {
        console.error('Entries GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;

    try {
        const body: EntryUpsertRequest = await request.json();
        const { date, maalas, note } = body;

        if (date === undefined || maalas === undefined) {
            return NextResponse.json({ error: 'date and maalas are required' }, { status: 400 });
        }

        const dateValidation = validateDate(date);
        if (!dateValidation.valid) {
            return NextResponse.json({ error: dateValidation.error }, { status: 400 });
        }

        const maalasValidation = validateMaalas(maalas);
        if (!maalasValidation.valid) {
            return NextResponse.json({ error: maalasValidation.error }, { status: 400 });
        }

        if (note !== undefined) {
            const noteValidation = validateNote(note);
            if (!noteValidation.valid) {
                return NextResponse.json({ error: noteValidation.error }, { status: 400 });
            }
        }

        const existingDoc = await firestore.getEntry(date);
        const now = new Date().toISOString();
        const createdAt = (existingDoc?.createdAt as string) || now;
        console.log('>>> About to setEntry:', { date, maalas, note });

        const success = await firestore.setEntry(date, {
            date,
            maalas,
            totalNames: maalas * CHANTING.NAMES_PER_MAALA,
            note: note || '',
            createdAt,
            updatedAt: now,
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
        }

        const entry: DailyEntryData = {
            date,
            maalas,
            totalNames: maalas * CHANTING.NAMES_PER_MAALA,
            note: note || undefined,
            createdAt,
            updatedAt: now,
        };

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error('Entries POST error:', error);
        console.error('Stack:', (error as Error).stack);
        return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
    }
}
