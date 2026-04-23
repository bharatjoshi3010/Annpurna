import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

type AuthContextType = {
    user: any;
    setUser: (user: any | ((prev: any) => any)) => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (user && user._id) {
            const socket = io(SOCKET_URL);

            socket.on('connect', () => {
                console.log('Socket connected for user:', user._id);
                socket.emit('join', user._id.toString());
            });

            socket.on('kycUpdate', (updatedUser) => {
                console.log('KYC status updated real-time:', updatedUser.kycStatus);
                setUser((prev: any) => ({
                    ...prev,
                    ...updatedUser
                }));
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user?._id]);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
