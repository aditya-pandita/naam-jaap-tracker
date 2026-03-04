/**
 * @file src/app/api/auth/google/route.ts
 * @description Google authentication endpoint.
 * POST /api/auth/google - Verifies Google ID token and creates/updates user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FirestoreClient } from '@/lib/auth-middleware';
import { CHANTING } from '@/lib/constants';
import { AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken || typeof idToken !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid idToken' },
                { status: 400 }
            );
        }

        const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        
        const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
            return NextResponse.json(
                { error: 'Invalid Google token' },
                { status: 401 }
            );
        }

        const firebaseUser = verifyData.users[0];
        const uid = firebaseUser.localId;
        const email = firebaseUser.email || '';
        const displayName = firebaseUser.displayName || 'User';

        // Create or update user profile in Firestore
        const firestore = new FirestoreClient(uid);
        const existingProfile = await firestore.getUserProfile();

        if (!existingProfile) {
            await firestore.createUserProfile({
                uid,
                email,
                displayName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                goalTotalNames: CHANTING.DEFAULT_GOAL_NAMES,
                namesPerMantra: CHANTING.NAMES_PER_MAHAMANTRA,
                beadsPerMaala: CHANTING.BEADS_PER_MAALA,
                namesPerMaala: CHANTING.NAMES_PER_MAALA,
            });
        }

        const response: AuthResponse = {
            uid,
            email,
            token: idToken,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.json(
            { error: 'Failed to authenticate with Google' },
            { status: 500 }
        );
    }
}
