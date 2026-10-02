import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Link as LinkIcon,
  Trophy,
  Award,
  Flame,
  Coins,
  Coffee,
  Quote,
  Smile,
  ExternalLink
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

  // Gamification Profile State
  const [gamificationProfile, setGamificationProfile] = useState(null);
  const [gamificationLoading, setGamificationLoading] = useState(true);

  // Random Joke State
  const [joke, setJoke] = useState(null);
  const [jokeLoading, setJokeLoading] = useState(false);
  const [revealPunchline, setRevealPunchline] = useState(true);

  const FALLBACK_JOKES = [
    { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!", type: "programming" },
    { setup: "How many programmers does it take to change a light bulb?", punchline: "None, it's a hardware problem.", type: "programming" },
    { setup: "There are 10 types of people in the world:", punchline: "Those who understand binary, and those who don't.", type: "programming" },
    { setup: "Why was the JavaScript developer sad?", punchline: "Because they didn't Node how to Express themselves.", type: "programming" },
    { setup: "Why do Java developers wear glasses?", punchline: "Because they don't C#!", type: "programming" },
    { setup: "What is a programmer's favorite hangout place?", punchline: "Foo Bar.", type: "programming" }
  ];

  const fetchRandomJoke = async () => {
    setJokeLoading(true);
    try {
      const res = await fetch('https://official-joke-api.appspot.com/random_joke');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setJoke({ setup: data.setup, punchline: data.punchline, type: data.type });
    } catch (err) {
      const fallback = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
      setJoke(fallback);
    } finally {
      setJokeLoading(false);
    }
  };

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

    const fetchGamification = async () => {
      try {
        const res = await axiosClient.get('/api/gamification/profile');
        if (res.data?.data) {
          setGamificationProfile(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load gamification profile', err);
      } finally {
        setGamificationLoading(false);
      }
    };

    fetchGamification();
    fetchRandomJoke();
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
    <div className="space-y-6 pb-16 animate-fade-in w-full">
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

      {/* ── Gamification Points & Achievement Banner ── */}
      <div 
        className="rounded-3xl border p-6 shadow-sm relative overflow-hidden transition-all"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
              <Trophy className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Poin Prestasi & Gamifikasi
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Level Progress
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kumpulkan poin dari penyelesaian tugas, catatan kerja, dan absensi aktif harian
              </p>
            </div>
          </div>

          <Link
            to="/gamification"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:opacity-90 self-start md:self-auto"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <span>Buka Pusat Hadiah & Badge</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Available Points */}
          <div 
            className="p-4 rounded-2xl border transition-all hover:translate-y-[-2px] hover:shadow-md"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Poin Tersedia</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-500">
              {gamificationLoading ? '...' : (gamificationProfile?.availablePoints ?? 0).toLocaleString('id-ID')}
              <span className="text-xs font-semibold text-slate-400 ml-1">Pts</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              ≈ Rp {(((gamificationProfile?.availablePoints ?? 0) * 100)).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Card 2: Total Accumulated Points */}
          <div 
            className="p-4 rounded-2xl border transition-all hover:translate-y-[-2px] hover:shadow-md"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Poin</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {gamificationLoading ? '...' : (gamificationProfile?.totalPointsEarned ?? 0).toLocaleString('id-ID')}
              <span className="text-xs font-semibold text-slate-400 ml-1">Pts</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Akumulasi seumur hidup
            </p>
          </div>

          {/* Card 3: Daily Streak */}
          <div 
            className="p-4 rounded-2xl border transition-all hover:translate-y-[-2px] hover:shadow-md"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Daily Streak</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-500 flex items-center gap-1.5">
              <span>{gamificationLoading ? '...' : (gamificationProfile?.currentStreak ?? 0)}</span>
              <span className="text-xs font-semibold text-slate-400">Hari</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Rekor: {gamificationProfile?.longestStreak ?? 0} Hari
            </p>
          </div>

          {/* Card 4: Badges Unlocked */}
          <div 
            className="p-4 rounded-2xl border transition-all hover:translate-y-[-2px] hover:shadow-md"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Badge Terbuka</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500 flex items-center gap-1.5">
              <span>{gamificationLoading ? '...' : (gamificationProfile?.badges?.length ?? 0)}</span>
              <span className="text-xs font-semibold text-slate-400">/ 42 Badge</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              {gamificationProfile?.hasCheckedInToday ? '✓ Sudah check-in hari ini' : 'Belum check-in hari ini'}
            </p>
          </div>
        </div>
      </div>

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

        {/* Column 2: Security & Coffee Break / Humor Widget */}
        <div className="space-y-6">
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

          {/* Coffee Break & Developer Humor Card */}
          <div 
            className="rounded-3xl border p-6 shadow-sm space-y-4 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b pb-3 relative z-10" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    Coffee Break & Humor Harian
                  </h2>
                  <p className="text-[11px] text-slate-400">Penyegar pikiran di sela waktu kerja</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setRevealPunchline(false);
                  fetchRandomJoke();
                }}
                disabled={jokeLoading}
                title="Ambil lelucon acak baru"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-slate-500/10 disabled:opacity-50"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${jokeLoading ? 'animate-spin' : ''}`} />
                <span>Jokes Baru</span>
              </button>
            </div>

            {/* Joke Box */}
            <div 
              className="p-5 rounded-2xl border relative transition-all"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            >
              <Quote className="w-8 h-8 text-amber-500/20 absolute top-3 right-3 pointer-events-none" />
              
              {jokeLoading ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs font-medium">Sedang meracik lelucon segar...</span>
                </div>
              ) : joke ? (
                <div className="space-y-3 relative z-10">
                  {joke.type && (
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      {joke.type}
                    </span>
                  )}
                  
                  {/* Setup */}
                  <p className="text-sm sm:text-base font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    "{joke.setup}"
                  </p>

                  {/* Punchline */}
                  {revealPunchline ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 animate-fade-in flex items-start gap-2.5">
                      <span className="text-lg">😄</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-500 mb-0.5">Punchline:</p>
                        <p className="text-sm font-bold text-amber-400 leading-snug">
                          {joke.punchline}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRevealPunchline(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Smile className="w-4 h-4" />
                      <span>Klik untuk melihat punchline 😂</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  Gagal memuat lelucon. Silakan klik tombol 'Jokes Baru'.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <span>Sumber:</span>
                <a 
                  href="https://official-joke-api.appspot.com/random_joke" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  official-joke-api <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </span>
              <span className="text-[10px] text-slate-400 italic">Have a great productive day! ✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
