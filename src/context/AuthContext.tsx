import React, { createContext, useState, useContext } from 'react';

type AuthContextType = {
    user: any;
    setUser: (user: any) => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
