import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Plus, Briefcase, Menu } from 'lucide-react';

export default function MobileBottomNav({ onOpenMobileDrawer, onQuickAdd }) {
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl bg-opacity-90 transition-colors pb-safe"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderColor: 'var(--border-color)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-14 h-full text-[10px] font-semibold transition-all ${
              isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
          })}
        >
          <LayoutDashboard size={20} />
          <span className="mt-1">Beranda</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-14 h-full text-[10px] font-semibold transition-all ${
              isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
          })}
        >
          <CheckSquare size={20} />
          <span className="mt-1">Tugas</span>
        </NavLink>

        {/* Elevated Plus Button */}
        <div className="relative -top-4 flex justify-center">
          <button
            onClick={onQuickAdd}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            aria-label="Tambah Cepat"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        <NavLink
          to="/projects"
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-14 h-full text-[10px] font-semibold transition-all ${
              isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
          })}
        >
          <Briefcase size={20} />
          <span className="mt-1">Proyek</span>
        </NavLink>

        <button
          onClick={onOpenMobileDrawer}
          className="flex flex-col items-center justify-center w-14 h-full text-[10px] font-semibold opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Menu Lengkap"
        >
          <Menu size={20} />
          <span className="mt-1">Menu</span>
        </button>
      </div>
    </nav>
  );
}
