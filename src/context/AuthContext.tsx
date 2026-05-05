import React, { createContext, useState, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, initApiConfig } from '../config';

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY = '@annpurna_token';
const ROLE_KEY = '@annpurna_role';

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

                // Validate the stored token against the backend (with timeout so it doesn't hang)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                
                const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (res.ok) {
                    const profile = await res.json();
                    // Re-attach the token so the rest of the app can use it
                    _setUser({ ...profile, token });
                } else {
                    // Token expired / revoked — clear storage
                    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
                }
            } catch {
                // Network error during restore — leave user as null (will go to Auth)
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

    // ── setUser: persists token automatically ─────────────────────────────────
    const setUser = (valueOrUpdater: any | ((prev: any) => any)) => {
        _setUser((prevUser: any) => {
            const newUser =
                typeof valueOrUpdater === 'function'
                    ? valueOrUpdater(prevUser)
                    : valueOrUpdater;

            if (newUser?.token) {
                AsyncStorage.setItem(TOKEN_KEY, newUser.token).catch(console.error);
                AsyncStorage.setItem(ROLE_KEY, newUser.role || 'student').catch(console.error);
            }
            return newUser;
        });
    };

    // ── logout: clears everything ─────────────────────────────────────────────
    const logout = async () => {
        await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
        _setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
