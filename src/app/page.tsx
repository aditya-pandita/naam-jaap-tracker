/**
 * @file src/app/page.tsx
 * @description Main dashboard page with Google authentication.
 *
 * Sign-in state comes from Firebase itself (onAuthChange), which restores the
 * session on reload and keeps the ID token refreshed. API calls get their token
 * from getFreshIdToken() rather than a copy saved in localStorage, which would
 * expire after an hour.
 */

'use client';

import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import {
    signInWithGoogle,
    signOut as firebaseSignOut,
    onAuthChange,
    checkRedirectResult,
} from '@/lib/firebase-client';

/** Create the user's Firestore profile on first sign-in (no-op if it exists). */
async function registerProfile(idToken: string): Promise<void> {
    const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Google auth failed');
    }
}

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Tokens used to be stored here; they expire after an hour, so drop any old copy.
        localStorage.removeItem('authToken');

        // Finish a sign-in that fell back to a full-page redirect (popup was blocked).
        checkRedirectResult()
            .then(token => (token ? registerProfile(token) : undefined))
            .catch(err => console.error('Redirect sign-in error:', err));

        return onAuthChange(user => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
        });
    }, []);

    const handleLogin = async () => {
        try {
            const idToken = await signInWithGoogle();
            await registerProfile(idToken);
            setIsAuthenticated(true);
        } catch (error) {
            const err = error as Error;
            if (err.message === 'REDIRECT') return; // page is navigating to Google
            console.error('Google login error:', error);
            if (!err.message.includes('Popup was closed')) {
                alert('Failed to sign in with Google. Please try again.');
            }
        }
    };

    const handleLogout = async () => {
        await firebaseSignOut();
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0A0908',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#A8A29E'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <Dashboard
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
            onLogout={handleLogout}
        />
    );
}
