import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  Building2,
  Building,
  Layers,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Edit3,
  Lock,
  Info,
  Phone,
  Mail,
  Briefcase,
  Camera,
  Upload,
  Image as ImageIcon
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
  const isPM = currentUser?.role === 'PM' || currentUser?.role === 'Project Manager' || currentUser?.role === 'ProjectManager';
  const canEdit = isAdmin || isPM;

  const [members, setMembers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'grid'
  const [collapsedCompanies, setCollapsedCompanies] = useState({});

  // Edit Member Modal
  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    jobTitle: '',
    phoneNumber: '',
    role: 'User',
    companyId: '',
    avatarUrl: '',
    coverPictureUrl: '',
    avatarColor: '#6366F1'
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);

  // Delete Modal
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
          pendingOnly: filterPending || undefined,
          companyId: selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : undefined
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

  const fetchCompanies = async () => {
    try {
      const res = await axiosClient.get('/api/members/companies');
      if (res.data?.data) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axiosClient.get('/api/members/roles');
      if (res.data?.data) {
        setAvailableRoles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
      setAvailableRoles(['Admin', 'PM', 'Project Manager', 'User', 'System Analyst', 'Technical Writer']);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, filterPending, selectedCompanyFilter]);

  useEffect(() => {
    fetchCompanies();
    fetchRoles();
  }, []);

  const toggleCompanyCollapse = (companyName) => {
    setCollapsedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  // Group members by company name
  const groupedMembers = useMemo(() => {
    const groups = {};
    members.forEach(member => {
      const cName = member.companyName || 'Tanpa Perusahaan';
      if (!groups[cName]) {
        groups[cName] = [];
      }
      groups[cName].push(member);
    });
    return groups;
  }, [members]);

  const handleApproval = async (memberId, isApproved) => {
    try {
      await axiosClient.put(`/api/members/${memberId}/approval`, { isApproved });
      fetchMembers();
    } catch (err) {
      console.error('Approval update failed:', err);
      alert('Gagal memperbarui status approval.');
    }
  };

  const handleOpenEdit = (member) => {
    setEditModalUser(member);
    setEditForm({
      fullName: member.fullName || '',
      email: member.email || '',
      jobTitle: member.jobTitle || '',
      phoneNumber: member.phoneNumber || '',
      role: member.role || 'User',
      companyId: member.companyId ? String(member.companyId) : (companies.length > 0 ? String(companies[0].id) : ''),
      avatarUrl: member.avatarUrl || member.profilePictureUrl || '',
      coverPictureUrl: member.coverPictureUrl || '',
      avatarColor: member.avatarColor || '#6366F1'
    });
    setEditError(null);
  };

  const handleAdminAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editModalUser) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosClient.post(`/api/members/${editModalUser.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.avatarUrl) {
        setEditForm(prev => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      }
    } catch (err) {
      console.error('Failed to upload member avatar:', err);
      alert('Gagal mengunggah foto profil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAdminCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editModalUser) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosClient.post(`/api/members/${editModalUser.id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.coverPictureUrl) {
        setEditForm(prev => ({ ...prev, coverPictureUrl: res.data.coverPictureUrl }));
      }
    } catch (err) {
      console.error('Failed to upload member cover:', err);
      alert('Gagal mengunggah foto cover.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      setEditError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        role: editForm.role
      };

      if (isAdmin) {
        payload.email = editForm.email.trim();
        payload.jobTitle = editForm.jobTitle.trim();
        payload.phoneNumber = editForm.phoneNumber.trim();
        payload.avatarUrl = editForm.avatarUrl ? editForm.avatarUrl.trim() : null;
        payload.profilePictureUrl = editForm.avatarUrl ? editForm.avatarUrl.trim() : null;
        payload.coverPictureUrl = editForm.coverPictureUrl ? editForm.coverPictureUrl.trim() : null;
        payload.avatarColor = editForm.avatarColor;
        if (editForm.companyId) {
          payload.companyId = parseInt(editForm.companyId, 10);
        }
      }

      await axiosClient.put(`/api/members/${editModalUser.id}`, payload);
      alert('Informasi pengguna berhasil diperbarui.');
      setEditModalUser(null);
      fetchMembers();
    } catch (err) {
      console.error('Failed to update member:', err);
      setEditError(err.response?.data?.message || 'Gagal memperbarui informasi member.');
    } finally {
      setEditLoading(false);
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

  const renderMemberCard = (member) => {
    return (
      <div
        key={member.id}
        className="rounded-3xl border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {/* Cover Banner Mock / Color */}
        <div 
          className="h-20 w-full relative bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 bg-cover bg-center"
          style={{ 
            backgroundImage: member.coverPictureUrl ? `url(${member.coverPictureUrl})` : undefined,
          }}
        />

        <div className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
          {/* Avatar and Header */}
          <div className="flex items-start justify-between -mt-8">
            <div 
              className="w-16 h-16 rounded-2xl border-4 shadow-md flex items-center justify-center text-white font-black text-lg flex-shrink-0 overflow-hidden" 
              style={{ 
                borderColor: 'var(--card-bg)',
                backgroundColor: member.avatarColor || '#6366F1'
              }}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
              ) : (
                getInitials(member.fullName)
              )}
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
            {member.companyName && (
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 line-clamp-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>{member.companyName}</span>
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/5" style={{ color: 'var(--text-primary)' }}>
              <Shield className="w-3 h-3 text-indigo-500" />
              <span>{member.role}</span>
            </span>

            {member.phoneNumber && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1" title={member.phoneNumber}>
                <Phone className="w-3 h-3" />
                <span>{member.phoneNumber}</span>
              </span>
            )}
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

          {/* Actions for Admin / PM */}
          <div className="pt-1">
            {!member.isApproved && isAdmin ? (
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
                <div className="flex items-center space-x-2">
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="flex items-center space-x-1 text-xs text-indigo-600 hover:underline font-semibold"
                      title={isAdmin ? "Ubah Profil Member (Admin)" : "Ubah Nama & Role (PM)"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profil</span>
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => setResetModalUser(member)}
                      className="flex items-center space-x-1 text-xs text-amber-600 hover:underline font-semibold"
                      title="Reset Kata Sandi"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Reset PW</span>
                    </button>
                  )}
                </div>

                {isAdmin && member.id !== currentUser?.id && (
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
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Direktori Anggota Tim & Manajemen Pengguna
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Mode Administrator
              </span>
            )}
            {!isAdmin && isPM && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Mode Project Manager
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Dikelompokkan berdasarkan nama perusahaan. Admin mengelola profil lengkap; Project Manager mengelola nama, peran, dan reset password.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div 
            className="flex items-center p-1 rounded-xl border bg-slate-500/5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grouped'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Grup Perusahaan</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Bebas</span>
            </button>
          </div>

          {isAdmin && (
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
          )}
        </div>
      </div>

      {/* Filter Pills for Companies */}
      {companies.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCompanyFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCompanyFilter === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{ 
              borderColor: selectedCompanyFilter === 'ALL' ? undefined : 'var(--border-color)',
              color: selectedCompanyFilter === 'ALL' ? '#fff' : 'var(--text-secondary)' 
            }}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Semua Perusahaan</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
              {members.length}
            </span>
          </button>

          {companies.map(c => {
            const isSelected = selectedCompanyFilter === String(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyFilter(String(c.id))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{ 
                  borderColor: isSelected ? undefined : 'var(--border-color)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)' 
                }}
              >
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>{c.name}</span>
                {c.memberCount !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300">
                    {c.memberCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div 
        className="p-4 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, email, jabatan, atau perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Main Content: Grouped by Company or Free Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat anggota tim...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Tidak ada anggota tim yang ditemukan.
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {Object.entries(groupedMembers).map(([companyName, companyMembers]) => {
            const isCollapsed = collapsedCompanies[companyName];
            const approvedCount = companyMembers.filter(m => m.isApproved).length;
            const pendingCount = companyMembers.filter(m => !m.isApproved).length;

            return (
              <div 
                key={companyName}
                className="rounded-3xl border shadow-sm overflow-hidden transition-all"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
              >
                {/* Company Group Accordion Header */}
                <div 
                  onClick={() => toggleCompanyCollapse(companyName)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {companyName}
                        </h2>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Organisasi terafiliasi dengan {companyMembers.length} anggota terdaftar
                      </p>
                    </div>
                  </div>

                  {/* Summary Badges & Toggle */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        {companyMembers.length} Anggota
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {approvedCount} Aktif
                      </span>
                      {pendingCount > 0 && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                          {pendingCount} Menunggu Approval
                        </span>
                      )}
                    </div>

                    <button 
                      type="button"
                      className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Company Members Grid */}
                {!isCollapsed && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {companyMembers.map(member => renderMemberCard(member))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {members.map(member => renderMemberCard(member))}
        </div>
      )}

      {/* Edit Member Profile Modal (Admin full access, PM role & nama only) */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Ubah Informasi & Foto Member
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditModalUser(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Role Notice Banner */}
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isAdmin 
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-300' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300'
              }`}>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>{isAdmin ? 'Mode Administrator' : 'Mode Project Manager'}</strong>: {
                      isAdmin 
                        ? 'Anda memiliki hak akses penuh untuk mengubah foto profil, foto sampul, data personal, kontak, peran, dan perusahaan member.' 
                        : 'Sesuai kebijakan keamanan, Project Manager hanya memiliki hak untuk mengubah Nama dan Peran (Role), serta mereset kata sandi.'
                    }
                  </div>
                </div>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs">
                  {editError}
                </div>
              )}

              {/* Cover & Avatar Customization (Admin Only) */}
              {isAdmin && (
                <div className="rounded-2xl border p-4 space-y-4 bg-slate-500/5" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      Kustomisasi Foto Sampul & Foto Profil
                    </span>
                    <span className="text-[10px] text-indigo-500 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      Khusus Administrator
                    </span>
                  </div>

                  {/* Visual Preview Banner */}
                  <div 
                    className="relative h-28 w-full rounded-xl overflow-hidden border bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 bg-cover bg-center"
                    style={{ 
                      backgroundImage: editForm.coverPictureUrl ? `url(${editForm.coverPictureUrl})` : undefined,
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    {/* Cover Upload Button Overlay */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold backdrop-blur-sm transition-all flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{uploadingCover ? 'Mengunggah...' : 'Upload Cover'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAdminCoverUpload} 
                          disabled={uploadingCover}
                        />
                      </label>
                      {editForm.coverPictureUrl && (
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, coverPictureUrl: '' }))}
                          className="px-2 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-semibold backdrop-blur-sm transition-all"
                          title="Hapus Cover"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {/* Avatar Circle with Upload */}
                    <div className="absolute bottom-2 left-3 flex items-end gap-3">
                      <div className="relative group">
                        <div 
                          className="w-16 h-16 rounded-2xl border-2 shadow-lg flex items-center justify-center text-white font-black text-lg overflow-hidden bg-slate-800"
                          style={{ 
                            borderColor: '#fff',
                            backgroundColor: editForm.avatarColor || '#6366F1'
                          }}
                        >
                          {editForm.avatarUrl ? (
                            <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(editForm.fullName || 'User')
                          )}
                        </div>
                        <label className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-xs">
                          <Camera className="w-4 h-4 mb-0.5" />
                          <span>{uploadingAvatar ? '...' : 'Ganti'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAdminAvatarUpload}
                            disabled={uploadingAvatar}
                          />
                        </label>
                      </div>

                      <div className="pb-1 text-white drop-shadow-md">
                        <div className="font-bold text-sm leading-tight text-white drop-shadow-sm">{editForm.fullName || 'Nama Member'}</div>
                        <div className="text-[11px] text-white/90 drop-shadow-sm">{editForm.jobTitle || 'Jabatan'}</div>
                      </div>
                    </div>
                  </div>

                  {/* URL Inputs & Color Picker */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                        URL Foto Profil (Avatar)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editForm.avatarUrl}
                          onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                          placeholder="https://... atau klik foto di atas"
                          className="flex-1 px-3 py-1.5 rounded-xl border text-xs"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {editForm.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, avatarUrl: '' })}
                            className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                        URL Foto Cover (Sampul)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editForm.coverPictureUrl}
                          onChange={(e) => setEditForm({ ...editForm, coverPictureUrl: e.target.value })}
                          placeholder="https://... atau klik upload di banner"
                          className="flex-1 px-3 py-1.5 rounded-xl border text-xs"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {editForm.coverPictureUrl && (
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, coverPictureUrl: '' })}
                            className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Avatar Color Picker */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Warna Background Avatar:
                    </span>
                    <input 
                      type="color" 
                      value={editForm.avatarColor || '#6366F1'} 
                      onChange={(e) => setEditForm({ ...editForm, avatarColor: e.target.value })}
                      className="w-7 h-7 rounded-lg border cursor-pointer p-0.5 bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-slate-400">
                      {editForm.avatarColor || '#6366F1'}
                    </span>
                  </div>
                </div>
              )}

              <form id="edit-member-form" onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                {/* Nama Lengkap (Editable by Admin & PM) */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Nama lengkap member..."
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Peran / Role (Editable by Admin & PM) */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Peran Akun (Role) *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {availableRoles
                      .filter(r => isAdmin || r !== 'Admin') // PM cannot select Admin
                      .map(roleName => (
                        <option key={roleName} value={roleName}>
                          {roleName}
                        </option>
                      ))}
                  </select>
                  {!isAdmin && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      * Sebagai PM, Anda tidak dapat memberikan peran Administrator.
                    </p>
                  )}
                </div>

                {/* Email (Admin Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Alamat Email
                    </label>
                    {!isAdmin && (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Terkunci (Khusus Admin)
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    disabled={!isAdmin}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${!isAdmin ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''}`}
                    style={{ backgroundColor: isAdmin ? 'var(--input-bg)' : undefined, borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Jabatan (Admin Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Jabatan (Job Title)
                    </label>
                    {!isAdmin && (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Terkunci (Khusus Admin)
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={editForm.jobTitle}
                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                    placeholder="Misal: Senior Backend Developer..."
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${!isAdmin ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''}`}
                    style={{ backgroundColor: isAdmin ? 'var(--input-bg)' : undefined, borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Nomor Telepon (Admin Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Nomor Telepon
                    </label>
                    {!isAdmin && (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Terkunci (Khusus Admin)
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    disabled={!isAdmin}
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    placeholder="Misal: 081234567890..."
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${!isAdmin ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''}`}
                    style={{ backgroundColor: isAdmin ? 'var(--input-bg)' : undefined, borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Perusahaan (Admin Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Perusahaan / Organisasi
                    </label>
                    {!isAdmin && (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Terkunci pada Perusahaan Anda
                      </span>
                    )}
                  </div>
                  {isAdmin ? (
                    <select
                      value={editForm.companyId}
                      onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.code ? `(${c.code})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={editModalUser.companyName || 'Perusahaan Anda'}
                      className="w-full px-3 py-2 rounded-xl border text-sm opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  )}
                </div>
              </form>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-end space-x-2 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="px-4 py-2 rounded-xl border font-semibold text-xs"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                form="edit-member-form"
                disabled={editLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin / PM Reset Password Modal */}
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

      {/* Double Confirmation Permanent Delete Modal (Admin Only - FSD 5.11) */}
      {deleteModalUser && isAdmin && (
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
