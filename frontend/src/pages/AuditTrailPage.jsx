import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert, Search, Download, RefreshCw, ChevronLeft,
  ChevronRight, Filter, User, Clock, Activity, AlertCircle,
  TrendingUp, BarChart2, Globe, X, Calendar
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

// ── HTTP Method Color Maps ────────────────────────────────────────────────────
function getMethodBadge(method) {
  const m = (method || '').toUpperCase();
  if (m === 'GET')    return { bg: 'rgba(14,165,233,0.15)',  border: 'rgba(14,165,233,0.35)',  text: '#38BDF8' };
  if (m === 'POST')   return { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.35)',  text: '#34D399' };
  if (m === 'PUT')    return { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  text: '#FBBF24' };
  if (m === 'DELETE') return { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.35)',   text: '#F87171' };
  if (m === 'PATCH')  return { bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.35)',  text: '#C084FC' };
  return { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.35)', text: '#94A3B8' };
}

function getStatusBadge(code) {
  if (code >= 200 && code < 300) return { bg: 'rgba(16,185,129,0.12)', text: '#34D399' };
  if (code >= 300 && code < 400) return { bg: 'rgba(14,165,233,0.12)', text: '#38BDF8' };
  if (code >= 400 && code < 500) return { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24' };
  return { bg: 'rgba(239,68,68,0.12)', text: '#F87171' };
}

const METHOD_COLORS = {
  GET:    '#38BDF8',
  POST:   '#34D399',
  PUT:    '#FBBF24',
  DELETE: '#F87171',
  PATCH:  '#C084FC',
  OTHER:  '#94A3B8',
};

// ── Pure SVG Line Chart ────────────────────────────────────────────────────────
function LineChart({ dates, series, selectedMethods }) {
  const W = 800, H = 220, PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PADDING.left - PADDING.right;
  const plotH = H - PADDING.top - PADDING.bottom;

  if (!dates || dates.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-secondary)', fontSize: 14 }}>
        <Activity size={24} style={{ marginRight: 8, opacity: 0.4 }} /> Tidak ada data untuk ditampilkan
      </div>
    );
  }

  // Build per-method per-date map
  const methods = selectedMethods && selectedMethods.length > 0 ? selectedMethods : ['GET', 'POST', 'PUT', 'DELETE'];
  const dataMap = {};
  (series || []).forEach(s => {
    if (!dataMap[s.method]) dataMap[s.method] = {};
    dataMap[s.method][s.date] = s.count;
  });

  // Compute max value
  let maxVal = 1;
  methods.forEach(m => {
    dates.forEach(d => {
      const v = (dataMap[m] && dataMap[m][d]) || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  const xStep = dates.length > 1 ? plotW / (dates.length - 1) : plotW;
  const yScale = (v) => plotH - (v / maxVal) * plotH;

  const buildPath = (method) => {
    const pts = dates.map((d, i) => {
      const v = (dataMap[method] && dataMap[method][d]) || 0;
      return [PADDING.left + i * xStep, PADDING.top + yScale(v)];
    });
    if (pts.length === 0) return '';
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return d;
  };

  const buildArea = (method) => {
    const pts = dates.map((d, i) => {
      const v = (dataMap[method] && dataMap[method][d]) || 0;
      return [PADDING.left + i * xStep, PADDING.top + yScale(v)];
    });
    if (pts.length === 0) return '';
    const bottom = PADDING.top + plotH;
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return `${pathD} L${pts[pts.length - 1][0].toFixed(1)},${bottom} L${pts[0][0].toFixed(1)},${bottom} Z`;
  };

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal));

  // X-axis labels - show subset
  const xLabelCount = Math.min(dates.length, 8);
  const xLabelStep = Math.max(1, Math.floor(dates.length / xLabelCount));
  const xLabels = dates.filter((_, i) => i % xLabelStep === 0 || i === dates.length - 1);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 400, display: 'block' }}>
        {/* Gridlines */}
        {yTicks.map((tick, i) => {
          const y = PADDING.top + yScale(tick);
          return (
            <g key={i}>
              <line x1={PADDING.left} y1={y} x2={W - PADDING.right} y2={y}
                stroke="rgba(100,116,139,0.15)" strokeWidth={1} />
              <text x={PADDING.left - 6} y={y + 4} fill="rgba(100,116,139,0.7)" fontSize={10} textAnchor="end">{tick}</text>
            </g>
          );
        })}

        {/* Area fills */}
        {methods.map(m => (
          <path key={`area-${m}`} d={buildArea(m)}
            fill={METHOD_COLORS[m] || METHOD_COLORS.OTHER}
            fillOpacity={0.06} />
        ))}

        {/* Lines */}
        {methods.map(m => (
          <path key={`line-${m}`} d={buildPath(m)}
            fill="none"
            stroke={METHOD_COLORS[m] || METHOD_COLORS.OTHER}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round" />
        ))}

        {/* Data points */}
        {methods.map(m =>
          dates.map((d, i) => {
            const v = (dataMap[m] && dataMap[m][d]) || 0;
            if (v === 0) return null;
            const cx = PADDING.left + i * xStep;
            const cy = PADDING.top + yScale(v);
            return (
              <circle key={`dot-${m}-${i}`} cx={cx} cy={cy} r={3}
                fill={METHOD_COLORS[m] || METHOD_COLORS.OTHER}
                stroke="var(--bg-secondary)" strokeWidth={1.5} />
            );
          })
        )}

        {/* X-axis labels */}
        {xLabels.map((d) => {
          const i = dates.indexOf(d);
          const x = PADDING.left + i * xStep;
          const label = d.slice(5); // MM-DD
          return (
            <text key={d} x={x} y={H - PADDING.bottom + 14} fill="rgba(100,116,139,0.7)" fontSize={9} textAnchor="middle">{label}</text>
          );
        })}

        {/* X-axis line */}
        <line x1={PADDING.left} y1={PADDING.top + plotH} x2={W - PADDING.right} y2={PADDING.top + plotH}
          stroke="rgba(100,116,139,0.25)" strokeWidth={1} />
      </svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [userNameFilter, setUserNameFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dropdown data
  const [distinctUsers, setDistinctUsers] = useState([]);
  const [distinctModules, setDistinctModules] = useState([]);

  // Chart
  const [chartData, setChartData] = useState(null);
  const [chartMethods] = useState(['GET', 'POST', 'PUT', 'DELETE']);
  const [showChart, setShowChart] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosClient.get('/api/audit-trail', {
        params: {
          search: search.trim() || undefined,
          statusCode: statusCode ? parseInt(statusCode) : undefined,
          method: methodFilter !== 'ALL' ? methodFilter : undefined,
          userName: userNameFilter || undefined,
          module: moduleFilter || undefined,
          activity: activityFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page, pageSize
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
    } finally { setLoading(false); }
  }, [search, statusCode, methodFilter, userNameFilter, moduleFilter, activityFilter, dateFrom, dateTo, page, pageSize]);

  const fetchChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const res = await axiosClient.get('/api/audit-trail/chart', {
        params: { dateFrom, dateTo, userName: userNameFilter || undefined, module: moduleFilter || undefined }
      });
      setChartData(res.data?.data || null);
    } catch { /* silent */ }
    finally { setChartLoading(false); }
  }, [dateFrom, dateTo, userNameFilter, moduleFilter]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [usersRes, modulesRes] = await Promise.all([
        axiosClient.get('/api/audit-trail/users'),
        axiosClient.get('/api/audit-trail/modules'),
      ]);
      setDistinctUsers(usersRes.data?.data || []);
      setDistinctModules(modulesRes.data?.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchLogs(); }, [page, statusCode, methodFilter]);
  useEffect(() => { fetchDropdowns(); }, []);
  useEffect(() => { if (showChart) fetchChart(); }, [dateFrom, dateTo, userNameFilter, moduleFilter, showChart]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchLogs(); fetchChart(); };

  const handleExportCsv = async () => {
    try {
      const res = await axiosClient.get('/api/audit-trail/export-csv', {
        params: { dateFrom, dateTo, method: methodFilter !== 'ALL' ? methodFilter : undefined },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuditTrail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Gagal mengekspor CSV.'); }
  };

  const resetFilters = () => {
    setSearch(''); setStatusCode(''); setMethodFilter('ALL');
    setUserNameFilter(''); setModuleFilter(''); setActivityFilter('');
    setPage(1);
  };

  const inputStyle = { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
  const inputCls = 'px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div style={{ paddingBottom: 48 }} className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <ShieldAlert size={26} style={{ color: '#6366F1' }} />
            Audit Trail & Log Aktivitas Sistem
          </h1>
          <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
            Pencatatan transparan seluruh mutasi data, HTTP method, pengguna, modul, dan waktu respons
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { fetchLogs(); fetchChart(); }}
            style={{ padding: '10px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Muat Ulang">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowChart(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: showChart ? 'rgba(99,102,241,0.1)' : 'none', cursor: 'pointer', color: showChart ? '#818CF8' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
            <TrendingUp size={15} /> Grafik
          </button>
          <button onClick={handleExportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* ── Chart ── */}
      {showChart && (
        <div style={{ borderRadius: 18, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: '#818CF8' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Aktivitas Harian per HTTP Method</span>
              {chartLoading && <div style={{ width: 14, height: 14, border: '2px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {chartMethods.map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 24, height: 3, borderRadius: 2, background: METHOD_COLORS[m] }} />
                  <span style={{ color: METHOD_COLORS[m], fontWeight: 700 }}>{m}</span>
                  {chartData?.summary && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      ({chartData.summary[m.toLowerCase() + 'Count'] || 0})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          {chartData?.summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total Request', value: chartData.summary.totalRequests, color: '#818CF8' },
                { label: 'Error (4xx/5xx)', value: chartData.summary.errorCount, color: '#F87171' },
                { label: 'Avg Durasi', value: `${chartData.summary.avgDurationMs}ms`, color: '#FBBF24' },
              ].map(s => (
                <div key={s.label} style={{ borderRadius: 10, border: `1px solid ${s.color}30`, background: s.color + '10', padding: '10px 14px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <LineChart dates={chartData?.dates || []} series={chartData?.series || []} selectedMethods={chartMethods} />
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '16px 18px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginBottom: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative', gridColumn: '1/-1' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari URL, email pengguna, aksi..."
                className={inputCls}
                style={{ ...inputStyle, width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
              />
            </div>

            {/* HTTP Method */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>HTTP Method</label>
              <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }} className={inputCls} style={{ ...inputStyle, width: '100%' }}>
                {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Status Code */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Status HTTP</label>
              <select value={statusCode} onChange={e => { setStatusCode(e.target.value); setPage(1); }} className={inputCls} style={{ ...inputStyle, width: '100%' }}>
                <option value="">Semua Status</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Server Error</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Pengguna</label>
              <input list="users-list" value={userNameFilter} onChange={e => setUserNameFilter(e.target.value)} placeholder="Ketik nama/email..."
                className={inputCls} style={{ ...inputStyle, width: '100%' }} />
              <datalist id="users-list">
                {distinctUsers.map((u, i) => <option key={i} value={u.userName || u.userEmail} />)}
              </datalist>
            </div>

            {/* Module Filter */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Modul</label>
              <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className={inputCls} style={{ ...inputStyle, width: '100%' }}>
                <option value="">Semua Modul</option>
                {distinctModules.map((m, i) => <option key={i} value={m}>{m.replace('ApiController', '')}</option>)}
              </select>
            </div>

            {/* Activity Filter */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Aktivitas</label>
              <input value={activityFilter} onChange={e => setActivityFilter(e.target.value)} placeholder="Nama action..."
                className={inputCls} style={{ ...inputStyle, width: '100%' }} />
            </div>

            {/* Date From */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Dari Tanggal</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} style={{ ...inputStyle, width: '100%' }} />
            </div>

            {/* Date To */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Hingga Tanggal</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={resetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
              <X size={13} /> Reset
            </button>
            <button type="submit"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px', borderRadius: 10, background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <Search size={13} /> Cari & Filter
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat log audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Activity size={40} style={{ color: '#94A3B8', opacity: 0.4, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Tidak ada log ditemukan</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Sesuaikan filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                  {['Waktu', 'Method', 'Status', 'Endpoint / Path', 'Modul & Aksi', 'Pengguna', 'IP', 'Durasi'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Durasi' ? 'right' : 'left', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => {
                  const mb = getMethodBadge(item.httpMethod);
                  const sb = getStatusBadge(item.statusCode);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: mb.bg, border: `1px solid ${mb.border}`, color: mb.text, fontFamily: 'monospace', fontWeight: 800, fontSize: 11 }}>
                          {item.httpMethod}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: sb.bg, color: sb.text, fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>
                          {item.statusCode}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 11, fontWeight: 500 }}>
                        {item.path}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {item.controllerName && (
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.controllerName?.replace('ApiController', '')}</span>
                            {item.actionName && <span style={{ fontSize: 10, color: '#818CF8', marginLeft: 4 }}>· {item.actionName}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.userName || item.userEmail || 'Tamu / Sistem'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {item.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: item.durationMs > 1000 ? '#F87171' : item.durationMs > 300 ? '#FBBF24' : '#34D399' }}>
                        {item.durationMs}ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div>
            Total <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalItems.toLocaleString()}</span> entri
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.35 : 1, color: 'var(--text-secondary)' }}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ padding: '0 8px', fontWeight: 600 }}>Hal. {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.35 : 1, color: 'var(--text-secondary)' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
