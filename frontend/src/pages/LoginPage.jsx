import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, AlertCircle, Palette, CheckCircle2, ArrowRight } from 'lucide-react';
import ThemeModal from '../components/layout/ThemeModal';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@trackerkerja.com');
  const [password, setPassword] = useState('Admin@123!');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Check query params for timeout or other reasons
  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background Ambient Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />

      {/* Top Bar Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-sm transition-all hover:scale-105"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-color)', 
            color: 'var(--text-primary)' 
          }}
        >
          <Palette size={15} style={{ color: 'var(--accent-primary)' }} />
          <span className="capitalize">{theme.replace('-', ' ')}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div 
        className="w-full max-w-md p-8 rounded-3xl border shadow-2xl relative z-10 backdrop-blur-xl animate-fadeIn"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Brand Logo & Title */}
        <div className="text-center mb-8">
          <div 
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg mb-4"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            WT
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Work Tracker Pro
          </h1>
          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
            Enterprise Task Management & Timesheet Platform v3.6
          </p>
        </div>

        {/* Reason Alert (Session Timeout, etc.) */}
        {reason === 'timeout' && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Sesi Berakhir:</span> Anda telah keluar secara otomatis karena tidak ada aktivitas selama 1 jam demi keamanan data kerja.
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Alamat Email
            </label>
            <div 
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all focus-within:ring-2"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Kata Sandi
            </label>
            <div 
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all focus-within:ring-2"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <Lock size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Ingat Saya</span>
            </label>

            <span className="opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Default: admin@trackerkerja.com
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Registration Link */}
        <div className="mt-8 pt-5 border-t text-center text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          Belum memiliki akun terdaftar?{' '}
          <Link 
            to="/register" 
            className="font-bold hover:underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            Daftar Akun Baru
          </Link>
        </div>
      </div>

      <ThemeModal 
        isOpen={isThemeModalOpen} 
        onClose={() => setIsThemeModalOpen(false)} 
      />
    </div>
  );
}
