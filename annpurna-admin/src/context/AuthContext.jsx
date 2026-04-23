import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/admin';
const TOKEN_KEY = 'annpurna_admin_token';

const AuthContext = createContext({
  admin: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]       = useState(null);
  const [isLoading, setLoading] = useState(true);

  // ── Restore session on page load / refresh ──────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      try {
        const res = await axios.get(`${BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmin({ ...res.data, token });
      } catch {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await axios.post(`${BASE_URL}/login`, { email, password });
    const data = res.data; // { token, role, email, name }
    localStorage.setItem(TOKEN_KEY, data.token);
    setAdmin(data);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AuthContext);

// Returns the stored token so axios interceptors can use it
export const getAdminToken = () => localStorage.getItem(TOKEN_KEY);
