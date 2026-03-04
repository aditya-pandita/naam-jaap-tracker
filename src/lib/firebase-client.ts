/**
 * @file src/lib/firebase-client.ts
 * @description Firebase Client SDK initialization for browser-side auth.
 *
 * Google Sign-In strategy:
 *   1. Try signInWithPopup (best UX — user stays on page)
 *   2. If popup blocked by COOP or browser settings → fall back to signInWithRedirect
 *   3. On page reload after redirect → getRedirectResult() picks up the credential
 *
 * Required env vars:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut as firebaseSignOut,
    UserCredential,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

/** Returns the Firebase Client App instance (singleton). */
function getClientApp(): FirebaseApp {
    if (getApps().length > 0) return getApp();
    return initializeApp(firebaseConfig);
}

/** Returns the Firebase Client Auth instance. */
export function getClientAuth(): Auth {
    return getAuth(getClientApp());
}

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google — popup first, redirect fallback.
 *
 * Returns the Firebase ID token on success.
 * Throws 'REDIRECT' if falling back to redirect (page will navigate away).
 */
export async function signInWithGoogle(): Promise<string> {
    const auth = getClientAuth();

    try {
        // Attempt 1: Popup (instant, no page navigation)
        const result = await signInWithPopup(auth, googleProvider);
        const token = await result.user.getIdToken();
        return token;
    } catch (error: unknown) {
        const err = error as { code?: string; message?: string };

        // These codes mean the popup was blocked — fall back to redirect
        const popupBlockedCodes = [
            'auth/popup-closed-by-user',
            'auth/popup-blocked',
            'auth/cancelled-popup-request',
        ];

        if (err.code && popupBlockedCodes.includes(err.code)) {
            console.warn(`Popup failed (${err.code}), falling back to redirect...`);
            await signInWithRedirect(auth, googleProvider);
            // Page navigates away — this throw is just a signal to the caller
            throw new Error('REDIRECT');
        }

        // Any other error — re-throw
        throw error;
    }
}

/**
 * Check if user just returned from a redirect sign-in.
 * Call this once on app mount (in useEffect).
 *
 * Returns the ID token if redirect just completed, null otherwise.
 */
export async function checkRedirectResult(): Promise<string | null> {
    const auth = getClientAuth();
    try {
        const result: UserCredential | null = await getRedirectResult(auth);
        if (result) {
            const token = await result.user.getIdToken();
            return token;
        }
        return null;
    } catch (error) {
        console.error('Redirect result error:', error);
        return null;
    }
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
    const auth = getClientAuth();
    await firebaseSignOut(auth);
}