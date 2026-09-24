import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Star, Zap, Award, Crown, Flame, Target, Clock,
  TrendingUp, Users, Medal, Shield, BookOpen, Coffee, Moon,
  RefreshCw, Plus, Edit2, Trash2, Rocket, Bug, LifeBuoy,
  X, Save, AlertCircle, CheckCircle, Sparkles, BarChart2,
  Gift, Wallet, DollarSign, CheckCircle2, AlertTriangle,
  ArrowRight, CreditCard, Utensils, Tag, ShieldCheck, HeartHandshake, Send
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

// ── Helpers & Constants ──────────────────────────────────────────────────────

const POINT_TO_RUPIAH = 100; // 1 Poin = Rp 100

const RARITY_META = {
  1: { label: 'Common',    bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', text: '#94A3B8', glow: 'none' },
  2: { label: 'Rare',      bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  text: '#60A5FA', glow: '0 0 20px rgba(59,130,246,0.3)' },
  3: { label: 'Epic',      bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.4)',  text: '#A78BFA', glow: '0 0 20px rgba(139,92,246,0.35)' },
  4: { label: 'Legendary', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  text: '#FBBF24', glow: '0 0 25px rgba(245,158,11,0.4)' },
};

const TRIGGER_LABELS = {
  0: 'Manual (Admin)',
  1: 'Task Selesai >= N',
  2: 'Jam Kerja >= N jam',
  3: 'Kehadiran Beruntun >= N',
  4: 'Top Task Bulanan (#1)',
  5: 'Task >= 100 Total',
  6: 'Lembur >= N Hari',
  7: 'Catatan/Dokumen >= N',
  8: 'Proyek Dikelola >= N',
  9: 'Early Bird Streak (<07:30)',
  10: 'Night Owl (>20:00) >= N',
  11: 'Tiket Issue Selesai >= N',
  12: 'Tiket Dilaporkan >= N',
  13: 'Kerja Akhir Pekan >= N',
  14: 'Speed Demon (< 2 Jam) >= N',
  15: 'Zero Defect (High/Crit) >= N'
};

const REWARD_TYPES = [
  { value: 1, label: 'Transfer Bank (Uang Tunai)', icon: <CreditCard className="w-4 h-4 text-emerald-400" />, desc: 'BCA, Mandiri, BNI, BRI, Jago' },
  { value: 2, label: 'E-Wallet', icon: <Wallet className="w-4 h-4 text-sky-400" />, desc: 'GoPay, OVO, Dana, ShopeePay' },
  { value: 3, label: 'Traktir Makan Siang / Malam Bersama', icon: <Utensils className="w-4 h-4 text-amber-400" />, desc: 'Makan bersama tim / admin' },
  { value: 4, label: 'Traktir Kopi / Snack Favorit', icon: <Coffee className="w-4 h-4 text-amber-500" />, desc: 'Kopi Kenangan, Fore, Starbucks, Boba' },
  { value: 5, label: 'Voucher Belanja / Pulsa', icon: <Tag className="w-4 h-4 text-purple-400" />, desc: 'Indomaret, Alfamart, Tokopedia' },
  { value: 6, label: 'Hadiah Khusus Lainnya', icon: <Gift className="w-4 h-4 text-rose-400" />, desc: 'Sesuai kesepakatan' }
];

const BADGE_ICON_MAP = { 
  Award, Trophy, Star, Zap, Flame, Target, Clock, Shield, BookOpen, 
  Coffee, Moon, Medal, Crown, TrendingUp, Users, Rocket, Bug, 
  LifeBuoy, Sparkles, ShieldCheck 
};

function BadgeIcon({ name, size = 20, color }) {
  const Icon = BADGE_ICON_MAP[name] || Award;
  return <Icon size={size} color={color} />;
}

function BadgeCard({ badge, unlocked, unlockedAt }) {
  const rarity = RARITY_META[badge.rarity] || RARITY_META[1];
  return (
    <div
      style={{
        background: unlocked ? rarity.bg : 'var(--bg-secondary)',
        border: `1.5px solid ${unlocked ? rarity.border : 'var(--border-color)'}`,
        boxShadow: unlocked ? rarity.glow : 'none',
        opacity: unlocked ? 1 : 0.45,
        filter: unlocked ? 'none' : 'grayscale(80%)',
        borderRadius: '1rem',
        padding: '1.1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {unlocked && badge.rarity === 4 && (
        <div style={{ position: 'absolute', top: -8, right: -8 }}>
          <Sparkles size={18} style={{ color: '#FBBF24' }} />
        </div>
      )}

      <div
        style={{
          width: 52, height: 52,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: unlocked ? badge.color + '22' : '#374151',
          border: `2px solid ${unlocked ? badge.color + '60' : 'transparent'}`,
        }}
      >
        <BadgeIcon name={badge.icon} size={24} color={unlocked ? badge.color : '#6B7280'} />
      </div>

      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.3 }}>
          {badge.name}
        </p>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: rarity.text }}>
          {rarity.label}
        </span>
      </div>

      <p style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{badge.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 6 }}>
        <Star size={12} style={{ color: '#FBBF24' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24' }}>{badge.points} pts</span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>≈ Rp {(badge.points * POINT_TO_RUPIAH).toLocaleString('id-ID')}</span>
      </div>

      {unlocked && unlockedAt && (
        <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          Diperoleh: {new Date(unlockedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}
      {!unlocked && <p style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic' }}>Terkunci</p>}
    </div>
  );
}

function LeaderboardRow({ entry, isMe }) {
  const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        borderRadius: 12,
        border: `1px solid ${isMe ? 'rgba(99,102,241,0.5)' : 'var(--border-color)'}`,
        background: isMe ? 'rgba(99,102,241,0.08)' : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ fontSize: 20, width: 36, textAlign: 'center', fontWeight: 700 }}>{rankEmoji}</div>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: entry.avatarColor || '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {(entry.fullName || 'U').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.fullName} {isMe && <span style={{ color: '#818CF8', fontSize: 12 }}>(Anda)</span>}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.jobTitle || entry.email}</p>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: '#34D399' }}>{entry.monthlyTasksDone}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Task</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.monthlyHours}j</p>
          <p style={{ color: 'var(--text-secondary)' }}>Jam</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: '#FBBF24' }}>{entry.badgeCount}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Badge</p>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontWeight: 900, fontSize: 16, color: '#818CF8' }}>{entry.score.toLocaleString()}</p>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>skor</p>
      </div>
    </div>
  );
}

export default function GamificationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState('leaderboard'); // leaderboard, my-badges, all-badges, claims, admin-claims, manage
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [leaderboard, setLeaderboard] = useState([]);
  const [lbYear, setLbYear] = useState(new Date().getFullYear());
  const [lbMonth, setLbMonth] = useState(new Date().getMonth() + 1);
  const [myBadges, setMyBadges] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [claims, setClaims] = useState([]);

  // Modal Klaim Hadiah
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    points: 100,
    rewardType: 1,
    accountOrContactInfo: '',
    userNotes: ''
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Modal Review Klaim (Admin)
  const [selectedClaimForReview, setSelectedClaimForReview] = useState(null);
  const [adminProcessForm, setAdminProcessForm] = useState({
    status: 2, // Approved
    adminNotes: ''
  });
  const [submittingAdminProcess, setSubmittingAdminProcess] = useState(false);

  // Modal Kelola Badge (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    category: 'Productivity',
    icon: 'Award',
    color: '#10B981',
    points: 50,
    rarity: 1,
    triggerType: 0,
    triggerThreshold: 0,
    isActive: true,
    orderIndex: 0
  });

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 5000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(null), 6000); };

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/gamification/leaderboard', { params: { year: lbYear, month: lbMonth } });
      setLeaderboard(res.data?.data?.leaderboard || []);
    } catch { showError('Gagal memuat leaderboard.'); }
    finally { setLoading(false); }
  }, [lbYear, lbMonth]);

  const fetchMyData = useCallback(async () => {
    setLoading(true);
    try {
      const [badgesRes, statsRes, allRes] = await Promise.all([
        axiosClient.get('/api/gamification/my-badges'),
        axiosClient.get('/api/gamification/my-stats'),
        axiosClient.get('/api/gamification/badges'),
      ]);
      setMyBadges(badgesRes.data?.data || []);
      setMyStats(statsRes.data?.data || null);
      setAllBadges(allRes.data?.data || []);
    } catch { showError('Gagal memuat data badge.'); }
    finally { setLoading(false); }
  }, []);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/gamification/claims');
      setClaims(res.data?.data || []);
    } catch { showError('Gagal memuat riwayat klaim.'); }
    finally { setLoading(false); }
  }, []);

  const fetchAllBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/gamification/badges');
      setAllBadges(res.data?.data || []);
    } catch { showError('Gagal memuat badge.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
    else if (activeTab === 'my-badges') { fetchMyData(); }
    else if (activeTab === 'all-badges') fetchAllBadges();
    else if (activeTab === 'claims' || activeTab === 'admin-claims') fetchClaims();
    else if (activeTab === 'manage') fetchAllBadges();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [lbYear, lbMonth]);

  const handleCheckBadges = async () => {
    try {
      const res = await axiosClient.post('/api/gamification/check-badges');
      showSuccess(res.data?.message || 'Pengecekan selesai.');
      fetchMyData();
    } catch { showError('Gagal cek badge.'); }
  };

  const handleOpenClaimModal = () => {
    const maxPoints = myStats?.availablePoints || 0;
    setClaimForm({
      points: maxPoints > 0 ? Math.min(100, maxPoints) : 50,
      rewardType: 1,
      accountOrContactInfo: '',
      userNotes: ''
    });
    setIsClaimModalOpen(true);
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (claimForm.points <= 0) {
      showError('Jumlah poin harus lebih besar dari 0.');
      return;
    }
    if (!claimForm.accountOrContactInfo.trim()) {
      showError('Informasi akun / nomor rekening / kontak / tempat traktir wajib diisi.');
      return;
    }

    setSubmittingClaim(true);
    try {
      const res = await axiosClient.post('/api/gamification/claim-reward', {
        points: parseInt(claimForm.points),
        rewardType: parseInt(claimForm.rewardType),
        accountOrContactInfo: claimForm.accountOrContactInfo.trim(),
        userNotes: claimForm.userNotes?.trim() || null
      });

      showSuccess(res.data?.message || 'Permohonan klaim berhasil dikirim!');
      setIsClaimModalOpen(false);
      fetchMyData();
      if (activeTab === 'claims') fetchClaims();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal mengajukan klaim hadiah.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleProcessClaim = async (e) => {
    e.preventDefault();
    if (!selectedClaimForReview) return;

    setSubmittingAdminProcess(true);
    try {
      const res = await axiosClient.put(`/api/gamification/claims/${selectedClaimForReview.id}/process`, {
        status: parseInt(adminProcessForm.status),
        adminNotes: adminProcessForm.adminNotes?.trim() || null
      });

      showSuccess(res.data?.message || 'Klaim berhasil diproses.');
      setSelectedClaimForReview(null);
      fetchClaims();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal memproses klaim.');
    } finally {
      setSubmittingAdminProcess(false);
    }
  };

  const openCreate = () => {
    setModalMode('create'); setEditId(null);
    setForm({ code: '', name: '', description: '', category: 'Productivity', icon: 'Award', color: '#10B981', points: 50, rarity: 1, triggerType: 0, triggerThreshold: 0, isActive: true, orderIndex: allBadges.length + 1 });
    setIsModalOpen(true);
  };

  const openEdit = (b) => {
    setModalMode('edit'); setEditId(b.id); setForm({ ...b }); setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') await axiosClient.post('/api/gamification/badges', form);
      else await axiosClient.put(`/api/gamification/badges/${editId}`, form);
      showSuccess(modalMode === 'create' ? 'Badge dibuat.' : 'Badge diperbarui.');
      setIsModalOpen(false);
      fetchAllBadges();
    } catch (err) { showError(err.response?.data?.message || 'Gagal menyimpan.'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus badge "${name}"?`)) return;
    try {
      await axiosClient.delete(`/api/gamification/badges/${id}`);
      showSuccess('Badge dihapus.');
      fetchAllBadges();
    } catch (err) { showError(err.response?.data?.message || 'Gagal.'); }
  };

  const myBadgeIds = new Set(myBadges.map(ub => ub.badgeId));
  const myBadgeMap = Object.fromEntries(myBadges.map(ub => [ub.badgeId, ub]));
  const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  const fieldStyle = { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
  const inputCls = 'w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const getClaimStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Menunggu Admin</span>;
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">Disetujui</span>;
      case 'PaidOrTreated':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Selesai Ditransfer / Ditraktir</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400">{status}</span>;
    }
  };

  return (
    <div style={{ paddingBottom: 48 }} className="space-y-6 animate-fade-in">
      {/* ── Gradient Hero ── */}
      <div style={{ borderRadius: 24, padding: '28px 32px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 60%, rgba(129,140,248,0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(244,114,182,0.3), transparent 40%)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Trophy size={30} style={{ color: '#FCD34D' }} />
              Gamification, Badge & Reward Center
            </h1>
            <p style={{ color: '#C7D2FE', marginTop: 4, fontSize: 14 }}>
              Raih badge, kumpulkan poin prestasi, dan klaim hadiah uang tunai atau traktiran (<strong>1 Poin = Rp 100</strong>)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {myStats && (
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '10px 18px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#FCD34D' }}>{myStats.availablePoints || 0} pts</p>
                <p style={{ fontSize: 11, color: '#C7D2FE' }}>Poin Siap Klaim (≈ Rp {((myStats.availablePoints || 0) * POINT_TO_RUPIAH).toLocaleString('id-ID')})</p>
              </div>
            )}

            <button
              onClick={handleOpenClaimModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-indigo-950 bg-amber-400 hover:bg-amber-300 shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <Gift className="w-5 h-5 text-indigo-950" />
              Klaim Hadiah / Uang 🎁
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><AlertCircle size={16} />{error}</div>}
      {successMsg && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><CheckCircle size={16} />{successMsg}</div>}

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        {[
          { id: 'leaderboard', label: 'Leaderboard', icon: <Crown size={15}/> },
          { id: 'my-badges',   label: 'Badge Saya',  icon: <Medal size={15}/> },
          { id: 'all-badges',  label: 'Semua Koleksi Badge', icon: <Trophy size={15}/> },
          { id: 'claims',      label: 'Riwayat Klaim Hadiah', icon: <Gift size={15}/> },
          ...(isAdmin ? [
            { id: 'admin-claims', label: 'Kelola Klaim Tim (Admin)', icon: <Wallet size={15}/> },
            { id: 'manage', label: 'Kelola Master Badge', icon: <Shield size={15}/> }
          ] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', 
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', 
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent', 
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1 
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ─────── LEADERBOARD ─────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={lbYear} onChange={e => setLbYear(+e.target.value)} className={inputCls} style={fieldStyle}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={lbMonth} onChange={e => setLbMonth(+e.target.value)} className={inputCls} style={fieldStyle}>
                {MONTHS_ID.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <button onClick={fetchLeaderboard} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Kalkulasi Skor = Task×10 + Jam×3 + Badge×5 + Kehadiran×2
            </p>
          </div>

          {/* Podium Top 3 */}
          {leaderboard.length >= 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '16px 0' }}>
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, idx) => {
                if (!entry) return <div key={idx} />;
                const podiumH = idx === 1 ? 110 : idx === 0 ? 80 : 60;
                const grd = idx === 1 ? 'linear-gradient(180deg,#F59E0B,#D97706)' : idx === 0 ? 'linear-gradient(180deg,#94A3B8,#64748B)' : 'linear-gradient(180deg,#B45309,#92400E)';
                const emoji = idx === 1 ? '🥇' : idx === 0 ? '🥈' : '🥉';
                return (
                  <div key={entry.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: entry.avatarColor || '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                      {(entry.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.fullName}</p>
                    <p style={{ fontSize: 12, fontWeight: 900, color: '#818CF8' }}>{entry.score} pts</p>
                    <div style={{ width: '100%', height: podiumH, borderRadius: '12px 12px 0 0', background: grd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      {emoji}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <BarChart2 size={16} style={{ color: '#818CF8' }} />
              Peringkat Anggota — {MONTHS_ID[lbMonth - 1]} {lbYear}
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
            ) : (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {leaderboard.map(entry => <LeaderboardRow key={entry.userId} entry={entry} isMe={entry.userId === user?.id} />)}
                {leaderboard.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Belum ada data untuk periode ini.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── MY BADGES & REWARD STATUS ─────── */}
      {activeTab === 'my-badges' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xs font-semibold text-slate-400">Total Poin Diperoleh</span>
              <p className="text-2xl font-black mt-1 text-amber-400">{myStats?.totalPointsEarned || 0} pts</p>
              <span className="text-xs text-slate-400">≈ Rp {((myStats?.totalPointsEarned || 0) * POINT_TO_RUPIAH).toLocaleString('id-ID')}</span>
            </div>

            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xs font-semibold text-slate-400">Poin Siap Diklaim</span>
              <p className="text-2xl font-black mt-1 text-emerald-400">{myStats?.availablePoints || 0} pts</p>
              <span className="text-xs text-slate-400">≈ Rp {((myStats?.availablePoints || 0) * POINT_TO_RUPIAH).toLocaleString('id-ID')}</span>
            </div>

            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xs font-semibold text-slate-400">Poin Dicairkan</span>
              <p className="text-2xl font-black mt-1 text-sky-400">{myStats?.pointsClaimed || 0} pts</p>
              <span className="text-xs text-slate-400">Selesai/Diproses</span>
            </div>

            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xs font-semibold text-slate-400">Koleksi Badge</span>
              <p className="text-2xl font-black mt-1 text-purple-400">{myBadges.length} / {allBadges.length}</p>
              <span className="text-xs text-slate-400">Pencapaian Karier</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              Koleksi Badge Anda ({myBadges.length}/{allBadges.length})
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleOpenClaimModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold transition-all border border-amber-500/30"
              >
                <Gift size={14} /> Ajukan Klaim Hadiah
              </button>
              <button 
                onClick={handleCheckBadges} 
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                <Sparkles size={14} /> Cek / Sinkronkan Badge
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
            {allBadges.map(badge => (
              <BadgeCard 
                key={badge.id} 
                badge={badge} 
                unlocked={myBadgeIds.has(badge.id)} 
                unlockedAt={myBadgeMap[badge.id]?.unlockedAt} 
              />
            ))}
          </div>
        </div>
      )}

      {/* ─────── ALL BADGES CATALOG ─────── */}
      {activeTab === 'all-badges' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-slate-500/5 text-xs text-slate-400 flex items-center justify-between">
            <span>Katalog seluruh badge yang dapat diperoleh melalui penyelesaian tugas, jam timesheet, tiket kendala, dan presensi.</span>
            <span className="font-semibold text-amber-400">1 Poin = Rp 100</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
            {allBadges.map(badge => <BadgeCard key={badge.id} badge={badge} unlocked={true} />)}
            {!loading && allBadges.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Belum ada badge.</p>}
          </div>
        </div>
      )}

      {/* ─────── CLAIMS HISTORY (USER) ─────── */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Riwayat Klaim Hadiah Saya</h2>
              <p className="text-xs text-slate-400">Pantau status pencairan uang tunai atau traktiran dari Administrator</p>
            </div>
            <button
              onClick={handleOpenClaimModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-indigo-950 hover:bg-amber-300 shadow-md"
            >
              <Plus className="w-4 h-4" /> Ajukan Klaim Baru
            </button>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            {claims.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Gift className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
                <p className="text-sm font-semibold">Belum Ada Permohonan Klaim</p>
                <p className="text-xs">Kumpulkan poin prestasi dari tugas dan badge untuk mengklaim hadiah uang atau traktir makan!</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {claims.map((c) => (
                  <div key={c.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getClaimStatusBadge(c.status)}
                        <span className="font-bold text-amber-400 text-sm">
                          {c.pointsClaimed} Pts = Rp {c.rupiahAmount?.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-300 border border-slate-700/30">
                          {c.rewardType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        Info Rekening / Kontak: <span className="text-slate-100">{c.accountOrContactInfo}</span>
                      </p>
                      {c.userNotes && (
                        <p className="text-xs text-slate-400 italic">" {c.userNotes} "</p>
                      )}
                      {c.adminNotes && (
                        <div className="mt-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 space-y-0.5">
                          <strong>Catatan Administrator:</strong>
                          <p>{c.adminNotes}</p>
                          {c.processedByName && (
                            <span className="text-[10px] text-sky-400/70 block">
                              Diproses oleh {c.processedByName} pada {new Date(c.processedAt).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-400 self-end md:self-auto">
                      <span>Diajukan: {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── ADMIN CLAIMS MANAGEMENT ─────── */}
      {activeTab === 'admin-claims' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Kelola Permohonan Klaim Tim (Admin)</h2>
              <p className="text-xs text-slate-400">Verifikasi, approve, atau konfirmasi transfer uang tunai dan traktiran anggota tim</p>
            </div>
            <button onClick={fetchClaims} className="p-2 rounded-xl border border-slate-700/40 hover:bg-slate-500/10 text-slate-300">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-500/10 text-slate-400 uppercase font-semibold border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <tr>
                    <th className="p-3.5">Anggota Tim</th>
                    <th className="p-3.5">Poin & Rupiah</th>
                    <th className="p-3.5">Jenis Hadiah</th>
                    <th className="p-3.5">Nomor Rekening / Info Traktiran</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">Belum ada data klaim hadiah dari tim.</td>
                    </tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="p-3.5 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: c.userAvatarColor || '#6366F1' }}>
                              {c.userName?.slice(0, 1)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200">{c.userName}</p>
                              <p className="text-[10px] text-slate-400">{c.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <strong className="text-amber-400 font-bold">{c.pointsClaimed} pts</strong>
                          <span className="block text-[11px] text-emerald-400 font-semibold">Rp {c.rupiahAmount?.toLocaleString('id-ID')}</span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">{c.rewardType}</td>
                        <td className="p-3.5">
                          <p className="text-slate-200">{c.accountOrContactInfo}</p>
                          {c.userNotes && <p className="text-[11px] text-slate-400 italic">"{c.userNotes}"</p>}
                        </td>
                        <td className="p-3.5">{getClaimStatusBadge(c.status)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedClaimForReview(c);
                              setAdminProcessForm({
                                status: c.status === 'Pending' ? 2 : (c.status === 'Approved' ? 3 : 2),
                                adminNotes: c.adminNotes || ''
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all text-xs"
                          >
                            Proses / Verifikasi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────── MANAGE (ADMIN) ─────── */}
      {activeTab === 'manage' && isAdmin && (
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Kelola Master Badge & Aturan Otomatis</h2>
            <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              <Plus size={14} /> Tambah Badge Baru
            </button>
          </div>
          <div style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Badge', 'Trigger', 'Rarity', 'Poin', 'Nilai Rp', 'Aktif', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Poin' || h === 'Nilai Rp' || h === 'Aktif' ? 'center' : h === 'Aksi' ? 'right' : 'left', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBadges.map(badge => {
                    const rarity = RARITY_META[badge.rarity] || RARITY_META[1];
                    return (
                      <tr key={badge.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: badge.color + '20', border: `1.5px solid ${badge.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BadgeIcon name={badge.icon} size={18} color={badge.color} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{badge.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{badge.code}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                          {TRIGGER_LABELS[badge.triggerType] || 'Manual'}
                          {badge.triggerThreshold > 0 && <span style={{ marginLeft: 4, fontWeight: 700, color: '#818CF8' }}>&ge;{badge.triggerThreshold}</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: rarity.text }}>{rarity.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#FBBF24' }}>{badge.points} pts</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#10B981', fontSize: 11 }}>Rp {(badge.points * POINT_TO_RUPIAH).toLocaleString('id-ID')}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: badge.isActive ? '#34D399' : '#6B7280' }} />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => openEdit(badge)} style={{ padding: '6px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: 'none', cursor: 'pointer', color: '#818CF8' }}><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(badge.id, badge.name)} style={{ padding: '6px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#F87171' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading && allBadges.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Belum ada badge.</p>}
          </div>
        </div>
      )}

      {/* ─────── MODAL AJUKAN KLAIM REWARD (USER) ─────── */}
      {isClaimModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', width: '100%', maxWidth: 540, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>Klaim Hadiah / Poin Prestasi</h3>
                  <p className="text-xs text-slate-400">Nilai Konversi Resmi: <strong>1 Poin = Rp 100</strong></p>
                </div>
              </div>
              <button onClick={() => setIsClaimModalOpen(false)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitClaim} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Point input & Rupiah calculator */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Poin Anda Tersedia:</span>
                  <strong className="text-amber-400">{myStats?.availablePoints || 0} pts</strong>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Jumlah Poin Diklaim *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={myStats?.availablePoints || 100000}
                      value={claimForm.points}
                      onChange={(e) => setClaimForm({ ...claimForm, points: e.target.value })}
                      className={inputCls}
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Setara Uang Rupiah:</label>
                    <div className="px-3.5 py-2 rounded-xl border text-sm font-bold text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                      Rp {((parseInt(claimForm.points) || 0) * POINT_TO_RUPIAH).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Pilih Bentuk Hadiah *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {REWARD_TYPES.map((rt) => (
                    <div
                      key={rt.value}
                      onClick={() => setClaimForm({ ...claimForm, rewardType: rt.value })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        claimForm.rewardType === rt.value 
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                          : 'border-slate-700/40 hover:bg-slate-500/5'
                      }`}
                    >
                      <div className="mt-0.5">{rt.icon}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{rt.label}</p>
                        <p className="text-[10px] text-slate-400">{rt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                  {claimForm.rewardType === 1 ? 'Nomor Rekening & Nama Bank / Pemilik *'
                    : claimForm.rewardType === 2 ? 'Nomor HP & Jenis E-Wallet (GoPay/OVO/Dana) *'
                    : claimForm.rewardType === 3 ? 'Nama Restoran / Tempat Makan Rekomendasi *'
                    : claimForm.rewardType === 4 ? 'Nama Kedai Kopi / Menu Minuman Favorit *'
                    : 'Nomor Kontak / Detail Informasi Penerima *'}
                </label>
                <input
                  type="text"
                  required
                  value={claimForm.accountOrContactInfo}
                  onChange={(e) => setClaimForm({ ...claimForm, accountOrContactInfo: e.target.value })}
                  placeholder={
                    claimForm.rewardType === 1 ? 'Contoh: BCA 1234567890 a/n Ahmad Fajar'
                    : claimForm.rewardType === 2 ? 'Contoh: GoPay 081234567890 (Ahmad Fajar)'
                    : claimForm.rewardType === 3 ? 'Contoh: Rumah Makan Padang Sederhana / Solaria'
                    : claimForm.rewardType === 4 ? 'Contoh: Kopi Kenangan Mantan Large x2'
                    : 'Masukkan detail akun / kontak...'
                  }
                  className={inputCls}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Pesan / Catatan ke Administrator (Opsional)</label>
                <textarea
                  rows={2}
                  value={claimForm.userNotes}
                  onChange={(e) => setClaimForm({ ...claimForm, userNotes: e.target.value })}
                  placeholder="Catatan tambahan untuk admin (misal: jam makan siang yang luang, dll)..."
                  className={inputCls}
                  style={{ ...fieldStyle, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setIsClaimModalOpen(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Batal</button>
                <button
                  type="submit"
                  disabled={submittingClaim || (myStats?.availablePoints || 0) < 10}
                  className="flex-1 px-5 py-2.5 rounded-xl font-bold text-sm text-indigo-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingClaim ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Ajukan Klaim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODAL REVIEW KLAIM (ADMIN) ─────── */}
      {selectedClaimForReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Proses Klaim Hadiah Anggota</h3>
              <button onClick={() => setSelectedClaimForReview(null)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleProcessClaim} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-700/30 text-xs space-y-1">
                <p>Pemohon: <strong>{selectedClaimForReview.userName}</strong> ({selectedClaimForReview.userEmail})</p>
                <p>Poin: <strong className="text-amber-400">{selectedClaimForReview.pointsClaimed} Pts</strong> (≈ <strong className="text-emerald-400">Rp {selectedClaimForReview.rupiahAmount?.toLocaleString('id-ID')}</strong>)</p>
                <p>Tipe: <strong>{selectedClaimForReview.rewardType}</strong></p>
                <p>Rekening / Kontak: <strong className="text-slate-200">{selectedClaimForReview.accountOrContactInfo}</strong></p>
                {selectedClaimForReview.userNotes && <p className="italic">"{selectedClaimForReview.userNotes}"</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Status Permohonan *</label>
                <select
                  value={adminProcessForm.status}
                  onChange={(e) => setAdminProcessForm({ ...adminProcessForm, status: e.target.value })}
                  className={inputCls}
                  style={fieldStyle}
                >
                  <option value={2}>Disetujui (Approved) - Masuk antrean transfer / traktir</option>
                  <option value={3}>Selesai Ditransfer / Telah Ditraktir (Paid / Treated)</option>
                  <option value={4}>Tolak (Rejected) - Kembalikan saldo poin ke user</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Catatan Admin / Bukti Transfer / Info Traktir</label>
                <textarea
                  rows={3}
                  value={adminProcessForm.adminNotes}
                  onChange={(e) => setAdminProcessForm({ ...adminProcessForm, adminNotes: e.target.value })}
                  placeholder="Contoh: Sudah ditransfer via BCA No Ref #TRX9988123 / Ditraktir makan siang bersama di Resto X..."
                  className={inputCls}
                  style={{ ...fieldStyle, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setSelectedClaimForReview(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Batal</button>
                <button
                  type="submit"
                  disabled={submittingAdminProcess}
                  className="flex-1 px-4 py-2 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white transition-all disabled:opacity-50"
                >
                  {submittingAdminProcess ? 'Menyimpan...' : 'Simpan Status Klaim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── BADGE MODAL (ADMIN) ─────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--bg-card)', width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{modalMode === 'create' ? 'Tambah Badge Baru' : 'Edit Badge'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '75vh', overflowY: 'auto' }}>
              {[
                { key: 'code', label: 'Kode Badge', placeholder: 'TASK_FIRST', required: true },
                { key: 'name', label: 'Nama Badge', placeholder: 'Langkah Pertama', required: true },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={required} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className={inputCls} style={fieldStyle} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Deskripsi</label>
                <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls} style={{ ...fieldStyle, resize: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Trigger Otomatis</label>
                  <select value={form.triggerType} onChange={e => setForm(p => ({ ...p, triggerType: +e.target.value }))} className={inputCls} style={fieldStyle}>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Threshold (N)</label>
                  <input type="number" min={0} value={form.triggerThreshold || 0} onChange={e => setForm(p => ({ ...p, triggerThreshold: +e.target.value }))} className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Rarity</label>
                  <select value={form.rarity} onChange={e => setForm(p => ({ ...p, rarity: +e.target.value }))} className={inputCls} style={fieldStyle}>
                    {[1, 2, 3, 4].map(r => <option key={r} value={r}>{RARITY_META[r].label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Poin</label>
                  <input type="number" min={1} value={form.points || 50} onChange={e => setForm(p => ({ ...p, points: +e.target.value }))} className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ikon (Lucide Name)</label>
                  <input value={form.icon || 'Award'} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="Award" className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Warna</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="color" value={form.color || '#10B981'} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ width: 40, height: 40, border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input value={form.color || '#10B981'} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className={inputCls} style={fieldStyle} />
                  </div>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }} />
                Badge Aktif
              </label>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Batal</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={14} />{modalMode === 'create' ? 'Simpan Badge' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
