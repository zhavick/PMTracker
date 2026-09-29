import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy, Star, Zap, Award, Crown, Flame, Target, Clock,
  TrendingUp, Users, Medal, Shield, BookOpen, Coffee, Moon,
  RefreshCw, Plus, Edit2, Trash2, Rocket,
  X, Save, AlertCircle, CheckCircle, Sparkles, BarChart2,
  Gift, Wallet, DollarSign, CheckCircle2, AlertTriangle,
  ArrowRight, CreditCard, Utensils, Tag, ShieldCheck,
  Smartphone, ShoppingBag, Package, Shirt, Calendar, CalendarCheck,
  Coins, Sun, Sunrise, Gem, Building, Building2, Compass
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import gamificationApi from '../api/gamification';

const POINT_TO_RUPIAH = 100; // 1 Poin = Rp 100

const RARITY_META = {
  1: { label: 'Perunggu (Common)',    bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.35)', text: '#94A3B8', glow: 'none' },
  2: { label: 'Perak (Rare)',         bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#60A5FA', glow: '0 0 20px rgba(59,130,246,0.25)' },
  3: { label: 'Emas (Epic)',          bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  text: '#FBBF24', glow: '0 0 22px rgba(245,158,11,0.3)' },
  4: { label: 'Platinum (Legendary)', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.35)',  text: '#C084FC', glow: '0 0 25px rgba(168,85,247,0.35)' },
  5: { label: 'Berlian (Special)',    bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.4)',   text: '#F472B6', glow: '0 0 30px rgba(236,72,153,0.4)' },
};

const BADGE_ICON_MAP = { 
  Award, Trophy, Star, Zap, Flame, Target, Clock, Shield, BookOpen, 
  Coffee, Moon, Medal, Crown, TrendingUp, Users, Rocket, Sparkles, 
  ShieldCheck, CalendarCheck, Sun, Sunrise, Coins, Gem, Building, 
  Building2, Compass, CheckCircle2, Gift
};

function BadgeIcon({ name, size = 20, color }) {
  const Icon = BADGE_ICON_MAP[name] || Award;
  return <Icon size={size} color={color} />;
}

export default function GamificationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState('checkin'); // checkin | rewards | badges | leaderboard | claims | admin-claims
  const [profile, setProfile] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [claims, setClaims] = useState([]);
  const [adminClaims, setAdminClaims] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Leaderboard filters
  const [lbYear, setLbYear] = useState(new Date().getFullYear());
  const [lbMonth, setLbMonth] = useState(new Date().getMonth() + 1);

  // Rewards catalog filters
  const [rewardCategory, setRewardCategory] = useState('Semua');
  const [selectedRewardToClaim, setSelectedRewardToClaim] = useState(null);
  const [claimForm, setClaimForm] = useState({
    accountOrContactInfo: '',
    userNotes: ''
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Badges filter
  const [badgeFilterTier, setBadgeFilterTier] = useState('all');
  const [badgeSearch, setBadgeSearch] = useState('');

  // Admin Claim Review Modal
  const [selectedClaimForReview, setSelectedClaimForReview] = useState(null);
  const [adminProcessForm, setAdminProcessForm] = useState({
    status: 2, // Approved
    adminNotes: ''
  });
  const [submittingAdminProcess, setSubmittingAdminProcess] = useState(false);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 6000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(null), 7000); };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await gamificationApi.getProfile();
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load gamification profile:', err);
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await gamificationApi.getRewards();
      if (res.data?.data) {
        setRewards(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await gamificationApi.getLeaderboard({ year: lbYear, month: lbMonth });
      setLeaderboard(res.data?.data?.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  }, [lbYear, lbMonth]);

  const fetchClaims = useCallback(async () => {
    try {
      const res = await gamificationApi.getClaims();
      setClaims(res.data?.data || []);
      if (isAdmin) {
        setAdminClaims(res.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load claims:', err);
    }
  }, [isAdmin]);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await gamificationApi.getBadges();
      setAllBadges(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load master badges:', err);
    }
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchRewards(),
      fetchLeaderboard(),
      fetchClaims(),
      fetchBadges()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [fetchLeaderboard]);

  // Handle Daily Check-In
  const handleCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (profile?.hasCheckedInToday) return;

    setCheckInLoading(true);
    try {
      const res = await gamificationApi.dailyCheckIn(checkInNotes?.trim() || null);
      showSuccess(res.data?.message || 'Daily check-in berhasil dicatat!');
      setCheckInNotes('');
      fetchProfile();
      fetchLeaderboard();
      // Auto check badges
      gamificationApi.checkAndAwardBadges();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal melakukan daily check-in.');
    } finally {
      setCheckInLoading(false);
    }
  };

  // Handle Claiming Item
  const handleOpenClaimModal = (item) => {
    setSelectedRewardToClaim(item);
    setClaimForm({ accountOrContactInfo: '', userNotes: '' });
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedRewardToClaim) return;
    if (!claimForm.accountOrContactInfo.trim()) {
      showError('Harap cantumkan nomor rekening / e-wallet / nomor kontak penerima.');
      return;
    }

    setSubmittingClaim(true);
    try {
      const res = await gamificationApi.claimItem(
        selectedRewardToClaim.id,
        claimForm.accountOrContactInfo.trim(),
        claimForm.userNotes?.trim() || null
      );
      showSuccess(res.data?.message || 'Permohonan klaim hadiah berhasil dikirim!');
      setSelectedRewardToClaim(null);
      fetchProfile();
      fetchRewards();
      fetchClaims();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal mengajukan klaim hadiah.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Handle Admin Process Claim
  const handleProcessClaimSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClaimForReview) return;

    setSubmittingAdminProcess(true);
    try {
      const res = await gamificationApi.processClaim(selectedClaimForReview.id, {
        status: parseInt(adminProcessForm.status, 10),
        adminNotes: adminProcessForm.adminNotes?.trim() || null
      });
      showSuccess(res.data?.message || 'Status klaim berhasil diperbarui.');
      setSelectedClaimForReview(null);
      fetchClaims();
      fetchRewards();
      fetchProfile();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal memproses klaim.');
    } finally {
      setSubmittingAdminProcess(false);
    }
  };

  // Filtering Rewards
  const filteredRewards = useMemo(() => {
    if (rewardCategory === 'Semua') return rewards;
    return rewards.filter(r => r.category.toLowerCase() === rewardCategory.toLowerCase());
  }, [rewards, rewardCategory]);

  // Filtering Badges
  const userUnlockedBadgeIds = useMemo(() => {
    return new Set(profile?.badges?.map(b => b.badgeId) || []);
  }, [profile]);

  const filteredBadges = useMemo(() => {
    let list = allBadges;
    if (badgeFilterTier !== 'all') {
      const tierNum = parseInt(badgeFilterTier, 10);
      list = list.filter(b => b.rarity === tierNum);
    }
    if (badgeSearch.trim()) {
      const q = badgeSearch.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
    }
    return list;
  }, [allBadges, badgeFilterTier, badgeSearch]);

  const rewardCategoriesList = ['Semua', 'Kopi', 'E-Wallet', 'Voucher', 'Merchandise', 'Cuti', 'Traktir'];
  const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  const getClaimStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">Menunggu Admin</span>;
      case 'Approved':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30">Disetujui</span>;
      case 'PaidOrTreated':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Selesai Ditransfer / Ditraktir</span>;
      case 'Rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">Ditolak</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── Gradient Hero Banner ── */}
      <div 
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 45%, #EC4899 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-transparent to-pink-900/30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Gamifikasi & Penghargaan v3.7
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-300 drop-shadow" />
              Pusat Prestasi & Hadiah Karyawan
            </h1>
            <p className="text-sm text-indigo-100 max-w-xl">
              Pertahankan streak absensi, selesaikan tugas tepat waktu, dan buka 42 badge kreatif. 
              Tukarkan poin prestasi Anda dengan saldo e-wallet, voucher kopi, merchandise, atau traktiran!
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-300">
                <Flame className="w-5 h-5" />
                <span className="text-xl sm:text-2xl font-black">{profile?.currentStreak || 0} Hari</span>
              </div>
              <p className="text-[11px] text-indigo-200 font-semibold mt-0.5">Current Streak</p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-300">
                <Coins className="w-5 h-5" />
                <span className="text-xl sm:text-2xl font-black">
                  {profile?.availablePoints || 0} Pts
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 font-semibold mt-0.5">
                ≈ Rp {((profile?.availablePoints || 0) * POINT_TO_RUPIAH).toLocaleString('id-ID')}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('rewards')}
              className="px-5 py-3 rounded-2xl font-black text-xs sm:text-sm text-indigo-950 bg-amber-400 hover:bg-amber-300 shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Tukar Hadiah 🎁
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Main Tab Navigation ── */}
      <div 
        className="flex items-center gap-2 p-1.5 rounded-2xl border overflow-x-auto select-none"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {[
          { id: 'checkin',     label: 'Daily Check-In & Roadmap', icon: CalendarCheck, badge: profile?.hasCheckedInToday ? '✓ Done' : 'Hari Ini' },
          { id: 'rewards',     label: 'Katalog Hadiah',          icon: Gift,          badge: `${rewards.length} Item` },
          { id: 'badges',      label: '42 Koleksi Badge',        icon: Trophy,        badge: `${profile?.badges?.length || 0}/${allBadges.length}` },
          { id: 'leaderboard', label: 'Leaderboard',             icon: Crown },
          { id: 'claims',      label: 'Riwayat Klaim',           icon: Wallet,        badge: claims.length },
          ...(isAdmin ? [
            { id: 'admin-claims', label: 'Verifikasi Klaim Tim (Admin)', icon: ShieldCheck, badge: adminClaims.filter(c => c.status === 'Pending').length }
          ] : [])
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────── TAB 1: DAILY CHECK-IN & 30-DAY ROADMAP ─────── */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          {/* Daily Check-In Action Card */}
          <div 
            className="p-6 sm:p-8 rounded-3xl border shadow-sm relative overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Flame className="w-4 h-4" /> Streak Disiplin Aktif
                </div>
                <h2 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Perjalanan 30 Hari Menuju Golden Milestone 🏆
                </h2>
                <p className="text-xs sm:text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                  Setiap check-in harian memberikan <strong>+10 Poin</strong>. Capai streak 30 hari tanpa putus 
                  untuk mengklaim <strong>Golden Bonus +150 Poin</strong> dan membuka badge eksklusif Sultan Disiplin!
                </p>
              </div>

              {/* Action Button & Status */}
              <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
                {profile?.hasCheckedInToday ? (
                  <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Sudah Check-In Hari Ini (+10 Pts)</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                    <input
                      type="text"
                      placeholder="Catatan hari ini (opsional)..."
                      value={checkInNotes}
                      onChange={(e) => setCheckInNotes(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border text-xs sm:text-sm w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={handleCheckIn}
                      disabled={checkInLoading}
                      className="px-6 py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>{checkInLoading ? 'Menyimpan...' : 'Check-In Sekarang (+10 Pts)'}</span>
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Total Absen 30 Hari Terakhir: <strong>{profile?.checkInDaysCount30Days || 0} hari</strong> • Rekor Terpanjang: <strong>{profile?.longestStreak || 0} hari</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 30-Day Visual Roadmap Grid */}
          <div 
            className="p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Roadmap Streak Absensi (Siklus 30 Hari)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisasi perjalanan hari ke hari menuju kotak hadiah milestone ke-30.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                <Gift className="w-4 h-4" /> Hari ke-30 = Golden Box (+160 Pts Total)
              </span>
            </div>

            {/* 30 Cards Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5 pt-2">
              {profile?.thirtyDayRoadmap?.map((day) => {
                const isMilestone = day.isMilestone;
                const isCheckedIn = day.isCheckedIn;
                const isToday = day.isToday;

                return (
                  <div
                    key={day.dayIndex}
                    className={`rounded-2xl p-3 flex flex-col items-center justify-between text-center relative border transition-all ${
                      isMilestone
                        ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/20 border-amber-500/50 shadow-md col-span-2 sm:col-span-2 md:col-span-1'
                        : isCheckedIn
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : isToday
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-2 ring-indigo-500/30 animate-pulse'
                        : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    {/* Day Number */}
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      H-{day.dayIndex}
                    </span>

                    {/* Center Icon */}
                    <div className="my-2">
                      {isMilestone ? (
                        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-indigo-950 shadow">
                          <Gift className="w-4 h-4" />
                        </div>
                      ) : isCheckedIn ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isToday ? (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Flame className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 text-slate-400 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Points Tag */}
                    <span className={`text-[10px] font-bold ${
                      isMilestone ? 'text-amber-500 font-black' : isCheckedIn ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      +{day.points} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────── TAB 2: REWARDS CATALOG ─────── */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Header & Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Gift className="w-5 h-5 text-indigo-500" />
                Katalog Hadiah & Tukar Poin
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Poin yang tersedia: <strong className="text-amber-500">{profile?.availablePoints || 0} Poin</strong> (≈ Rp {((profile?.availablePoints || 0) * POINT_TO_RUPIAH).toLocaleString('id-ID')})
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto select-none py-1">
              {rewardCategoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setRewardCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    rewardCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredRewards.map((item) => {
              const canAfford = (profile?.availablePoints || 0) >= item.pointCost;
              const hasStock = item.stock > 0;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <div className="p-5 space-y-3">
                    {/* Top Category & Stock */}
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        {item.category}
                      </span>
                      <span className={`text-[11px] font-bold ${hasStock ? 'text-slate-400' : 'text-rose-500'}`}>
                        {hasStock ? `Stok: ${item.stock}` : 'Habis'}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start space-x-3 pt-1">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        <BadgeIcon name={item.icon} size={24} color={item.color} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {item.description || 'Hadiah apresiasi kerja resmi.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Cost & Action */}
                  <div className="p-5 pt-0 border-t mt-2" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="text-base font-black text-amber-500">{item.pointCost} Poin</span>
                        <p className="text-[10px] text-slate-400">
                          ≈ Rp {(item.pointCost * POINT_TO_RUPIAH).toLocaleString('id-ID')}
                        </p>
                      </div>
                      {item.isMonthlyMilestoneReward && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500">
                          Milestone Reward
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenClaimModal(item)}
                      disabled={!canAfford || !hasStock}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      style={{ 
                        backgroundColor: canAfford && hasStock ? 'var(--accent-primary)' : '#6B7280',
                        boxShadow: canAfford && hasStock ? 'var(--accent-glow)' : 'none'
                      }}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{hasStock ? (canAfford ? 'Tukar Poin Ini' : 'Poin Kurang') : 'Stok Habis'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────── TAB 3: 42 BADGES SHOWCASE ─────── */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Trophy className="w-5 h-5 text-amber-500" />
                Koleksi 42 Badge Prestasi (5 Tier Tingkat Kesulitan)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Koleksi Anda: <strong className="text-indigo-500">{userUnlockedBadgeIds.size}</strong> dari {allBadges.length} Badge telah terbuka.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="text"
                placeholder="Cari nama atau deskripsi badge..."
                value={badgeSearch}
                onChange={(e) => setBadgeSearch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />

              <select
                value={badgeFilterTier}
                onChange={(e) => setBadgeFilterTier(e.target.value)}
                className="px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="all">Semua Tier</option>
                <option value="1">Tier 1: Perunggu (Common)</option>
                <option value="2">Tier 2: Perak (Rare)</option>
                <option value="3">Tier 3: Emas (Epic)</option>
                <option value="4">Tier 4: Platinum (Legendary)</option>
                <option value="5">Tier 5: Berlian (Special)</option>
              </select>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredBadges.map((badge) => {
              const isUnlocked = userUnlockedBadgeIds.has(badge.id);
              const meta = RARITY_META[badge.rarity] || RARITY_META[1];

              return (
                <div
                  key={badge.id}
                  className={`rounded-2xl p-4 flex flex-col items-center text-center relative border transition-all ${
                    isUnlocked 
                      ? 'shadow-md hover:scale-105' 
                      : 'opacity-50 grayscale hover:opacity-75'
                  }`}
                  style={{
                    backgroundColor: isUnlocked ? meta.bg : 'var(--card-bg)',
                    borderColor: isUnlocked ? meta.border : 'var(--border-color)',
                    boxShadow: isUnlocked ? meta.glow : 'none'
                  }}
                >
                  {/* Badge Icon Circle */}
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center my-1 shadow-sm"
                    style={{ backgroundColor: `${badge.color}25`, color: badge.color }}
                  >
                    <BadgeIcon name={badge.icon} size={28} color={badge.color} />
                  </div>

                  {/* Title & Tier */}
                  <h4 className="font-bold text-xs mt-2 line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                    {badge.name}
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: meta.text }}>
                    {meta.label.split(' ')[0]}
                  </span>

                  {/* Description */}
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Points Tag */}
                  <div className="mt-3 pt-2 border-t w-full flex items-center justify-center gap-1" style={{ borderColor: 'var(--border-color)' }}>
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-500">+{badge.points} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────── TAB 4: LEADERBOARD ─────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Crown className="w-5 h-5 text-amber-500" />
                Papan Peringkat Kinerja Tim (Leaderboard)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kalkulasi Skor: Tugas Selesai × 10 + Jam Kerja × 3 + Badge × 5 + Kehadiran × 2
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={lbYear} 
                onChange={(e) => setLbYear(parseInt(e.target.value, 10))} 
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select 
                value={lbMonth} 
                onChange={(e) => setLbMonth(parseInt(e.target.value, 10))} 
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {MONTHS_ID.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </select>
              <button 
                onClick={fetchLeaderboard} 
                className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-6 py-6 max-w-xl mx-auto items-end">
              {/* Rank 2 */}
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-slate-300"
                  style={{ backgroundColor: leaderboard[1]?.avatarColor || '#64748B' }}
                >
                  {(leaderboard[1]?.fullName || 'U').charAt(0)}
                </div>
                <h4 className="font-bold text-xs sm:text-sm mt-2 line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                  {leaderboard[1]?.fullName}
                </h4>
                <span className="text-xs font-black text-indigo-500">{leaderboard[1]?.score} pts</span>
                <div className="w-full h-24 rounded-t-2xl bg-gradient-to-t from-slate-400 to-slate-300 flex items-center justify-center text-2xl font-black text-white mt-2 shadow">
                  🥈 2
                </div>
              </div>

              {/* Rank 1 */}
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-xl shadow-xl border-4 border-amber-300 animate-bounce"
                  style={{ backgroundColor: leaderboard[0]?.avatarColor || '#F59E0B' }}
                >
                  {(leaderboard[0]?.fullName || 'U').charAt(0)}
                </div>
                <h4 className="font-bold text-sm sm:text-base mt-2 line-clamp-1 text-amber-500">
                  {leaderboard[0]?.fullName}
                </h4>
                <span className="text-xs font-black text-amber-500">{leaderboard[0]?.score} pts</span>
                <div className="w-full h-32 rounded-t-2xl bg-gradient-to-t from-amber-500 to-amber-400 flex items-center justify-center text-3xl font-black text-white mt-2 shadow-lg">
                  👑 1
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-amber-600"
                  style={{ backgroundColor: leaderboard[2]?.avatarColor || '#B45309' }}
                >
                  {(leaderboard[2]?.fullName || 'U').charAt(0)}
                </div>
                <h4 className="font-bold text-xs sm:text-sm mt-2 line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                  {leaderboard[2]?.fullName}
                </h4>
                <span className="text-xs font-black text-indigo-500">{leaderboard[2]?.score} pts</span>
                <div className="w-full h-20 rounded-t-2xl bg-gradient-to-t from-amber-700 to-amber-600 flex items-center justify-center text-2xl font-black text-white mt-2 shadow">
                  🥉 3
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div 
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-black/5 dark:bg-white/5 font-semibold text-slate-500 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <tr>
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Anggota Tim</th>
                  <th className="p-4 text-center">Tugas Selesai</th>
                  <th className="p-4 text-center">Jam Kerja</th>
                  <th className="p-4 text-center">Presensi</th>
                  <th className="p-4 text-right">Skor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {leaderboard.map((u) => (
                  <tr key={u.userId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center font-bold">
                      {u.rank === 1 ? '🥇 1' : u.rank === 2 ? '🥈 2' : u.rank === 3 ? '🥉 3' : `#${u.rank}`}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: u.avatarColor || '#6366F1' }}
                        >
                          {(u.fullName || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{u.fullName}</p>
                          <p className="text-[11px] text-slate-400">{u.jobTitle || u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold">{u.monthlyTasksDone} task</td>
                    <td className="p-4 text-center font-semibold">{u.monthlyHours} jam</td>
                    <td className="p-4 text-center font-semibold">{u.attendanceDays} hari</td>
                    <td className="p-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                      {u.score} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────── TAB 5: RIWAYAT KLAIM ─────── */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Wallet className="w-5 h-5 text-indigo-500" />
                Riwayat Klaim Hadiah Saya
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar permohonan penukaran poin Anda beserta status verifikasi oleh Administrator.
              </p>
            </div>
            <button 
              onClick={fetchClaims} 
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Belum ada riwayat penukaran hadiah.</p>
              <p className="text-xs text-slate-400 mt-1">Kumpulkan poin prestasi Anda dan tukarkan di tab Katalog Hadiah!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claims.map((claim) => (
                <div 
                  key={claim.id} 
                  className="p-5 rounded-2xl border shadow-sm space-y-3"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {claim.rewardItemName || 'Klaim Poin Hadiah'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(claim.claimedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {getClaimStatusBadge(claim.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y" style={{ borderColor: 'var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Poin Ditukar:</span>
                    <strong className="text-amber-500 font-bold">{claim.pointsSpent} Pts (Rp {claim.rupiahEquivalent?.toLocaleString('id-ID')})</strong>
                  </div>

                  <div className="text-xs space-y-1">
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Kontak / Rekening: <strong style={{ color: 'var(--text-primary)' }}>{claim.accountOrContactInfo}</strong>
                    </p>
                    {claim.userNotes && (
                      <p className="text-slate-400 italic">"{claim.userNotes}"</p>
                    )}
                    {claim.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border text-[11px] mt-2" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="font-bold text-indigo-500">Catatan Admin: </span>
                        <span>{claim.adminNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────── TAB 6: ADMIN CLAIM REVIEW ─────── */}
      {isAdmin && activeTab === 'admin-claims' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                Pusat Persetujuan Klaim Hadiah Tim (Admin)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tinjau permohonan klaim dari seluruh anggota tim, setujui transfer / traktiran, atau tolak dengan alasan.
              </p>
            </div>
            <button 
              onClick={fetchClaims} 
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div 
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-black/5 dark:bg-white/5 font-semibold text-slate-500 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <tr>
                  <th className="p-4">Anggota Tim</th>
                  <th className="p-4">Hadiah & Poin</th>
                  <th className="p-4">Info Pembayaran / Kontak</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {adminClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{claim.userName}</p>
                      <p className="text-[11px] text-slate-400">{claim.userEmail}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{claim.rewardItemName}</p>
                      <p className="text-[11px] text-amber-500 font-bold">{claim.pointsSpent} Pts (Rp {claim.rupiahEquivalent?.toLocaleString('id-ID')})</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>{claim.accountOrContactInfo}</p>
                      {claim.userNotes && <p className="text-[11px] text-slate-400 italic">"{claim.userNotes}"</p>}
                    </td>
                    <td className="p-4">
                      {getClaimStatusBadge(claim.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedClaimForReview(claim);
                          setAdminProcessForm({
                            status: claim.status === 'Approved' ? 3 : 2,
                            adminNotes: claim.adminNotes || ''
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl border text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        Proses Klaim
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: CLAIM REWARD ITEM ── */}
      {selectedRewardToClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg, #FFFFFF)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-indigo-950 font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Konfirmasi Penukaran Hadiah
                  </h3>
                  <p className="text-xs text-slate-400">{selectedRewardToClaim.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRewardToClaim(null)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="p-6 space-y-4">
              {/* Cost Summary */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Poin Dibutuhkan:</span>
                  <strong className="text-amber-500 font-bold">{selectedRewardToClaim.pointCost} Poin</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Nilai Setara:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">Rp {(selectedRewardToClaim.pointCost * POINT_TO_RUPIAH).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-amber-500/20">
                  <span className="text-slate-500">Sisa Poin Anda:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {(profile?.availablePoints || 0) - selectedRewardToClaim.pointCost} Poin
                  </strong>
                </div>
              </div>

              {/* Account / Contact Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nomor Rekening / No. HP E-Wallet / Kontak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA 1234567890 a.n Budi / GoPay 0812345678"
                  value={claimForm.accountOrContactInfo}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, accountOrContactInfo: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Informasi tambahan untuk admin..."
                  value={claimForm.userNotes}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, userNotes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedRewardToClaim(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                >
                  {submittingClaim ? 'Mengirim...' : 'Ajukan Penukaran Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADMIN PROCESS CLAIM ── */}
      {selectedClaimForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg, #FFFFFF)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Verifikasi Klaim Hadiah
                  </h3>
                  <p className="text-xs text-slate-400">Pemohon: {selectedClaimForReview.userName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClaimForReview(null)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessClaimSubmit} className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border text-xs space-y-1" style={{ borderColor: 'var(--border-color)' }}>
                <p>Hadiah: <strong>{selectedClaimForReview.rewardItemName}</strong></p>
                <p>Poin: <strong className="text-amber-500">{selectedClaimForReview.pointsSpent} Pts (Rp {selectedClaimForReview.rupiahEquivalent?.toLocaleString('id-ID')})</strong></p>
                <p>Kontak / Rekening: <strong>{selectedClaimForReview.accountOrContactInfo}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Status Keputusan
                </label>
                <select
                  value={adminProcessForm.status}
                  onChange={(e) => setAdminProcessForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-semibold"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value={2}>🔵 Disetujui (Approved)</option>
                  <option value={3}>🟢 Selesai Ditransfer / Ditraktir (PaidOrTreated)</option>
                  <option value={4}>🔴 Ditolak (Kembalikan Stok Hadiah)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Catatan Admin untuk Pemohon
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Bukti transfer terlampir / silakan ambil merchandise di meja HR..."
                  value={adminProcessForm.adminNotes}
                  onChange={(e) => setAdminProcessForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedClaimForReview(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={submittingAdminProcess}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                >
                  {submittingAdminProcess ? 'Menyimpan...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
