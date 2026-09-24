import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Trash2, 
  Shield, 
  Clock, 
  CheckSquare, 
  AlertTriangle, 
  X, 
  Save, 
  UserCheck 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function MembersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPending, setFilterPending] = useState(false);

  // Modals
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);

  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [confirmName, setConfirmName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/members', {
        params: {
          search: search.trim() || undefined,
          pendingOnly: filterPending || undefined
        }
      });
      if (res.data?.data) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, filterPending]);

  const handleApproval = async (memberId, isApproved) => {
    try {
      await axiosClient.put(`/api/members/${memberId}/approval`, { isApproved });
      fetchMembers();
    } catch (err) {
      console.error('Approval update failed:', err);
      alert('Gagal memperbarui status approval.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      await axiosClient.post(`/api/members/${resetModalUser.id}/reset-password`, {
        newPassword
      });
      alert('Kata sandi berhasil diperbarui.');
      setResetModalUser(null);
      setNewPassword('');
    } catch (err) {
      console.error('Reset password error:', err);
      setResetError(err.response?.data?.message || 'Gagal mereset kata sandi.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await axiosClient.delete(`/api/members/${deleteModalUser.id}/permanent`, {
        data: {
          fullNameConfirmation: confirmName,
          adminPassword
        }
      });
      alert('Pengguna berhasil dihapus secara permanen.');
      setDeleteModalUser(null);
      setConfirmName('');
      setAdminPassword('');
      fetchMembers();
    } catch (err) {
      console.error('Permanent delete error:', err);
      setDeleteError(err.response?.data?.message || 'Gagal menghapus pengguna.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Direktori Anggota Tim & Approval
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Tata letak Pure Grid Card, approval pengguna baru, dan kontrol hak akses tim (FSD 5.11).
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterPending(!filterPending)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                filterPending ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ borderColor: filterPending ? undefined : 'var(--border-color)', color: filterPending ? '#fff' : 'var(--text-secondary)' }}
            >
              <UserCheck className="w-4 h-4" />
              <span>Menunggu Approval</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div 
        className="p-4 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Pure Grid Card Directory (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat anggota tim...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Tidak ada anggota tim yang ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-3xl border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              {/* Cover Banner Mock / Color */}
              <div 
                className="h-16 w-full relative bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"
                style={{ 
                  backgroundImage: member.coverPictureUrl ? `url(${member.coverPictureUrl})` : undefined,
                  backgroundSize: 'cover'
                }}
              />

              <div className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                {/* Avatar and Header */}
                <div className="flex items-start justify-between -mt-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 border-4 shadow-md flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ borderColor: 'var(--card-bg)' }}>
                    {getInitials(member.fullName)}
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-8 ${
                    member.isApproved 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-amber-500/10 text-amber-600 animate-pulse'
                  }`}>
                    {member.isApproved ? 'Approved' : 'Menunggu Approval'}
                  </span>
                </div>

                {/* User Info (Protected from Overflow) */}
                <div className="space-y-1">
                  <h3 className="font-bold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }} title={member.fullName}>
                    {member.fullName}
                  </h3>
                  <div className="text-xs text-indigo-500 font-semibold line-clamp-1">
                    {member.jobTitle}
                  </div>
                  <div className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }} title={member.email}>
                    {member.email}
                  </div>
                </div>

                {/* Role Badge */}
                <div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/5" style={{ color: 'var(--text-primary)' }}>
                    <Shield className="w-3 h-3 text-indigo-500" />
                    <span>{member.role}</span>
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 py-2 border-y text-center text-xs" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <div className="text-gray-400">Tugas Ditugaskan</div>
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{member.totalTasksAssigned}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Total Jam Kerja</div>
                    <div className="font-bold text-sm text-indigo-600">{member.totalHoursLogged} Jam</div>
                  </div>
                </div>

                {/* Actions for Admin */}
                {isAdmin && (
                  <div className="flex items-center justify-between pt-1">
                    {!member.isApproved ? (
                      <div className="flex items-center space-x-2 w-full">
                        <button
                          onClick={() => handleApproval(member.id, true)}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleApproval(member.id, false)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 text-xs font-semibold hover:bg-rose-500/10"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <button
                          onClick={() => setResetModalUser(member)}
                          className="flex items-center space-x-1 text-xs text-indigo-600 hover:underline font-semibold"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </button>

                        {member.id !== currentUser.id && (
                          <button
                            onClick={() => setDeleteModalUser(member)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Permanen Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-4"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Reset Kata Sandi Anggota
                </h3>
              </div>
              <button onClick={() => setResetModalUser(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Masukkan kata sandi baru untuk pengguna: <strong>{resetModalUser.fullName}</strong> ({resetModalUser.email}).
            </p>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {resetLoading ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double Confirmation Permanent Delete Modal (FSD 5.11) */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border border-rose-500/40 shadow-2xl overflow-hidden p-6 space-y-4"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <div className="flex items-center space-x-2.5 text-rose-600">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="font-black text-lg">Konfirmasi Hapus Permanen Akun</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs leading-relaxed space-y-1">
              <strong>Tindakan ini tidak dapat dibatalkan!</strong>
              <p>
                Menghapus pengguna <strong>{deleteModalUser.fullName}</strong> akan membersihkan akun ASP.NET Identity, presensi, sesi kerja, dan membebaskan penugasan tugas secara aman.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  1. Ketikkan nama lengkap pengguna persis sama:
                </label>
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-xs font-bold mb-1.5 select-all" style={{ color: 'var(--text-primary)' }}>
                  {deleteModalUser.fullName}
                </div>
                <input
                  type="text"
                  required
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Ketik nama lengkap di atas..."
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  2. Masukkan kata sandi Administrator Anda untuk verifikasi:
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Kata sandi admin Anda..."
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="px-4 py-2 rounded-xl border font-semibold"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {deleteLoading ? 'Menghapus...' : 'Hapus Permanen Akun Ini'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
