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
  Layers, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  FileText 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function SyncPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hostUrl, setHostUrl] = useState('http://localhost:5000');
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState(null); // { success: bool, message: string }

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/sync/summary');
      if (res.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sync summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handlePingHost = async (e) => {
    e.preventDefault();
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await axiosClient.post('/api/sync/ping-host', { hostUrl });
      setPingResult({
        success: true,
        message: res.data?.message || 'Host Induk berhasil merespons sinyal sinkronisasi dengan status 200 OK.'
      });
    } catch (err) {
      setPingResult({
        success: false,
        message: err.response?.data?.message || 'Gagal menghubungi Host Induk. Pastikan URL dan port valid serta dapat diakses.'
      });
    } finally {
      setPingLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <RefreshCw className="w-7 h-7 text-indigo-500" />
            Multi-Instance Synchronization
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manajemen replikasi data ke Server Host Induk via REST API atau paket arsip ZIP mandiri
          </p>
        </div>

        <button
          onClick={fetchSummary}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border hover:bg-slate-500/10 text-sm font-semibold transition-colors self-start md:self-auto"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Status Node
        </button>
      </div>

      {/* Local Node Stats */}
      <div 
        className="rounded-2xl border p-6 shadow-sm space-y-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Node Lokal: {summary?.instanceId || 'Machine Host'}
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Mesin Database: {summary?.databaseEngine || 'MySQL 8.4 LTS'} • Waktu Server UTC: {summary?.serverTimeUtc ? new Date(summary.serverTimeUtc).toLocaleTimeString('id-ID') : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-500">Status Node: Siap & Aktif</span>
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl border flex flex-col items-center text-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <Users className="w-5 h-5 text-indigo-500 mb-1" />
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary?.totalUsers || 0}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Pengguna</span>
          </div>

          <div className="p-4 rounded-xl border flex flex-col items-center text-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <Briefcase className="w-5 h-5 text-sky-500 mb-1" />
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary?.totalProjects || 0}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Proyek</span>
          </div>

          <div className="p-4 rounded-xl border flex flex-col items-center text-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <CheckSquare className="w-5 h-5 text-emerald-500 mb-1" />
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary?.totalTasks || 0}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Tugas Kerja</span>
          </div>

          <div className="p-4 rounded-xl border flex flex-col items-center text-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <Clock className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary?.totalSessions || 0}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Sesi Kerja</span>
          </div>

          <div className="p-4 rounded-xl border flex flex-col items-center text-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <FileText className="w-5 h-5 text-purple-500 mb-1" />
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary?.totalNotes || 0}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Catatan & Doc</span>
          </div>

          <div className="p-4 rounded-xl border flex flex-col items-center text-center gap-1.5" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <Radio className="w-5 h-5 text-rose-500 mb-1" />
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary?.totalAttendances || 0}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Absensi</span>
          </div>
        </div>
      </div>

      {/* Host Induk Handshake Form */}
      <div 
        className="rounded-2xl border p-6 shadow-sm space-y-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Radio className="w-5 h-5 text-indigo-500" />
          Pengujian Sambungan ke Server Host Induk (Online Handshake)
        </h2>

        <form onSubmit={handlePingHost} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              URL Endpoint Host Induk *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                required
                value={hostUrl}
                onChange={(e) => setHostUrl(e.target.value)}
                placeholder="https://tracker-master.perusahaan.com"
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button
                type="submit"
                disabled={pingLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Send className={`w-4 h-4 ${pingLoading ? 'animate-pulse' : ''}`} />
                {pingLoading ? 'Menguji...' : 'Uji Ping Host'}
              </button>
            </div>
          </div>
        </form>

        {pingResult && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
            pingResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            {pingResult.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{pingResult.message}</span>
          </div>
        )}
      </div>

      {/* Manual Package Export Info */}
      <div 
        className="rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="space-y-1">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Sinkronisasi Mandiri / Offline Deployment (Air-Gapped)
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Unduh bundel snapshot kompresi data lokal untuk diimpor secara manual ke server pusat jika jaringan tertutup
          </p>
        </div>

        <button
          onClick={() => alert('Fitur ekspor snapshot arsip ZIP lokal disiapkan untuk integrasi batch host induk.')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border hover:bg-slate-500/10 text-xs font-semibold transition-colors whitespace-nowrap"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <Download className="w-4 h-4" />
          Ekspor Snapshot JSON
        </button>
      </div>
    </div>
  );
}
