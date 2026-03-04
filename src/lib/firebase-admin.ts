/**
 * @file src/lib/firebase-admin.ts
 * @description Firebase Admin SDK singleton initialization for server-side API routes.
 * Uses a singleton pattern to avoid re-initializing on every request in the
 * Next.js development hot-reload cycle.
 *
 * Required env vars (set in Vercel / .env.local):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (the full PEM key, newlines as \n)
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;

function initAdmin(): void {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
    } else {
        const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
            process.env;

        if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
            throw new Error(
                'Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, ' +
                'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
            );
        }

        // Handle private key - strip quotes and convert \n to actual newlines
        let privateKey = FIREBASE_PRIVATE_KEY.trim();
        
        // Remove surrounding quotes if present
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        
        // Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        console.log('[Firebase Admin] Initializing with key starting:', privateKey.substring(0, 40));
        console.log('[Firebase Admin] Key length:', privateKey.length);
        
        try {
            adminApp = initializeApp({
                credential: cert({
                    projectId: FIREBASE_PROJECT_ID,
                    clientEmail: FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
            console.log('[Firebase Admin] Initialized successfully');
        } catch (initError) {
            console.error('[Firebase Admin] Init error:', initError);
            throw initError;
        }
    }

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
}

/**
 * Returns the Firebase Admin Firestore instance.
 * Initializes the Admin SDK on first call.
 */
export function getAdminDb(): Firestore {
    if (!adminDb) initAdmin();
    return adminDb;
}

/**
 * Returns the Firebase Admin Auth instance.
 * Initializes the Admin SDK on first call.
 */
export function getAdminAuth(): Auth {
    if (!adminAuth) initAdmin();
    return adminAuth;
}
