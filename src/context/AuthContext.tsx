import React, { createContext, useState, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, initApiConfig } from '../config';

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY   = '@annpurna_token';
const ROLE_KEY    = '@annpurna_role';
const USER_KEY    = '@annpurna_user';   // full user snapshot for offline restore

// ── Types ─────────────────────────────────────────────────────────────────────
type AuthContextType = {
    user: any;
    isLoading: boolean;            // true while checking stored token on startup
    setUser: (user: any | ((prev: any) => any)) => void;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    setUser: () => { },
    logout: async () => { },
});

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, _setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);

    // ── Restore session on app launch ─────────────────────────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            try {
                await initApiConfig();

                const token = await AsyncStorage.getItem(TOKEN_KEY);
                if (!token) { setIsLoading(false); return; }

                // Try to validate the stored token against the backend.
                // Use a short timeout so this never hangs the splash screen.
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s

                    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const profile = await res.json();
                        const hydratedUser = { ...profile, token };
                        _setUser(hydratedUser);
                        // Keep the snapshot fresh for offline restores
                        await AsyncStorage.setItem(USER_KEY, JSON.stringify(hydratedUser)).catch(() => {});
                    } else {
                        // 401 / 403 → token genuinely expired or revoked
                        await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, USER_KEY]);
                    }
                } catch {
                    // Network error or timeout — do NOT log the user out.
                    // Restore from the last cached user snapshot instead.
                    const cachedUser = await AsyncStorage.getItem(USER_KEY);
                    if (cachedUser) {
                        try { _setUser(JSON.parse(cachedUser)); } catch { /* corrupt cache */ }
                    }
                    // If no snapshot exists either, fall through leaving user null → Auth screen.
                }
            } catch {
                // Unexpected error in storage itself — fail gracefully
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    // ── Socket lifecycle ──────────────────────────────────────────────────────
    useEffect(() => {
        if (user && user._id) {
            const newSocket = io(API_BASE_URL);

            newSocket.on('connect', () => {
                newSocket.emit('join', user._id.toString());
            });

            newSocket.on('kycUpdate', (updatedUser: any) => {
                _setUser((prev: any) => ({ ...prev, ...updatedUser }));
            });

            setSocket(newSocket);
            return () => { newSocket.disconnect(); };
        } else {
            socket?.disconnect();
            setSocket(null);
        }
    }, [user?._id]);

    // ── setUser: persists token + full snapshot automatically ────────────────
    const setUser = (valueOrUpdater: any | ((prev: any) => any)) => {
        _setUser((prevUser: any) => {
            const newUser =
                typeof valueOrUpdater === 'function'
                    ? valueOrUpdater(prevUser)
                    : valueOrUpdater;

            if (newUser?.token) {
                AsyncStorage.setItem(TOKEN_KEY, newUser.token).catch(console.error);
                AsyncStorage.setItem(ROLE_KEY, newUser.role || 'student').catch(console.error);
                // Persist full snapshot so session survives network-less restarts
                AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)).catch(console.error);
            }
            return newUser;
        });
    };

    // ── logout: clears everything ─────────────────────────────────────────────
    const logout = async () => {
        await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, USER_KEY]);
        _setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
