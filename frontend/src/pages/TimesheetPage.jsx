import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Download, 
  Plus, 
  Filter, 
  Trash2, 
  FileSpreadsheet, 
  Play, 
  CheckCircle2, 
  X, 
  Save, 
  Layers,
  Users
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTimer } from '../context/TimerContext';
import { useAuth } from '../context/AuthContext';
import { formatTimeInTz, formatDateInTz, getTimezoneInfo } from '../utils/timezoneHelper';

function formatSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0j 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return formatDateInTz(dateStr, 'short');
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  return formatTimeInTz(dateStr);
}

export default function TimesheetPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'System Analyst';
  const tzInfo = getTimezoneInfo();
  const { startTimer, isTaskTimerRunning } = useTimer();
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(isAdmin ? 'all' : '');
  const [loading, setLoading] = useState(true);
  const [periodPreset, setPeriodPreset] = useState('month'); // 'today' | 'week' | 'month' | 'custom'

  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Manual Session Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    taskId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    durationMinutes: 60,
    notes: ''
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState(null);

  // Set date ranges according to presets
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (periodPreset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (periodPreset === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      setStartDate(pastWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (periodPreset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  }, [periodPreset]);

  const fetchSessions = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const params = { startDate, endDate };
      if (selectedUserId) params.userId = selectedUserId;
      const res = await axiosClient.get('/api/timesheets', { params });
      if (res.data?.data) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load timesheet sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axiosClient.get('/api/tasks', { params: { pageSize: 100 } });
      if (res.data?.data?.items) {
        setTasks(res.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load tasks for dropdown:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axiosClient.get('/api/members');
      if (res.data?.data) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSessions();
  }, [startDate, endDate, selectedUserId]);

  const handleExportExcel = async () => {
    try {
      const params = { startDate, endDate };
      if (selectedUserId && selectedUserId !== 'all') {
        params.userId = selectedUserId;
      }
      const res = await axiosClient.get('/api/timesheets/export-personal', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Timesheet_${startDate}_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download timesheet excel:', err);
      alert('Gagal mengunduh berkas Excel laporan.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Yakin ingin menghapus sesi kerja ini?')) return;
    try {
      await axiosClient.delete(`/api/timesheets/${sessionId}`);
      fetchSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('Gagal menghapus sesi kerja.');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.taskId) {
      setManualError('Pilih tugas terlebih dahulu.');
      return;
    }

    setManualLoading(true);
    setManualError(null);

    try {
      await axiosClient.post('/api/timesheets/manual', {
        taskId: parseInt(manualForm.taskId, 10),
        sessionDate: new Date(manualForm.sessionDate).toISOString(),
        durationMinutes: parseInt(manualForm.durationMinutes, 10),
        notes: manualForm.notes.trim() || null
      });

      setIsManualModalOpen(false);
      setManualForm({
        taskId: '',
        sessionDate: new Date().toISOString().split('T')[0],
        durationMinutes: 60,
        notes: ''
      });
      fetchSessions();
    } catch (err) {
      console.error('Failed to add manual session:', err);
      setManualError(err.response?.data?.message || 'Gagal menambahkan sesi kerja.');
    } finally {
      setManualLoading(false);
    }
  };

  // Metrics
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const totalSessions = sessions.length;

  // Project distribution
  const projectGroups = sessions.reduce((acc, s) => {
    const key = s.projectName || 'Umum / Non-Proyek';
    if (!acc[key]) {
      acc[key] = { name: key, color: s.projectColor || '#6366F1', seconds: 0, count: 0 };
    }
    acc[key].seconds += (s.duration || 0);
    acc[key].count += 1;
    return acc;
  }, {});

  const projectList = Object.values(projectGroups).sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Timesheet & Multi-Timer Kerja
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {tzInfo.shortLabel}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pelacakan waktu aktivitas kerja serentak dan ekspor laporan personal bertenaga ClosedXML (Zona Waktu: {tzInfo.label}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual Entry Button */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Catat Jam Manual</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all transform active:scale-95"
            style={{ backgroundColor: '#10B981', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)' }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter and Period Presets */}
      <div 
        className="p-4 rounded-2xl border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold" style={{ borderColor: 'var(--border-color)' }}>
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'week', label: '7 Hari Terakhir' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'custom', label: 'Kustom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodPreset === p.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-3 py-1.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>s.d.</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-3 py-1.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Member Filter for Admin */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Anggota:</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="all">👥 Semua Anggota Tim ({members.length})</option>
                <option value="">👤 Saya Sendiri ({user?.fullName})</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName || m.userName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-5 rounded-2xl border shadow-sm flex items-center space-x-4"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Durasi Kerja</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{totalHours} Jam</div>
            <div className="text-xs text-indigo-500 font-medium mt-0.5">{formatSeconds(totalSeconds)}</div>
          </div>
        </div>

        <div 
          className="p-5 rounded-2xl border shadow-sm flex items-center space-x-4"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Sesi Tercatat</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{totalSessions} Sesi</div>
            <div className="text-xs text-gray-400 mt-0.5">Sesi mandiri & multi-timer</div>
          </div>
        </div>

        <div 
          className="p-5 rounded-2xl border shadow-sm flex items-center space-x-4"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Proyek Terlibat</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{projectList.length} Proyek</div>
            <div className="text-xs text-gray-400 mt-0.5">Alokasi waktu tim</div>
          </div>
        </div>
      </div>

      {/* Project Breakdown Allocation */}
      {projectList.length > 0 && (
        <div 
          className="p-5 rounded-2xl border shadow-sm space-y-3"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Distribusi Waktu per Proyek (FSD 5.7 Sheet 2)
          </h3>

          <div className="space-y-3">
            {projectList.map((p) => {
              const pct = totalSeconds > 0 ? ((p.seconds / totalSeconds) * 100).toFixed(1) : 0;
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--text-primary)' }}>{p.name} ({p.count} sesi)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatSeconds(p.seconds)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div 
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Rincian Sesi Timesheet ({sessions.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Memuat data sesi...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tidak ada rekaman sesi kerja pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr 
                  className="text-xs font-bold uppercase tracking-wider border-b"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <th className="py-3 px-4">Tanggal</th>
                  {isAdmin && <th className="py-3 px-3">PIC / Anggota</th>}
                  <th className="py-3 px-4">Tugas & Proyek</th>
                  <th className="py-3 px-3">Mulai</th>
                  <th className="py-3 px-3">Selesai</th>
                  <th className="py-3 px-3">Durasi</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border-color)' }}>
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(s.startTime)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/5 dark:bg-white/10 font-bold">
                          {s.userName || 'Anggota'}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.taskTitle}</div>
                      <span className="text-[11px] text-indigo-500 font-medium">
                        {s.projectName || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(s.startTime)}
                    </td>
                    <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {s.endTime ? formatTime(s.endTime) : <span className="text-emerald-500 font-bold animate-pulse">Aktif</span>}
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {formatSeconds(s.duration)}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {s.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Sesi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Session Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg, var(--bg-card, #FFFFFF))', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Catat Sesi Kerja Manual
                </h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4" style={{ backgroundColor: 'var(--card-bg, var(--bg-card, #FFFFFF))' }}>
              {manualError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {manualError}
                </div>
              )}

              {/* Task Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Pilih Tugas <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.taskId}
                  onChange={(e) => setManualForm(prev => ({ ...prev, taskId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Pilih Tugas --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>[{t.projectName || 'Umum'}] {t.title}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Tanggal Sesi
                </label>
                <input
                  type="date"
                  value={manualForm.sessionDate}
                  onChange={(e) => setManualForm(prev => ({ ...prev, sessionDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Duration Minutes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Durasi Sesi (Menit)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  value={manualForm.durationMinutes}
                  onChange={(e) => setManualForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <div className="flex gap-1.5 mt-2">
                  {[15, 30, 45, 60, 120, 180].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setManualForm(prev => ({ ...prev, durationMinutes: m }))}
                      className="px-2 py-0.5 text-xs rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 font-medium"
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Catatan Aktivitas Sesi
                </label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ringkasan aktivitas pekerjaan pada sesi ini..."
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-medium"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                >
                  <Save className="w-4 h-4" />
                  <span>{manualLoading ? 'Menyimpan...' : 'Simpan Sesi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
