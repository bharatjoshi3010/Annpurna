import { NavLink } from 'react-router-dom';
import { Users, UtensilsCrossed, LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';

const navItems = [
  { to: '/',            icon: <LayoutDashboard size={20} />, label: 'Dashboard',          end: true },
  { to: '/users',       icon: <Users size={20} />,           label: 'Manage Users' },
  { to: '/restaurants', icon: <UtensilsCrossed size={20} />, label: 'Manage Restaurants' },
];

export default function Sidebar({ onLogout, adminName }) {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800/80 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Annpurna</h1>
            <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer — admin name + logout */}
      <div className="px-4 py-4 border-t border-slate-800/80 space-y-3">
        {adminName && (
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
              {adminName.charAt(0)}
            </div>
            <span className="text-sm text-slate-400 font-medium truncate">{adminName}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400
                     hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
        <p className="text-xs text-slate-700 text-center">Annpurna © 2025</p>
      </div>
    </aside>
  );
}
