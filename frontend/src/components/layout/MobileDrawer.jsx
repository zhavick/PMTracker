import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, LayoutDashboard, CheckSquare, Briefcase, Clock, Calendar, 
  FileText, Database, Code, Users, Settings, ShieldAlert, 
  Mail, RefreshCw, HelpCircle, ExternalLink, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  if (!isOpen) return null;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Daftar Tugas (Grid/Kanban)', icon: CheckSquare },
    { path: '/projects', label: 'Proyek Kerja', icon: Briefcase },
    { path: '/timesheet', label: 'Timesheet & Multi-Timer', icon: Clock },
    { path: '/attendance', label: 'Presensi & Kehadiran', icon: Calendar },
    { path: '/calendar', label: 'Kalender Tugas', icon: Calendar },
    { path: '/notes', label: 'Catatan & Dokumen', icon: FileText },
    { path: '/sql-tools', label: 'SQL Beautifier', icon: Database },
    { path: '/json-tools', label: 'JSON Payload Tools', icon: Code },
    ...(isAdmin ? [
      { path: '/members', label: 'Anggota Tim & Approval', icon: Users },
      { path: '/master-data', label: 'Master Data & SDLC', icon: Settings },
      { path: '/audit-trail', label: 'Audit Trail', icon: ShieldAlert },
      { path: '/email-settings', label: 'Pengaturan Email SMTP', icon: Mail },
      { path: '/sync', label: 'Multi-Instance Sync', icon: RefreshCw },
    ] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div 
        className="relative w-72 max-w-[80vw] h-full flex flex-col shadow-2xl z-10 transition-transform duration-300"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              WT
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                WorkTracker
              </span>
              <span className="ml-1 text-[10px] px-1 py-0.5 rounded font-mono font-semibold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}>
                v3.6
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="p-4 mx-3 my-2 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
              style={{ backgroundColor: user.avatarColor || 'var(--accent-primary)' }}
            >
              {user.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.fullName}
              </div>
              <div className="text-[11px] truncate opacity-70" style={{ color: 'var(--text-secondary)' }}>
                {user.jobTitle || user.role}
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'shadow-sm text-white' 
                      : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                })}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t space-y-1 pb-safe" style={{ borderColor: 'var(--border-color)' }}>
          <a
            href="/swagger"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ExternalLink size={16} />
            <span>Swagger REST API</span>
          </a>
        </div>
      </div>
    </div>
  );
}
