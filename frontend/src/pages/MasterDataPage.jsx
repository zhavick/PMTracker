import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Flag, 
  CheckCircle, 
  Layers, 
  Folder, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  AlertCircle, 
  Check, 
  Palette,
  Hash,
  Clock,
  Globe,
  ShieldCheck
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { TIMEZONE_OPTIONS, getAppTimezone, setAppTimezone, formatTimeInTz, formatDateInTz } from '../utils/timezoneHelper';

export default function MasterDataPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState('priorities'); // priorities, statuses, milestones, categories, timezone
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Timezone Config State
  const [selectedTz, setSelectedTz] = useState(getAppTimezone());
  const [liveClock, setLiveClock] = useState(new Date());

  // App Identity / Branding Config State
  const [appConfig, setAppConfig] = useState({
    appName: 'Work Tracker Pro v3.6 • Enterprise Edition',
    companyName: 'PT Elistec Teknologi',
    description: 'Enterprise Task & Workforce Tracker'
  });
  const [isSavingAppConfig, setIsSavingAppConfig] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveTimezone = () => {
    setAppTimezone(selectedTz);
    setSuccessMsg(`Zona waktu aplikasi berhasil diperbarui ke ${selectedTz}. Semua modul absensi dan clocker kini menggunakan zona waktu ini.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleSaveAppConfig = async (e) => {
    if (e) e.preventDefault();
    if (!appConfig.appName.trim() || !appConfig.companyName.trim()) {
      setError('Nama aplikasi dan nama perusahaan tidak boleh kosong.');
      return;
    }
    setIsSavingAppConfig(true);
    setError(null);
    try {
      const res = await axiosClient.put('/api/app-settings', {
        appName: appConfig.appName.trim(),
        companyName: appConfig.companyName.trim(),
        description: appConfig.description?.trim()
      });
      setSuccessMsg(res.data?.message || 'Identitas aplikasi berhasil diperbarui.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan konfigurasi aplikasi.');
    } finally {
      setIsSavingAppConfig(false);
    }
  };

  // Data states
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchActiveData();
  }, [activeTab]);

  const fetchActiveData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'appConfig') {
        const res = await axiosClient.get('/api/app-settings');
        if (res.data?.data) {
          setAppConfig({
            appName: res.data.data.appName || 'Work Tracker Pro v3.6 • Enterprise Edition',
            companyName: res.data.data.companyName || 'PT Elistec Teknologi',
            description: res.data.data.description || 'Enterprise Task & Workforce Tracker'
          });
        }
      } else if (activeTab === 'priorities') {
        const res = await axiosClient.get('/api/master-data/priorities');
        setPriorities(res.data?.data || []);
      } else if (activeTab === 'statuses') {
        const res = await axiosClient.get('/api/master-data/statuses');
        setStatuses(res.data?.data || []);
      } else if (activeTab === 'milestones') {
        const res = await axiosClient.get('/api/master-data/milestones');
        setMilestones(res.data?.data || []);
      } else if (activeTab === 'categories') {
        const res = await axiosClient.get('/api/master-data/categories');
        setCategories(res.data?.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentEditId(null);
    if (activeTab === 'priorities') {
      setFormData({ name: '', color: '#3B82F6', icon: 'Flag', orderIndex: priorities.length + 1, description: '', isDefault: false });
    } else if (activeTab === 'statuses') {
      setFormData({ name: '', color: '#10B981', isDoneState: false, orderIndex: statuses.length + 1, description: '', isDefault: false });
    } else if (activeTab === 'milestones') {
      setFormData({ name: '', phase: 'Development', color: '#8B5CF6', icon: 'Code', orderIndex: milestones.length + 1, description: '', isDefault: false });
    } else if (activeTab === 'categories') {
      setFormData({ name: '', description: '', icon: 'Folder', color: '#EC4899' });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setCurrentEditId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    try {
      if (modalMode === 'create') {
        await axiosClient.post(`/api/master-data/${activeTab}`, formData);
        setSuccessMsg('Data master berhasil ditambahkan.');
      } else {
        await axiosClient.put(`/api/master-data/${activeTab}/${currentEditId}`, formData);
        setSuccessMsg('Data master berhasil diperbarui.');
      }
      setIsModalOpen(false);
      fetchActiveData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Settings className="w-7 h-7 text-indigo-500" />
            Master Data & SDLC Waterfall
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Kelola Prioritas, Status Pekerjaan, Tahapan SDLC Waterfall, dan Kategori Tugas & Dokumen
          </p>
        </div>

        {isAdmin && activeTab !== 'timezone' && activeTab !== 'appConfig' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-md hover:opacity-95 transition-all self-start md:self-auto"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('priorities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'priorities'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'priorities' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'priorities' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <Flag className="w-4 h-4" />
          Prioritas Tugas ({priorities.length})
        </button>

        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'statuses'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'statuses' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'statuses' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <CheckCircle className="w-4 h-4" />
          Status Pekerjaan ({statuses.length})
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'milestones'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'milestones' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'milestones' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <Layers className="w-4 h-4" />
          Milestone SDLC ({milestones.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'categories'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'categories' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'categories' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <Folder className="w-4 h-4" />
          Kategori Dokumen ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('timezone')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'timezone'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'timezone' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'timezone' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <Globe className="w-4 h-4" />
          Konfigurasi Waktu & Timezone (GMT+7)
        </button>

        <button
          onClick={() => setActiveTab('appConfig')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'appConfig'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'appConfig' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'appConfig' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <ShieldCheck className="w-4 h-4" />
          Identitas Aplikasi & Footer Panduan
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Table / Cards */}
      {activeTab === 'appConfig' ? (
        <div 
          className="rounded-2xl border shadow-sm p-6 space-y-6" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                Konfigurasi Identitas Aplikasi & Perusahaan Pembuat
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Atur nama aplikasi dan nama perusahaan pembuat sistem. Nilai ini tampil secara dinamis pada bagian footer Buku Panduan Pengguna (User Guide) dan branding platform.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 self-start md:self-auto">
              Konfigurasi Admin
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Nama Aplikasi Resmi (Footer Kiri Panduan)
                </label>
                <input
                  type="text"
                  value={appConfig.appName}
                  onChange={(e) => setAppConfig({ ...appConfig, appName: e.target.value })}
                  placeholder="Work Tracker Pro v3.6 • Enterprise Edition"
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <code className="text-indigo-400">Work Tracker Pro v3.6 • Enterprise Edition</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Nama Perusahaan Pembuat (Footer Kanan Panduan)
                </label>
                <input
                  type="text"
                  value={appConfig.companyName}
                  onChange={(e) => setAppConfig({ ...appConfig, companyName: e.target.value })}
                  placeholder="PT Elistec Teknologi"
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <code className="text-indigo-400">PT Elistec Teknologi</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Deskripsi Singkat Sistem (Opsional)
                </label>
                <input
                  type="text"
                  value={appConfig.description || ''}
                  onChange={(e) => setAppConfig({ ...appConfig, description: e.target.value })}
                  placeholder="Enterprise Task & Workforce Tracker"
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Pratinjau Footer Halaman Panduan Pengguna
              </label>

              <div 
                className="p-5 rounded-2xl border space-y-4 shadow-sm"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">Simulasi Tampilan Footer Panduan:</p>
                  <p className="text-[11px]">Footer halaman panduan akan menampilkan teks nama aplikasi di sisi kiri dan perusahaan pembuat di sisi kanan.</p>
                </div>

                <div 
                  className="pt-4 pb-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs" 
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <span className="font-medium tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    {appConfig.appName || 'Work Tracker Pro v3.6 • Enterprise Edition'}
                  </span>
                  <span className="font-semibold text-indigo-500">
                    {appConfig.companyName || 'PT Elistec Teknologi'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Perubahan konfigurasi ini disimpan ke database (tabel <code className="text-indigo-300 font-mono">SystemSettings</code>) dan langsung tersinkronisasi saat halaman Buku Panduan dibuka kembali.
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs text-slate-400">
                Pastikan nama aplikasi dan nama perusahaan telah sesuai sebelum menyimpan.
              </p>
              <button
                onClick={handleSaveAppConfig}
                disabled={isSavingAppConfig}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all self-end sm:self-auto disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Save className="w-4 h-4" />
                {isSavingAppConfig ? 'Menyimpan...' : 'Simpan Identitas Aplikasi'}
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'timezone' ? (
        <div 
          className="rounded-2xl border shadow-sm p-6 space-y-6" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-5 h-5 text-indigo-500" />
                Pengaturan Zona Waktu Operasional (Default: GMT+7 WIB)
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Zona waktu ini digunakan sebagai acuan global untuk modul Clocker, Timesheet harian, input kehadiran (Presensi), dan log aktivitas tugas di seluruh aplikasi.
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl border flex items-center gap-3 bg-indigo-500/10 border-indigo-500/30 self-start md:self-auto">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Waktu Sistem Saat Ini</p>
                <p className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatTimeInTz(liveClock, selectedTz)} <span className="text-xs font-semibold text-indigo-400">{TIMEZONE_OPTIONS.find(o => o.value === selectedTz)?.abbr}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {formatDateInTz(liveClock, selectedTz)}
                </p>
              </div>
            </div>
          </div>

          {/* Timezone Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIMEZONE_OPTIONS.map((tz) => {
              const isSelected = selectedTz === tz.value;
              return (
                <div
                  key={tz.value}
                  onClick={() => setSelectedTz(tz.value)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                      : 'hover:border-slate-400/50 hover:bg-slate-500/5'
                  }`}
                  style={{ borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)' }}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {tz.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-slate-500/15" style={{ color: 'var(--text-primary)' }}>
                        {tz.abbr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-mono">
                      Contoh Jam: <span className="font-bold text-indigo-400">{formatTimeInTz(liveClock, tz.value)}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Identitas IANA: <code className="font-mono">{tz.value}</code>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs text-slate-400">
              Pengaturan zona waktu disimpan di browser dan sistem ini secara default mengacu pada <strong className="text-indigo-400">GMT+7 (WIB / Asia/Jakarta)</strong>.
            </p>
            <button
              onClick={handleSaveTimezone}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all self-end sm:self-auto"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan Zona Waktu
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="rounded-2xl border shadow-sm overflow-hidden" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat data master...</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wider font-semibold" style={{ backgroundColor: 'var(--bg-tertiary, rgba(0,0,0,0.02))', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                <tr>
                  <th className="px-6 py-3.5">Urutan</th>
                  <th className="px-6 py-3.5">Nama & Label</th>
                  {activeTab === 'milestones' && <th className="px-6 py-3.5">Fase SDLC</th>}
                  {activeTab === 'statuses' && <th className="px-6 py-3.5">Tipe Selesai (Done)</th>}
                  <th className="px-6 py-3.5">Keterangan</th>
                  {activeTab !== 'categories' && <th className="px-6 py-3.5">Default</th>}
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {activeTab === 'priorities' && priorities.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                      #{p.orderIndex}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#3B82F6' }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                        {p.icon && <span className="text-xs px-2 py-0.5 rounded-md bg-slate-500/10 font-mono" style={{ color: 'var(--text-secondary)' }}>{p.icon}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {p.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {p.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors text-indigo-500"
                          title="Edit Prioritas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {activeTab === 'statuses' && statuses.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                      #{s.orderIndex}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#10B981' }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.isDoneState ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Selesai (100%)
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-500/10" style={{ color: 'var(--text-secondary)' }}>
                          Berjalan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {s.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {s.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors text-indigo-500"
                          title="Edit Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {activeTab === 'milestones' && milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                      #{m.orderIndex}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color || '#8B5CF6' }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400">
                        {m.phase || 'SDLC'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {m.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {m.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors text-indigo-500"
                          title="Edit Milestone"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {activeTab === 'categories' && categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                      #{c.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || '#EC4899' }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {c.description || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors text-indigo-500"
                          title="Edit Kategori"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {modalMode === 'create' ? 'Tambah Data Master' : 'Edit Data Master'} - {activeTab.toUpperCase()}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nama Label *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Sangat Mendesak / UAT / Selesai"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {activeTab === 'milestones' && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Fase SDLC Waterfall *
                  </label>
                  <select
                    value={formData.phase || 'Development'}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="Requirements">Requirements & Analysis</option>
                    <option value="Design">System & UI Architecture Design</option>
                    <option value="Implementation">Implementation & Coding</option>
                    <option value="Testing">Testing, QA & UAT</option>
                    <option value="Deployment">Deployment & Production Release</option>
                    <option value="Maintenance">Maintenance & Operations</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Palette className="w-3.5 h-3.5" /> Warna Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={formData.color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {activeTab !== 'categories' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Hash className="w-3.5 h-3.5" /> Urutan (Index)
                    </label>
                    <input
                      type="number"
                      value={formData.orderIndex || 1}
                      onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan operasional..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {activeTab === 'statuses' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDoneState"
                    checked={formData.isDoneState || false}
                    onChange={(e) => setFormData({ ...formData, isDoneState: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isDoneState" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Merupakan Status Selesai / Done (Progress Otomatis 100%)
                  </label>
                </div>
              )}

              {activeTab !== 'categories' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Jadikan Opsi Default saat membuat tugas baru
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-500/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-md hover:opacity-95 transition-all"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
