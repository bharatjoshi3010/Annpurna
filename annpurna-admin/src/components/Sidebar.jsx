import { NavLink } from 'react-router-dom';
import { Users, UtensilsCrossed, LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
  { to: '/users', icon: <Users size={20} />, label: 'Manage Users' },
  { to: '/restaurants', icon: <UtensilsCrossed size={20} />, label: 'Manage Restaurants' },
];

export default function Sidebar({ onLogout, adminName, onNavigate }) {
  return (
    <aside className="w-full h-full bg-slate-900/95 flex flex-col">
      {/* Logo Section */}
      <div className="px-8 py-10 border-b border-slate-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-xl shadow-primary-500/20 ring-1 ring-white/10">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight ">Annpurna</h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-3">
        <p className="px-4 mb-4 text-xs font-semibold text-slate-500">MAIN MENU</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="opacity-80">{item.icon}</span>
            <span className="tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile Section */}
      <div className="mt-auto p-6 border-t border-slate-800/40 bg-slate-900/50">
        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/40 shadow-inner">
          {adminName && (
            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white text-sm font-black border border-white/5 shadow-md">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 mb-0.5">Admin</p>
                <p className="text-sm text-white font-semibold truncate">{adminName}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-300
                       hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 text-sm font-medium border border-transparent hover:border-red-500/20"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
        <p className="text-xs text-slate-500 text-center mt-6">Annpurna Admin v1.2</p>
      </div>
    </aside>
  );
}
