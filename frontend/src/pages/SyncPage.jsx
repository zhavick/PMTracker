import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Server, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Send, 
  Download, 
  Upload,
  ArrowUpRight,
  ArrowDownLeft,
  Key,
  ShieldCheck,
  ExternalLink,
  Layers, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  FileText,
  HardDrive,
  Save,
  Check,
  Sliders,
  FolderArchive,
  Award,
  Calendar,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function SyncPage() {
  const [localStatus, setLocalStatus] = useState(null);
  const [settings, setSettings] = useState({
    targetHostUrl: 'https://tracker.saidilmuna.space',
    apiKey: 'TrackerKerja_Default_Sync_Secret_Key_2026!',
    cleanBeforeSyncDefault: false,
    backupBeforeSyncDefault: true,
    syncFilesDefault: true
  });
  const [loading, setLoading] = useState(true);
  const [remotePing, setRemotePing] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncActionType, setSyncActionType] = useState(''); // 'push' | 'pull' | 'export-sql' | 'export-pkg' | 'import-sql' | 'import-pkg'
  const [syncResult, setSyncResult] = useState(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // File upload state for manual import
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState('sql'); // 'sql' | 'pkg'
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Granular Module Sync State (FSD v3.7)
  const [modSyncSettings, setModSyncSettings] = useState({
    targetHostUrl: 'https://tracker.saidilmuna.space',
    email: 'admin@trackerkerja.com',
    password: 'Password123!',
    syncDirection: 'Pull', // 'Pull', 'Push'
    syncNotes: true,
    syncAttendance: true,
    syncGamification: true,
    showPassword: false
  });
  const [modSyncLoading, setModSyncLoading] = useState(false);
  const [modSyncResult, setModSyncResult] = useState(null);
  const [modSyncError, setModSyncError] = useState(null);
  const [showLogDetails, setShowLogDetails] = useState(false);

  // Fetch initial local status & settings
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resStatus, resSettings] = await Promise.allSettled([
        axiosClient.get('/api/sync/status'),
        axiosClient.get('/api/sync/settings')
      ]);

      if (resStatus.status === 'fulfilled' && resStatus.value.data?.data) {
        setLocalStatus(resStatus.value.data.data);
      } else {
        // Fallback to summary
        const resSum = await axiosClient.get('/api/sync/summary');
        if (resSum.data?.data) {
          setLocalStatus(resSum.data.data);
        }
      }

      if (resSettings.status === 'fulfilled' && resSettings.value.data?.data) {
        setSettings(resSettings.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load sync data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Ping Host Induk
  const handlePingHost = async (e) => {
    if (e) e.preventDefault();
    setPingLoading(true);
    setRemotePing(null);
    try {
      const res = await axiosClient.get('/api/sync/ping', {
        params: {
          remoteUrl: settings.targetHostUrl,
          apiKey: settings.apiKey,
          bearerToken: settings.bearerToken
        }
      });
      if (res.data?.data) {
        setRemotePing(res.data.data);
      }
    } catch (err) {
      setRemotePing({
        isOnline: false,
        message: err.response?.data?.message || err.message || 'Gagal menghubungi Server Induk. Pastikan URL dan koneksi internet stabil.'
      });
    } finally {
      setPingLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.put('/api/sync/settings', settings);
      if (res.data?.data) {
        setSettings(res.data.data);
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      alert('Gagal menyimpan pengaturan: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Push to Master
  const handlePush = async () => {
    if (!window.confirm(`Yakin ingin mengirim (Push) seluruh data lokal ke Server Induk (${settings.targetHostUrl})?`)) return;
    setSyncLoading(true);
    setSyncActionType('push');
    setSyncResult(null);
    try {
      const res = await axiosClient.post('/api/sync/push', {
        targetHostUrl: settings.targetHostUrl,
        apiKey: settings.apiKey,
        bearerToken: settings.bearerToken,
        cleanBeforeSync: settings.cleanBeforeSyncDefault,
        backupBeforeSync: settings.backupBeforeSyncDefault,
        syncFiles: settings.syncFilesDefault,
        sourceLabel: `Client Node (${localStatus?.hostName || 'Local'})`
      });
      setSyncResult({
        success: true,
        message: res.data?.message || 'Proses Push ke Server Induk berhasil diselesaikan!',
        data: res.data?.data
      });
      fetchInitialData();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal melakukan Push ke Server Induk.'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle Pull from Master
  const handlePull = async () => {
    if (!window.confirm(`PERINGATAN: Menarik data (Pull) dari Server Induk (${settings.targetHostUrl}) akan memperbarui basis data lokal Anda. Lanjutkan?`)) return;
    setSyncLoading(true);
    setSyncActionType('pull');
    setSyncResult(null);
    try {
      const res = await axiosClient.post('/api/sync/pull', {
        targetHostUrl: settings.targetHostUrl,
        apiKey: settings.apiKey,
        bearerToken: settings.bearerToken,
        cleanBeforeSync: settings.cleanBeforeSyncDefault,
        backupBeforeSync: settings.backupBeforeSyncDefault,
        syncFiles: settings.syncFilesDefault
      });
      setSyncResult({
        success: true,
        message: res.data?.message || 'Data berhasil ditarik dari Server Induk ke node lokal!',
        data: res.data?.data
      });
      fetchInitialData();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal melakukan Pull dari Server Induk.'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle Direct File Download
  const handleDownload = async (type) => {
    try {
      const url = type === 'sql' ? '/api/sync/export-sql' : '/api/sync/export-package';
      const ext = type === 'sql' ? 'sql' : 'zip';
      const res = await axiosClient.get(url, { responseType: 'blob' });
      
      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `worktracker_${type === 'sql' ? 'backup' : 'package'}_${new Date().toISOString().slice(0, 10)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mengunduh berkas: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Manual File Import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Pilih berkas yang akan diunggah.');
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const endpoint = importType === 'sql' ? '/api/sync/import-sql' : '/api/sync/import-package';
      const res = await axiosClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportResult({
        success: true,
        message: res.data?.message || 'Berkas berhasil diproses dan diimpor ke database lokal!'
      });
      setImportFile(null);
      fetchInitialData();
    } catch (err) {
      setImportResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal mengimpor berkas.'
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Granular Module Sync (Selective Sync)
  const handleGranularModuleSync = async (e) => {
    if (e) e.preventDefault();
    if (!modSyncSettings.syncNotes && !modSyncSettings.syncAttendance && !modSyncSettings.syncGamification) {
      alert('Pilih setidaknya satu modul (Catatan, Presensi, atau Gamifikasi) untuk disinkronkan.');
      return;
    }

    setModSyncLoading(true);
    setModSyncResult(null);
    setModSyncError(null);

    try {
      const payload = {
        targetHostUrl: modSyncSettings.targetHostUrl.trim(),
        email: modSyncSettings.email.trim(),
        password: modSyncSettings.password,
        syncDirection: modSyncSettings.syncDirection,
        syncNotes: modSyncSettings.syncNotes,
        syncAttendance: modSyncSettings.syncAttendance,
        syncGamification: modSyncSettings.syncGamification,
        timeoutSeconds: 30
      };

      const res = await axiosClient.post('/api/sync/modules', payload);
      if (res.data?.success && res.data?.data) {
        setModSyncResult(res.data.data);
        fetchInitialData();
      } else {
        setModSyncError(res.data?.message || 'Sinkronisasi granular gagal.');
      }
    } catch (err) {
      console.error('Modular sync error', err);
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat sinkronisasi modul.';
      const details = err.response?.data?.errors || err.response?.data?.data?.details || [];
      setModSyncError({ message: msg, details: Array.isArray(details) ? details : [details] });
    } finally {
      setModSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <RefreshCw className="w-7 h-7 text-indigo-500" />
            Sinkronisasi Server Induk & Multi-Node
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Replikasi dua arah (Push/Pull) dengan Server Induk <span className="font-semibold text-indigo-500">https://tracker.saidilmuna.space/</span> dan Swagger API terotorisasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border hover:bg-slate-500/10 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <ExternalLink className="w-4 h-4 text-emerald-500" />
            Buka Swagger API
          </a>
          <button
            onClick={fetchInitialData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border hover:bg-slate-500/10 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Status
          </button>
        </div>
      </div>

      {/* Swagger & Otorisasi Banner */}
      <div 
        className="rounded-2xl border p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-500 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Akses Swagger API & Petunjuk Otorisasi
              <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Bearer JWT + X-Sync-ApiKey
              </span>
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              1. Buka Swagger lokal di <a href="http://localhost:5000/swagger" target="_blank" rel="noreferrer" className="underline font-mono text-indigo-500 font-semibold">http://localhost:5000/swagger</a>.<br/>
              2. Klik tombol hijau <strong>Authorize</strong> di kanan atas halaman Swagger.<br/>
              3. Masukkan <strong>Bearer &lt;token_jwt&gt;</strong> (setelah login via <code>/api/auth/login</code>) atau isi <strong>X-Sync-ApiKey</strong> untuk endpoint sinkronisasi.<br/>
              4. Otorisasi kini tersimpan otomatis (<em>Persistent Authorization</em>) sehingga tidak hilang saat refresh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="https://tracker.saidilmuna.space/swagger/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border hover:bg-slate-500/10 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Swagger Server Induk
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grid: Status Lokal & Status Server Induk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Lokal Stats */}
        <div 
          className="rounded-2xl border p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-500">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Node Lokal (Child Node)
                </h2>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Mesin: {localStatus?.hostName || localStatus?.instanceId || 'Local Machine'} • {localStatus?.databaseType || localStatus?.databaseEngine || 'MySQL 8.4 LTS'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-500">Online</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xl font-bold font-mono text-indigo-500">{localStatus?.totalTasks || 0}</span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Tugas</p>
            </div>
            <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xl font-bold font-mono text-sky-500">{localStatus?.totalProjects || 0}</span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Proyek</p>
            </div>
            <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xl font-bold font-mono text-emerald-500">{localStatus?.totalUsers || 0}</span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pengguna</p>
            </div>
            <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xl font-bold font-mono text-amber-500">{localStatus?.totalSessions || 0}</span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Sesi Jam</p>
            </div>
            <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xl font-bold font-mono text-purple-500">{localStatus?.totalUploadFiles || 0}</span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Berkas File</p>
            </div>
            <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xl font-bold font-mono text-rose-500">{localStatus?.totalUploadsFormatted || '0 B'}</span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Ukuran Upload</p>
            </div>
          </div>
        </div>

        {/* Server Induk Remote Stats */}
        <div 
          className="rounded-2xl border p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/15 text-sky-500">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Server Induk (Host Master)
                </h2>
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {settings.targetHostUrl}
                </span>
              </div>
            </div>

            <button
              onClick={handlePingHost}
              disabled={pingLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Radio className={`w-3.5 h-3.5 ${pingLoading ? 'animate-ping' : ''}`} />
              {pingLoading ? 'Memeriksa...' : 'Cek Status Host'}
            </button>
          </div>

          {remotePing ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                remotePing.isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                {remotePing.isOnline ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{remotePing.message}</span>
              </div>

              {remotePing.isOnline && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xl font-bold font-mono text-indigo-500">{remotePing.totalTasks || 0}</span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Tugas Induk</p>
                  </div>
                  <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xl font-bold font-mono text-sky-500">{remotePing.totalProjects || 0}</span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Proyek Induk</p>
                  </div>
                  <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xl font-bold font-mono text-emerald-500">{remotePing.totalUsers || 0}</span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>User Induk</p>
                  </div>
                  <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xl font-bold font-mono text-amber-500">{remotePing.totalSessions || 0}</span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Sesi Induk</p>
                  </div>
                  <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xl font-bold font-mono text-purple-500">{remotePing.totalUploadFiles || 0}</span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Berkas Induk</p>
                  </div>
                  <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xl font-bold font-mono text-rose-500">{remotePing.totalUploadsFormatted || '0 B'}</span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Ukuran Upload</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <Radio className="w-6 h-6 text-slate-400" />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Klik tombol <strong>Cek Status Host</strong> untuk menguji responsibilitas dan mengambil statistik dari server induk.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Operasi Replikasi Sinkronisasi (Push / Pull) */}
      <div 
        className="rounded-2xl border p-6 shadow-sm space-y-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <RefreshCw className="w-5 h-5 text-indigo-500" />
              Operasi Replikasi Dua Arah (Two-Way Live Sync)
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Kirimkan data lokal ke Server Induk atau tarik data dari Server Induk secara otomatis via REST API.
            </p>
          </div>
        </div>

        {/* Sync Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Push Card */}
          <div 
            className="p-5 rounded-xl border space-y-3.5"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-500">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Push ke Server Induk
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Kirimkan tugas, sesi, proyek, absensi & berkas upload dari lokal ke server induk.
                </p>
              </div>
            </div>

            <button
              onClick={handlePush}
              disabled={syncLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Send className={`w-4 h-4 ${syncLoading && syncActionType === 'push' ? 'animate-bounce' : ''}`} />
              {syncLoading && syncActionType === 'push' ? 'Sedang Mengirim ke Induk...' : 'Kirim Data (Push ke Induk)'}
            </button>
          </div>

          {/* Pull Card */}
          <div 
            className="p-5 rounded-xl border space-y-3.5"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/15 text-sky-500">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Pull dari Server Induk
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Tarik entitas dan berkas lampiran dari server induk ke dalam basis data node lokal.
                </p>
              </div>
            </div>

            <button
              onClick={handlePull}
              disabled={syncLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border hover:bg-slate-500/10 transition-all disabled:opacity-50"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading && syncActionType === 'pull' ? 'animate-spin' : ''}`} />
              {syncLoading && syncActionType === 'pull' ? 'Sedang Menarik Data...' : 'Tarik Data (Pull dari Induk)'}
            </button>
          </div>
        </div>

        {/* Sync Execution Alert */}
        {syncResult && (
          <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            syncResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            {syncResult.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <p className="font-semibold">{syncResult.message}</p>
              {syncResult.data && (
                <p className="text-xs font-mono opacity-90">
                  Statement dieksekusi: {syncResult.data.executedStatementsCount || 0} • File: {syncResult.data.syncedFilesCount || 0} ({syncResult.data.syncedFilesSizeFormatted || '0 B'}) • Durasi: {syncResult.data.executionDurationMs || 0}ms
                  {syncResult.data.backupFileName && ` • Backup: ${syncResult.data.backupFileName}`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SINKRONISASI GRANULAR PER MODUL (SELECTIVE SYNC - FSD v3.7) */}
      <div 
        className="rounded-2xl border p-6 shadow-sm space-y-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-500 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Sinkronisasi Granular per Modul (Selective Sync)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                  FSD v3.7
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Sinkronkan data secara spesifik untuk modul Catatan Kerja, Presensi Tim, atau Gamifikasi tanpa me-replace seluruh database.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              REST API Direct Mode
            </span>
          </div>
        </div>

        <form onSubmit={handleGranularModuleSync} className="space-y-5">
          {/* Target Host & Credentials Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Target Server Induk (Host URL)
              </label>
              <input
                type="url"
                required
                value={modSyncSettings.targetHostUrl}
                onChange={(e) => setModSyncSettings({ ...modSyncSettings, targetHostUrl: e.target.value })}
                placeholder="https://tracker.saidilmuna.space"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email Akun Administrator Remote
              </label>
              <input
                type="email"
                required
                value={modSyncSettings.email}
                onChange={(e) => setModSyncSettings({ ...modSyncSettings, email: e.target.value })}
                placeholder="admin@trackerkerja.com"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Kata Sandi Administrator Remote
              </label>
              <div className="relative">
                <input
                  type={modSyncSettings.showPassword ? 'text' : 'password'}
                  required
                  value={modSyncSettings.password}
                  onChange={(e) => setModSyncSettings({ ...modSyncSettings, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setModSyncSettings({ ...modSyncSettings, showPassword: !modSyncSettings.showPassword })}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {modSyncSettings.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Module Selector & Direction Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Pilihan Modul */}
            <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                1. Pilih Modul yang Ingin Disinkronkan:
              </span>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:opacity-90 transition-all text-xs" style={{ borderColor: modSyncSettings.syncNotes ? 'var(--accent-primary)' : 'var(--border-color)', backgroundColor: modSyncSettings.syncNotes ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={modSyncSettings.syncNotes}
                    onChange={(e) => setModSyncSettings({ ...modSyncSettings, syncNotes: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-500 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>Catatan Kerja & Dokumentasi (Notes)</span>
                    <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>Sinkronkan judul, konten HTML, kategori, pin, dan lampiran catatan</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:opacity-90 transition-all text-xs" style={{ borderColor: modSyncSettings.syncAttendance ? 'var(--accent-primary)' : 'var(--border-color)', backgroundColor: modSyncSettings.syncAttendance ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={modSyncSettings.syncAttendance}
                    onChange={(e) => setModSyncSettings({ ...modSyncSettings, syncAttendance: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/15 text-blue-500 flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>Presensi Kehadiran Tim (Attendance)</span>
                    <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>Sinkronkan rekap check-in/out, durasi kerja, dan catatan per user</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:opacity-90 transition-all text-xs" style={{ borderColor: modSyncSettings.syncGamification ? 'var(--accent-primary)' : 'var(--border-color)', backgroundColor: modSyncSettings.syncGamification ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={modSyncSettings.syncGamification}
                    onChange={(e) => setModSyncSettings({ ...modSyncSettings, syncGamification: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-500 flex-shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>Gamifikasi & Lencana Prestasi (Master Badges)</span>
                    <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>Katalog 40+ lencana prestasi, poin reward, dan trigger otomatis</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Arah Sinkronisasi */}
            <div className="p-4 rounded-xl border space-y-3 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div>
                <span className="text-xs font-bold block mb-3" style={{ color: 'var(--text-primary)' }}>
                  2. Pilih Arah Replikasi Data:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModSyncSettings({ ...modSyncSettings, syncDirection: 'Pull' })}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      modSyncSettings.syncDirection === 'Pull' 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-slate-500/20 hover:bg-slate-500/5'
                    }`}
                  >
                    <ArrowDownLeft className={`w-4 h-4 mt-0.5 ${modSyncSettings.syncDirection === 'Pull' ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                        Tarik Data (Pull)
                      </span>
                      <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Ambil data dari Host Induk dan perbarui basis data lokal
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModSyncSettings({ ...modSyncSettings, syncDirection: 'Push' })}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      modSyncSettings.syncDirection === 'Push' 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-slate-500/20 hover:bg-slate-500/5'
                    }`}
                  >
                    <ArrowUpRight className={`w-4 h-4 mt-0.5 ${modSyncSettings.syncDirection === 'Push' ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                        Kirim Data (Push)
                      </span>
                      <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Unggah perubahan data lokal ke Server Induk
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t mt-3 flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Aman: Menggunakan pemetaan email unik pengguna
                </span>
                <button
                  type="submit"
                  disabled={modSyncLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <RefreshCw className={`w-4 h-4 ${modSyncLoading ? 'animate-spin' : ''}`} />
                  {modSyncLoading ? 'Memproses Sinkronisasi...' : 'Mulai Sinkronisasi Selektif'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Hasil Eksekusi Modular Sync */}
        {modSyncResult && (
          <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm">{modSyncResult.message}</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20">
                {modSyncResult.executionDurationMs} ms
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border bg-white/40 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px] block opacity-80">Notes Baru</span>
                <span className="text-base font-bold">+{modSyncResult.notesSynced}</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-white/40 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px] block opacity-80">Notes Update</span>
                <span className="text-base font-bold">~{modSyncResult.notesUpdated}</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-white/40 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px] block opacity-80">Absensi Baru</span>
                <span className="text-base font-bold">+{modSyncResult.attendancesSynced}</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-white/40 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px] block opacity-80">Absensi Update</span>
                <span className="text-base font-bold">~{modSyncResult.attendancesUpdated}</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-white/40 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px] block opacity-80">Badges Baru</span>
                <span className="text-base font-bold">+{modSyncResult.badgesSynced}</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-white/40 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[11px] block opacity-80">Badges Update</span>
                <span className="text-base font-bold">~{modSyncResult.userBadgesSynced}</span>
              </div>
            </div>

            {modSyncResult.details && modSyncResult.details.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowLogDetails(!showLogDetails)}
                  className="inline-flex items-center gap-1 text-xs font-semibold underline opacity-90 hover:opacity-100"
                >
                  {showLogDetails ? 'Sembunyikan Log Rinci' : 'Tampilkan Log Rinci'}
                  {showLogDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showLogDetails && (
                  <div className="mt-2 p-3 rounded-lg bg-black/40 text-slate-200 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
                    {modSyncResult.details.map((line, idx) => (
                      <div key={idx} className="leading-relaxed">{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {modSyncError && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold">
                {typeof modSyncError === 'string' ? modSyncError : modSyncError.message}
              </span>
            </div>
            {modSyncError.details && modSyncError.details.length > 0 && (
              <ul className="text-xs font-mono list-disc list-inside space-y-0.5 opacity-90 pl-1">
                {modSyncError.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Ekspor & Impor Paket / SQL Backup Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ekspor Manual */}
        <div 
          className="rounded-2xl border p-6 shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-500">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Ekspor Manual (Backup & Snapshot)
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Unduh salinan cadangan SQL murni atau paket arsip ZIP (termasuk folder uploads)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div>
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>SQL Dump Backup</h4>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Naskah query DDL/DML untuk MySQL 8.4 LTS</p>
              </div>
              <button
                onClick={() => handleDownload('sql')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-slate-500/10 transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <Download className="w-3.5 h-3.5" />
                Unduh .SQL
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div>
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Paket Arsip ZIP Lengkap</h4>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Berisi database dump + seluruh berkas lampiran uploads</p>
              </div>
              <button
                onClick={() => handleDownload('pkg')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <FolderArchive className="w-3.5 h-3.5" />
                Unduh .ZIP
              </button>
            </div>
          </div>
        </div>

        {/* Impor Manual */}
        <div 
          className="rounded-2xl border p-6 shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-500">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Impor & Pulihkan Data (Restore)
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Unggah berkas .sql atau .zip dari server induk untuk diterapkan ke lokal
              </span>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-3">
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                <input 
                  type="radio" 
                  name="importType" 
                  checked={importType === 'sql'} 
                  onChange={() => setImportType('sql')} 
                  className="text-indigo-600"
                />
                File .SQL Dump
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer ml-4" style={{ color: 'var(--text-primary)' }}>
                <input 
                  type="radio" 
                  name="importType" 
                  checked={importType === 'pkg'} 
                  onChange={() => setImportType('pkg')} 
                  className="text-indigo-600"
                />
                File .ZIP Paket Kompresi
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept={importType === 'sql' ? '.sql' : '.zip'}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="flex-1 text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-600 hover:file:bg-indigo-500/20"
                style={{ color: 'var(--text-secondary)' }}
              />
              <button
                type="submit"
                disabled={importLoading || !importFile}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Upload className={`w-3.5 h-3.5 ${importLoading ? 'animate-bounce' : ''}`} />
                {importLoading ? 'Memproses...' : 'Terapkan'}
              </button>
            </div>

            {importResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                importResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                {importResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{importResult.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Pengaturan Konfigurasi Sinkronisasi */}
      <div 
        className="rounded-2xl border p-6 shadow-sm space-y-5"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-500">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Konfigurasi Host Induk & Secret Key Sinkronisasi
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Parameter koneksi dan otorisasi API key untuk komunikasi antar server
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Target Host URL Server Induk *
              </label>
              <input
                type="url"
                required
                value={settings.targetHostUrl}
                onChange={(e) => setSettings({ ...settings, targetHostUrl: e.target.value })}
                placeholder="https://tracker.saidilmuna.space"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Header X-Sync-ApiKey *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={settings.apiKey || ''}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="TrackerKerja_Default_Sync_Secret_Key_2026!"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <Key className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Bearer Token Administrator Server Induk (Opsional / Tambahan)
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.bearerToken || ''}
                onChange={(e) => setSettings({ ...settings, bearerToken: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token JWT dari login server induk jika diperlukan)"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <ShieldCheck className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              Jika server induk mewajibkan otorisasi Bearer Administrator untuk ekspor/impor paket, tempelkan token JWT di atas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={settings.backupBeforeSyncDefault}
                onChange={(e) => setSettings({ ...settings, backupBeforeSyncDefault: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Buat Backup Otomatis sebelum sinkronisasi</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={settings.syncFilesDefault}
                onChange={(e) => setSettings({ ...settings, syncFilesDefault: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Sertakan berkas uploads dalam paket</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={settings.cleanBeforeSyncDefault}
                onChange={(e) => setSettings({ ...settings, cleanBeforeSyncDefault: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Bersihkan tabel lokal sebelum import (Clean Sync)</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md hover:opacity-95 transition-all"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              {settingsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {settingsSaved ? 'Pengaturan Tersimpan!' : 'Simpan Pengaturan Sinkronisasi'}
            </button>

            {settings.lastSyncAt && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Sinkronisasi Terakhir: {new Date(settings.lastSyncAt).toLocaleString('id-ID')} ({settings.lastSyncStatus || 'Selesai'})
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
