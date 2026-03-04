/**
 * @file src/app/api/auth/register/route.ts
 * @description User registration endpoint.
 * POST /api/auth/register - Creates a new user account and returns an ID token.
 * Body: { email, password, displayName }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { CHANTING } from '@/lib/constants';
import { RegisterRequest, AuthResponse } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const body: RegisterRequest = await request.json();
        const { email, password, displayName } = body;

        if (!email || !password || !displayName) {
            return NextResponse.json(
                { error: 'Missing required fields: email, password, displayName' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const auth = getAdminAuth();
        const db = getAdminDb();

        // Check if user already exists
        try {
            await auth.getUserByEmail(email);
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        } catch {
            // User doesn't exist, proceed with creation
        }

        // Create the user
        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
        });

        // Create user profile in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            displayName,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            goalTotalNames: CHANTING.DEFAULT_GOAL_NAMES,
            namesPerMantra: CHANTING.NAMES_PER_MAHAMANTRA,
            beadsPerMaala: CHANTING.BEADS_PER_MAALA,
            namesPerMaala: CHANTING.NAMES_PER_MAALA,
        });

        // Generate custom token and exchange for ID token
        const customToken = await auth.createCustomToken(userRecord.uid);
        const idToken = await auth.verifyIdToken(customToken);

        const response: AuthResponse = {
            uid: userRecord.uid,
            email: userRecord.email || email,
            token: idToken.token,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
