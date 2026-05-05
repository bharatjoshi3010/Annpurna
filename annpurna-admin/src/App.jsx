import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import RestaurantsPage from './pages/RestaurantsPage';
import LoginPage from './pages/LoginPage';

// ── Protected layout: shows Sidebar + pages only when logged in ───────────────
function AdminLayout() {
  const { admin, isLoading, logout } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center w-full">
        <div className="text-center">
          <div className="text-5xl mb-4">🍲</div>
          <p className="text-slate-400 text-sm animate-pulse">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-200 w-full lg:p-5 lg:gap-5">
      {/* Sidebar - Fixed width on desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0 z-20 rounded-3xl overflow-hidden border border-slate-800/60 shadow-2xl">
        <Sidebar onLogout={logout} adminName={admin.name} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] h-full flex flex-col bg-slate-900 shadow-2xl transform transition-transform duration-300">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl z-50"
            >
              <X size={20} />
            </button>
            <Sidebar onLogout={logout} adminName={admin.name} onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">

        {/* Top Header / Breadcrumb placeholder */}
        <header className="h-16 border-b border-slate-800/60 flex items-center px-6 lg:px-12 justify-between z-10 sticky top-0">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="text-xl font-bold text-white tracking-tight">Annpurna</span>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <span className="text-lg font-semibold text-white">Admin Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Optional: Add search or notifications here */}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12">
          <div className="max-w-7xl mx-auto fade-in pb-12">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/restaurants" element={<RestaurantsPage />} />
              {/* Catch-all back to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
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
          <Route path="/*" element={<AdminLayout />} />
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
