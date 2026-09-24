import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  User, 
  Send, 
  X, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  FolderKanban, 
  ShieldAlert, 
  CheckSquare, 
  Lock,
  Tag,
  ArrowUpRight,
  UserCheck,
  FileText
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function TicketingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    myAssigned: 0,
    myReported: 0
  });
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedScope, setSelectedScope] = useState('ALL'); // ALL, MY_ASSIGNED, MY_REPORTED

  // Modal Create Ticket
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 1, // Bug
    priority: 2, // Medium
    projectId: '',
    assignedToUserId: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Detail Modal / Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status Update & Resolution Modal
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 1,
    resolutionNotes: ''
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedPriority, selectedCategory, selectedScope]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchTickets(),
        fetchSummary(),
        fetchProjects(),
        fetchTeamMembers()
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data ticketing.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axiosClient.get('/api/tickets/summary');
      if (res.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tickets summary', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axiosClient.get('/api/projects');
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await axiosClient.get('/api/members');
      setTeamMembers(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load members', err);
    }
  };

  const fetchTickets = async () => {
    setRefreshing(true);
    try {
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      if (selectedScope === 'MY_ASSIGNED' && user?.id) {
        params.assignedToUserId = user.id;
      } else if (selectedScope === 'MY_REPORTED' && user?.id) {
        params.createdByUserId = user.id;
      }

      const res = await axiosClient.get('/api/tickets', { params });
      setTickets(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar tiket.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenDetail = async (ticketId) => {
    setLoadingDetail(true);
    try {
      const res = await axiosClient.get(`/api/tickets/${ticketId}`);
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
        setStatusUpdateForm({
          status: getStatusNumeric(res.data.data.status),
          resolutionNotes: res.data.data.resolutionNotes || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuka detail tiket.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setError('Judul dan deskripsi tiket wajib diisi.');
      return;
    }

    setSubmittingCreate(true);
    setError(null);
    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        category: parseInt(createForm.category),
        priority: parseInt(createForm.priority),
        projectId: createForm.projectId ? parseInt(createForm.projectId) : null,
        assignedToUserId: createForm.assignedToUserId || null
      };

      const res = await axiosClient.post('/api/tickets', payload);
      setSuccessMsg(res.data?.message || 'Tiket berhasil dilaporkan.');
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        description: '',
        category: 1,
        priority: 2,
        projectId: '',
        assignedToUserId: ''
      });
      fetchTickets();
      fetchSummary();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat tiket.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;

    setSubmittingComment(true);
    try {
      const res = await axiosClient.post(`/api/tickets/${selectedTicket.id}/comments`, {
        message: commentText.trim(),
        isInternal: isInternalComment
      });

      if (res.data?.data) {
        setSelectedTicket(prev => ({
          ...prev,
          comments: [...(prev.comments || []), res.data.data]
        }));
        setCommentText('');
        setIsInternalComment(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim komentar.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    try {
      const payload = {
        status: parseInt(statusUpdateForm.status),
        resolutionNotes: statusUpdateForm.resolutionNotes?.trim() || null
      };

      const res = await axiosClient.patch(`/api/tickets/${selectedTicket.id}/status`, payload);
      setSuccessMsg(res.data?.message || 'Status tiket berhasil diperbarui.');
      // Refresh detail
      handleOpenDetail(selectedTicket.id);
      fetchTickets();
      fetchSummary();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status tiket.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Bug':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Bug / Eror</span>;
      case 'FeatureRequest':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Request Fitur</span>;
      case 'Support':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1.5"><LifeBuoy className="w-3.5 h-3.5" /> Bantuan Teknis</span>;
      case 'Infrastructure':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5"><ServerIcon className="w-3.5 h-3.5" /> Infrastruktur</span>;
      case 'AccountAccess':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Akses Akun</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">Lainnya</span>;
    }
  };

  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'Critical':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-500 border border-rose-600/40 animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> KRITIS
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> TINGGI
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            SEDANG
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-normal bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            RENDAH
          </span>
        );
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Open':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">Baru (Open)</span>;
      case 'InProgress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Dikerjakan</span>;
      case 'PendingUser':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Menunggu User</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Terselesaikan</span>;
      case 'Closed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">Ditutup</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400">{st}</span>;
    }
  };

  const getStatusNumeric = (st) => {
    switch (st) {
      case 'Open': return 1;
      case 'InProgress': return 2;
      case 'PendingUser': return 3;
      case 'Resolved': return 4;
      case 'Closed': return 5;
      case 'Rejected': return 6;
      default: return 1;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <LifeBuoy className="w-6 h-6" />
            </div>
            Ticketing & Issue Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pusat pelaporan kendala teknis, bug sistem, permohonan fitur baru, dan pelacakan SLA resolusi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInitialData}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-700/40 hover:bg-slate-500/10 text-slate-300 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-md hover:opacity-95 transition-all bg-gradient-to-r from-sky-600 to-indigo-600"
          >
            <Plus className="w-4 h-4" />
            Laporkan Kendala / Tiket
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div 
          onClick={() => { setSelectedStatus('ALL'); setSelectedScope('ALL'); }}
          className="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tiket</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{summary.total}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Semua laporan</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('Open')}
          className="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: selectedStatus === 'Open' ? '#0ea5e9' : 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Menunggu (Open)</span>
            <AlertCircle className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-sky-400">{summary.open}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Belum ditangani</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('InProgress')}
          className="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: selectedStatus === 'InProgress' ? '#6366f1' : 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Dikerjakan</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-indigo-400">{summary.inProgress}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Dalam proses teknis</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('Resolved')}
          className="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: selectedStatus === 'Resolved' ? '#10b981' : 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Terselesaikan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-400">{summary.resolved}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Fixed / Closed</span>
        </div>

        <div 
          onClick={() => setSelectedPriority('Critical')}
          className="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] col-span-2 md:col-span-1"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: selectedPriority === 'Critical' ? '#ef4444' : 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Isu Kritis</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-rose-500">{summary.critical}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">SLA Mendesak</span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div 
        className="p-4 rounded-2xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
              placeholder="Cari nomor tiket (#TCK-...), judul, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs md:text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={fetchTickets}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 transition-all whitespace-nowrap"
          >
            Cari
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope filter */}
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="ALL">Semua Tiket</option>
            <option value="MY_ASSIGNED">Ditugaskan ke Saya ({summary.myAssigned})</option>
            <option value="MY_REPORTED">Saya yang Laporkan ({summary.myReported})</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="Open">Baru (Open)</option>
            <option value="InProgress">Sedang Dikerjakan</option>
            <option value="PendingUser">Menunggu User</option>
            <option value="Resolved">Terselesaikan</option>
            <option value="Closed">Ditutup (Closed)</option>
            <option value="Rejected">Ditolak</option>
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="Critical">Kritis (Critical)</option>
            <option value="High">Tinggi (High)</option>
            <option value="Medium">Sedang (Medium)</option>
            <option value="Low">Rendah (Low)</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Bug">Bug / Eror Sistem</option>
            <option value="FeatureRequest">Request Fitur</option>
            <option value="Support">Bantuan Teknis</option>
            <option value="Infrastructure">Infrastruktur</option>
            <option value="AccountAccess">Akses Akun</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div 
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {tickets.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <LifeBuoy className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Belum ada tiket issue</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tidak ada tiket yang cocok dengan kriteria filter saat ini. Klik tombol di atas untuk melaporkan kendala baru.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenDetail(t.id)}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-500/5 transition-all cursor-pointer group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                      {t.ticketNumber}
                    </span>
                    {getPriorityBadge(t.priority)}
                    {getCategoryBadge(t.category)}
                    {getStatusBadge(t.status)}
                    {t.projectName && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                        {t.projectName}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base group-hover:text-sky-400 transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: t.createdByAvatarColor || '#6366F1' }}>
                        {t.createdByName?.slice(0, 1)}
                      </div>
                      Dilaporkan oleh: <strong className="text-slate-300">{t.createdByName}</strong>
                    </span>

                    {t.assignedToName ? (
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Assignee: <strong className="text-slate-300">{t.assignedToName}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-500/80 italic">Belum dialokasikan</span>
                    )}

                    <span>{new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-500/10 px-2.5 py-1.5 rounded-xl border border-slate-700/30">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.commentCount || 0} respon</span>
                  </div>

                  <div className="p-2 rounded-xl group-hover:bg-sky-500/10 text-slate-400 group-hover:text-sky-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Buat Tiket */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div 
            className="w-full max-w-2xl rounded-3xl border p-6 space-y-5 shadow-2xl relative my-8"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Laporkan Kendala / Buat Tiket Baru</h3>
                  <p className="text-xs text-slate-400">Tiket akan otomatis mendapat nomor unik dan masuk antrean tim</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                  Judul Kendala / Tiket *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Contoh: Eror 500 saat ekspor laporan PDF bulanan"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Kategori Masalah *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value={1}>Bug / Eror Sistem</option>
                    <option value={2}>Request Fitur Baru</option>
                    <option value={3}>Bantuan Teknis & Operasional</option>
                    <option value={4}>Infrastruktur, Jaringan & Server</option>
                    <option value={5}>Akses Akun & Hak Izin</option>
                    <option value={6}>Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Tingkat Prioritas *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value={1}>Rendah (Low) - Masalah minor</option>
                    <option value={2}>Sedang (Medium) - Operasional reguler</option>
                    <option value={3}>Tinggi (High) - Membutuhkan penanganan cepat</option>
                    <option value={4}>Kritis (Critical) - Sistem down / blocker mendesak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Proyek Terkait (Opsional)</label>
                  <select
                    value={createForm.projectId}
                    onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Tidak Terikat Proyek Khusus --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Tugaskan ke (Assignee)</label>
                    <select
                      value={createForm.assignedToUserId}
                      onChange={(e) => setCreateForm({ ...createForm, assignedToUserId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">-- Biarkan Terbuka (Unassigned) --</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName || m.userName} ({m.role || 'Member'})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Deskripsi Lengkap & Langkah Replikasi *</label>
                <textarea
                  required
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Jelaskan detail kendala, URL halaman terkait, pesan eror yang muncul, atau langkah-langkah untuk mereproduksi masalah..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-500/10 text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 disabled:opacity-50"
                >
                  {submittingCreate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Kirim Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal Detail Tiket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl h-full border-l p-6 flex flex-col space-y-5 overflow-y-auto shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            {/* Header Detail */}
            <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                    {selectedTicket.ticketNumber}
                  </span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getCategoryBadge(selectedTicket.category)}
                </div>
                <h2 className="text-xl font-bold pt-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedTicket.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl hover:bg-slate-500/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Assignee Bar */}
            <div 
              className="p-4 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold">Status Saat Ini:</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Assignee: <strong className="text-slate-200">{selectedTicket.assignedToName || 'Belum dialokasikan'}</strong></span>
                </div>
              </div>

              {/* Form Update Status bagi Admin / Assignee */}
              {(isAdmin || selectedTicket.assignedToUserId === user?.id) && (
                <form onSubmit={handleUpdateStatus} className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">Ubah Status:</span>
                    <select
                      value={statusUpdateForm.status}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                      className="px-3 py-1.5 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value={1}>Open (Baru)</option>
                      <option value={2}>In Progress (Dikerjakan)</option>
                      <option value={3}>Pending User (Tunggu Respon)</option>
                      <option value={4}>Resolved (Terselesaikan)</option>
                      <option value={5}>Closed (Ditutup)</option>
                      <option value={6}>Rejected (Ditolak)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all disabled:opacity-50"
                    >
                      {isUpdatingStatus ? 'Menyimpan...' : 'Perbarui Status'}
                    </button>
                  </div>

                  {statusUpdateForm.status == 4 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Catatan Resolusi / Solusi Fix:</label>
                      <input
                        type="text"
                        value={statusUpdateForm.resolutionNotes}
                        onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, resolutionNotes: e.target.value })}
                        placeholder="Contoh: Bug berhasil difix di commit #803303d, fungsi ekspor PDF kembali normal."
                        className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Description Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deskripsi Masalah</h4>
              <div 
                className="p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {selectedTicket.description}
              </div>
            </div>

            {/* Resolution Note if any */}
            {selectedTicket.resolutionNotes && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Catatan Resolusi Tim:
                </div>
                <p className="leading-relaxed">{selectedTicket.resolutionNotes}</p>
                {selectedTicket.resolvedAt && (
                  <span className="text-[10px] text-emerald-500/70 block pt-1">
                    Diselesaikan pada: {new Date(selectedTicket.resolvedAt).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            )}

            {/* Timeline Komentar & Diskusi */}
            <div className="flex-1 space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Diskusi & Riwayat Komentar ({selectedTicket.comments?.length || 0})</span>
              </h4>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                  <div className="py-6 text-center text-xs text-slate-500 italic">
                    Belum ada diskusi pada tiket ini. Kirim komentar pertama di bawah.
                  </div>
                ) : (
                  selectedTicket.comments.map((c) => (
                    <div 
                      key={c.id} 
                      className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${
                        c.isInternal 
                          ? 'bg-amber-500/10 border-amber-500/30' 
                          : 'bg-slate-500/5 border-slate-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                            style={{ backgroundColor: c.userAvatarColor || '#6366F1' }}
                          >
                            {c.userName?.slice(0, 1)}
                          </div>
                          <span className="font-semibold text-slate-200">{c.userName}</span>
                          {c.isInternal && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> INTERNAL NOTE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-7">{c.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Form Input Komentar */}
              <form onSubmit={handleAddComment} className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis respon, update perkembangan, atau solusi..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  {isAdmin && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-400">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span>Catatan Teknis Internal (hanya admin/dev)</span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim Respon
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServerIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}
