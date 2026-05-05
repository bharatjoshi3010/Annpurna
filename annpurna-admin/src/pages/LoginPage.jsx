import { useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext sets admin → App re-renders into the dashboard
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 w-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-600 to-primary-400 text-4xl mb-6 shadow-2xl shadow-primary-500/20 ring-1 ring-white/10">
            🍲
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Annpurna</h1>
          <p className="text-slate-400 mt-2 text-base font-medium opacity-90">Sign in to manage Annpurna</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="card p-8 shadow-2xl space-y-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300 ml-1">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@annpurna.com"
              required
              className="form-input"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-4 text-base mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Authenticating…
              </span>
            ) : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-10 font-medium">
          Restricted Access · Annpurna © 2026
        </p>
      </motion.div>
    </div>
  );
}
