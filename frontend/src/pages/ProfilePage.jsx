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
  EyeOff,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trash2,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const PRESET_COVERS = [
  { name: 'Aurora Indigo', value: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)' },
  { name: 'Cyberpunk Neon', value: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4C1D95 100%)' },
  { name: 'Emerald Forest', value: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #10B981 100%)' },
  { name: 'Sunset Crimson', value: 'linear-gradient(135deg, #991B1B 0%, #D97706 50%, #F59E0B 100%)' },
  { name: 'Deep Ocean Blue', value: 'linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #38BDF8 100%)' },
  { name: 'Dark Slate Minimal', value: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #3F3F46 100%)' }
];

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const coverFileInputRef = useRef(null);
  const avatarFileInputRef = useRef(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: '',
    jobTitle: '',
    avatarColor: '#6366F1',
    email: '',
    companyName: '',
    role: '',
    profilePictureUrl: '',
    coverPictureUrl: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Upload States
  const [coverLoading, setCoverLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Password Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        jobTitle: user.jobTitle || '',
        avatarColor: user.avatarColor || '#6366F1',
        email: user.email || '',
        companyName: user.companyName || 'PT Elistec Teknologi',
        role: user.role || 'User',
        profilePictureUrl: user.profilePictureUrl || user.avatarUrl || '',
        coverPictureUrl: user.coverPictureUrl || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await axiosClient.put('/api/auth/profile', {
        fullName: profileData.fullName.trim(),
        jobTitle: profileData.jobTitle.trim(),
        avatarColor: profileData.avatarColor,
        profilePictureUrl: profileData.profilePictureUrl?.trim() || null,
        coverPictureUrl: profileData.coverPictureUrl?.trim() || null
      });
      setProfileMsg({ type: 'success', text: 'Data profil Anda berhasil disimpan.' });
      if (refreshProfile) await refreshProfile();
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

  // Upload Cover File
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
      const newCoverUrl = res.data?.data?.coverPictureUrl;
      if (newCoverUrl) {
        setProfileData(prev => ({ ...prev, coverPictureUrl: newCoverUrl }));
      }
      if (refreshProfile) await refreshProfile();
      setProfileMsg({ type: 'success', text: 'Foto sampul berhasil diunggah.' });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengunggah foto sampul.');
    } finally {
      setCoverLoading(false);
    }
  };

  // Upload Avatar File
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosClient.post('/api/members/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newAvatarUrl = res.data?.data?.profilePictureUrl;
      if (newAvatarUrl) {
        setProfileData(prev => ({ ...prev, profilePictureUrl: newAvatarUrl }));
      }
      if (refreshProfile) await refreshProfile();
      setProfileMsg({ type: 'success', text: 'Foto profil berhasil diunggah.' });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const isCoverGradient = profileData.coverPictureUrl?.startsWith('linear-gradient');

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-5xl mx-auto">
      {/* ── Cover Banner Card ── */}
      <div 
        className="relative rounded-3xl border overflow-hidden shadow-md"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Banner Image or Gradient */}
        <div 
          className="h-48 sm:h-64 w-full relative transition-all bg-cover bg-center"
          style={{
            background: profileData.coverPictureUrl
              ? (isCoverGradient ? profileData.coverPictureUrl : `url(${profileData.coverPictureUrl}) center / cover no-repeat`)
              : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)'
          }}
        >
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-black/25" />

          {/* Controls on Cover (Top Right) */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {profileData.coverPictureUrl && (
              <button
                type="button"
                onClick={() => setProfileData(p => ({ ...p, coverPictureUrl: '' }))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600/70 hover:bg-rose-600 backdrop-blur-md transition-all shadow-md"
                title="Hapus foto sampul"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Sampul
              </button>
            )}

            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={coverLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-black/45 backdrop-blur-md hover:bg-black/65 transition-all border border-white/20 shadow-md"
            >
              {coverLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {coverLoading ? 'Mengunggah...' : 'Upload Foto Sampul'}
            </button>
            <input
              type="file"
              ref={coverFileInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar Container with Upload Overlay */}
            <div className="relative group">
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-bold text-2xl sm:text-3xl text-white shadow-xl ring-4 ring-white dark:ring-slate-900 overflow-hidden flex-shrink-0 relative"
                style={{ backgroundColor: profileData.avatarColor || '#6366F1' }}
              >
                {profileData.profilePictureUrl ? (
                  <img 
                    src={profileData.profilePictureUrl} 
                    alt={profileData.fullName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  getInitials(profileData.fullName)
                )}

                {/* Hover overlay button to change avatar */}
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{avatarLoading ? 'Upload...' : 'Ganti Foto'}</span>
                </button>
              </div>

              <input
                type="file"
                ref={avatarFileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-1 mb-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {profileData.fullName || 'Pengguna'}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-500 border border-indigo-500/20">
                  <Shield className="w-3 h-3" />
                  {profileData.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {profileData.jobTitle || 'Anggota Tim'} • {profileData.companyName}
              </p>
            </div>
          </div>

          {/* Quick Buttons for Avatar actions */}
          <div className="flex items-center gap-2 self-center sm:self-end">
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-500/10 transition-all"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              Upload Avatar
            </button>
            {profileData.profilePictureUrl && (
              <button
                type="button"
                onClick={() => setProfileData(p => ({ ...p, profilePictureUrl: '' }))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border-rose-500/30 transition-all"
                title="Gunakan inisial"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Form Notification Messages ── */}
      {profileMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border text-sm font-medium animate-fade-in ${
          profileMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
        }`}>
          {profileMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{profileMsg.text}</span>
        </div>
      )}

      {/* ── Forms Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile & Customization Form */}
        <div 
          className="rounded-3xl border p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <User className="w-4 h-4 text-indigo-500" />
              Kostumisasi Foto & Identitas Profil
            </h2>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
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
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
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

            {/* Custom Avatar URL Field */}
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" /> URL Foto Profil (Avatar)
              </label>
              <input
                type="url"
                value={profileData.profilePictureUrl || ''}
                onChange={(e) => setProfileData({ ...profileData, profilePictureUrl: e.target.value })}
                placeholder="https://images.unsplash.com/... atau /uploads/avatars/..."
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Anda dapat mengunggah file foto melalui tombol kamera di atas atau menempelkan tautan gambar online di sini.
              </p>
            </div>

            {/* Custom Cover Picture URL Field */}
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> URL Foto Sampul (Cover Picture)
              </label>
              <input
                type="text"
                value={profileData.coverPictureUrl || ''}
                onChange={(e) => setProfileData({ ...profileData, coverPictureUrl: e.target.value })}
                placeholder="https://images.unsplash.com/... atau pilih preset di bawah"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Preset Cover Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                Pilih Preset Sampul Modern
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_COVERS.map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => setProfileData(prev => ({ ...prev, coverPictureUrl: preset.value }))}
                    className={`h-12 rounded-xl border cursor-pointer transition-all flex items-center justify-center p-2 text-center text-[10px] font-bold text-white shadow-sm ${
                      profileData.coverPictureUrl === preset.value ? 'ring-2 ring-white scale-105' : 'hover:opacity-90'
                    }`}
                    style={{ background: preset.value, borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {preset.name}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 flex items-center gap-1.5 text-slate-400">
                <Palette className="w-3.5 h-3.5 text-indigo-400" /> Warna Aksen Avatar (Fallback Inisial)
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Save className="w-4 h-4" />
                {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password & Security Form */}
        <div 
          className="rounded-3xl border p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Lock className="w-4 h-4 text-indigo-500" />
              Keamanan & Ganti Kata Sandi
            </h2>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>

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
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                Kata Sandi Saat Ini *
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="Masukkan kata sandi lama Anda"
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
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                Kata Sandi Baru *
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                Konfirmasi Kata Sandi Baru *
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={passwords.confirmNewPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
                placeholder="Ulangi kata sandi baru"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Lock className="w-4 h-4" />
                {passLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
