import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Archive, 
  ArrowRight,
  X,
  Save,
  Layers,
  Building2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Filter,
  DollarSign,
  UserCheck,
  CheckSquare,
  Square,
  ListPlus,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const COLOR_PRESETS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6'  // Blue
];

function formatSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0j';
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours}j`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Admin View & Grouping State
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'grid'
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [collapsedCompanies, setCollapsedCompanies] = useState({});

  // Team Members for PM Selection
  const [members, setMembers] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366F1',
    deadline: '',
    status: 0,
    companyId: '',
    clientName: '',
    projectManagerId: '',
    budget: 0,
    actualCost: 0,
    tags: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Bulk Task Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignProject, setAssignProject] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (isAdmin && selectedCompanyFilter !== 'all') {
        params.companyId = selectedCompanyFilter;
      }

      const res = await axiosClient.get('/api/projects', { params });
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axiosClient.get('/api/projects/companies');
      if (res.data?.data) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
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
    fetchProjects();
    fetchMembers();
  }, [search, selectedCompanyFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  const toggleCompanyCollapse = (companyName) => {
    setCollapsedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366F1',
      deadline: '',
      status: 0,
      companyId: companies.length > 0 ? companies[0].id : '',
      clientName: '',
      projectManagerId: '',
      budget: 0,
      actualCost: 0,
      tags: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setProjectToEdit(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      color: project.color || '#6366F1',
      deadline: project.deadline ? project.deadline.substring(0, 10) : '',
      status: project.status ?? 0,
      companyId: project.companyId || '',
      clientName: project.clientName || '',
      projectManagerId: project.projectManagerId || '',
      budget: project.budget || 0,
      actualCost: project.actualCost || 0,
      tags: project.tags || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenAssignModal = async (project) => {
    setAssignProject(project);
    setSelectedTaskIds([]);
    setIsAssignModalOpen(true);
    try {
      const res = await axiosClient.get('/api/tasks');
      if (res.data?.data) {
        // Show tasks not yet in this project or unassigned
        setAvailableTasks(res.data.data.filter(t => t.projectId !== project.id));
      }
    } catch (err) {
      console.error('Failed to fetch available tasks:', err);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignProject || selectedTaskIds.length === 0) return;

    setAssignLoading(true);
    try {
      await axiosClient.post(`/api/projects/${assignProject.id}/assign-tasks`, {
        taskIds: selectedTaskIds
      });
      setIsAssignModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Failed to assign tasks:', err);
      alert('Gagal mengalokasikan tugas ke proyek.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama proyek wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: parseInt(formData.status, 10),
        companyId: isAdmin && formData.companyId ? parseInt(formData.companyId, 10) : undefined,
        clientName: formData.clientName?.trim() || null,
        projectManagerId: formData.projectManagerId ? parseInt(formData.projectManagerId, 10) : null,
        budget: parseFloat(formData.budget) || 0,
        actualCost: parseFloat(formData.actualCost) || 0,
        tags: formData.tags?.trim() || null
      };

      if (projectToEdit) {
        await axiosClient.put(`/api/projects/${projectToEdit.id}`, payload);
      } else {
        await axiosClient.post('/api/projects', payload);
      }

      setIsModalOpen(false);
      fetchProjects();
      if (isAdmin) fetchCompanies();
    } catch (err) {
      console.error('Failed to save project:', err);
      setFormError(err.response?.data?.message || 'Gagal menyimpan proyek.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Yakin ingin menghapus/mengarsipkan proyek: "${project.name}"?`)) return;
    try {
      const res = await axiosClient.delete(`/api/projects/${project.id}`);
      alert(res.data?.message || 'Operasi berhasil.');
      fetchProjects();
      if (isAdmin) fetchCompanies();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Gagal menghapus proyek.');
    }
  };

  // Group projects by company name
  const groupedProjects = useMemo(() => {
    const groups = {};
    projects.forEach(p => {
      const compName = p.companyName || 'Perusahaan Mandiri';
      if (!groups[compName]) {
        groups[compName] = [];
      }
      groups[compName].push(p);
    });
    return groups;
  }, [projects]);

  const renderProjectCard = (project) => {
    const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 1;

    return (
      <div
        key={project.id}
        className="rounded-2xl border shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {/* Top Color Accent Line */}
        <div 
          className="h-1.5 w-full"
          style={{ backgroundColor: project.color || '#6366F1' }}
        />

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Title, Company & Status */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color || '#6366F1' }}
                />
                <h3 className="font-bold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h3>
              </div>

              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                project.status === 1 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : project.status === 2 
                  ? 'bg-gray-500/10 text-gray-500' 
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}>
                {project.status === 1 ? 'Selesai' : project.status === 2 ? 'Arsip' : 'Aktif'}
              </span>
            </div>

            {/* Company Badge for Admin / Quick Info */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Building2 className="w-3 h-3" />
                {project.companyName || 'Perusahaan Mandiri'}
              </span>
              {project.clientName && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Klien: {project.clientName}
                </span>
              )}
              {project.projectManagerName && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  PM: {project.projectManagerName}
                </span>
              )}
            </div>

            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {project.description || 'Tidak ada deskripsi tambahan.'}
            </p>
          </div>

          {/* Financial Burn Rate Card */}
          {(project.budget > 0 || project.actualCost > 0) && (
            <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span style={{ color: 'var(--text-secondary)' }}>Serapan Finansial (Burn Rate)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  project.burnRatePercent > 100 
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' 
                    : project.burnRatePercent >= 80 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                }`}>
                  {project.burnRatePercent}% {project.burnRatePercent > 100 ? 'Overbudget' : ''}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] opacity-75">Pagu: Rp {Number(project.budget || 0).toLocaleString('id-ID')}</span>
                <span className="font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>
                  Aktual: Rp {Number(project.actualCost || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span style={{ color: 'var(--text-secondary)' }}>Progres Tugas</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{project.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${project.progressPercent}%`,
                  backgroundColor: project.color || '#6366F1' 
                }}
              />
            </div>
          </div>

          {/* Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y text-center" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Total Tugas</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.totalTasks}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Selesai</div>
              <div className="text-sm font-bold text-emerald-600">{project.completedTasks}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Jam Kerja</div>
              <div className="text-sm font-bold text-indigo-600">{formatSeconds(project.totalSecondsLogged)}</div>
            </div>
          </div>

          {/* Deadline & Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className={isOverdue ? 'text-rose-500 font-bold' : ''} style={{ color: isOverdue ? undefined : 'var(--text-secondary)' }}>
                {formatDate(project.deadline)}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleOpenAssignModal(project)}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-600 transition-colors"
                title="Alokasikan Tugas Massal ke Proyek"
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleOpenEdit(project)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-indigo-600 transition-colors"
                title="Edit Proyek"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(project)}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 transition-colors"
                title="Hapus / Arsipkan Proyek"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/tasks')}
                className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-600 transition-colors"
                title="Lihat Tugas Proyek"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
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
              {isAdmin ? 'Manajemen Portofolio Proyek Enterprise' : `Portofolio Proyek - ${user?.companyName || 'Perusahaan Saya'}`}
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Mode Administrator
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin 
              ? 'Pantau portofolio proyek terpusat yang dikelompokkan berdasarkan nama perusahaan dan klien mitra.' 
              : `Daftar proyek resmi yang dialokasikan khusus untuk anggota tim ${user?.companyName || 'perusahaan Anda'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin View Mode Switcher */}
          {isAdmin && (
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
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all transform active:scale-95 w-max"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        className="p-4 rounded-2xl border shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau deskripsi proyek..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Menampilkan <strong className="text-indigo-500">{projects.length}</strong> proyek
            {isAdmin && ` dari ${Object.keys(groupedProjects).length} perusahaan`}
          </div>
        </div>

        {/* Admin Company Filter Pills */}
        {isAdmin && companies.length > 0 && (
          <div className="pt-2 border-t flex items-center gap-2 overflow-x-auto pb-1" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter Perusahaan:
            </span>

            <button
              onClick={() => setSelectedCompanyFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCompanyFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
              }`}
            >
              Semua ({projects.length})
            </button>

            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyFilter(c.id.toString())}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCompanyFilter === c.id.toString()
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>{c.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                  {c.projectCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Projects Display */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat portofolio proyek...</p>
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="py-16 text-center rounded-2xl border flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <FolderKanban className="w-12 h-12 mb-3 text-gray-400 opacity-60" />
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Belum Ada Proyek</h3>
          <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin 
              ? 'Belum ada proyek yang terdaftar pada sistem atau filter perusahaan yang dipilih.' 
              : `Belum ada proyek terdaftar untuk ${user?.companyName || 'perusahaan Anda'}.`}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Tambah Proyek Sekarang
          </button>
        </div>
      ) : isAdmin && viewMode === 'grouped' ? (
        /* Admin Grouped View by Company */
        <div className="space-y-8">
          {Object.entries(groupedProjects).map(([companyName, companyProjects]) => {
            const isCollapsed = !!collapsedCompanies[companyName];
            const totalTasks = companyProjects.reduce((s, p) => s + p.totalTasks, 0);
            const completedTasks = companyProjects.reduce((s, p) => s + p.completedTasks, 0);
            const avgProgress = companyProjects.length > 0 
              ? Math.round(companyProjects.reduce((s, p) => s + p.progressPercent, 0) / companyProjects.length)
              : 0;

            return (
              <div 
                key={companyName}
                className="rounded-3xl border shadow-sm overflow-hidden space-y-4 p-5 transition-all"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                {/* Company Group Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {companyName}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                          {companyProjects.length} Proyek
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Portofolio proyek resmi entitas {companyName}
                      </p>
                    </div>
                  </div>

                  {/* Summary Badges & Toggle Accordion */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="hidden md:flex items-center gap-4 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Total Tugas</span>
                        <span style={{ color: 'var(--text-primary)' }}>{totalTasks}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-500/20" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Tugas Selesai</span>
                        <span className="text-emerald-500">{completedTasks}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-500/20" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Rata-rata Progres</span>
                        <span className="text-indigo-400">{avgProgress}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCompanyCollapse(companyName)}
                      className="p-2 rounded-xl border hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 text-xs font-medium"
                      style={{ borderColor: 'var(--border-color)' }}
                      title={isCollapsed ? 'Buka grup' : 'Tutup grup'}
                    >
                      {isCollapsed ? (
                        <>
                          <span>Tampilkan</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Sembunyikan</span>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Company Projects Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                    {companyProjects.map(renderProjectCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Regular User View / Flat Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(renderProjectCard)}
        </div>
      )}

      {/* Modal Create / Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg, var(--bg-card, #FFFFFF))', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {projectToEdit ? 'Ubah Rincian Proyek' : 'Tambah Proyek Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4" style={{ backgroundColor: 'var(--card-bg, var(--bg-card, #FFFFFF))' }}>
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Admin Company Selector */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Alokasi Perusahaan Pemilik Proyek <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        🏢 {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sebagai Administrator, Anda dapat menentukan perusahaan mana yang memiliki proyek ini.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Digitalisasi Platform HR..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Jelaskan tujuan dan ruang lingkup proyek..."
                  className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Label Warna Proyek
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formData.color === color ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500 shadow-md' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Deadline & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Batas Waktu (Deadline)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Status Proyek
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value={0}>🔵 Aktif</option>
                    <option value={1}>🟢 Selesai</option>
                    <option value={2}>⚪ Arsip</option>
                  </select>
                </div>
              </div>

              {/* Client Name & Project Manager (PIC) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Klien / Pemilik Proyek
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Contoh: PT Surya Utama"
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Project Manager (PIC)
                  </label>
                  <select
                    value={formData.projectManagerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectManagerId: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Pilih Project Manager --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.fullName || m.name || m.userName} ({m.role || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget & Actual Cost (Financial Tracking) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Anggaran (Budget Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Realisasi Biaya (Actual Cost Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.actualCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualCost: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Project Tags */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Label / Tag (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. Prioritas, Q3, Mobile, Internal"
                  className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                >
                  <Save className="w-4 h-4" />
                  <span>{formLoading ? 'Menyimpan...' : 'Simpan Proyek'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Task Assignment */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg, var(--bg-card, #FFFFFF))', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Alokasikan Tugas ke Proyek
                  </h3>
                  <p className="text-xs text-indigo-500 font-medium">
                    {assignProject?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {availableTasks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Tidak ada tugas lain yang tersedia untuk dialokasikan.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Semua tugas sudah masuk ke dalam proyek ini atau belum ada tugas yang dibuat.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Pilih tugas yang ingin dipindahkan ke proyek ini:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTaskIds.length === availableTasks.length) {
                          setSelectedTaskIds([]);
                        } else {
                          setSelectedTaskIds(availableTasks.map(t => t.id));
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      {selectedTaskIds.length === availableTasks.length ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {availableTasks.map(task => {
                      const isSelected = selectedTaskIds.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskIds(prev => 
                              isSelected ? prev.filter(id => id !== task.id) : [...prev, task.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-500/10' 
                              : 'border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                                {task.title}
                              </p>
                              {task.projectName && (
                                <p className="text-[11px] text-slate-400">
                                  Sebelumnya: {task.projectName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Tutup
                </button>
                {availableTasks.length > 0 && (
                  <button
                    type="submit"
                    disabled={assignLoading || selectedTaskIds.length === 0}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                  >
                    <span>{assignLoading ? 'Menyimpan...' : `Alokasikan (${selectedTaskIds.length}) Tugas`}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
