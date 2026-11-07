import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Sliders,
  History,
  Share2,
  FileBarChart2,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronRight,
  Zap,
  Globe2,
  Gavel,
  Store,
} from 'lucide-react';
import { getUser, authApi } from '../services/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Monitoring', href: '/live', icon: Activity, badge: 'LIVE' },
  { name: 'AI Fraud Detector', href: '/detector', icon: Sliders },
  { name: 'Fraud Alerts', href: '/alerts', icon: ShieldAlert },
  { name: 'Transaction History', href: '/history', icon: History },
  { name: 'Network Analysis', href: '/network', icon: Share2 },
  { name: 'Reports & Analytics', href: '/reports', icon: FileBarChart2 },
  { name: '─', href: null, divider: true },
  { name: 'NPCI Ecosystem', href: '/npci', icon: Globe2, badge: 'NEW' },
  { name: 'AML & Compliance', href: '/aml', icon: Gavel },
  { name: 'Merchant Risk', href: '/merchants', icon: Store },
  { name: '─', href: null, divider: true },
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheck, adminOnly: true },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const user = getUser() || { email: 'analyst@fraudguard.ai', full_name: 'Risk Analyst', role: 'analyst' };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0D1527] border-r border-slate-800/80 transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-full flex-col justify-between">
        {/* Brand Header */}
        <div>
          <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800/70 bg-[#0A101D]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                FRAUDGUARD <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded font-mono">UPI</span>
              </h1>
              <p className="text-[11px] text-slate-400">NPCI Real-Time Shield</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3 py-4">
            {navigation.map((item) => {
              if (item.divider) return <div key={Math.random()} className="my-1 mx-3 border-t border-slate-800/60" />;
              if (item.adminOnly && user?.role !== 'admin') return null;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-400 border-l-2 border-cyan-400 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-rose-400 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0A101D]/60">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-cyan-400 border border-slate-600">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-medium text-white">{user.full_name || 'Risk Analyst'}</p>
                <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">{user.role || 'Analyst'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
