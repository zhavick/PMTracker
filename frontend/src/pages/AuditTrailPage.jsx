import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  User, 
  Globe, 
  Clock, 
  Activity,
  AlertCircle
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

function getMethodBadge(method) {
  const m = (method || '').toUpperCase();
  if (m === 'GET') return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
  if (m === 'POST') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  if (m === 'PUT') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  if (m === 'DELETE') return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
  return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
}

function getStatusBadge(code) {
  if (code >= 200 && code < 300) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
  if (code >= 300 && code < 400) return 'text-sky-600 dark:text-sky-400 bg-sky-500/10';
  if (code >= 400 && code < 500) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
  return 'text-rose-600 dark:text-rose-400 bg-rose-500/10';
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/audit-trail', {
        params: {
          search: search.trim() || undefined,
          statusCode: statusCode ? parseInt(statusCode) : undefined,
          page,
          pageSize
        }
      });
      const data = res.data?.data;
      if (data) {
        setLogs(data.items || []);
        setTotalPages(Math.ceil((data.totalItems || 0) / pageSize) || 1);
        setTotalItems(data.totalItems || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusCode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCsv = async () => {
    try {
      const res = await axiosClient.get('/api/audit-trail/export-csv', {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuditTrail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengekspor berkas CSV audit trail.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <ShieldAlert className="w-7 h-7 text-indigo-500" />
            Audit Trail & Log Aktivitas Sistem
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pencatatan transparan seluruh mutasi data, alamat IP, pengguna, dan waktu respons HTTP
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border hover:bg-slate-500/10 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-md hover:opacity-95 transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div 
        className="p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari URL endpoint, email user, atau aksi..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={statusCode}
            onChange={(e) => {
              setStatusCode(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="">Semua Status HTTP</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div 
        className="rounded-2xl border shadow-sm overflow-hidden" 
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat catatan audit log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Tidak ada log ditemukan</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Coba sesuaikan kata kunci pencarian atau filter status HTTP Anda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wider font-semibold" style={{ backgroundColor: 'var(--bg-tertiary, rgba(0,0,0,0.02))', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                <tr>
                  <th className="px-6 py-3.5">Waktu (UTC)</th>
                  <th className="px-6 py-3.5">Metode</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Endpoint API</th>
                  <th className="px-6 py-3.5">Pengguna</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md font-mono text-xs font-bold border ${getMethodBadge(item.httpMethod)}`}>
                        {item.httpMethod}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${getStatusBadge(item.statusCode)}`}>
                        {item.statusCode}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs truncate font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.path}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-xs truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>
                          {item.userName || item.userEmail || 'Tamu / Sistem'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {item.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {item.durationMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div 
          className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <div>
            Total <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalItems}</span> entri tercatat di database
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border hover:bg-slate-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border hover:bg-slate-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
