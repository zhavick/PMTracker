import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  AlertCircle, 
  FileText, 
  Users, 
  Edit3, 
  X, 
  Save,
  Check,
  Globe
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { 
  formatTimeInTz, 
  formatDateInTz, 
  getAppTimezone, 
  getTimezoneInfo 
} from '../utils/timezoneHelper';

const ATTENDANCE_TYPES = [
  { id: 1, label: 'Hadir (Normal)', color: 'text-emerald-600 bg-emerald-500/10' },
  { id: 2, label: 'Cuti (Leave)', color: 'text-blue-600 bg-blue-500/10' },
  { id: 3, label: 'Sakit (Sick)', color: 'text-rose-600 bg-rose-500/10' },
  { id: 4, label: 'Izin (Permission)', color: 'text-amber-600 bg-amber-500/10' },
  { id: 5, label: 'Dinas Luar', color: 'text-purple-600 bg-purple-500/10' }
];

const LOCATIONS = [
  { id: 1, label: 'WFO (Kantor)' },
  { id: 2, label: 'WFH (Rumah)' },
  { id: 4, label: 'Remote' },
  { id: 3, label: 'Dinas' }
];

function formatTime(dateStr) {
  if (!dateStr) return '-';
  return formatTimeInTz(dateStr);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return formatDateInTz(dateStr);
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const tzInfo = getTimezoneInfo();

  const [activeTab, setActiveTab] = useState('self'); // 'self' | 'reconciliation'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Today state
  const [todayRecord, setTodayRecord] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);

  // Check-in form
  const [checkInType, setCheckInType] = useState(1);
  const [workLocation, setWorkLocation] = useState(1);
  const [notes, setNotes] = useState('');
  const [locationName, setLocationName] = useState('Head Office Jakarta');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Monthly history
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Manual Attendance Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState(null);
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualForm, setManualForm] = useState({
    userId: user?.id || '',
    date: new Date().toISOString().split('T')[0],
    type: 1, // Hadir
    workLocation: 1, // WFO
    clockIn: '08:30',
    clockOut: '17:30',
    totalHours: 9.0,
    notes: '',
    location: 'Head Office Jakarta'
  });

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch members for Admin manual entry
  useEffect(() => {
    if (isAdmin) {
      axiosClient.get('/api/members')
        .then(res => setMembersList(res.data?.data || []))
        .catch(err => console.error('Failed to fetch members:', err));
    }
  }, [isAdmin]);

  const fetchToday = async () => {
    setTodayLoading(true);
    try {
      const res = await axiosClient.get('/api/attendance/today');
      setTodayRecord(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load today attendance:', err);
    } finally {
      setTodayLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setHistoryLoading(true);
    try {
      const res = await axiosClient.get('/api/attendance/monthly');
      if (res.data?.data) {
        setMonthlyRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load monthly attendance:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
    fetchMonthly();
  }, []);

  const handleTimeChange = (field, val) => {
    const updated = { ...manualForm, [field]: val };
    if (updated.clockIn && updated.clockOut) {
      const [hIn, mIn] = updated.clockIn.split(':').map(Number);
      const [hOut, mOut] = updated.clockOut.split(':').map(Number);
      let diffMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      updated.totalHours = Math.round((diffMinutes / 60) * 10) / 10;
    }
    setManualForm(updated);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    setManualError(null);
    try {
      await axiosClient.post('/api/attendance/manual', {
        userId: manualForm.userId ? parseInt(manualForm.userId) : user?.id,
        date: manualForm.date,
        type: parseInt(manualForm.type),
        workLocation: parseInt(manualForm.workLocation),
        clockIn: manualForm.clockIn || null,
        clockOut: manualForm.clockOut || null,
        totalHours: manualForm.totalHours ? parseFloat(manualForm.totalHours) : null,
        notes: manualForm.notes || null,
        location: manualForm.location || null
      });
      setManualSuccess('Presensi berhasil dicatat secara manual!');
      setTimeout(() => setManualSuccess(''), 5000);
      setIsManualModalOpen(false);
      fetchToday();
      fetchMonthly();
    } catch (err) {
      setManualError(err.response?.data?.message || 'Gagal menyimpan presensi manual.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await axiosClient.post('/api/attendance/check-in', {
        type: checkInType,
        workLocation,
        notes: notes.trim() || null,
        location: locationName.trim() || null
      });
      setTodayRecord(res.data?.data);
      fetchMonthly();
    } catch (err) {
      console.error('Check in failed:', err);
      setActionError(err.response?.data?.message || 'Gagal melakukan check-in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!window.confirm('Yakin ingin melakukan Check-Out sekarang? Jam kerja harian Anda akan dihitung.')) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await axiosClient.post('/api/attendance/check-out', {
        notes: notes.trim() || null
      });
      setTodayRecord(res.data?.data);
      fetchMonthly();
    } catch (err) {
      console.error('Check out failed:', err);
      setActionError(err.response?.data?.message || 'Gagal melakukan check-out.');
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = todayRecord && todayRecord.clockIn && !todayRecord.clockOut;
  const isCheckedOut = todayRecord && todayRecord.clockIn && todayRecord.clockOut;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Presensi & Rekonsiliasi Absensi
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pencatatan kehadiran kerja mandiri karyawan dan rekonsiliasi bulanan tim.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* Manual Attendance Button */}
          <button
            onClick={() => {
              setManualError(null);
              setManualForm({
                userId: user?.id || '',
                date: new Date().toISOString().split('T')[0],
                type: 1,
                workLocation: 1,
                clockIn: '08:30',
                clockOut: '17:30',
                totalHours: 9.0,
                notes: '',
                location: 'Head Office Jakarta'
              });
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Edit3 className="w-4 h-4" />
            <span>Input Presensi Manual</span>
          </button>

          {/* Tab switch */}
          {isAdmin && (
            <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setActiveTab('self')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'self' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                Presensi Mandiri
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'reconciliation' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                Rekonsiliasi Tim
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Success Toast */}
      {manualSuccess && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{manualSuccess}</span>
        </div>
      )}

      {activeTab === 'self' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Check-In / Check-Out Widget */}
          <div 
            className="p-6 rounded-3xl border shadow-sm space-y-6 flex flex-col justify-between"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Live Presensi Digital
                </span>
                <span className="flex items-center space-x-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDate(currentTime)}</span>
                </span>
              </div>

              {/* Digital Clock */}
              <div className="text-center py-4 rounded-2xl bg-black/5 dark:bg-white/5 border relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="font-mono text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {formatTimeInTz(currentTime, true)}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{tzInfo.label}</span>
                </div>
              </div>

              {actionError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {actionError}
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-4 p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Status Kehadiran Hari Ini:</span>
                  {todayLoading ? (
                    <span className="text-gray-400">Memeriksa...</span>
                  ) : isCheckedOut ? (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600">Selesai Kerja</span>
                  ) : isCheckedIn ? (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 animate-pulse">Sedang Bekerja</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600">Belum Check-In</span>
                  )}
                </div>

                {todayRecord?.clockIn && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <div className="text-gray-400">Jam Masuk</div>
                      <div className="font-bold text-emerald-600">{formatTime(todayRecord.clockIn)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Jam Pulang</div>
                      <div className="font-bold text-indigo-600">{formatTime(todayRecord.clockOut)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Options (when not checked in yet) */}
              {!isCheckedIn && !isCheckedOut && (
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Tipe Presensi
                    </label>
                    <select
                      value={checkInType}
                      onChange={(e) => setCheckInType(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {ATTENDANCE_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Lokasi Bekerja
                    </label>
                    <select
                      value={workLocation}
                      onChange={(e) => setWorkLocation(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {LOCATIONS.map(l => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Catatan / Aktivitas Rencana
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Fokus implementasi REST API..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Check-In / Check-Out Action Button */}
            <div className="pt-4">
              {!isCheckedIn && !isCheckedOut ? (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{actionLoading ? 'Mencatat...' : 'Lakukan Check-In Sekarang'}</span>
                </button>
              ) : isCheckedIn ? (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{actionLoading ? 'Menyimpan...' : 'Check-Out (Selesai Bekerja)'}</span>
                </button>
              ) : (
                <div className="p-3 text-center rounded-xl bg-blue-500/10 text-blue-600 text-xs font-semibold">
                  Presensi hari ini telah lengkap terekam. Terima kasih atas kerja keras Anda!
                </div>
              )}
            </div>
          </div>

          {/* Monthly Attendance Records Table */}
          <div 
            className="lg:col-span-2 rounded-3xl border shadow-sm overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Riwayat Presensi Bulan Ini
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Rekapitulasi jam masuk, jam pulang, dan durasi kerja per hari.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {historyLoading ? (
                <div className="py-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Memuat riwayat kehadiran...
                </div>
              ) : monthlyRecords.length === 0 ? (
                <div className="py-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Belum ada rekaman presensi pada bulan ini.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr 
                      className="font-bold uppercase tracking-wider border-b"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-3">Tipe</th>
                      <th className="py-3 px-3">Lokasi</th>
                      <th className="py-3 px-3">Jam Masuk</th>
                      <th className="py-3 px-3">Jam Pulang</th>
                      <th className="py-3 px-3">Durasi</th>
                      <th className="py-3 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {monthlyRecords.map((r) => {
                      const typeInfo = ATTENDANCE_TYPES.find(t => t.id === r.type) || ATTENDANCE_TYPES[0];
                      const locInfo = LOCATIONS.find(l => l.id === r.workLocation) || LOCATIONS[0];

                      return (
                        <tr key={r.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(r.date)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {locInfo.label}
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-600">
                            {formatTime(r.clockIn)}
                          </td>
                          <td className="py-3 px-3 font-semibold text-indigo-600">
                            {formatTime(r.clockOut)}
                          </td>
                          <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                            {r.totalHours > 0 ? `${r.totalHours} Jam` : '-'}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {r.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Admin Reconciliation View */
        <div 
          className="p-6 rounded-3xl border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center space-x-2 text-indigo-600 font-bold">
            <Users className="w-5 h-5" />
            <h3>Rekonsiliasi Absensi Tim (Administrator)</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Fitur rekonsiliasi memungkinkan Administrator meninjau dan mengoreksi jam kerja tim, status absensi, dan memvalidasi rekaman kehadiran bulanan secara langsung.
          </p>

          <div className="rounded-2xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border-color)' }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Semua Rekaman Presensi Telah Tervalidasi</div>
            <p className="text-xs text-gray-400">Tidak ada perselisihan jam kerja yang memerlukan koreksi manual saat ini.</p>
          </div>
        </div>
      )}

      {/* Manual Attendance Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 space-y-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Edit3 className="w-5 h-5 text-indigo-500" />
                  Input Manual Presensi Kehadiran
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Zona Waktu Operasional: <span className="font-semibold text-indigo-400">{tzInfo.label}</span>
                </p>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-500/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Pilih Anggota Tim / Karyawan
                  </label>
                  <select
                    value={manualForm.userId}
                    onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value={user?.id}>Saya Sendiri ({user?.name || user?.email})</option>
                    {membersList.filter(m => m.id !== user?.id).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.userName} ({m.email}) - {m.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Tanggal Presensi *
                </label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Tipe Kehadiran *
                  </label>
                  <select
                    value={manualForm.type}
                    onChange={(e) => setManualForm({ ...manualForm, type: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {ATTENDANCE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Lokasi Bekerja *
                  </label>
                  <select
                    value={manualForm.workLocation}
                    onChange={(e) => setManualForm({ ...manualForm, workLocation: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Jam Masuk (Clock In)
                  </label>
                  <input
                    type="time"
                    value={manualForm.clockIn}
                    onChange={(e) => handleTimeChange('clockIn', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Jam Pulang (Clock Out)
                  </label>
                  <input
                    type="time"
                    value={manualForm.clockOut}
                    onChange={(e) => handleTimeChange('clockOut', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Total Jam Kerja
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    value={manualForm.totalHours}
                    onChange={(e) => setManualForm({ ...manualForm, totalHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <span className="text-[10px] text-slate-400">Otomatis dihitung dari jam masuk/pulang</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nama Lokasi / Kantor
                  </label>
                  <input
                    type="text"
                    value={manualForm.location}
                    onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                    placeholder="Contoh: Kantor Pusat Jakarta"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Keterangan tambahan (opsional)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-500/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Save className="w-4 h-4" />
                  <span>{manualLoading ? 'Menyimpan...' : 'Simpan Presensi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
