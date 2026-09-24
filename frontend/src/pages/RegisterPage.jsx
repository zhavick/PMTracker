import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, Building, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    jobTitle: '',
    password: '',
    confirmPassword: '',
    companyOption: 'existing', // 'existing' or 'new'
    newCompanyName: '',
    newCompanyCode: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      setSuccess(res.message || 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (approval) dari Administrator.');
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Pendaftaran gagal. Periksa kembali formulir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors py-12"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div 
        className="w-full max-w-lg p-8 rounded-3xl border shadow-2xl relative z-10 backdrop-blur-xl animate-fadeIn"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <Link 
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 hover:underline"
          style={{ color: 'var(--accent-primary)' }}
        >
          <ArrowLeft size={14} /> Kembali ke Halaman Masuk
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Daftar Akun Baru
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Bergabung dengan ruang kerja tim Anda di Work Tracker Pro
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Pendaftaran Berhasil!</p>
              <p className="mt-0.5">{success}</p>
              <p className="mt-1 opacity-70">Mengalihkan ke halaman login...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Nama Lengkap
              </label>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <User size={15} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Misal: John Doe"
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Jabatan / Posisi
              </label>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <Briefcase size={15} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  required
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Misal: Backend Developer"
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Alamat Email Kerja
            </label>
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <Mail size={15} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@perusahaan.com"
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Company Option */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Organisasi / Perusahaan
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, companyOption: 'existing' })}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  formData.companyOption === 'existing' ? 'bg-indigo-600 text-white border-indigo-600' : 'opacity-70'
                }`}
                style={{
                  backgroundColor: formData.companyOption === 'existing' ? 'var(--accent-primary)' : 'transparent',
                  borderColor: formData.companyOption === 'existing' ? 'var(--accent-primary)' : 'var(--border-color)'
                }}
              >
                Gabung Default (PT Elistec)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, companyOption: 'new' })}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  formData.companyOption === 'new' ? 'bg-indigo-600 text-white border-indigo-600' : 'opacity-70'
                }`}
                style={{
                  backgroundColor: formData.companyOption === 'new' ? 'var(--accent-primary)' : 'transparent',
                  borderColor: formData.companyOption === 'new' ? 'var(--accent-primary)' : 'var(--border-color)'
                }}
              >
                Buat Perusahaan Baru
              </button>
            </div>

            {formData.companyOption === 'new' && (
              <div className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <input
                  type="text"
                  required
                  name="newCompanyName"
                  value={formData.newCompanyName}
                  onChange={handleChange}
                  placeholder="Nama Perusahaan Baru"
                  className="w-full p-2 rounded-lg border bg-white dark:bg-zinc-800 text-xs outline-none"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <input
                  type="text"
                  name="newCompanyCode"
                  value={formData.newCompanyCode}
                  onChange={handleChange}
                  placeholder="Kode Perusahaan (opsional, misal: ELISTEC)"
                  className="w-full p-2 rounded-lg border bg-white dark:bg-zinc-800 text-xs outline-none"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Kata Sandi
              </label>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <Lock size={15} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 karakter"
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Konfirmasi Sandi
              </label>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <Lock size={15} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  required
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi kata sandi"
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400">
            🛡️ <b>Alur Persetujuan Admin:</b> Akun baru secara bawaan membutuhkan persetujuan (*Admin Approval*) sebelum dapat digunakan untuk masuk ke sistem.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:opacity-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
