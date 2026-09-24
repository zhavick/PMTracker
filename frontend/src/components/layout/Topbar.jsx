import React, { useState } from 'react';
import { 
  Menu, Search, Palette, User, LogOut, Clock, 
  Building2, Sparkles, ChevronDown, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onOpenMobileDrawer, onOpenThemeModal, onOpenTour }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  return (
    <header 
      className="h-16 border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 transition-colors"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Left: Mobile hamburger & Brand/Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileDrawer}
          className="lg:hidden p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          {/* Company Badge */}
          {user?.companyName && (
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-color)',
                color: 'var(--accent-primary)' 
              }}
            >
              <Building2 size={13} />
              <span className="max-w-[150px] truncate">{user.companyName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div 
          className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-sm transition-all focus-within:ring-2"
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)'
          }}
        >
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Cari tugas, proyek, dokumen... (Ctrl + K)"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm placeholder:opacity-60"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Right: Actions, Theme Switcher & Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Help / Tour Button */}
        <button
          onClick={onOpenTour}
          className="p-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm hidden sm:flex items-center gap-1.5"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          title="Mulai Tur Aplikasi"
        >
          <HelpCircle size={16} className="text-indigo-500" />
          <span className="hidden md:inline">Tur Layar</span>
        </button>

        {/* Theme & Font Button */}
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          title="Ganti Tema & Font"
        >
          <Palette size={16} style={{ color: 'var(--accent-primary)' }} />
          <span className="hidden sm:inline capitalize">{theme.replace('-', ' ')}</span>
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {user?.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt={user.fullName} 
                className="w-8 h-8 rounded-full object-cover border"
                style={{ borderColor: 'var(--border-color)' }}
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: user?.avatarColor || 'var(--accent-primary)' }}
              >
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                {user?.fullName || 'Pengguna'}
              </div>
              <div className="opacity-70 truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>
                {user?.jobTitle || user?.role || 'Karyawan'}
              </div>
            </div>
            <ChevronDown size={14} className="hidden sm:block opacity-60" style={{ color: 'var(--text-secondary)' }} />
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-fadeIn"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              onMouseLeave={() => setIsProfileDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.fullName}
                </p>
                <p className="text-[11px] truncate opacity-70" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate('/profile'); setIsProfileDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <User size={15} />
                  <span>Profil & Kustomisasi Cover</span>
                </button>

                <button
                  onClick={() => { onOpenTour(); setIsProfileDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <HelpCircle size={15} className="text-indigo-500" />
                  <span>Mulai Tur Aplikasi</span>
                </button>

                <button
                  onClick={() => { onOpenThemeModal(); setIsProfileDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span>Pilihan 40 Tema & 5 Fonts</span>
                </button>
              </div>

              <div className="border-t pt-1" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => logout('manual')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 text-left transition-colors"
                >
                  <LogOut size={15} />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
