/**
 * @file src/app/page.tsx
 * @description Main dashboard page with Google authentication.
 */

'use client';

import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { signInWithGoogle, signOut as firebaseSignOut } from '@/lib/firebase-client';

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleLogin = async () => {
        try {
            const idToken = await signInWithGoogle();
            
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Google auth failed');
            }

            localStorage.setItem('authToken', data.token);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Google login error:', error);
            const err = error as Error;
            if (!err.message.includes('Popup was closed')) {
                alert('Failed to sign in with Google. Please try again.');
            }
        }
    };

    const handleLogout = async () => {
        await firebaseSignOut();
        localStorage.removeItem('authToken');
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
