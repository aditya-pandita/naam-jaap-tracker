/**
 * @file src/app/api/auth/login/route.ts
 * @description User login endpoint.
 * POST /api/auth/login - Authenticates user and returns an ID token.
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoginRequest, AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields: email, password' },
                { status: 400 }
            );
        }

        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error?.message || 'Invalid email or password' },
                { status: 401 }
            );
        }

        const authResponse: AuthResponse = {
            uid: data.localId,
            email: data.email,
            token: data.idToken,
        };

        return NextResponse.json(authResponse);
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Failed to authenticate' },
            { status: 500 }
        );
    }
}
