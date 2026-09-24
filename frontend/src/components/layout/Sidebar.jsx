import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, Briefcase, Clock, Calendar, 
  FileText, Database, Code, Users, Settings, ShieldAlert, 
  Mail, RefreshCw, ChevronLeft, ChevronRight, ExternalLink, HelpCircle, Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'Admin';

  const navSections = [
    {
      title: 'OPERASIONAL',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/tasks', label: 'Daftar Tugas', icon: CheckSquare },
        { path: '/projects', label: 'Proyek', icon: Briefcase },
        { path: '/timesheet', label: 'Timesheet & Timer', icon: Clock },
        { path: '/attendance', label: 'Presensi Kehadiran', icon: Calendar },
        { path: '/calendar', label: 'Kalender Kerja', icon: Calendar },
        { path: '/notes', label: 'Catatan & Dokumen', icon: FileText },
        { path: '/gamification', label: 'Gamification & Badge', icon: Trophy },
      ]
    },
    {
      title: 'DEVELOPER TOOLS',
      items: [
        { path: '/sql-tools', label: 'SQL Beautifier', icon: Database },
        { path: '/json-tools', label: 'JSON Payload Tools', icon: Code },
      ]
    },
    ...(isAdmin ? [{
      title: 'ADMINISTRASI ENTERPRISE',
      items: [
        { path: '/members', label: 'Anggota Tim & Approval', icon: Users },
        { path: '/master-data', label: 'Master Data & SDLC', icon: Settings },
        { path: '/audit-trail', label: 'Audit Trail & Log', icon: ShieldAlert },
        { path: '/email-settings', label: 'Email SMTP & Template', icon: Mail },
        { path: '/sync', label: 'Host Induk Sync', icon: RefreshCw },
      ]
    }] : [])
  ];

  return (
    <aside 
      className={`hidden lg:flex flex-col border-r transition-all duration-300 select-none relative z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            WT
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                WorkTracker
              </span>
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded font-mono font-semibold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}>
                v3.6
              </span>
              <div className="text-[11px] truncate font-medium" style={{ color: 'var(--text-secondary)' }}>
                {user?.companyName || 'Enterprise'}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase opacity-60" style={{ color: 'var(--text-secondary)' }}>
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'font-semibold shadow-sm' 
                        : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    }}
                  >
                    <Icon size={19} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / External Links */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border-color)' }}>
        <a
          href="/swagger"
          target="_blank"
          rel="noreferrer"
          title={isCollapsed ? "REST API Swagger UI" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!isCollapsed && <span>Swagger REST API</span>}
        </a>
        <NavLink
          to="/user-guide"
          title={isCollapsed ? "Panduan Pengguna" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <HelpCircle size={16} className="shrink-0" />
          {!isCollapsed && <span>Panduan Pengguna</span>}
        </NavLink>
      </div>
    </aside>
  );
}
