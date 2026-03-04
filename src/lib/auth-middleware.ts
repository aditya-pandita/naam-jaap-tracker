/**
 * @file src/lib/auth-middleware.ts
 * @description Authentication using Firebase Auth REST API + Firestore using Admin SDK.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface AuthenticatedUser {
    uid: string;
    email: string;
}

interface FirebaseUserInfo {
    localId: string;
    email: string;
    displayName?: string;
}

interface FirebaseLookupResponse {
    users: FirebaseUserInfo[];
}

const getApiKey = () => process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

/**
 * Verify token using Firebase Auth REST API.
 */
async function verifyToken(token: string): Promise<FirebaseUserInfo | null> {
    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${getApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
        }
    );

    const data: FirebaseLookupResponse = await response.json();
    if (!response.ok || !data.users || data.users.length === 0) {
        return null;
    }
    return data.users[0];
}

function toFirestoreTimestamp(dateStr: string): Timestamp {
    return Timestamp.fromDate(new Date(dateStr));
}

function fromFirestoreTimestamp(ts: Timestamp): string {
    return ts.toDate().toISOString();
}

/**
 * Firestore operations using Firebase Admin SDK.
 */
export class FirestoreClient {
    private db = getAdminDb();

    constructor(public uid: string) {}

    async getEntry(date: string) {
        const doc = await this.db.doc(`users/${this.uid}/entries/${date}`).get();
        if (!doc.exists) return null;
        const data = doc.data()!;
        return {
            date: data.date,
            maalas: data.maalas,
            totalNames: data.totalNames,
            note: data.note,
            createdAt: fromFirestoreTimestamp(data.createdAt),
            updatedAt: fromFirestoreTimestamp(data.updatedAt),
        };
    }

    async setEntry(date: string, data: Record<string, unknown>) {
        const docRef = this.db.doc(`users/${this.uid}/entries/${date}`);
        await docRef.set({
            ...data,
            createdAt: toFirestoreTimestamp(data.createdAt as string),
            updatedAt: toFirestoreTimestamp(data.updatedAt as string),
        });
        return true;
    }

    async updateEntry(date: string, data: Record<string, unknown>) {
        const docRef = this.db.doc(`users/${this.uid}/entries/${date}`);
        await docRef.update({
            ...data,
            updatedAt: Timestamp.now(),
        });
        return true;
    }

    async deleteEntry(date: string) {
        const docRef = this.db.doc(`users/${this.uid}/entries/${date}`);
        await docRef.delete();
        return true;
    }

    async queryEntries(from: string, to: string) {
        const snapshot = await this.db
            .collection(`users/${this.uid}/entries`)
            .where('date', '>=', from)
            .where('date', '<=', to)
            .get();
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.date,
                maalas: data.maalas,
                totalNames: data.totalNames,
                note: data.note,
                createdAt: fromFirestoreTimestamp(data.createdAt),
                updatedAt: fromFirestoreTimestamp(data.updatedAt),
            };
        });
    }

    async getAllEntries() {
        const snapshot = await this.db
            .collection(`users/${this.uid}/entries`)
            .get();
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.date,
                maalas: data.maalas,
                totalNames: data.totalNames,
                note: data.note,
                createdAt: fromFirestoreTimestamp(data.createdAt),
                updatedAt: fromFirestoreTimestamp(data.updatedAt),
            };
        });
    }

    async getUserProfile() {
        const doc = await this.db.doc(`users/${this.uid}`).get();
        if (!doc.exists) return null;
        const data = doc.data()!;
        return {
            ...data,
            createdAt: fromFirestoreTimestamp(data.createdAt),
            updatedAt: fromFirestoreTimestamp(data.updatedAt),
        };
    }

    async createUserProfile(data: Record<string, unknown>) {
        const docRef = this.db.doc(`users/${this.uid}`);
        await docRef.set({
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return true;
    }
}

/**
 * Extract and verify the Bearer token from the request.
 */
export async function authenticateRequest(
    request: NextRequest
): Promise<{ user: AuthenticatedUser; firestore: FirestoreClient } | NextResponse<{ error: string }>> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Missing or invalid Authorization header' },
            { status: 401 }
        );
    }

    const token = authHeader.slice(7);

    try {
        const user = await verifyToken(token);

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        return {
            user: {
                uid: user.localId,
                email: user.email || '',
            },
            firestore: new FirestoreClient(user.localId),
        };
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
        );
    }
}
