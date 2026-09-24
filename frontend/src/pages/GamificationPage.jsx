import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Star, Zap, Award, Crown, Flame, Target, Clock,
  TrendingUp, Users, Medal, Shield, BookOpen, Coffee, Moon,
  RefreshCw, Plus, Edit2, Trash2,
  X, Save, AlertCircle, CheckCircle, Sparkles, BarChart2
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  3: 'Kehadiran Beruntun',
  4: 'Top Task Bulanan',
  5: 'Task >= 100 Total',
  6: 'Lembur >= N Hari',
  7: 'Catatan >= N',
  8: 'Proyek >= N',
  9: 'Early Bird Streak',
  10: 'Night Owl >= N Hari',
};

const BADGE_ICON_MAP = { Award, Trophy, Star, Zap, Flame, Target, Clock, Shield, BookOpen, Coffee, Moon, Medal, Crown, TrendingUp, Users };

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
        opacity: unlocked ? 1 : 0.5,
        filter: unlocked ? 'none' : 'grayscale(80%)',
        borderRadius: '1rem',
        padding: '1rem',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
        <Star size={12} style={{ color: '#FBBF24' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24' }}>{badge.points} pts</span>
      </div>

      {unlocked && unlockedAt && (
        <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {new Date(unlockedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}
      {!unlocked && <p style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic' }}>Belum terbuka</p>}
    </div>
  );
}

function LeaderboardRow({ entry, isMe }) {
  const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px',
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
          <p style={{ color: 'var(--text-secondary)' }}>Task/bln</p>
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

  const [activeTab, setActiveTab] = useState('leaderboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [leaderboard, setLeaderboard] = useState([]);
  const [lbYear, setLbYear] = useState(new Date().getFullYear());
  const [lbMonth, setLbMonth] = useState(new Date().getMonth() + 1);
  const [myBadges, setMyBadges] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [allBadges, setAllBadges] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', category: 'Productivity', icon: 'Award', color: '#10B981', points: 50, rarity: 1, triggerType: 0, triggerThreshold: 0, isActive: true, orderIndex: 0 });

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
    else if (activeTab === 'all-badges' || activeTab === 'manage') fetchAllBadges();
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

  return (
    <div style={{ paddingBottom: 48 }} className="space-y-6 animate-fade-in">
      {/* ── Gradient Hero ── */}
      <div style={{ borderRadius: 24, padding: '28px 32px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 60%, rgba(129,140,248,0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(244,114,182,0.3), transparent 40%)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Trophy size={30} style={{ color: '#FCD34D' }} />
              Gamification & Leaderboard
            </h1>
            <p style={{ color: '#C7D2FE', marginTop: 4, fontSize: 14 }}>Raih badge, kumpulkan poin, jadilah yang terbaik di tim</p>
          </div>
          {myStats && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Skor Badge', value: myStats.totalPoints, color: '#FCD34D' },
                { label: 'Total Task', value: myStats.totalTasksDone, color: '#6EE7B7' },
                { label: 'Badge', value: myStats.badgeCount, color: '#F9A8D4' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '10px 18px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: '#C7D2FE' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
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
          { id: 'all-badges',  label: 'Semua Badge', icon: <Trophy size={15}/> },
          ...(isAdmin ? [{ id: 'manage', label: 'Kelola Badge', icon: <Shield size={15}/> }] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'}`, color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1 }}>
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
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Skor = Task×10 + Jam×3 + Badge×5 + Hadir×2</p>
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
              Peringkat — {MONTHS_ID[lbMonth - 1]} {lbYear}
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

      {/* ─────── MY BADGES ─────── */}
      {activeTab === 'my-badges' && (
        <div className="space-y-5">
          {myStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
              {[
                { label: 'Task Bulan ini', value: myStats.monthlyTasksDone, icon: <Target size={18}/>, color: '#34D399' },
                { label: 'Total Task Selesai', value: myStats.totalTasksDone, icon: <CheckCircle size={18}/>, color: '#60A5FA' },
                { label: 'Jam Bulan ini', value: `${myStats.monthlyHours}j`, icon: <Clock size={18}/>, color: '#A78BFA' },
                { label: 'Hari Lembur', value: myStats.overtimeDays, icon: <Flame size={18}/>, color: '#FB923C' },
              ].map(s => (
                <div key={s.label} style={{ borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Badge Anda ({myBadges.length}/{allBadges.length})</h2>
            <button onClick={handleCheckBadges} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              <Sparkles size={14} /> Cek Badge Baru
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
            {allBadges.map(badge => <BadgeCard key={badge.id} badge={badge} unlocked={myBadgeIds.has(badge.id)} unlockedAt={myBadgeMap[badge.id]?.unlockedAt} />)}
          </div>
        </div>
      )}

      {/* ─────── ALL BADGES ─────── */}
      {activeTab === 'all-badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
          {allBadges.map(badge => <BadgeCard key={badge.id} badge={badge} unlocked={true} />)}
          {!loading && allBadges.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>Belum ada badge.</p>}
        </div>
      )}

      {/* ─────── MANAGE (ADMIN) ─────── */}
      {activeTab === 'manage' && isAdmin && (
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Kelola Master Badge</h2>
            <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              <Plus size={14} /> Tambah Badge
            </button>
          </div>
          <div style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Badge', 'Trigger', 'Rarity', 'Poin', 'Aktif', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Poin' || h === 'Aktif' ? 'center' : h === 'Aksi' ? 'right' : 'left', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
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
                          {TRIGGER_LABELS[badge.triggerType]}
                          {badge.triggerThreshold > 0 && <span style={{ marginLeft: 4, fontWeight: 700, color: '#818CF8' }}>&ge;{badge.triggerThreshold}</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: rarity.text }}>{rarity.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#FBBF24' }}>{badge.points}</td>
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

      {/* ─────── BADGE MODAL ─────── */}
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
