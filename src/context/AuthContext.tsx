import React, { createContext, useState, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY = '@annpurna_token';
const ROLE_KEY  = '@annpurna_role';

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
    setUser: () => {},
    logout: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, _setUser]    = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);

    // ── Restore session on app launch ─────────────────────────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = await AsyncStorage.getItem(TOKEN_KEY);
                if (!token) { setIsLoading(false); return; }

                // Validate the stored token against the backend
                const res = await fetch(`${BASE_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

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
            const newSocket = io(BASE_URL);

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
    const setUser = async (valueOrUpdater: any | ((prev: any) => any)) => {
        const newUser =
            typeof valueOrUpdater === 'function'
                ? valueOrUpdater(user)
                : valueOrUpdater;

        _setUser(newUser);

        if (newUser?.token) {
            await AsyncStorage.setItem(TOKEN_KEY, newUser.token);
            await AsyncStorage.setItem(ROLE_KEY, newUser.role || 'student');
        }
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
