/**
 * @file src/app/api/entries/[date]/route.ts
 * @description Single entry API for a specific date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateDate, validateMaalas, validateIncrement } from '@/lib/validators';
import { CHANTING } from '@/lib/constants';
import { DailyEntryData, EntryUpdateRequest } from '@/types';

interface RouteParams {
    params: Promise<{ date: string }>;
}

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

export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;
    const { date } = await params;

    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
        return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    try {
        const doc = await firestore.getEntry(date);

        if (!doc) {
            return NextResponse.json({ error: `No entry found for ${date}` }, { status: 404 });
        }

        return NextResponse.json(toEntryData(doc));
    } catch (error) {
        console.error('Entry GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;
    const { date } = await params;

    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
        return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    try {
        const body: EntryUpdateRequest = await request.json();

        if (body.maalas === undefined && body.incrementMaalas === undefined) {
            return NextResponse.json(
                { error: 'Provide either maalas (absolute) or incrementMaalas' },
                { status: 400 }
            );
        }

        const existingDoc = await firestore.getEntry(date);

        if (!existingDoc) {
            return NextResponse.json({ error: `No entry found for ${date}` }, { status: 404 });
        }

        let newMaalas: number;
        const currentMaalas = (existingDoc.maalas as number) || 0;

        if (body.maalas !== undefined) {
            const maalasValidation = validateMaalas(body.maalas);
            if (!maalasValidation.valid) {
                return NextResponse.json({ error: maalasValidation.error }, { status: 400 });
            }
            newMaalas = body.maalas;
        } else if (body.incrementMaalas !== undefined) {
            const incrementValidation = validateIncrement(body.incrementMaalas, currentMaalas);
            if (!incrementValidation.valid) {
                return NextResponse.json({ error: incrementValidation.error }, { status: 400 });
            }
            newMaalas = currentMaalas + body.incrementMaalas;
        } else {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const success = await firestore.updateEntry(date, {
            maalas: newMaalas,
            totalNames: newMaalas * CHANTING.NAMES_PER_MAALA,
            updatedAt: now,
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
        }

        const updatedDoc = await firestore.getEntry(date);
        return NextResponse.json(toEntryData(updatedDoc!));
    } catch (error) {
        console.error('Entry PUT error:', error);
        return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { firestore } = authResult;
    const { date } = await params;

    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
        return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    try {
        const existingDoc = await firestore.getEntry(date);

        if (!existingDoc) {
            return NextResponse.json({ error: `No entry found for ${date}` }, { status: 404 });
        }

        await firestore.deleteEntry(date);

        return NextResponse.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Entry DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
}
