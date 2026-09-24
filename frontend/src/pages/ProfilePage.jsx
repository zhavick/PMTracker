import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Shield, 
  Camera, 
  Lock, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: '',
    jobTitle: '',
    avatarColor: '#6366F1',
    email: '',
    companyName: '',
    role: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  // Cover Upload State
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        jobTitle: user.jobTitle || '',
        avatarColor: user.avatarColor || '#6366F1',
        email: user.email || '',
        companyName: user.companyName || 'PT Elistec Teknologi',
        role: user.role || 'User'
      });
      setCoverUrl(user.coverPictureUrl || null);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await axiosClient.put('/api/auth/profile', {
        fullName: profileData.fullName,
        jobTitle: profileData.jobTitle,
        avatarColor: profileData.avatarColor
      });
      setProfileMsg({ type: 'success', text: 'Data profil Anda berhasil disimpan.' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memperbarui profil.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setPassMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      await axiosClient.post('/api/auth/change-password', passwords);
      setPassMsg({ type: 'success', text: 'Kata sandi Anda berhasil diperbarui.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah kata sandi. Pastikan kata sandi saat ini benar.' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosClient.post('/api/members/profile/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data?.coverPictureUrl) {
        setCoverUrl(res.data.data.coverPictureUrl);
      }
      if (refreshUser) await refreshUser();
    } catch (err) {
      alert('Gagal mengunggah foto sampul.');
    } finally {
      setCoverLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Cover Banner Card */}
      <div 
        className="relative rounded-3xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Banner Image or Gradient */}
        <div 
          className="h-44 sm:h-56 w-full relative transition-all bg-cover bg-center"
          style={{
            backgroundImage: coverUrl 
              ? `url(${coverUrl})` 
              : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)'
          }}
        >
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Change Banner Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={coverLoading}
            className="absolute top-4 right-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all border border-white/20 shadow-md"
          >
            <Camera className="w-3.5 h-3.5" />
            {coverLoading ? 'Mengunggah...' : 'Ubah Foto Sampul'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar */}
            <div 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-bold text-2xl sm:text-3xl text-white shadow-xl ring-4 ring-white dark:ring-slate-900 overflow-hidden flex-shrink-0"
              style={{ backgroundColor: profileData.avatarColor || '#6366F1' }}
            >
              {getInitials(profileData.fullName)}
            </div>

            <div className="space-y-1 mb-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {profileData.fullName || 'Pengguna'}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-500">
                  <Shield className="w-3 h-3" />
                  {profileData.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {profileData.jobTitle || 'Anggota Tim'} • {profileData.companyName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Form */}
        <div 
          className="rounded-2xl border p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User className="w-4 h-4 text-indigo-500" />
            Informasi Profil & Identitas
          </h2>

          {profileMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
              profileMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Jabatan / Job Title *
              </label>
              <input
                type="text"
                required
                value={profileData.jobTitle}
                onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Alamat Email (Akun Utama)
              </label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm opacity-60 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Palette className="w-3.5 h-3.5" /> Warna Aksen Avatar
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profileData.avatarColor || '#6366F1'}
                  onChange={(e) => setProfileData({ ...profileData, avatarColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={profileData.avatarColor || '#6366F1'}
                  onChange={(e) => setProfileData({ ...profileData, avatarColor: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-mono"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Save className="w-4 h-4" />
                {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div 
          className="rounded-2xl border p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Lock className="w-4 h-4 text-indigo-500" />
            Keamanan & Ganti Kata Sandi
          </h2>

          {passMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
              passMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Kata Sandi Saat Ini *
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Kata Sandi Baru * (Min 6 Karakter)
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Ulangi Kata Sandi Baru *
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={passwords.confirmNewPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Save className="w-4 h-4" />
                {passLoading ? 'Mengubah...' : 'Perbarui Kata Sandi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
