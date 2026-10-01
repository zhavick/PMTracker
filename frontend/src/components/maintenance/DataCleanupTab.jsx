import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Clock, 
  FileText, 
  AlertCircle, 
  Trophy, 
  Activity, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  Database, 
  RotateCcw, 
  X,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function DataCleanupTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Partial Selection
  const [selectedModules, setSelectedModules] = useState([]);

  // Full Purge Options
  const [resetPoints, setResetPoints] = useState(true);

  // Modal State
  const [modalType, setModalType] = useState(null); // 'partial' | 'full' | null
  const [confirmText, setConfirmText] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/maintenance/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      } else {
        setStats(res.data || null);
      }
    } catch (err) {
      console.error('Failed to load maintenance stats:', err);
      setError(err?.message || 'Gagal memuat statistik data database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const MODULES = [
    {
      id: 'tasks',
      title: 'Tugas & Sesi Kerja',
      desc: 'Daftar penugasan tugas (Tasks) dan histori timer sesi kerja (Sessions).',
      icon: CheckSquare,
      color: 'blue',
      count: stats?.totalTasksAndSessions ?? 0,
      details: [
        { label: 'Tugas Kerja', value: stats?.tasksCount ?? 0 },
        { label: 'Sesi Waktu Kerja', value: stats?.sessionsCount ?? 0 }
      ]
    },
    {
      id: 'attendance',
      title: 'Presensi & Check-in',
      desc: 'Catatan presensi harian jam masuk/pulang dan entri status check-in tim.',
      icon: Clock,
      color: 'emerald',
      count: stats?.totalAttendance ?? 0,
      details: [
        { label: 'Presensi Absensi', value: stats?.attendancesCount ?? 0 },
        { label: 'Daily Check-in', value: stats?.dailyCheckInsCount ?? 0 }
      ]
    },
    {
      id: 'notes',
      title: 'Catatan Kerja & Lampiran',
      desc: 'Semua berkas catatan harian proyek beserta lampiran berkas dokumen.',
      icon: FileText,
      color: 'amber',
      count: stats?.totalNotes ?? 0,
      details: [
        { label: 'Catatan Kerja', value: stats?.notesCount ?? 0 },
        { label: 'Lampiran Berkas', value: stats?.noteAttachmentsCount ?? 0 }
      ]
    },
    {
      id: 'tickets',
      title: 'Tiket Kendala & Diskusi',
      desc: 'Tiket bantuan kendala proyek dan seluruh riwayat balasan komentar.',
      icon: AlertCircle,
      color: 'rose',
      count: stats?.totalTickets ?? 0,
      details: [
        { label: 'Tiket Masalah', value: stats?.ticketsCount ?? 0 },
        { label: 'Komentar Tiket', value: stats?.ticketCommentsCount ?? 0 }
      ]
    },
    {
      id: 'gamification',
      title: 'Gamifikasi & Hadiah',
      desc: 'Riwayat klaim penukaran hadiah koin dan perolehan lencana profil user.',
      icon: Trophy,
      color: 'purple',
      count: stats?.totalGamification ?? 0,
      details: [
        { label: 'Klaim Hadiah', value: stats?.rewardClaimsCount ?? 0 },
        { label: 'Lencana Pengguna', value: stats?.userBadgesCount ?? 0 }
      ]
    },
    {
      id: 'logs',
      title: 'Log Audit & Riwayat',
      desc: 'Histori aktivitas request HTTP, log import Excel, dan histori query tools.',
      icon: Activity,
      color: 'slate',
      count: stats?.totalLogs ?? 0,
      details: [
        { label: 'Log Audit HTTP', value: stats?.auditLogsCount ?? 0 },
        { label: 'Log Import File', value: stats?.importLogsCount ?? 0 },
        { label: 'Histori SQL & JSON', value: (stats?.sqlHistoriesCount ?? 0) + (stats?.jsonHistoriesCount ?? 0) }
      ]
    }
  ];

  const handleToggleModule = (id) => {
    setSelectedModules((prev) => 
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedModules.length === MODULES.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(MODULES.map((m) => m.id));
    }
  };

  const handleOpenPartialModal = (singleModuleId = null) => {
    if (singleModuleId) {
      setSelectedModules([singleModuleId]);
    }
    setModalType('partial');
    setConfirmText('');
    setExecutionResult(null);
  };

  const handleOpenFullModal = () => {
    setModalType('full');
    setConfirmText('');
    setExecutionResult(null);
  };

  const handleCloseModal = () => {
    if (executing) return;
    setModalType(null);
    setConfirmText('');
  };

  const calculateSelectedRecords = () => {
    return MODULES
      .filter((m) => selectedModules.includes(m.id))
      .reduce((sum, m) => sum + m.count, 0);
  };

  const handleExecutePurge = async () => {
    if (modalType === 'partial') {
      if (!confirmText.trim().match(/^HAPUS SELEKSI$/i)) return;
      setExecuting(true);
      setError(null);
      try {
        const res = await axiosClient.post('/maintenance/purge-partial', {
          modules: selectedModules,
          confirmationText: confirmText.trim().toUpperCase()
        });
        const data = res.data?.data || res.data;
        setExecutionResult(data);
        fetchStats();
      } catch (err) {
        console.error('Error in partial purge:', err);
        setError(err?.message || 'Gagal mengeksekusi penghapusan parsial data.');
      } finally {
        setExecuting(false);
      }
    } else if (modalType === 'full') {
      if (!confirmText.trim().match(/^RESET PENUH$/i)) return;
      setExecuting(true);
      setError(null);
      try {
        const res = await axiosClient.post('/maintenance/purge-full', {
          confirmationText: confirmText.trim().toUpperCase(),
          resetUserPoints: resetPoints
        });
        const data = res.data?.data || res.data;
        setExecutionResult(data);
        fetchStats();
      } catch (err) {
        console.error('Error in full purge:', err);
        setError(err?.message || 'Gagal mengeksekusi reset penuh database.');
      } finally {
        setExecuting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview & Quick Stats Bar */}
      <div 
        className="p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Pembersihan Data & Reset Sistem
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400">
                Zona Admin
              </span>
            </div>
            <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Kelola pembersihan data operasional secara parsial per modul atau bersihkan total (Full Reset)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Baris Terdata
            </div>
            <div className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {loading ? '...' : (stats?.grandTotalRecords?.toLocaleString('id-ID') ?? 0)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            title="Muat ulang statistik data terkini"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 1: Modular / Partial Data Cleaner */}
      <div 
        className="p-5 md:p-6 rounded-3xl border shadow-sm space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trash2 className="w-4 h-4 text-amber-500" />
              1. Penghapusan Parsial Berdasarkan Modul (Partial Cleanup)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Pilih satu atau beberapa modul tertentu yang ingin dikosongkan datanya tanpa mempengaruhi modul lain.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {selectedModules.length === MODULES.length ? 'Batal Pilih Semua' : 'Pilih Semua Modul'}
            </button>
            <button
              type="button"
              onClick={() => handleOpenPartialModal()}
              disabled={selectedModules.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Terpilih ({selectedModules.length})
            </button>
          </div>
        </div>

        {/* Modular Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModules.includes(mod.id);
            return (
              <div
                key={mod.id}
                onClick={() => handleToggleModule(mod.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected 
                    ? 'ring-2 ring-amber-500 bg-amber-500/5 shadow-sm' 
                    : 'hover:border-amber-500/50 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{ 
                  backgroundColor: isSelected ? undefined : 'var(--bg-secondary)', 
                  borderColor: isSelected ? 'var(--accent-primary, #f59e0b)' : 'var(--border-color)' 
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {mod.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          ID: {mod.id}
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-400/50'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {mod.desc}
                  </p>
                </div>

                <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--text-secondary)' }}>Total Data:</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {mod.count.toLocaleString('id-ID')} baris
                    </span>
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-0.5 text-slate-400">
                    {mod.details.map((d, i) => (
                      <div key={i} className="flex justify-between">
                        <span>• {d.label}</span>
                        <span className="font-mono">{d.value.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPartialModal(mod.id);
                      }}
                      className="w-full py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center justify-center gap-1 opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                      Bersihkan modul ini saja
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Danger Zone / Full Reset */}
      <div 
        className="p-5 md:p-6 rounded-3xl border-2 border-rose-500/40 bg-rose-500/5 shadow-sm space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500 text-white shrink-0 shadow-md">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-bold text-rose-600 dark:text-rose-400">
                2. Zona Bahaya: Reset Penuh Database (Full System Purge)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                Irreversible
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Tindakan ini akan <strong>mengosongkan seluruh data operasional dan riwayat aktivitas</strong> dalam sistem, mengembalikan sistem ke kondisi bersih awal (Clean Slate).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-black/5 dark:bg-white/5 space-y-2">
            <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Data Yang Akan Dihapus Bersih:
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-4 list-disc">
              <li>Seluruh Tugas, Subtask, dan Riwayat Sesi Timer Waktu Kerja.</li>
              <li>Seluruh Rekam Presensi Masuk/Pulang dan Daily Check-In.</li>
              <li>Seluruh Catatan Kerja dan Berkas File Attachment.</li>
              <li>Seluruh Tiket Masalah dan Riwayat Utas Komentar.</li>
              <li>Seluruh Riwayat Klaim Reward dan Badge Pengguna.</li>
              <li>Seluruh Log Audit HTTP, Riwayat Import, dan Query Tools.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-black/5 dark:bg-white/5 space-y-2">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Data Yang Aman Dipertahankan:
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-4 list-disc">
              <li>Akun Pengguna, Password, dan Hak Akses Role (Admin, PM, dll).</li>
              <li>Profil Identitas Perusahaan (Company Master).</li>
              <li>Master Referensi (Prioritas, Status, Milestone, Hari Libur).</li>
              <li>Konfigurasi Sistem SMTP Email & Template Notifikasi.</li>
              <li>Wadah Struktur Proyek & Kategori (kosong tanpa tugas).</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-rose-500/20">
          <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
            <input 
              type="checkbox" 
              checked={resetPoints} 
              onChange={(e) => setResetPoints(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <span>Reset juga akumulasi poin hadiah & streak harian anggota tim menjadi 0</span>
          </label>

          <button
            type="button"
            onClick={handleOpenFullModal}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Mulai Reset Penuh Database
          </button>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5 animate-scale-up"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${modalType === 'full' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {modalType === 'full' ? 'Konfirmasi Reset Penuh Database' : 'Konfirmasi Penghapusan Parsial'}
                  </h3>
                  <p className="text-xs text-rose-500 font-semibold mt-0.5">
                    Tindakan ini permanen dan data TIDAK BISA dipulihkan!
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                disabled={executing}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Execution Result Banner */}
            {executionResult ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{executionResult.message}</span>
                </div>
                {executionResult.deletedCounts && (
                  <div className="text-xs space-y-1 pl-7 font-mono">
                    {Object.entries(executionResult.deletedCounts).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className="font-bold">{val?.toLocaleString('id-ID')} baris</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Tutup & Selesai
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border text-xs space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Ringkasan Tindakan:
                  </div>
                  {modalType === 'partial' ? (
                    <div className="space-y-1 text-slate-600 dark:text-slate-300">
                      <div>Modul yang dipilih: <strong>{selectedModules.join(', ')}</strong></div>
                      <div>Estimasi data terhapus: <strong>~{calculateSelectedRecords().toLocaleString('id-ID')} baris</strong></div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-600 dark:text-slate-300">
                      <div>Mode: <strong>Pembersihan Total Semua Modul Operasional</strong></div>
                      <div>Estimasi data terhapus: <strong>~{stats?.grandTotalRecords?.toLocaleString('id-ID') ?? 0} baris</strong></div>
                      {resetPoints && <div className="text-amber-500">• Akumulasi poin user akan di-reset ke 0.</div>}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                    Untuk mencegah ketidaksengajaan, ketik kata verifikasi{' '}
                    <span className="font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-rose-500 font-bold">
                      {modalType === 'full' ? 'RESET PENUH' : 'HAPUS SELEKSI'}
                    </span>{' '}
                    di bawah ini:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={modalType === 'full' ? 'Ketik RESET PENUH' : 'Ketik HAPUS SELEKSI'}
                    disabled={executing}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={executing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePurge}
                    disabled={
                      executing || 
                      (modalType === 'partial' && !confirmText.trim().match(/^HAPUS SELEKSI$/i)) ||
                      (modalType === 'full' && !confirmText.trim().match(/^RESET PENUH$/i))
                    }
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                      modalType === 'full' 
                        ? 'bg-rose-600 hover:bg-rose-700 active:scale-95' 
                        : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                    }`}
                  >
                    {executing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eksekusi {modalType === 'full' ? 'Reset Penuh' : 'Penghapusan'}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
