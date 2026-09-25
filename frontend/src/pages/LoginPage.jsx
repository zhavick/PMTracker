import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Rocket,
  Mail,
  Lock,
  Key,
  AtSign,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  Palette,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import ThemeModal from '../components/layout/ThemeModal';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, setTheme, themesList } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Check query params for timeout or returnUrl
  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason');

  // Determine dark or light mode based on theme context
  const currentThemeObj = themesList?.find(t => t.id === theme);
  const isDark = currentThemeObj ? currentThemeObj.mode === 'dark' : (
    theme.includes('dark') || theme.includes('midnight') || theme.includes('oled') || theme.includes('void') || theme.includes('carbon')
  );

  const toggleThemeMode = () => {
    if (isDark) {
      setTheme('indigo-nebula');
    } else {
      setTheme('midnight-oled');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      const returnUrl = queryParams.get('ReturnUrl') || '/dashboard';
      navigate(returnUrl);
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden select-none">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL: FULL-SCREEN SHOWCASE WITH LARGE LOTTIE ANIMATION & BRAND   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="lg:w-7/12 xl:w-3/5 relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden border-b lg:border-b-0 lg:border-r transition-all duration-300"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #020617 0%, #0F172A 40%, #1E1B4B 100%)'
            : 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #4F46E5 100%)',
          borderColor: isDark ? '#1E293B' : '#E0E7FF',
          color: '#FFFFFF'
        }}
      >
        {/* Background Ambient Glows */}
        <div className="ambient-sphere w-[500px] h-[500px] bg-indigo-500/30 -top-24 -left-24" />
        <div className="ambient-sphere w-[450px] h-[450px] bg-purple-500/25 -bottom-24 right-10" style={{ animationDelay: '-3s' }} />
        <div className="ambient-sphere w-[350px] h-[350px] bg-cyan-500/20 top-1/2 left-1/3 -translate-y-1/2" style={{ animationDelay: '-5s' }} />

        {/* Top Header & Brand */}
        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg ring-1 ring-white/30 text-white">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Work Tracker Pro</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">Enterprise Project & Team Productivity</p>
            </div>
          </div>
        </header>

        {/* Center Showcase: Large Lottie Animation & Headline */}
        <div className="relative z-10 my-auto py-8 lg:py-12 flex flex-col items-center text-center max-w-2xl mx-auto">

          {/* Large Lottie Animation Container */}
          <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] h-[260px] sm:h-[320px] lg:h-[380px] flex items-center justify-center relative">
            <dotlottie-player
              id="admin-lottie"
              src="/assets/lottie/knee-deep-in-admin.lottie"
              background="transparent"
              speed="1"
              style={{ width: '100%', height: '100%' }}
              loop
              autoplay
            />
          </div>

          {/* Showcase Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mt-2">
            Manajemen Pekerjaan Lebih <span className="underline decoration-wavy decoration-cyan-300">Cepat & Terstruktur</span>
          </h2>
          <p className="text-white/85 text-xs sm:text-sm lg:text-base mt-3 max-w-xl font-normal leading-relaxed">
            Pantau progres tugas SDLC, log jam kerja timesheet, absensi harian terintegrasi, dan analitik performa tim dalam satu dashboard modern.
          </p>

          {/* Feature Highlight Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all bg-black/20 dark:bg-slate-900/60 border-white/20 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Kanban & Waterfall SDLC</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all bg-black/20 dark:bg-slate-900/60 border-white/20 text-white">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Timesheet Otomatis</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all bg-black/20 dark:bg-slate-900/60 border-white/20 text-white">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Presensi & Cuti</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all bg-black/20 dark:bg-slate-900/60 border-white/20 text-white">
              <span className="w-2 h-2 rounded-full bg-pink-400"></span>
              <span>Gamifikasi & Tiket</span>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <footer className="relative z-10 flex items-center justify-between text-xs text-white/70 pt-4 border-t border-white/15">
          <span>&copy; 2026 Work Tracker Pro. Hak Cipta Dilindungi.</span>
          <span className="hidden sm:inline flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline" />
            <span>Secure AES-256 Authentication</span>
          </span>
        </footer>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL: CLEAN MODERN LOGIN FORM WITH DARK/LIGHT TOGGLE           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="lg:w-5/12 xl:w-2/5 min-h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative transition-all duration-300"
        style={{
          backgroundColor: isDark ? '#090D16' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1E293B'
        }}
      >
        {/* Top Action Bar (Dark/Light Switcher & Palette) */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Akses Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Dark / Light Mode Switch Button */}
            <button
              type="button"
              onClick={toggleThemeMode}
              aria-label="Ubah Tema Gelap atau Terang"
              title="Klik untuk beralih antara mode gelap dan terang"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs hover:opacity-90"
              style={{
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#CBD5E1',
                color: isDark ? '#FCD34D' : '#475569'
              }}
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Mode Gelap</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mode Terang</span>
                </>
              )}
            </button>

            {/* Custom Theme Palette Button */}
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="p-1.5 rounded-xl border transition-all text-slate-400 hover:text-indigo-500"
              style={{
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#CBD5E1'
              }}
              title="Pilih Tema Warna (40 Pilihan)"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Form Card */}
        <div className="w-full max-w-md my-auto">

          {/* Login Card Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
              <span>Selamat Datang</span>
              <span className="text-indigo-500">👋</span>
            </h1>
            <p className="text-sm mt-2" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Masukkan email dan kata sandi untuk masuk ke akun Anda.
            </p>
          </div>

          {/* Reason Alert (Session Timeout, etc.) */}
          {reason === 'timeout' && (
            <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Sesi Berakhir:</span> Anda telah keluar secara otomatis karena tidak ada aktivitas selama 1 jam demi keamanan akun.
              </div>
            </div>
          )}

          {/* Validation Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Input Field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: isDark ? '#CBD5E1' : '#334155' }}
              >
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>Alamat Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email-input"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3.5 pl-11 rounded-2xl border text-sm font-medium transition-all focus:outline-none"
                  style={{
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                <AtSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: isDark ? '#CBD5E1' : '#334155' }}
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Kata Sandi</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password-input"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full px-4 py-3.5 pl-11 pr-11 rounded-2xl border text-sm font-medium transition-all focus:outline-none"
                  style={{
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl text-slate-400 hover:text-indigo-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium transition-colors" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  Ingat sesi saya di perangkat ini
                </span>
              </label>

              {/* <span className="text-[11px] opacity-75 font-mono" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                Default: admin@trackerkerja.com
              </span> */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full text-white font-black py-4 px-6 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Navigation Links */}
          <div
            className="mt-8 pt-6 border-t text-center space-y-3"
            style={{ borderColor: isDark ? '#1E293B' : '#E2E8F0' }}
          >
            <p className="text-xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Belum memiliki akun terdaftar?
              <Link to="/register" className="text-indigo-500 font-bold hover:text-indigo-600 transition-colors ml-1">
                Daftar Akun Baru &rarr;
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel Bottom Spacer */}
        <div className="text-[11px] text-center pt-4" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
          <span>Work Tracker Pro Enterprise Edition</span>
        </div>
      </section>

      {/* Theme Selection Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}
