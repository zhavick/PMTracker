import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Rocket,
  Mail,
  Lock,
  Key,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ResetPasswordPage() {
  const { theme, setTheme, themesList } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || '';
  const initialToken = queryParams.get('token') || '';

  const [step, setStep] = useState(initialToken ? 'reset' : 'request'); // 'request' | 'reset'
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [claimUrl, setClaimUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Theme detection
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

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setStep('reset');
    }
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [location.search]);

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setClaimUrl('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/api/auth/forgot-password', {
        email: email.trim()
      });

      if (res.data?.data?.claimUrl) {
        setClaimUrl(res.data.data.claimUrl);
        setToken(res.data.data.resetToken);
        setSuccessMsg('Tautan klaim reset kata sandi (User Claim Link) berhasil dibuat!');
      } else {
        setSuccessMsg(res.data?.message || 'Permintaan reset kata sandi berhasil diajukan.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan reset kata sandi. Pastikan email terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!token.trim()) {
      setError('Token reset tidak ditemukan. Silakan minta tautan baru.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post('/api/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        newPassword,
        confirmNewPassword: confirmPassword
      });

      setSuccessMsg(res.data?.message || 'Kata sandi berhasil diatur ulang! Mengalihkan ke login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mereset kata sandi. Token mungkin telah kadaluarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClaimUrl = () => {
    const fullUrl = `${window.location.origin}${claimUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative select-none"
      style={{
        backgroundColor: isDark ? '#020617' : '#F8FAFC',
        color: isDark ? '#F8FAFC' : '#0F172A'
      }}
    >
      {/* Background Ambience */}
      <div className="ambient-sphere w-[500px] h-[500px] bg-indigo-500/20 -top-24 -left-24 fixed pointer-events-none" />
      <div className="ambient-sphere w-[450px] h-[450px] bg-purple-500/20 -bottom-24 -right-10 fixed pointer-events-none" />

      {/* Top Navbar */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-5xl mx-auto z-10">
        <Link to="/login" className="flex items-center gap-2.5 text-sm font-bold text-indigo-500 hover:text-indigo-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Login</span>
        </Link>

        <button
          onClick={toggleThemeMode}
          className="p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer"
          style={{
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E2E8F0',
            color: isDark ? '#F8FAFC' : '#0F172A'
          }}
          title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </header>

      {/* Main Card */}
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl p-8 relative z-10 space-y-6 mt-12 animate-fade-in"
        style={{
          backgroundColor: isDark ? '#0B132B' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0'
        }}
      >
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto shadow-sm">
            <Key className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {step === 'reset' ? 'Atur Ulang Kata Sandi' : 'Lupa Kata Sandi Akun'}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {step === 'reset' 
              ? 'Masukkan kata sandi baru untuk akun Anda guna mengamankan kembali akses.'
              : 'Dapatkan tautan klaim reset kata sandi (User Claim Link) mandiri tanpa ketergantungan email server.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Request Link */}
        {step === 'request' && (
          <form onSubmit={handleRequestLink} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                Email Akun Terdaftar *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-4 py-3 pl-11 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary, #6366F1)' }}
            >
              <span>{loading ? 'Membuat Tautan...' : 'Buat Tautan Klaim Reset'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Generated Claim URL Box */}
            {claimUrl && (
              <div 
                className="p-4 rounded-2xl border space-y-3 mt-4"
                style={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: 'var(--accent-primary, #6366F1)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> User Claim Link Siap
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyClaimUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 text-xs font-mono break-all text-slate-300 select-all border border-slate-700/50">
                  {window.location.origin}{claimUrl}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('reset')}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Lanjutkan Reset Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Step 2: Set New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                Email Akun
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-4 py-3 pl-11 rounded-2xl border text-sm font-medium transition-all focus:outline-none"
                  style={{
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                Kata Sandi Baru * (Min. 6 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl text-slate-400 hover:text-indigo-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                Konfirmasi Kata Sandi Baru *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru..."
                  className="w-full px-4 py-3 pl-11 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary, #6366F1)' }}
            >
              <span>{loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-xs text-slate-400 hover:text-indigo-400 py-1 transition-colors text-center"
            >
              &larr; Minta tautan token baru
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t text-center text-xs" style={{ borderColor: isDark ? '#1E293B' : '#E2E8F0' }}>
          <p style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
            Sudah ingat kata sandi Anda?{' '}
            <Link to="/login" className="text-indigo-500 font-bold hover:underline ml-1">
              Masuk Sekarang &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
