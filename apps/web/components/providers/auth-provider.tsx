'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { jwtDecode } from 'jwt-decode';

interface User {
    sub: string;
    email: string;
    role: string;
    name?: string;
    // Add other claims as needed
}

interface AuthContextType {
    user: User | null;
    login: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    const logout = useCallback(() => {
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        setUser(null);
        router.push('/login');
    }, [router]);

    useEffect(() => {
        // Check for existing token on mount
        const token = getCookie('accessToken');
        if (token && typeof token === 'string') {
            try {
                const decoded = jwtDecode<User>(token);
                setUser(decoded);
            } catch (e) {
                console.error('Invalid token', e);
                logout();
            }
        }
    }, [logout]);

    const login = (accessToken: string, refreshToken: string) => {
        setCookie('accessToken', accessToken, { maxAge: 60 * 15, path: '/' }); // 15 mins
        setCookie('refreshToken', refreshToken, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // 7 days

        try {
            const decoded = jwtDecode<User>(accessToken);
            setUser(decoded);
            router.push('/dashboard');
        } catch (e) {
            console.error('Login failed: Invalid token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
