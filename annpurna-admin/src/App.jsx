import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import RestaurantsPage from './pages/RestaurantsPage';
import LoginPage from './pages/LoginPage';

// ── Protected layout: shows Sidebar + pages only when logged in ───────────────
function AdminLayout() {
  const { admin, isLoading, logout } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🍲</div>
          <p className="text-slate-400 text-sm animate-pulse">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar onLogout={logout} adminName={admin.name} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/users"       element={<UsersPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          {/* Catch-all back to dashboard */}
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPageGuard />} />
          <Route path="/*"     element={<AdminLayout />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

// Redirect away from /login if already authenticated
function LoginPageGuard() {
  const { admin, isLoading } = useAdminAuth();
  if (isLoading) return null;
  if (admin) return <Navigate to="/" replace />;
  return <LoginPage />;
}
